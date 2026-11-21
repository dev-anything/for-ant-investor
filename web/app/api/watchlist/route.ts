// /api/watchlist — 추적 종목 조회·등록·해제 (FS 9-12, PRD F-12). 로그인 세션 필요 (FS 4-2).
// 순서: 상태 변경 요청은 Origin(403) → 세션(401) → 입력(400) → 조회·저장.
import { NextResponse } from 'next/server';
import {
  checkStateChangeOrigin,
  PRIVATE_NO_STORE,
  privateJson,
  privateServerError,
  readJsonBody,
  requireSession,
} from '@/lib/api-guard';
import { readWatchCodeBody, isWatchCodeFormat } from '@/lib/auth';
import { findWatchTarget, insertWatch } from '@/lib/data/watch';

// GET /api/watchlist?code= → { watching }
export async function GET(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const code = new URL(request.url).searchParams.get('code');
  if (!isWatchCodeFormat(code)) return privateJson({ error: 'bad_request' }, 400);

  try {
    const target = await findWatchTarget(code);
    // 검색 대상이 아니면 추적 중일 수 없다
    if (target === null) return privateJson({ watching: false });
    // RLS로 본인 행만 보인다
    const { data, error } = await guard.supabase
      .from('watchlist')
      .select('srtn_cd')
      .eq('srtn_cd', target.srtnCd)
      .maybeSingle();
    if (error) throw error;
    return privateJson({ watching: data !== null });
  } catch (error: unknown) {
    return privateServerError('/api/watchlist GET', error);
  }
}

// POST /api/watchlist { code } → 201 (이미 있어도 201)
export async function POST(request: Request) {
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const code = readWatchCodeBody(await readJsonBody(request));
  if (code === null) return privateJson({ error: 'bad_request' }, 400);

  try {
    const target = await findWatchTarget(code);
    // 검색 대상 아님·외국회사는 404 (PRD F-12)
    if (target === null || target.isForeign) return privateJson({ error: 'not_found' }, 404);

    const result = await insertWatch(guard.supabase, guard.userId, target);
    // 20개 상한은 409 (문구는 화면이 붙인다)
    if (result === 'limit') return privateJson({ error: 'limit' }, 409);
    return privateJson({ watching: true }, 201);
  } catch (error: unknown) {
    return privateServerError('/api/watchlist POST', error);
  }
}

// DELETE /api/watchlist { code } → 204 (없어도 204)
export async function DELETE(request: Request) {
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const code = readWatchCodeBody(await readJsonBody(request));
  if (code === null) return privateJson({ error: 'bad_request' }, 400);

  try {
    const target = await findWatchTarget(code);
    if (target !== null) {
      const { error } = await guard.supabase.from('watchlist').delete().eq('srtn_cd', target.srtnCd);
      if (error) throw error;
    }
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
  } catch (error: unknown) {
    return privateServerError('/api/watchlist DELETE', error);
  }
}
