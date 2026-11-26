// 로그인·요청 출처 관련 순수 함수 (FS 6-12, 9-10·9-11, DEV_PLAN 16b). 서버·클라이언트 어디서나 쓴다.

// 추적 종목 코드 형식 (PRD F-12). 영문이 섞인 코드(`0220W0`)도 허용한다. 검색 대상인지는 DB로 따로 본다.
const WATCH_CODE_PATTERN = /^[0-9A-Z]{6}$/;

// 로그인 뒤 돌아갈 경로에 쓸 수 없는 문자 (제어 문자·백슬래시). URL 해석이 이상하게 바뀌는 입력을 막는다.
const UNSAFE_PATH_PATTERN = /[\\\u0000-\u001f\u007f]/;

// URL 해석의 기준 주소. 여기서 호스트가 바뀌면 다른 사이트로 가는 경로다.
const PROBE_BASE = 'http://probe.invalid';

/**
 * 로그인 뒤 이동할 경로를 안전한 경로로 바꾼다 (PRD F-11, 열린 리다이렉트 방지).
 * `/`로 시작하고 `//`·`/\`가 아니며 해석 뒤 호스트가 그대로인 경로만 통과시키고, 그 밖·빈 값은 `/`.
 */
export function safeNextPath(next: string | null): string {
  if (next === null || !next.startsWith('/')) return '/';
  if (next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (UNSAFE_PATH_PATTERN.test(next)) return '/';
  try {
    const resolved = new URL(next, PROBE_BASE);
    if (resolved.origin !== PROBE_BASE) return '/';
  } catch {
    // 해석할 수 없는 경로는 안전하게 홈으로 보낸다
    return '/';
  }
  return next;
}

/** 추적 종목 코드 형식(`^[0-9A-Z]{6}$`)인지 본다. 없으면 false. */
export function isWatchCodeFormat(code: string | null): code is string {
  return code !== null && WATCH_CODE_PATTERN.test(code);
}

/**
 * 인증 메일(가입 확인·비밀번호 설정)의 돌아갈 주소를 만든다. 항상 `?next=`를 붙인다 (메일 템플릿이 `&`로 이어 붙이기 때문).
 * `watch`는 형식이 맞을 때만 붙인다 (잘못된 값으로 자동 등록을 시도하지 않게).
 */
export function buildLoginRedirect(origin: string, next: string, watch?: string): string {
  const base = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  if (watch !== undefined && isWatchCodeFormat(watch)) {
    return `${base}&watch=${encodeURIComponent(watch)}`;
  }
  return base;
}

/** 요청 옵션. `requireOrigin`이 true면 Origin 헤더가 없을 때도 거부한다 (상태 변경 요청, FS 4-2). */
export type SameOriginOptions = { requireOrigin?: boolean };

/**
 * Origin 헤더의 호스트(포트 포함)가 Host 헤더와 같은지 본다 (FS 4-2, DEV_PLAN 상단 표).
 * 기본 동작(`requireOrigin` 없음): Origin이 없으면 통과 — 공개 `/api/chat`용. 브라우저 밖 요청(curl)을 막지 않는다.
 * `requireOrigin: true`: Origin이 없으면 거부 — 로그인 세션을 쓰는 상태 변경 요청(POST·PATCH·DELETE)용.
 * 이 경우 CSRF 방어가 Origin 검사에만 기대므로 빠진 Origin을 믿지 않는다.
 */
export function isSameOrigin(
  originHeader: string | null,
  hostHeader: string | null,
  options: SameOriginOptions = {},
): boolean {
  if (originHeader === null) return options.requireOrigin !== true;
  if (hostHeader === null) return false;
  try {
    return new URL(originHeader).host.toLowerCase() === hostHeader.toLowerCase();
  } catch {
    // Origin이 "null" 같은 값이면 출처를 알 수 없으니 거부한다
    return false;
  }
}

// 이메일 형식 검사 (FS 12장 8번, PRD F-11). 보내기 전에 브라우저에서만 본다. 실제 주소 확인은 가입 확인 메일이 한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254; // RFC 5321 주소 최대 길이

/** 앞뒤 공백을 빼고 이메일 형식(`a@b.c`, 공백 없음, 254자 이하)인지 본다. */
export function isEmailFormat(email: string): boolean {
  const value = email.trim();
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value);
}

/** 로그인 상태 (FS 9-10 `GET /api/me`). 이메일은 내려오지 않는다. */
export type MeState = { loggedIn: false } | { loggedIn: true; unreadCount: number };

/**
 * `/api/me` 응답 모양을 확인한다. 모양이 다르면 null (호출하는 쪽이 로그인 안 한 상태로 본다).
 * 응답은 외부 입력과 같으니 `unknown`으로 받아 하나씩 본다.
 */
export function parseMeResponse(body: unknown): MeState | null {
  if (typeof body !== 'object' || body === null) return null;
  // typeof 검사로 객체임을 확인했다. 키 값은 아래에서 하나씩 본다 (as는 키 모양만 빌리는 용도)
  const record = body as Record<string, unknown>;
  if (record.loggedIn === false) return { loggedIn: false };
  if (record.loggedIn === true && typeof record.unreadCount === 'number' && record.unreadCount >= 0) {
    return { loggedIn: true, unreadCount: record.unreadCount };
  }
  return null;
}

/**
 * `{ code }` 요청 본문에서 추적 종목 코드를 꺼낸다 (FS 9-12, 17a). 모양이 틀리거나 형식이 아니면 null (호출하는 쪽이 400).
 * 입력은 외부 값이라 `unknown`으로 받아 `in` 검사로 키를 확인한다.
 */
export function readWatchCodeBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('code' in body)) return null;
  const code = body.code;
  if (typeof code !== 'string' || !isWatchCodeFormat(code)) return null;
  return code;
}

/** `{ emailOptIn }` 요청 본문을 본다 (FS 9-12 `PATCH /api/settings`). boolean이 아니면 null (호출하는 쪽이 400). */
export function readEmailOptInBody(body: unknown): boolean | null {
  if (typeof body !== 'object' || body === null || !('emailOptIn' in body)) return null;
  const value = body.emailOptIn;
  return typeof value === 'boolean' ? value : null;
}

/** 비밀번호 설정·재설정 메일의 링크를 누르면 가는 화면 (PRD F-11). */
export const RESET_PASSWORD_PATH = '/reset-password';

export const PASSWORD_MIN_LENGTH = 8;
// Supabase Auth는 비밀번호를 bcrypt로 해시해서 72바이트까지만 받는다
export const PASSWORD_MAX_BYTES = 72;

export type PasswordProblem = 'too_short' | 'too_long' | 'mismatch';

/** 새 비밀번호와 확인 입력을 본다 (PRD F-11). 문자 조합 조건은 없다. 문제가 없으면 null. */
export function checkNewPassword(password: string, confirm: string): PasswordProblem | null {
  // 글자 수는 코드 포인트 기준 (이모지 1개를 2글자로 세지 않는다)
  if ([...password].length < PASSWORD_MIN_LENGTH) return 'too_short';
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return 'too_long';
  if (password !== confirm) return 'mismatch';
  return null;
}

export type LoginFailure = 'invalid' | 'unconfirmed' | 'failed';

/** Supabase 로그인 오류 코드를 화면 안내 종류로 바꾼다. 가입 여부는 구분해 알려주지 않는다 (PRD F-11). */
export function loginFailureKind(code: string | undefined): LoginFailure {
  if (code === 'invalid_credentials') return 'invalid';
  if (code === 'email_not_confirmed') return 'unconfirmed';
  return 'failed';
}

export type PasswordUpdateFailure = 'same' | 'weak' | 'expired' | 'failed';

// 세션이 없거나 오래돼 재설정 메일을 다시 받아야 하는 오류. `AuthSessionMissingError`는 코드 없이 이름만 온다
const SESSION_EXPIRED_CODES = new Set([
  'AuthSessionMissingError',
  'session_not_found',
  'session_expired',
  'reauthentication_needed',
]);

/** Supabase 비밀번호 변경 오류 코드(코드가 없으면 오류 이름)를 화면 안내 종류로 바꾼다. */
export function passwordUpdateFailureKind(code: string): PasswordUpdateFailure {
  if (code === 'same_password') return 'same';
  if (code === 'weak_password') return 'weak';
  if (SESSION_EXPIRED_CODES.has(code)) return 'expired';
  return 'failed';
}

/** 메일 링크의 종류. `email`은 가입 확인, `recovery`는 비밀번호 설정·재설정 (FS 9-11). */
export type MailLinkType = 'email' | 'recovery';

/** `/auth/callback`의 `type` 값을 본다. 받지 않는 종류면 null. */
export function parseMailLinkType(type: string | null): MailLinkType | null {
  return type === 'email' || type === 'recovery' ? type : null;
}
