import { Skeleton } from '@/components/Skeleton';

// FS 8-3 로딩, DESIGN 6-13: 제목·문장 입력칸·필터 패널·결과 카드 자리를 실제 모양에 맞춰 깐다
export default function ScreenerLoading() {
  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-12 w-full rounded-md" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
