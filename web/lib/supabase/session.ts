import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';
import { readSupabasePublicEnv } from '@/lib/supabase/env';

export type SessionClient = NonNullable<Awaited<ReturnType<typeof createSessionClient>>>;

// FS 9-10: 로그인 세션 서버 클라이언트. publishable 키 + 세션 쿠키만 쓴다 (RLS 적용).
// 서버용 키(SUPABASE_SERVICE_ROLE_KEY)는 여기서 쓰지 않는다. 공개 화면에서는 부르지 않는다 (쿠키를 읽으면 캐시가 깨짐).
export async function createSessionClient() {
  const env = readSupabasePublicEnv();
  if (env === null) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error: unknown) {
          // Server Component에서 호출되면 쿠키 쓰기가 막힌다. 세션 갱신은 proxy.ts가 맡으므로 여기서는 무시해도 된다.
          console.warn('세션 쿠키 쓰기를 건너뜀', error instanceof Error ? error.name : '');
        }
      },
    },
  });
}
