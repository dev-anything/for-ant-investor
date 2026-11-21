// 리포트카드 지표 값 준비·표시 (PRD 4장 F-05, FS 8-2 MetricRow). 화면 없이 계산만 한다.
// 값은 뷰(v_company_years)가 계산한 것을 그대로 읽는다. 여기서 다시 계산하지 않는다 (FS 1장).
import { copy } from '@/lib/copy';
import type { YearRow } from '@/lib/data/stock';
import type { GaugeKey } from '@/lib/gauge';
import { formatPercent } from '@/lib/format';

// PRD 4장 F-05 지표 3개 (화면 순서)
export const REPORT_METRIC_KEYS: readonly GaugeKey[] = ['debt_ratio', 'operating_margin', 'revenue_growth'];

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

/** 값 목록을 `(a → b → c)` 줄로 만든다. null 칸은 "계산할 수 없어" (PRD 4장 F-05 표). 단위 %. */
export function formatValueLine(values: (number | null)[]): string {
  const parts = values.map((v) => formatPercent(v) ?? copy.reportCard.noCalc);
  return `(${parts.join(' → ')})`;
}
