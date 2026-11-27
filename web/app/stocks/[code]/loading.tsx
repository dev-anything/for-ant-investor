import { Skeleton } from '@/components/Skeleton';

// FS 8-2, DESIGN.md 6-13: 실제 종목 화면(5-2)과 같은 모양의 스켈레톤.
// 회전·문구 없이 빈 칸만 깔아 화면 구조를 보여준다.
export default function StockLoading() {
  return (
    <div className="mx-auto max-w-content px-4 py-8">
      {/* 머리: 회사 이름과 정보 줄 */}
      <div className="space-y-2 border-b border-line pb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* DESIGN 5-2: PC는 두 단, 1024px 미만은 DOM 순서대로 한 단 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          {/* 리포트카드·실적 그래프 자리 */}
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          {/* FS 9-1: 주가 수준·배당 자리 */}
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
      {/* PRD 3-5: 기사·공시는 재무 아래 전체 폭 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
