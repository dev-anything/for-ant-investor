import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountSection } from '@/components/AccountSection';
import { EmailOptInToggle } from '@/components/EmailOptInToggle';
import { EmptyState } from '@/components/EmptyState';
import { NotificationList } from '@/components/NotificationList';
import { WatchCard } from '@/components/WatchCard';
import { getMypage } from '@/lib/data/mypage';
import { copy } from '@/lib/copy';
import { WATCH_LIMIT } from '@/lib/mypage';
import { createSessionClient } from '@/lib/supabase/session';

// FS 9-10·9-12: 쿠키를 읽는 화면이라 캐시하지 않는다 (공개 화면과 분리)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: copy.mypage.pageTitle,
};

// FS 9-12 `/mypage` (서버). 로그인 확인은 쿠키만 믿지 않고 getUser로 서버에서 검증한다 (FS 9-10).
// 로그인 안 했으면 `/`로 보내고 로그인 창을 연다 (FS 12장 동작 기본안 7번).
export default async function MypagePage() {
  const supabase = await createSessionClient();
  // 로그인 기능이 꺼져 있으면 로그인할 수 없으니 같은 길로 보낸다
  if (supabase === null) redirect('/?login=required');
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user === null) redirect('/?login=required');

  const mypage = await getMypage(supabase);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">{copy.mypage.title}</h1>

      <section aria-labelledby="watch-heading" className="mt-8">
        <h2 id="watch-heading" className="text-xl font-semibold text-ink-sub">
          {copy.mypage.watchTitle(mypage.watches.length, WATCH_LIMIT)}
        </h2>
        {mypage.watches.length === 0 ? (
          <EmptyState message={copy.mypage.noWatch} />
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {mypage.watches.map((watch) => (
              <li key={watch.srtnCd}>
                <WatchCard watch={watch} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notification-heading" className="mt-10">
        <h2 id="notification-heading" className="text-xl font-semibold text-ink-sub">
          {copy.mypage.notificationsTitle}
        </h2>
        <div className="mt-4">
          <NotificationList initial={mypage.notifications} />
        </div>
      </section>

      <section aria-labelledby="settings-heading" className="mt-10">
        <h2 id="settings-heading" className="text-xl font-semibold text-ink-sub">
          {copy.mypage.settingsTitle}
        </h2>
        <div className="mt-4">
          <EmailOptInToggle initialValue={mypage.emailOptIn} />
        </div>
      </section>

      <section aria-labelledby="account-heading" className="mt-10">
        <h2 id="account-heading" className="text-xl font-semibold text-ink-sub">
          {copy.mypage.accountTitle}
        </h2>
        <div className="mt-4">
          <AccountSection />
        </div>
      </section>
    </div>
  );
}
