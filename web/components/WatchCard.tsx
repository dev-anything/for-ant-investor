// FS 9-12 WatchCard (서버 컴포넌트): 추적 종목 한 장 (PRD F-12).
// 카드 전체가 종목 화면 링크다. KRX 목록에서 빠진 종목은 종목 화면이 404라 링크를 두지 않는다.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { MiniBars } from '@/components/MiniBars';
import { copy } from '@/lib/copy';
import type { WatchEntry } from '@/lib/data/mypage';
import {
  buildMiniCharts,
  capitalImpairmentText,
  latestGrowthText,
  summarizeInsights,
} from '@/lib/mypage';

const CARD_CLASS =
  'block h-full rounded border border-line bg-surface p-4 transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

export function WatchCard({ watch }: { watch: WatchEntry }) {
  const body = <WatchCardBody watch={watch} />;
  // 목록에서 빠진 종목·코드가 없는 종목은 링크 없이 보여준다
  if (!watch.isListed || watch.shortCode === null) {
    return <div className={CARD_CLASS}>{body}</div>;
  }
  return (
    <Link href={`/stocks/${watch.shortCode}`} className={`${CARD_CLASS} hover:border-ink`}>
      {body}
    </Link>
  );
}

function WatchCardBody({ watch }: { watch: WatchEntry }) {
  const summary = watch.summary;
  // 자본잠식 표시 (FS 12장 11번). 잠식이 아니면 없음
  const capital = summary === null ? null : capitalImpairmentText(summary.capitalImpairment);
  const insight = summary === null ? { first: null, extraCount: 0 } : summarizeInsights(summary.insights);
  const growth = summary === null ? null : latestGrowthText(watch.years, summary.isFinancial);
  const charts = summary === null ? [] : buildMiniCharts(watch.years, summary.isFinancial);

  return (
    <>
      <h3 className="font-medium text-ink">
        {watch.name}
        {watch.shortCode !== null && <span className="ml-1 text-sm text-ink-sub">({watch.shortCode})</span>}
      </h3>
      {watch.market !== null && <p className="mt-0.5 text-xs text-ink-sub">{watch.market}</p>}

      {!watch.isListed && <Line strong>{copy.mypage.delisted}</Line>}
      {summary === null && <Line>{copy.mypage.noFinancials}</Line>}
      {capital !== null && <Line strong>{capital}</Line>}

      {charts.length > 0 && charts.some((chart) => chart.bars.length > 0) && (
        <div className="mt-3">
          <MiniBars charts={charts} />
        </div>
      )}
      {growth !== null && <Line>{growth}</Line>}
      {insight.first !== null && (
        <Line>
          <span className="text-ink-sub">{copy.reportCard.insightTitle}: </span>
          {insight.first}
          {insight.extraCount > 0 && <span className="ml-1 text-ink-sub">{copy.mypage.moreInsights(insight.extraCount)}</span>}
        </Line>
      )}
    </>
  );
}

// 카드 안 한 줄 (간격 통일)
function Line({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <p className={`mt-2 text-sm ${strong ? 'font-medium text-ink' : 'text-ink-sub'}`}>{children}</p>;
}
