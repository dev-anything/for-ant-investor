import { Suspense } from 'react';
import { DisclosureList } from '@/components/DisclosureList';
import { Skeleton } from '@/components/Skeleton';
import { StockNews } from '@/components/StockNews';

// FS 9-1 StockFeedSection (PRD 3-5 6번): 회사 기사(왼쪽)와 최근 공시(오른쪽). PC 두 열, 좁은 화면은 기사 위·공시 아래
// 칸마다 Suspense로 따로 기다려서 한 칸이 느려도 다른 칸은 먼저 뜬다
export function StockFeedSection({
  name,
  shortCode,
  corpCode,
}: {
  name: string;
  shortCode: string;
  corpCode: string | null;
}) {
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <StockNews name={name} shortCode={shortCode} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <DisclosureList corpCode={corpCode} />
      </Suspense>
    </div>
  );
}
