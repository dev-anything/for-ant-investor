import { Info } from 'lucide-react';
import { copy } from '@/lib/copy';

// FS 8-2, FS 12장 2번, DESIGN.md 6-12: 없는 종목 주소 (404 안내 박스, h1 접근성 유지)
export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-content px-4 py-16">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg bg-surface p-6 sm:p-12">
        <h1 className="flex w-full items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
          <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <span>{copy.stock.notFound}</span>
        </h1>
      </div>
    </div>
  );
}
