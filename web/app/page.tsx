import Link from 'next/link';
import { Suspense } from 'react';
import { HomeNews } from '@/components/HomeNews';
import { SearchBox } from '@/components/SearchBox';
import { Skeleton } from '@/components/Skeleton';
import { copy } from '@/lib/copy';

// FS 3-3: 첫 화면은 기사 칸 때문에 30분마다 다시 그린다 (FS 3-3, F-18)
export const revalidate = 1800;

// FS 8-1 `/` 검색 (F-01). 검색은 SearchBox가 API Route를 부른다. 경제 기사 칸(F-18)은 Suspense 안에서 따로 기다린다
export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16">
      <h1 className="sr-only">{copy.search.label}</h1>
      <SearchBox />
      <p className="mt-4 text-sm text-ink-sub">
        {copy.search.hint}{' '}
        <Link href="/screener" className="text-ink underline underline-offset-2 hover:text-ink-sub">
          {copy.nav.screener}
        </Link>
      </p>
      {/* PRD 3-5 첫 화면 바로가기 2번째 줄 (2차, F-15) */}
      <p className="mt-2 text-sm text-ink-sub">
        {copy.search.industryHint}{' '}
        <Link href="/industries" className="text-ink underline underline-offset-2 hover:text-ink-sub">
          {copy.search.industryLink}
        </Link>
      </p>
      <div className="mt-12 w-full">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <HomeNews />
        </Suspense>
      </div>
    </div>
  );
}
