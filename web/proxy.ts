// 세션 쿠키 갱신 (FS 9-10, DEV_PLAN 16b). Next.js 16은 middleware.ts 대신 proxy.ts를 쓴다.
// matcher는 로그인 관련 경로만 건다. 공개 화면(`/`·`/stocks`·`/screener`·`/industries`·`/news`)은 넣지 않는다 (캐시 유지, Set-Cookie 없음).
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { readSupabasePublicEnv } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = readSupabasePublicEnv();
  if (env === null) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 요청 쿠키를 갱신하고, 같은 값을 응답 쿠키로도 내려준다 (@supabase/ssr 안내 방식)
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser는 서버에서 토큰을 검증하고 갱신한다. 쿠키 값만 믿는 방식은 쓰지 않는다.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    '/mypage',
    '/reset-password',
    '/auth/:path*',
    '/api/me',
    '/api/watchlist',
    '/api/settings',
    '/api/notifications/:path*',
    '/api/account/:path*',
  ],
};
