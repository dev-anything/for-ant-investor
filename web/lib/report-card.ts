// 리포트카드 지표 값 준비·표시 (PRD 4장 F-05, FS 8-2 MetricRow). 화면 없이 계산만 한다.
// 값은 뷰(v_company_years)가 계산한 것을 그대로 읽는다. 여기서 다시 계산하지 않는다 (FS 1장).
import { getDisplayYears } from '@/lib/chart-data';
import { copy } from '@/lib/copy';
import type { StockIndustry, StockSummary, YearRow } from '@/lib/data/stock';
import type { GaugeKey } from '@/lib/gauge';
import { formatPercent } from '@/lib/format';
import { topInsights } from '@/lib/insights';

// PRD 4장 F-05 지표 3개 (화면 순서). 매출 → 영업이익 → 빚 순서다
export const REPORT_METRIC_KEYS: readonly GaugeKey[] = ['revenue_growth', 'operating_margin', 'debt_ratio'];

// 지표 키 → 연도 행의 값 필드
const METRIC_FIELD: Record<GaugeKey, (row: YearRow) => number | null> = {
  debt_ratio: (row) => row.debtRatio,
  operating_margin: (row) => row.operatingMargin,
  revenue_growth: (row) => row.revenueGrowth,
};

/** 화면 연도 행(오래된 → 최근)에서 지표 값 목록을 뽑는다. null 칸은 그대로 둔다. */
export function metricValues(years: YearRow[], key: GaugeKey): (number | null)[] {
  return years.map(METRIC_FIELD[key]);
}

/** 가장 최근 값(Y3). 목록이 비었거나 마지막 칸이 null이면 null. */
export function latestValue(values: (number | null)[]): number | null {
  if (values.length === 0) return null;
  return values[values.length - 1];
}

/** 3개년 값 줄 `2023 a → 2024 b → 2025 c`를 만든다. null 칸은 "계산할 수 없어" (FS 8-2). 단위 %. */
export function formatValueLine(points: { year: number; value: number | null }[]): string {
  return points
    .map(({ year, value }) => `${year} ${formatPercent(value) ?? copy.reportCard.noCalc}`)
    .join(' → ');
}

/**
 * 리포트카드 영역을 그릴지 본다. 영역이 숨으면 아래 두 단이 PER·PBR | 배당 두 칸이 된다 (DESIGN-V2 2-1).
 * 숨김 조건은 ReportCard와 같은 것을 쓰도록 여기에 모아 둔다 (PRD 4장 F-05·F-08).
 */
export function shouldShowReportCard(
  summary: StockSummary,
  years: YearRow[],
  industry: StockIndustry | null
): boolean {
  if (getDisplayYears(years).length === 0) return false;
  const { isFinancial, capitalImpairment } = summary;
  const hasCapitalNotice = capitalImpairment === 'full' || capitalImpairment === 'partial';
  if (isFinancial && !hasCapitalNotice && topInsights(summary.insights).length === 0 && industry === null) {
    return false;
  }
  return true;
}
