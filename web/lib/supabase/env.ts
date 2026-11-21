// 로그인용 공개 설정 읽기 (FS 9-10, DEV_PLAN 16b). 값이 없으면 로그인 기능만 꺼진다 (앱은 계속 뜬다).
// 이 값들은 브라우저에 가도 되는 공개 값이라 NEXT_PUBLIC_ 접두어를 쓴다.

type SupabasePublicEnv = { url: string; key: string };

let warnedMissing = false;

/**
 * URL과 publishable 키를 읽는다. 하나라도 없으면 null.
 * 값은 로그에 남기지 않고 변수 이름만 한 번 남긴다 (CLAUDE.md 보안 규칙).
 * `process.env.NEXT_PUBLIC_*`는 리터럴로 접근해야 빌드 때 브라우저용으로 치환된다.
 */
export function readSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) return { url, key };
  if (!warnedMissing) {
    warnedMissing = true;
    console.warn('로그인 기능 꺼짐: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 환경변수가 없어');
  }
  return null;
}
