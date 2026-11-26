// GET /auth/callback?next=&watch=&token_hash=&type= — 인증 메일 링크 확인 (FS 9-11).
// `type=email`은 가입 확인, `type=recovery`는 비밀번호 설정·재설정.
// 메일 링크는 token_hash 방식이라 요청한 브라우저가 아닌 다른 기기에서 열어도 된다 (PKCE 아님).
import { NextResponse } from 'next/server';
import { errorCodeOf, PRIVATE_NO_STORE } from '@/lib/api-guard';
import {
  isWatchCodeFormat,
  parseMailLinkType,
  RESET_PASSWORD_PATH,
  safeNextPath,
} from '@/lib/auth';
import { findWatchTarget, insertWatch } from '@/lib/data/watch';
import { createSessionClient, type SessionClient } from '@/lib/supabase/session';

// 내부 경로에 쿼리를 붙이는 데만 쓴다 (호스트는 바뀌지 않는다)
const PROBE_BASE = 'http://probe.invalid';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // 열린 리다이렉트 방지: 돌아갈 곳은 항상 safeNextPath를 거친다 (PRD F-11)
  const next = safeNextPath(url.searchParams.get('next'));
  const tokenHash = url.searchParams.get('token_hash');
  const type = parseMailLinkType(url.searchParams.get('type'));
  const watch = url.searchParams.get('watch');

  const supabase = await createSessionClient();
  // 로그인 기능이 꺼져 있으면 로그인 실패 표시 없이 돌려보낸다
  if (supabase === null) return redirectTo(request, next);

  // 새 비밀번호 화면은 세션이 없으면 열리지 않아서, 그쪽으로 가던 링크가 실패하면 홈에서 안내한다
  const failurePath = withLoginFlag(next === RESET_PASSWORD_PATH ? '/' : next, 'expired');
  if (tokenHash === null || type === null) return redirectTo(request, failurePath);

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  // 만료·이미 쓴 링크. 화면이 LoginDialog(expired)를 연다 (9-11)
  if (error || data.user === null) return redirectTo(request, failurePath);

  // 비밀번호 설정 링크는 `next` 값과 상관없이 새 비밀번호 화면으로 보낸다
  if (type === 'recovery') return redirectTo(request, RESET_PASSWORD_PATH);

  // 로그인 성공은 유지한다. 자동 등록이 실패해도 돌려보내기는 한다 (9-12)
  let destination = next;
  if (isWatchCodeFormat(watch)) {
    const limited = await autoWatch(supabase, data.user.id, watch);
    // 20개 상한이면 종목 화면에서 상한 문구를 보여준다 (FS 9-12, `WatchButton`이 쿼리를 읽는다)
    if (limited) destination = withQueryParam(next, 'watch', 'limit');
  }
  return redirectTo(request, destination);
}

/**
 * 로그인 뒤 추적 종목 자동 등록 (FS 9-12). 상한에 걸리면 true, 그 밖은 false.
 * 검색 대상이 아니거나 외국회사면 아무 일도 하지 않는다. 등록 실패는 로그인 성공과 따로 보고 조용히 넘어간다.
 */
async function autoWatch(supabase: SessionClient, userId: string, code: string): Promise<boolean> {
  try {
    const target = await findWatchTarget(code);
    if (target === null || target.isForeign) return false;
    return (await insertWatch(supabase, userId, target)) === 'limit';
  } catch (error: unknown) {
    // 자동 등록 실패는 로그인 자체를 되돌리지 않는다 (FS 9-12). 코드만 남긴다
    console.warn('로그인 뒤 자동 등록 실패', errorCodeOf(error));
    return false;
  }
}

/**
 * 돌려보내기. `request.url`의 호스트는 서버 내부 주소(localhost)로 잡힐 수 있어서, 사용자가 접속한 Host 헤더를 쓴다
 * (LAN·Tailscale 접속에서 localhost로 튀지 않게). 개인 응답이라 캐시하지 않는다 (FS 4-2).
 */
function redirectTo(request: Request, path: string): NextResponse {
  const host = request.headers.get('host');
  const origin = host ? `${new URL(request.url).protocol}//${host}` : new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, origin), { headers: { 'Cache-Control': PRIVATE_NO_STORE } });
}

function withLoginFlag(path: string, value: 'expired'): string {
  return withQueryParam(path, 'login', value);
}

function withQueryParam(path: string, key: string, value: string): string {
  const target = new URL(path, PROBE_BASE);
  target.searchParams.set(key, value);
  return `${target.pathname}${target.search}${target.hash}`;
}
