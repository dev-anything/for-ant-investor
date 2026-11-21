// POST /api/account/delete — 탈퇴 (FS 9-11, DEV_PLAN 16c, PRD F-11). 상태 변경이라 Origin 검사를 먼저 한다.
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkStateChangeOrigin, PRIVATE_NO_STORE, requireSession } from '@/lib/api-guard';
import { db } from '@/lib/supabase/server';

// Supabase 세션 쿠키 이름 (`sb-<프로젝트>-auth-token`, 큰 값은 `.0`·`.1` 조각으로 나뉨)
const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.+-auth-token/;

export async function POST(request: Request) {
  // FS 4-2: Origin 검사(403)가 세션 검사(401)보다 먼저다
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  // 서버용 키로만 지운다. 이 라우트 밖에서는 서버용 키를 쓰지 않는다 (FS 9-10)
  // user_settings·watchlist·notifications는 auth.users 삭제의 cascade로 함께 지워진다 (PRD F-11)
  const { error } = await db().auth.admin.deleteUser(guard.userId);
  if (error) {
    console.error('/api/account/delete 탈퇴 실패', error.name);
    return NextResponse.json({ error: 'server_error' }, { status: 500, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
  }

  // 이 브라우저의 세션 쿠키도 지운다 (다른 기기 세션은 사용자가 이미 없어져서 쓸 수 없다)
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (SUPABASE_AUTH_COOKIE_PATTERN.test(cookie.name)) cookieStore.delete(cookie.name);
  }
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
}
