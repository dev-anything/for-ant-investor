'use client';

import { ResultsChart } from '@/components/ResultsChart';
import type { YearRow } from '@/lib/data/stock';
import { buildMetricBars, chartMetricsFor, getDisplayYears } from '@/lib/chart-data';
import { copy } from '@/lib/copy';
import { formatFsDiv, formatYearRange } from '@/lib/format';

// FS 8-2 ResultsCharts, DESIGN.md 5-2 흰 카드(rounded-lg, p-4 sm:p-6), 6-4: 최근 3개년 실적 막대그래프 묶음
export function ResultsCharts({
  years,
  fsDiv,
  isFinancial,
}: {
  years: YearRow[];
  fsDiv: string;
  isFinancial: boolean;
}) {
  const displayYears = getDisplayYears(years);
  // 화면 연도가 하나도 없으면 그래프를 그리지 않고 재무 없음 문구를 쓴다 (PRD 3-7)
  if (displayYears.length === 0) {
    return <p className="text-ink-sub">{copy.stock.noFinancials}</p>;
  }

  const yearRange = formatYearRange(displayYears.map((row) => row.fiscalYear)) ?? '';
  const fsLabel = formatFsDiv(fsDiv) ?? fsDiv;
  const metrics = chartMetricsFor(isFinancial);

  return (
    <section aria-labelledby="results-title" className="rounded-lg bg-surface p-4 sm:p-6">
      <h2 id="results-title" className="text-lg font-semibold text-ink">
        {copy.results.title}
      </h2>
      <p className="mt-1 text-sm text-ink-sub">{copy.results.basis(fsLabel, yearRange)}</p>
      {isFinancial && (
        <p className="mt-2 rounded border border-line bg-white px-3 py-2 text-sm text-ink-sub">
          {copy.results.financialNotice}
        </p>
      )}
      {/* 가로 3개, 좁은 화면은 세로로 쌓는다. data-tour는 읽는 순서 안내가 짚는 자리다 (FS 9-1)
          sales = 매출액 그래프 하나, profit = 영업이익·순이익 묶음 (두 칸 차지, 금융회사는 세 칸 전부) */}
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        {metrics.includes('revenue') && (
          <div data-tour="sales" className="min-w-0">
            <ResultsChart metric="revenue" bars={buildMetricBars(years, 'revenue')} />
          </div>
        )}
        <div
          data-tour="profit"
          className={`grid min-w-0 gap-6 md:grid-cols-2 ${isFinancial ? 'md:col-span-3' : 'md:col-span-2'}`}
        >
          {metrics
            .filter((metric) => metric !== 'revenue')
            .map((metric) => (
              <ResultsChart key={metric} metric={metric} bars={buildMetricBars(years, metric)} />
            ))}
        </div>
      </div>
    </section>
  );
}
