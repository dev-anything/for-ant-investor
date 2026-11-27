import { copy } from '@/lib/copy';

// 종목 밖의 없는 주소 (404). 문구는 lib/copy.ts의 임시 문구 (문구 미정)
export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="rounded border-l-4 border-brand bg-surface px-4 py-6 text-lg text-ink">
        {copy.notFoundPage}
      </h1>
    </div>
  );
}
