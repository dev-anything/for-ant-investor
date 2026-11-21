import { copy } from '@/lib/copy';

// FS 8-2, FS 12장 2번: 없는 종목 주소 (404)
export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-lg text-neutral-900">{copy.stock.notFound}</h1>
    </div>
  );
}
