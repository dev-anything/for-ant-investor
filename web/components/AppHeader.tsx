import Link from 'next/link';
import { Suspense } from 'react';
import { AuthMenu } from '@/components/AuthMenu';
import { NavLink } from '@/components/NavLink';
import { copy } from '@/lib/copy';

// FS 7장: 공통 머리 컴포넌트 (서버 컴포넌트, 쿠키를 읽지 않음). 현재 경로 표시는 NavLink가 맡는다
export function AppHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold text-neutral-900 transition-colors hover:text-neutral-700"
          >
            {copy.brand}
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-4 text-sm">
            <NavLink href="/">{copy.nav.search}</NavLink>
            <NavLink href="/screener">{copy.nav.screener}</NavLink>
            {/* PRD 4장 F-15 (2차). /industries/… 전부에서 켜진다 (isActivePath 접두어 판정) */}
            <NavLink href="/industries">{copy.nav.industry}</NavLink>
          </nav>
        </div>
        {/* 확장 (F-11): 로그인 메뉴. 쿼리(`?login=`)를 읽으니 Suspense로 감싼다. 자리는 AuthMenu와 같은 폭 */}
        <Suspense fallback={<div className="flex h-8 min-w-40" aria-hidden="true" />}>
          <AuthMenu />
        </Suspense>
      </div>
    </header>
  );
}
