import { LayoutGrid, ListFilter } from 'lucide-react';
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
    <div className="mx-auto flex max-w-content flex-col items-center px-4 pb-12 pt-12 sm:px-6 sm:pt-20">
      {/* DESIGN 5-1: 검색 중심 히어로. 기존 스크린 리더 제목을 그대로 보여 준다 */}
      <h1 className="text-center text-2xl font-bold text-ink sm:text-hero">{copy.search.label}</h1>
      <p className="mt-3 text-center text-base text-ink-sub">{copy.meta.description}</p>

      <div className="mt-8 w-full max-w-[640px]">
        <SearchBox />
      </div>

      {/* DESIGN 5-1: 바로가기 카드 2개. 문구·링크 대상은 copy의 기존 값 그대로 */}
      <div className="mt-10 grid w-full max-w-[640px] gap-4 sm:grid-cols-2">
        <Link
          href="/screener"
          className="rounded-lg bg-white px-4 py-5 transition-colors hover:bg-subtle sm:p-6"
        >
          <ListFilter size={24} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink">{copy.nav.screener}</h2>
          <p className="mt-1 text-sm text-ink-sub">{copy.search.hint}</p>
        </Link>
        <Link
          href="/industries"
          className="rounded-lg bg-white px-4 py-5 transition-colors hover:bg-subtle sm:p-6"
        >
          <LayoutGrid size={24} strokeWidth={1.75} className="text-brand" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink">{copy.industry.listTitle}</h2>
          <p className="mt-1 text-sm text-ink-sub">{copy.search.industryHint}</p>
        </Link>
      </div>

      <div className="mt-8 w-full">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <HomeNews />
        </Suspense>
      </div>
    </div>
  );
}
