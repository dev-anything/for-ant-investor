import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { ReadingTour } from '@/components/ReadingTour';
import { Tooltip } from '@/components/Tooltip';
import { WatchButton } from '@/components/WatchButton';
import { copy } from '@/lib/copy';
import { formatAccMt } from '@/lib/format';
import type { StockInfo } from '@/lib/data/stock';

// FS 8-2 StockHeader, PRD 3-5 머리: 회사 이름 + 정보 줄 (서버 컴포넌트)
// 정보 줄은 값이 있는 칸만 잇는다. 12월 결산은 formatAccMt가 null을 줘서 생략된다 (PRD 3-5)
// 업종 이름은 F-15 업종 목록으로 가는 링크다 (PRD 4장 F-15, 2차)
// readingTour: status='ok'일 때만 넘긴다 (PRD 4장 F-16, FS 9-8). 없으면 알림 띠·버튼도 없다
// watchable: 외국회사가 아닐 때만 true (PRD F-12, FS 9-12). 추적하기 버튼은 오른쪽에 둔다
export function StockHeader({
  stock,
  readingTour,
  watchable = false,
}: {
  stock: StockInfo;
  readingTour?: { isFinancial: boolean };
  watchable?: boolean;
}) {
  const infoParts: ReactNode[] = [stock.shortCode, stock.market];

  if (stock.divisionCode !== null && stock.divisionName !== null) {
    infoParts.push(
      <span className="inline-flex items-center gap-1">
        <Link
          href={`/industries/${stock.divisionCode}`}
          className="underline underline-offset-2 hover:text-neutral-900"
        >
          {stock.divisionName}
        </Link>
        <Tooltip text={copy.industry.stockTip} label={copy.reportCard.tipButtonLabel} />
      </span>
    );
  }

  const accText = formatAccMt(stock.accMt);
  if (accText !== null && accText !== '') infoParts.push(accText);

  return (
    <header className="border-b border-neutral-200 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{stock.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {infoParts.map((part, index) => (
              // 정보 줄 칸은 고정된 순서라 위치를 키로 써도 된다
              <Fragment key={index}>
                {index > 0 && ' · '}
                {part}
              </Fragment>
            ))}
          </p>
        </div>
        {watchable && <WatchButton code={stock.shortCode} />}
      </div>
      {readingTour && <ReadingTour isFinancial={readingTour.isFinancial} />}
    </header>
  );
}
