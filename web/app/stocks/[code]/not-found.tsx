import { copy } from '@/lib/copy';

// FS 8-2, FS 12장 2번, DESIGN.md 4-6: 없는 종목 주소 (404 안내 박스 스타일, h1 접근성 유지)
export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="mt-6 rounded border-l-4 border-ink bg-surface px-4 py-6 text-lg text-ink">
        {copy.stock.notFound}
      </h1>
    </div>
  );
}
