import { CapitalNotice } from '@/components/CapitalNotice';
import { InsightList } from '@/components/InsightList';
import { MetricRow } from '@/components/MetricRow';
import { getDisplayYears } from '@/lib/chart-data';
import type { StockSummary, YearRow } from '@/lib/data/stock';
import { copy } from '@/lib/copy';
import { topInsights } from '@/lib/insights';
import { metricValues } from '@/lib/report-card';

// FS 8-2 ReportCard / PRD 4장 F-05. 순서: 금융회사 자본잠식 안내 → 눈여겨볼 변화 → 지표 3개
// 자본잠식 안내 위치: 일반 회사는 부채비율 눈금 자리(full 상자, partial 눈금 아래 한 줄), 금융회사는 맨 위 (PRD 4장 F-05 표, FS 8-2)
// 금융회사 판별·자본잠식 판정은 배치 값을 읽을 뿐 다시 하지 않는다 (FS 1장)
export function ReportCard({ summary, years }: { summary: StockSummary; years: YearRow[] }) {
  const displayYears = getDisplayYears(years);
  // 화면 연도가 없으면 그리지 않는다 (재무 없음 문구는 ResultsCharts가 맡는다, PRD 3-7)
  if (displayYears.length === 0) return null;

  const { isFinancial, capitalImpairment } = summary;
  const insightItems = topInsights(summary.insights);
  const hasCapitalNotice = capitalImpairment === 'full' || capitalImpairment === 'partial';
  // 금융회사에서 보여줄 것이 하나도 없으면 제목만 남기지 않도록 영역 전체를 숨긴다
  if (isFinancial && !hasCapitalNotice && insightItems.length === 0) return null;

  const debtValues = metricValues(displayYears, 'debt_ratio');

  return (
    <section aria-labelledby="report-card-title" className="mt-8">
      <h2 id="report-card-title" className="text-lg font-bold text-neutral-900">
        {copy.reportCard.title}
      </h2>
      <div className="mt-4 rounded border border-neutral-300 px-4">
        {isFinancial && hasCapitalNotice && (
          <div className="py-4">
            <CapitalNotice impairment={capitalImpairment} />
          </div>
        )}
        <InsightList items={insightItems} />
        {/* 금융회사는 지표 3개 눈금을 그리지 않는다 (PRD 3-6, F-05) */}
        {!isFinancial && (
          <>
            <MetricRow
              gauge="debt_ratio"
              values={debtValues}
              gaugeSlot={
                capitalImpairment === 'full' ? <CapitalNotice impairment="full" /> : undefined
              }
              belowGauge={
                capitalImpairment === 'partial' ? <CapitalNotice impairment="partial" /> : undefined
              }
            />
            <MetricRow gauge="operating_margin" values={metricValues(displayYears, 'operating_margin')} />
            <MetricRow gauge="revenue_growth" values={metricValues(displayYears, 'revenue_growth')} />
          </>
        )}
      </div>
    </section>
  );
}
