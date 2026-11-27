import { Info } from 'lucide-react';
import { copy } from '@/lib/copy';

// 종목 밖의 없는 주소 (404). 문구는 lib/copy.ts의 임시 문구 (문구 미정)
// DESIGN.md 6-12: 흰 카드 가운데 + subtle 안내 박스 + ⓘ. h1 접근성은 유지한다
export default function NotFound() {
  return (
    <div className="mx-auto max-w-content px-4 py-16">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg bg-surface p-6 sm:p-12">
        <h1 className="flex w-full items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
          <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <span>{copy.notFoundPage}</span>
        </h1>
      </div>
    </div>
  );
}
