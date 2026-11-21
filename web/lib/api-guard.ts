// 로그인 세션을 쓰는 API Route 공통 처리 (FS 4-2, DEV_PLAN 16b). 응답은 항상 `Cache-Control: private, no-store`.
import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { createSessionClient, type SessionClient } from '@/lib/supabase/session';

// FS 4-2: 개인 응답은 공유 캐시에 남기지 않는다
export const PRIVATE_NO_STORE = 'private, no-store';

/** 개인 데이터용 JSON 응답. 상태 코드와 캐시 헤더를 한 번에 붙인다. */
export function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
}

/**
 * 상태 변경 요청(POST·PATCH·DELETE)의 Origin 검사 (FS 4-2, CSRF 방어).
 * Origin이 없으면 거부한다 (`/api/chat`의 공개 동작과 다르다). 통과하면 null, 막으면 403 응답.
 */
export function checkStateChangeOrigin(request: Request): NextResponse | null {
  const allowed = isSameOrigin(request.headers.get('origin'), request.headers.get('host'), { requireOrigin: true });
  if (allowed) return null;
  return privateJson({ error: 'forbidden' }, 403);
}

export type SessionGuard =
  | { ok: true; supabase: SessionClient; userId: string }
  | { ok: false; response: NextResponse };

/**
 * 로그인 세션을 확인한다 (`getUser`로 서버에서 검증, 쿠키만 믿지 않음). 세션이 없거나 로그인 기능이 꺼져 있으면 401.
 * 성공하면 세션 클라이언트와 사용자 id를 돌려준다. 호출하는 쪽은 RLS로 자기 행만 읽는다.
 */
export async function requireSession(): Promise<SessionGuard> {
  const supabase = await createSessionClient();
  if (supabase === null) {
    return { ok: false, response: privateJson({ error: 'unauthorized' }, 401) };
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user === null) {
    return { ok: false, response: privateJson({ error: 'unauthorized' }, 401) };
  }
  return { ok: true, supabase, userId: data.user.id };
}

/** 요청 본문을 JSON으로 읽는다. JSON이 아니면 undefined (호출하는 쪽의 검사가 400으로 답한다). */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    // 본문이 없거나 JSON이 아닌 경우는 오류가 아니라 "모양이 틀림"으로 본다
    return undefined;
  }
}

/** DB 오류 응답 (FS 4-2): 500 `server_error`. 로그에는 PostgREST 오류 코드만 남긴다 (키·URL 금지). */
export function privateServerError(route: string, error: unknown): NextResponse {
  console.error(`${route} 실패`, errorCodeOf(error));
  return privateJson({ error: 'server_error' }, 500);
}

/** 오류 객체에서 PostgREST·PostgreSQL 코드만 꺼낸다 (로그용, 메시지·URL은 남기지 않는다). */
export function errorCodeOf(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown';
}
