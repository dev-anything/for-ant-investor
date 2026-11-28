import Link from 'next/link';

import { CapitalNotice } from '@/components/CapitalNotice';
import { InsightList } from '@/components/InsightList';
import { MetricRow } from '@/components/MetricRow';
import { getDisplayYears } from '@/lib/chart-data';
import type { GaugeKey } from '@/lib/gauge';
import type { StockIndustry, StockSummary, YearRow } from '@/lib/data/stock';
import { copy } from '@/lib/copy';
import { compareToIndustry, type IndustryCompare } from '@/lib/industry';
import { topInsights } from '@/lib/insights';
import { latestValue, metricValues, shouldShowReportCard } from '@/lib/report-card';

// FS 8-2 ReportCard / PRD 4장 F-05, DESIGN.md 4-1 흰 카드(rounded-lg, p-4 sm:p-6), 5-2.
// 순서: 금융회사 자본잠식 안내 → 눈여겨볼 변화 → 지표 3개(매출 증가율 → 영업이익률 → 부채비율) → 같은 업종 회사 보기
export function ReportCard({
  summary,
  years,
  industry,
}: {
  summary: StockSummary;
  years: YearRow[];
  industry: StockIndustry | null;
}) {
  const displayYears = getDisplayYears(years);
  const displayYearNumbers = displayYears.map((row) => row.fiscalYear);
  // 영역 숨김 판단은 페이지의 두 단 배치와 같아야 하므로 순수 함수로 같이 쓴다 (DESIGN-V2 2-1)
  if (!shouldShowReportCard(summary, years, industry)) return null;

  const { isFinancial, capitalImpairment } = summary;
  const insightItems = topInsights(summary.insights);
  const hasCapitalNotice = capitalImpairment === 'full' || capitalImpairment === 'partial';

  // 지표별 값은 한 번만 계산해 눈금과 업종 비교에 함께 쓴다
  const growthValues = metricValues(displayYears, 'revenue_growth');
  const marginValues = metricValues(displayYears, 'operating_margin');
  const debtValues = metricValues(displayYears, 'debt_ratio');

  return (
    <section aria-labelledby="report-card-title" className="rounded-lg bg-surface p-4 sm:p-6">
      <h2 id="report-card-title" className="text-lg font-semibold text-ink">
        {copy.reportCard.title}
      </h2>
      <div className="mt-4">
        {isFinancial && hasCapitalNotice && (
          <div className="py-2">
            <CapitalNotice impairment={capitalImpairment} />
          </div>
        )}
        <InsightList items={insightItems} />
        {/* 금융회사는 지표 3개 눈금을 그리지 않는다 (PRD 3-6, F-05) */}
        {!isFinancial && (
          <>
            {/* 업종 정보가 없으면 지표마다 반복하지 않고 한 번만 알린다 (PRD 4장 F-08) */}
            {industry === null && <p className="py-4 text-sm text-ink-sub">{copy.industry.noIndustry}</p>}
            {/* data-tour="debt": 부채비율 행 또는 그 자리의 완전 자본잠식 상자를 짚는다 (FS 9-1) */}
            <MetricRow
              gauge="revenue_growth"
              values={growthValues}
              years={displayYearNumbers}
              compare={compareFor('revenue_growth', growthValues, industry)}
            />
            <MetricRow
              gauge="operating_margin"
              values={marginValues}
              years={displayYearNumbers}
              compare={compareFor('operating_margin', marginValues, industry)}
            />
            <div data-tour="debt">
              <MetricRow
                gauge="debt_ratio"
                values={debtValues}
                years={displayYearNumbers}
                compare={compareFor('debt_ratio', debtValues, industry)}
                gaugeSlot={
                  capitalImpairment === 'full' ? <CapitalNotice impairment="full" /> : undefined
                }
                belowGauge={
                  capitalImpairment === 'partial' ? <CapitalNotice impairment="partial" /> : undefined
                }
              />
            </div>
          </>
        )}
        {/* 금융회사도 업종이 있으면 링크를 보여준다 (FS 9-2) */}
        {industry !== null && (
          <p className="border-t border-line pt-4">
            <Link
              href={`/industries/${industry.divisionCode}/compare`}
              className="text-sm font-medium text-ink underline underline-offset-2 hover:text-ink-sub"
            >
              {copy.industry.compareLink}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

// 지표 하나의 업종 비교 (PRD 4장 F-08). Y3 값과 같은 업종 가운데 값·회사 수를 견준다
function compareFor(key: GaugeKey, values: (number | null)[], industry: StockIndustry | null): IndustryCompare {
  if (industry === null) return { kind: 'no_industry' };
  const { value, n } = industry.medians[key];
  return compareToIndustry(latestValue(values), value, n, true);
}
