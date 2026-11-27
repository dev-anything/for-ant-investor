import { Skeleton } from '@/components/Skeleton';

// FS 8-2, DESIGN.md 5-6: 머리·카드·그래프 자리 스켈레톤 (회전·문구 없이 빈 칸으로 화면 구조를 보여줌)
export default function StockLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-2 border-b border-line pb-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
        {/* FS 9-1: 주가 수준·배당 자리 */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
