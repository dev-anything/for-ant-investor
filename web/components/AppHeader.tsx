import Link from 'next/link';
import { Menu, Radar } from 'lucide-react';
import { Suspense } from 'react';
import { AuthMenu } from '@/components/AuthMenu';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavLink } from '@/components/NavLink';
import { copy } from '@/lib/copy';

// FS 7장, DESIGN.md 4-2: 공통 머리 (서버 컴포넌트 유지). 흰 바탕, 아래 line 선, 64px, 위 고정.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        {/* DESIGN 4-2: 보라 정사각형 심볼(32px) + 로고 글자(20px/800) */}
        <Link href="/" className="flex shrink-0 items-center gap-2 text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand">
            <Radar size={20} strokeWidth={2} className="text-white" aria-hidden="true" />
          </span>
          <span className="text-xl font-extrabold">{copy.brand}</span>
        </Link>

        {/* 가운데 작은 검색창. 홈에서는 HeaderSearch가 스스로 숨는다 */}
        <HeaderSearch />

        {/* 오른쪽 그룹: [데스크톱 nav] [AuthMenu] [모바일 ≡] */}
        <div className="flex shrink-0 items-center gap-2 md:gap-6">
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

          {/* 모바일(md 미만) 접기 메뉴: 흰 팝오버 카드 + 1px line (DESIGN 4-2) */}
          <details className="relative md:hidden">
            <summary
              aria-label="주요 메뉴"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-line bg-white text-ink hover:bg-subtle [&::-webkit-details-marker]:hidden"
            >
              <Menu size={20} strokeWidth={2} aria-hidden="true" />
            </summary>
            <nav
              aria-label="주요 메뉴"
              className="absolute right-0 top-full z-50 mt-2 flex w-40 flex-col gap-2 rounded-md border border-line bg-white p-3 text-sm shadow-[0_8px_24px_rgb(0_0_0/0.08)]"
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
