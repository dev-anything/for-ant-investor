'use client';

// FS 7장 AuthMenu, 9-10, DESIGN.md 2-2: 상단 로그인 메뉴. 화면이 뜬 뒤 `GET /api/me`로 묻는다
// (공개 화면은 쿠키를 읽지 않으므로 서버에서 로그인 상태를 알 수 없다, FS 1장).
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginDialog, type LoginReason } from '@/components/LoginDialog';
import { parseMeResponse, type MeState } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { getBrowserClient } from '@/lib/supabase/browser';

// 응답 전에는 자리만 두고, 로그인 전·후 글자 폭 차이로 머리가 흔들리지 않게 640px 이상에서 폭을 고정한다
// (640px 미만에서는 최소 폭이 헤더를 넘기지 않게 없앤다)
const MENU_CLASS = 'flex h-9 items-center justify-end gap-4 text-sm sm:min-w-40';

const LOGGED_OUT: MeState = { loggedIn: false };

// 실패하면 로그인 안 한 상태로 본다 (로그인 메뉴가 떠도 앱은 계속 쓸 수 있다)
async function fetchMe(): Promise<MeState> {
  try {
    const response = await fetch('/api/me', { cache: 'no-store' });
    if (!response.ok) return LOGGED_OUT;
    return parseMeResponse(await response.json()) ?? LOGGED_OUT;
  } catch (error: unknown) {
    console.warn('로그인 상태 확인 실패', error instanceof Error ? error.name : '');
    return LOGGED_OUT;
  }
}

// `?login=` 값 중 창을 여는 것만 받는다
function readLoginFlag(value: string | null): LoginReason | null {
  return value === 'expired' || value === 'required' ? value : null;
}

export function AuthMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // null: 아직 응답을 받지 않음 (자리만 보인다)
  const [me, setMe] = useState<MeState | null>(null);
  // null: 로그인 창 닫힘. 객체면 열림 (이유는 쿼리나 버튼에서 온다)
  const [dialog, setDialog] = useState<{ reason?: LoginReason } | null>(null);
  const [logoutFailed, setLogoutFailed] = useState(false);

  const loginFlag = readLoginFlag(searchParams.get('login'));
  // 이미 창에 반영한 쿼리 값. 쿼리가 지워지기 전에 창을 닫아도 다시 열리지 않게 기억한다
  const [seenFlag, setSeenFlag] = useState<LoginReason | null>(null);
  // 쿼리는 곧 지우므로 창 상태로 옮겨 둔다. 옮기지 않으면 쿼리를 지우는 순간 창이 닫힌다 (렌더 중 상태 맞추기)
  if (loginFlag !== seenFlag) {
    setSeenFlag(loginFlag);
    if (loginFlag !== null) setDialog({ reason: loginFlag });
  }

  useEffect(() => {
    let active = true;
    void fetchMe().then((state) => {
      if (active) setMe(state);
    });
    return () => {
      active = false;
    };
  }, []);

  // `/auth/callback`·`/mypage`가 붙인 `?login=` 쿼리는 창을 연 뒤 바로 지운다 (새로고침 때 다시 열리지 않게)
  useEffect(() => {
    if (loginFlag === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('login');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [loginFlag, pathname, router, searchParams]);

  async function logout(): Promise<void> {
    const client = getBrowserClient();
    // 로그인 기능이 꺼져 있으면 로그인된 상태일 수 없다
    if (client === null) return;
    setLogoutFailed(false);
    const { error } = await client.auth.signOut();
    if (error) {
      console.warn('로그아웃 실패', error.name);
      setLogoutFailed(true);
      return;
    }
    setMe(LOGGED_OUT);
    // 마이페이지는 로그인해야 보이므로 홈으로 보낸다 (FS 9-10). 공개 화면은 그대로 둔다
    if (pathname === '/mypage' || pathname.startsWith('/mypage/')) router.push('/');
  }

  if (me === null) {
    return (
      <div className={MENU_CLASS} aria-busy="true">
        <span aria-hidden="true" className="inline-block h-4 w-20 rounded bg-skeleton" />
      </div>
    );
  }

  return (
    <div className={MENU_CLASS}>
      {me.loggedIn ? (
        <>
          <Link href="/mypage" className="text-ink-sub transition-colors hover:text-ink">
            {copy.auth.mypage}
            {me.unreadCount > 0 && <span className="ml-1 tabular-nums font-bold text-ink">{me.unreadCount}</span>}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-ink-sub transition-colors hover:text-ink"
          >
            {copy.auth.logout}
          </button>
          {logoutFailed && <span className="text-meta text-ink">{copy.auth.logoutFailed}</span>}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setDialog({})}
          className="h-9 rounded-md bg-subtle px-4 font-semibold text-ink transition-colors hover:bg-line"
        >
          {copy.auth.login}
        </button>
      )}
      {dialog !== null && <LoginDialog reason={dialog.reason} onClose={() => setDialog(null)} />}
    </div>
  );
}
