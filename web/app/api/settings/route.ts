// PATCH /api/settings — 알림 메일 받기 설정 (FS 9-12, PRD F-12). 세션 필요, 상태 변경이라 Origin 검사 (FS 4-2).
import { NextResponse } from 'next/server';
import {
  checkStateChangeOrigin,
  PRIVATE_NO_STORE,
  privateJson,
  privateServerError,
  readJsonBody,
  requireSession,
} from '@/lib/api-guard';
import { readEmailOptInBody } from '@/lib/auth';

// 열 권한은 email_opt_in만 있다 (초기 스키마). 본인 행만 바뀐다 (RLS)
export async function PATCH(request: Request) {
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const emailOptIn = readEmailOptInBody(await readJsonBody(request));
  if (emailOptIn === null) return privateJson({ error: 'bad_request' }, 400);

  try {
    const { data, error } = await guard.supabase
      .from('user_settings')
      .update({ email_opt_in: emailOptIn })
      .eq('user_id', guard.userId)
      .select('user_id');
    if (error) throw error;
    // 행이 없으면 404 (FS 4-2 "없는 행")
    if (data.length === 0) return privateJson({ error: 'not_found' }, 404);
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
  } catch (error: unknown) {
    return privateServerError('/api/settings PATCH', error);
  }
}
