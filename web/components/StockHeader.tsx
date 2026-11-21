import { formatAccMt } from '@/lib/format';
import type { StockInfo } from '@/lib/data/stock';

// FS 8-2 StockHeader, PRD 3-5 머리: 회사 이름 + 정보 줄 (서버 컴포넌트)
// 정보 줄은 값이 있는 칸만 잇는다. 12월 결산은 formatAccMt가 null을 줘서 생략된다 (PRD 3-5)
export function StockHeader({ stock }: { stock: StockInfo }) {
  const infoParts = [
    stock.shortCode,
    stock.market,
    stock.divisionName,
    formatAccMt(stock.accMt),
  ].filter((part): part is string => part !== null && part !== '');

  return (
    <header className="border-b border-neutral-200 pb-4">
      <h1 className="text-2xl font-bold text-neutral-900">{stock.name}</h1>
      <p className="mt-1 text-sm text-neutral-600">{infoParts.join(' · ')}</p>
    </header>
  );
}
