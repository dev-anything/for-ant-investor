import Link from 'next/link';
import { Suspense } from 'react';
import { AuthMenu } from '@/components/AuthMenu';
import { NavLink } from '@/components/NavLink';
import { copy } from '@/lib/copy';

// FS 7장, DESIGN.md 5-3: 공통 머리 컴포넌트 (서버 컴포넌트 유지).
// md 이상은 펼침, md 미만은 <details> 접기 메뉴 (≡)
export function AppHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold text-ink transition-colors hover:text-ink-sub"
        >
          {copy.brand}
        </Link>

        {/* 오른쪽 그룹: [데스크톱 nav] [AuthMenu] [모바일 ≡] (DESIGN 5-3) */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* 데스크톱(md 이상) 메뉴 */}
          <nav aria-label="주요 메뉴" className="hidden items-center gap-4 text-sm md:flex">
            <NavLink href="/">{copy.nav.search}</NavLink>
            <NavLink href="/screener">{copy.nav.screener}</NavLink>
            {/* PRD 4장 F-15 (2차). /industries/… 전부에서 켜진다 (isActivePath 접두어 판정) */}
            <NavLink href="/industries">{copy.nav.industry}</NavLink>
          </nav>

          {/* 확장 (F-11): 로그인 메뉴. 쿼리(`?login=`)를 읽으니 Suspense로 감싼다. 자리는 AuthMenu와 같은 폭 */}
          <Suspense fallback={<div className="flex h-8 min-w-40" aria-hidden="true" />}>
            <AuthMenu />
          </Suspense>

          {/* 모바일(md 미만) 접기 메뉴 */}
          <details className="relative md:hidden">
            <summary
              aria-label="주요 메뉴"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded border border-line bg-white text-lg text-ink hover:bg-surface [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden="true">≡</span>
            </summary>
            <nav
              aria-label="주요 메뉴"
              className="absolute right-0 top-full z-50 mt-2 flex w-40 flex-col gap-2 rounded border border-line bg-white p-3 text-sm"
            >
              <NavLink href="/">{copy.nav.search}</NavLink>
              <NavLink href="/screener">{copy.nav.screener}</NavLink>
              <NavLink href="/industries">{copy.nav.industry}</NavLink>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
