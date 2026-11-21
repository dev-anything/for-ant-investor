import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readSupabasePublicEnv } from '@/lib/supabase/env';

// FS 9-10: 브라우저 클라이언트. 로그인 링크 요청(signInWithOtp)과 로그아웃(signOut)에만 쓴다.
// 사용자 테이블은 브라우저에서 직접 읽지 않고 API Route를 거친다 (PRD 7-4).
let cached: SupabaseClient | null = null;

/** 브라우저용 클라이언트를 한 번만 만든다. 환경변수가 없으면 null (로그인 버튼이 안내만 한다). */
export function getBrowserClient(): SupabaseClient | null {
  if (cached !== null) return cached;
  const env = readSupabasePublicEnv();
  if (env === null) return null;
  cached = createBrowserClient(env.url, env.key);
  return cached;
}
