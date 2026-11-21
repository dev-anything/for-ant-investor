// 마이페이지 추적 카드 계산 (PRD 4장 F-12, FS 9-12). 화면 없이 계산만 한다.
// 입력은 lib/data/mypage.ts가 DB에서 읽고 camelCase로 바꾼 값이다.
import { buildMetricBars, chartMetricsFor, type ChartBar, type ChartMetric } from '@/lib/chart-data';
import type { CapitalImpairment, YearRow } from '@/lib/data/stock';
import { copy } from '@/lib/copy';
import type { Insight } from '@/lib/insights';
import { topInsights } from '@/lib/insights';

// PRD F-12: 1인 추적 상한 (DB 트리거와 같은 값, 표시용)
export const WATCH_LIMIT = 20;

// 증감률 문자열의 부호로 방향을 가른다 (formatGrowth 결과 `+12.3%` · `-4.0%` · `0.0%`)
const FLAT_TEXT = '0.0%';

/** 자본잠식 표시 문구 (FS 12장 11번). 잠식이 아니거나 모르는 값이면 null (표시 없음). */
export function capitalImpairmentText(value: CapitalImpairment): string | null {
  if (value === 'full') return copy.mypage.capitalFull;
  if (value === 'partial') return copy.mypage.capitalPartial;
  return null;
}

/** 카드의 "눈여겨볼 변화": 첫 문장과 나머지 개수 (PRD F-12, "외 {N}건"). 문장이 안 만들어지는 항목은 세지 않는다. */
export function summarizeInsights(insights: Insight[]): { first: string | null; extraCount: number } {
  const texts = topInsights(insights, insights.length);
  if (texts.length === 0) return { first: null, extraCount: 0 };
  return { first: texts[0].text, extraCount: texts.length - 1 };
}

// 카드의 작은 막대 한 묶음 (F-02와 같은 기준·단위)
export interface MiniChart {
  metric: ChartMetric;
  title: string;
  bars: ChartBar[];
}

/** 카드에 그릴 작은 막대 묶음. 금융회사는 영업이익·순이익만 (PRD 3-6). 순서는 F-02와 같다. */
export function buildMiniCharts(years: YearRow[], isFinancial: boolean): MiniChart[] {
  return chartMetricsFor(isFinancial).map((metric) => ({
    metric,
    title: copy.results.metricTitle[metric],
    bars: buildMetricBars(years, metric),
  }));
}

/**
 * 최신 연도 전년 대비 증감률 한 줄 (FS 9-12). 기준 항목은 매출액(금융회사는 영업이익).
 * 최신 연도의 증감률을 계산할 수 없으면 null (전년이 없거나 0·null).
 */
export function latestGrowthText(years: YearRow[], isFinancial: boolean): string | null {
  const metric: ChartMetric = isFinancial ? 'operatingIncome' : 'revenue';
  const bars = buildMetricBars(years, metric);
  if (bars.length === 0) return null;
  const latest = bars[bars.length - 1];
  if (latest.growthText === null) return null;

  const title = copy.results.metricTitle[metric];
  if (latest.growthText === FLAT_TEXT) return copy.mypage.growthFlat(latest.fiscalYear, title);
  const percent = latest.growthText.replace(/^[+-]/, '');
  return latest.growthText.startsWith('+')
    ? copy.mypage.growthUp(latest.fiscalYear, title, percent)
    : copy.mypage.growthDown(latest.fiscalYear, title, percent);
}
