import { Skeleton } from '@/components/Skeleton';

// FS 8-3 로딩: 제목·필터 자리·표 자리 스켈레톤
export default function ScreenerLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-40 w-full" />
      <Skeleton className="mt-6 h-64 w-full" />
    </div>
  );
}
