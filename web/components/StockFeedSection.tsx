import { Suspense } from 'react';
import { DisclosureList } from '@/components/DisclosureList';
import { Skeleton } from '@/components/Skeleton';

// FS 9-1 StockFeedSection (PRD 3-5 6번): 회사 기사 칸과 최근 공시 칸을 PC에서 두 열로 나란히 둔다. 좁은 화면은 한 열(기사 위, 공시 아래)
// 기사 칸(F-18)은 11단계에서 왼쪽 열을 채운다. 지금은 빈 자리로 두어 두 열 배치를 유지한다.
export function StockFeedSection({ corpCode }: { corpCode: string | null }) {
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <div aria-hidden="true" className="hidden md:block" />
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <DisclosureList corpCode={corpCode} />
      </Suspense>
    </div>
  );
}
