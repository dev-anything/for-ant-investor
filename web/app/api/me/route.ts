// GET /api/me — 로그인 상태와 안 읽은 알림 수 (FS 9-10, DEV_PLAN 16b). 이메일은 내려주지 않는다.
import { privateJson } from '@/lib/api-guard';
import { createSessionClient } from '@/lib/supabase/session';

export async function GET() {
  const supabase = await createSessionClient();
  // 로그인 기능이 꺼져 있으면 앱은 그대로 두고 로그인 안 한 상태로 답한다
  if (supabase === null) return privateJson({ loggedIn: false });

  // 세션이 없거나 확인이 안 되면 로그인 안 한 상태 (오류로 막지 않는다)
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user === null) return privateJson({ loggedIn: false });

  // RLS로 본인 알림만 세므로 user_id 조건을 따로 걸지 않는다
  const { count, error: countError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (countError) {
    console.error('/api/me 안 읽은 알림 수 조회 실패', countError.code);
    return privateJson({ error: 'server_error' }, 500);
  }
  return privateJson({ loggedIn: true, unreadCount: count ?? 0 });
}
