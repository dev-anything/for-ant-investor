// 브라우저에서 부르는 인증 요청 (PRD F-11, FS 9-11). 던지지 않고 결과 값으로 돌려준다.
// 비밀번호는 브라우저에서 Supabase Auth로 바로 보내며 우리 서버를 거치지 않는다. 로그에는 오류 코드만 남긴다.
import {
  loginFailureKind,
  passwordUpdateFailureKind,
  type LoginFailure,
  type PasswordUpdateFailure,
} from '@/lib/auth';
import { getBrowserClient } from '@/lib/supabase/browser';

export type LoginResult = 'ok' | LoginFailure;
// signed_in: Supabase의 메일 확인이 꺼져 있으면 가입과 동시에 세션이 생긴다
export type SignUpResult = 'sent' | 'signed_in' | 'weak' | 'failed';
export type PasswordUpdateResult = 'ok' | PasswordUpdateFailure;

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : '';
}

/** 이메일·비밀번호로 로그인한다. */
export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const client = getBrowserClient();
  // 로그인 기능이 꺼져 있으면 보낼 수 없다 (FS 9-10)
  if (client === null) return 'failed';
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (!error) return 'ok';
    console.warn('로그인 실패', error.code ?? error.name);
    return loginFailureKind(error.code);
  } catch (error: unknown) {
    console.warn('로그인 요청 중 오류', errorName(error));
    return 'failed';
  }
}

/** 가입하고 확인 메일을 보낸다. 이미 가입한 이메일도 `sent`다 (가입 여부를 알려주지 않음). */
export async function signUpWithPassword(
  email: string,
  password: string,
  redirectTo: string,
): Promise<SignUpResult> {
  const client = getBrowserClient();
  if (client === null) return 'failed';
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (!error) return data.session === null ? 'sent' : 'signed_in';
    console.warn('가입 실패', error.code ?? error.name);
    if (error.code === 'user_already_exists') return 'sent';
    return error.code === 'weak_password' ? 'weak' : 'failed';
  } catch (error: unknown) {
    console.warn('가입 요청 중 오류', errorName(error));
    return 'failed';
  }
}

/** 가입 확인 메일을 다시 보낸다. 성공하면 true. */
export async function resendSignupMail(email: string, redirectTo: string): Promise<boolean> {
  const client = getBrowserClient();
  if (client === null) return false;
  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) console.warn('확인 메일 재발송 실패', error.code ?? error.name);
    return !error;
  } catch (error: unknown) {
    console.warn('확인 메일 재발송 중 오류', errorName(error));
    return false;
  }
}

/** 비밀번호 설정·재설정 메일을 보낸다. 가입하지 않은 이메일도 성공으로 온다. */
export async function requestPasswordMail(email: string, redirectTo: string): Promise<boolean> {
  const client = getBrowserClient();
  if (client === null) return false;
  try {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) console.warn('비밀번호 설정 메일 요청 실패', error.code ?? error.name);
    return !error;
  } catch (error: unknown) {
    console.warn('비밀번호 설정 메일 요청 중 오류', errorName(error));
    return false;
  }
}

/** 로그인한 계정의 비밀번호를 바꾼다. */
export async function updatePassword(password: string): Promise<PasswordUpdateResult> {
  const client = getBrowserClient();
  if (client === null) return 'failed';
  try {
    const { error } = await client.auth.updateUser({ password });
    if (!error) return 'ok';
    console.warn('비밀번호 저장 실패', error.code ?? error.name);
    return passwordUpdateFailureKind(error.code ?? error.name);
  } catch (error: unknown) {
    console.warn('비밀번호 저장 중 오류', errorName(error));
    return 'failed';
  }
}

/**
 * 로그인 직후 추적 종목을 등록한다 (PRD F-12). 20개 상한에 걸리면 true.
 * 그 밖의 실패는 로그인 성공을 되돌리지 않으므로 false.
 */
export async function registerWatchAfterLogin(code: string): Promise<boolean> {
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });
    return response.status === 409;
  } catch (error: unknown) {
    console.warn('로그인 뒤 자동 등록 실패', errorName(error));
    return false;
  }
}
