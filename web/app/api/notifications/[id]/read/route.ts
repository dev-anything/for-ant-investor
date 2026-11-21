// PATCH /api/notifications/[id]/read — 알림 읽음 처리 (FS 9-13, PRD F-13). 로그인 세션 필요, 상태 변경이라 Origin 검사.
// 순서: Origin(403) → 세션(401) → 입력(400) → 저장. 이미 읽은 알림은 204, 행이 없으면 404.
import { NextResponse } from 'next/server';
import { checkStateChangeOrigin, PRIVATE_NO_STORE, privateJson, privateServerError, requireSession } from '@/lib/api-guard';
import { parseNotificationId } from '@/lib/notify';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const id = parseNotificationId((await params).id);
  if (id === null) return privateJson({ error: 'bad_request' }, 400);

  try {
    // RLS로 본인 알림만 보인다. 이미 읽은 행(read_at 있음)은 갱신하지 않는다
    const { data, error } = await guard.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null)
      .select('id');
    if (error) throw error;

    // 갱신된 행이 없을 때 이미 읽은 것인지 없는 것인지 구분한다 (다른 사람 알림도 없는 것으로 보인다)
    if (data.length === 0) {
      const { data: row, error: findError } = await guard.supabase
        .from('notifications')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      if (findError) throw findError;
      if (row === null) return privateJson({ error: 'not_found' }, 404);
    }
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': PRIVATE_NO_STORE } });
  } catch (error: unknown) {
    return privateServerError('/api/notifications/[id]/read PATCH', error);
  }
}
