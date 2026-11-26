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
import { latestValue, metricValues } from '@/lib/report-card';

// FS 8-2 ReportCard / PRD 4장 F-05. 순서: 금융회사 자본잠식 안내 → 눈여겨볼 변화 → 지표 3개(매출 증가율 → 영업이익률 → 부채비율) → 같은 업종 회사 보기
// 자본잠식 안내 위치: 일반 회사는 부채비율 눈금 자리(full 상자, partial 눈금 아래 한 줄), 금융회사는 맨 위 (PRD 4장 F-05 표, FS 8-2)
// 금융회사 판별·자본잠식 판정은 배치 값을 읽을 뿐 다시 하지 않는다 (FS 1장)
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
  // 화면 연도가 없으면 그리지 않는다 (재무 없음 문구는 ResultsCharts가 맡는다, PRD 3-7)
  if (displayYears.length === 0) return null;

  const { isFinancial, capitalImpairment } = summary;
  const insightItems = topInsights(summary.insights);
  const hasCapitalNotice = capitalImpairment === 'full' || capitalImpairment === 'partial';
  // 금융회사에서 보여줄 것이 하나도 없으면 제목만 남기지 않도록 영역 전체를 숨긴다.
  // 업종이 있으면 "같은 업종 회사 보기" 링크가 남으므로 숨기지 않는다 (PRD 4장 F-08, FS 9-2)
  if (isFinancial && !hasCapitalNotice && insightItems.length === 0 && industry === null) return null;

  // 지표별 값은 한 번만 계산해 눈금과 업종 비교에 함께 쓴다
  const growthValues = metricValues(displayYears, 'revenue_growth');
  const marginValues = metricValues(displayYears, 'operating_margin');
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
            {/* 업종 정보가 없으면 지표마다 반복하지 않고 한 번만 알린다 (PRD 4장 F-08) */}
            {industry === null && <p className="py-4 text-sm text-neutral-700">{copy.industry.noIndustry}</p>}
            {/* data-tour="debt": 부채비율 행 또는 그 자리의 완전 자본잠식 상자를 짚는다 (FS 9-1) */}
            <MetricRow
              gauge="revenue_growth"
              values={growthValues}
              compare={compareFor('revenue_growth', growthValues, industry)}
            />
            <MetricRow
              gauge="operating_margin"
              values={marginValues}
              compare={compareFor('operating_margin', marginValues, industry)}
            />
            <div data-tour="debt">
              <MetricRow
                gauge="debt_ratio"
                values={debtValues}
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
          <p className="py-4">
            <Link
              href={`/industries/${industry.divisionCode}/compare`}
              className="text-sm font-medium text-neutral-900 underline underline-offset-2"
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
