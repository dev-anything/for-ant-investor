// POST /api/unsubscribe — 알림 메일 수신 거부 (FS 9-13, PRD F-13). 로그인 없이 토큰만으로 처리한다.
// GET으로는 아무것도 바꾸지 않는다 (메일 검사기의 자동 열기 방지). 서버용 키는 이 라우트에서만 쓴다.
import { checkStateChangeOrigin, privateJson, privateServerError, readJsonBody } from '@/lib/api-guard';
import { isUnsubscribeTokenFormat, readUnsubscribeBody } from '@/lib/notify';
import { db } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // 상태 변경이라 Origin이 없으면 막는다 (FS 4-2, 로그인 없이도 CSRF 방어)
  const forbidden = checkStateChangeOrigin(request);
  if (forbidden !== null) return forbidden;

  const token = readUnsubscribeBody(await readJsonBody(request));
  if (!isUnsubscribeTokenFormat(token)) return privateJson({ error: 'bad_request' }, 400);

  try {
    // 토큰과 정확히 일치하는 행만 끈다. 토큰은 사용자 본인만 가진 값이다
    const { data, error } = await db()
      .from('user_settings')
      .update({ email_opt_in: false })
      .eq('unsubscribe_token', token)
      .select('user_id');
    if (error) throw error;
    // 없는 토큰은 404 (FS 9-13)
    if (data.length === 0) return privateJson({ error: 'not_found' }, 404);
    return privateJson({ unsubscribed: true });
  } catch (error: unknown) {
    return privateServerError('/api/unsubscribe POST', error);
  }
}
