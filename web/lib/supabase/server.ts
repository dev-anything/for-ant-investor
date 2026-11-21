import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// FS 3-2: 서버용 Supabase 클라이언트 (Service Role Key 사용, 서버 전용)
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('SUPABASE_URL 환경변수가 필요합니다.');
  }
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
