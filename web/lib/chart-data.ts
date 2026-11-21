// F-02 실적 그래프의 데이터 변환 (PRD 4장 F-02, FS 8-2 ResultsCharts). 화면 없이 계산만 한다.
// 입력은 v_company_years 행 전체(저장 연도 최대 4개). 화면 연도(is_display_year)만 그래프에 그리고,
// 전년 대비 증감률은 저장된 전년 행이 있을 때만 계산한다 (PRD 4장 F-02 예외).
import type { YearRow } from '@/lib/data/stock';
import { formatAmount, formatGrowth, formatWon } from '@/lib/format';

export type ChartMetric = 'revenue' | 'operatingIncome' | 'netIncome';

// PRD 4장 F-02: 세 그래프 순서 (매출액 / 영업이익 / 순이익)
export const ALL_CHART_METRICS: readonly ChartMetric[] = ['revenue', 'operatingIncome', 'netIncome'];

// PRD 3-6: 금융회사는 매출액 그래프를 그리지 않는다 (판별값은 배치가 저장한 is_financial을 그대로 받는다)
export const FINANCIAL_CHART_METRICS: readonly ChartMetric[] = ['operatingIncome', 'netIncome'];

// 막대 위·아래 값 라벨이 잘리지 않게 축 끝을 조금 넓힌다 (값 표시 자리)
const LABEL_ROOM_RATIO = 1.15;

export interface ChartBar {
  fiscalYear: number;
  // X축 라벨 (PRD 3-8 연도 형식): '2025년'
  label: string;
  // 원 단위 원본. null이면 그 막대 자리에 "제공되지 않음"
  value: number | null;
  // 막대 위 라벨 (PRD 3-8 금액 단위). null이면 라벨 없음
  valueText: string | null;
  // 툴팁용 정확한 금액 (원 단위 쉼표)
  exactText: string | null;
  // 전년 대비 증감률 (예: '+12.3%'). 전년이 저장되지 않았거나 0·null이면 null
  growthText: string | null;
  isNegative: boolean;
}

/** 화면 연도(is_display_year)만 골라 오래된 → 최근 순으로 돌려준다. */
export function getDisplayYears(years: YearRow[]): YearRow[] {
  return years
    .filter((row) => row.isDisplayYear)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}

/** 금융회사 여부에 따라 그릴 그래프 항목을 고른다 (PRD 3-6, F-02). */
export function chartMetricsFor(isFinancial: boolean): readonly ChartMetric[] {
  return isFinancial ? FINANCIAL_CHART_METRICS : ALL_CHART_METRICS;
}

/** 항목 하나의 막대 데이터를 만든다. 입력 years는 저장된 연도 전부여야 전년 값을 찾는다. */
export function buildMetricBars(years: YearRow[], metric: ChartMetric): ChartBar[] {
  return getDisplayYears(years).map((row) => {
    const value = row[metric];
    // 전년은 화면 연도가 아니어도 저장된 행이면 쓴다 (FS 8-2 툴팁 규칙)
    const prev = years.find((candidate) => candidate.fiscalYear === row.fiscalYear - 1);
    return {
      fiscalYear: row.fiscalYear,
      label: `${row.fiscalYear}년`,
      value,
      valueText: formatAmount(value),
      exactText: formatWon(value),
      growthText: prev ? formatGrowth(value, prev[metric]) : null,
      isNegative: value !== null && value < 0,
    };
  });
}

/**
 * 그래프 세로축 범위. 0을 항상 포함하고 (적자면 0 아래까지), 값 라벨 자리를 조금 넓힌다.
 * 값이 하나도 없으면 [0, 1]을 돌려 빈 축이 깨지지 않게 한다.
 */
export function getAxisDomain(bars: ChartBar[]): [number, number] {
  const values = bars.flatMap((bar) => (bar.value === null ? [] : [bar.value]));
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  if (max === 0 && min === 0) return [0, 1];
  return [min * LABEL_ROOM_RATIO, max * LABEL_ROOM_RATIO];
}
