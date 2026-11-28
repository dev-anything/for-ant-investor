// 눈금 범위·위치 계산 (PRD 4장 F-05·F-09, FS 6-3). 화면 없이 계산만 한다.
// F-05 지표 3개 범위는 batch/rules.py의 GAUGES와 같아야 한다 (tests/rules-sync.test.ts가 확인). PER·PBR은 배치에 없는 웹앱 전용 범위다.
import { copy } from '@/lib/copy';
import { formatMultiple, formatPercent } from '@/lib/format';

// F-05 리포트카드 지표 3개
export type GaugeKey = 'debt_ratio' | 'operating_margin' | 'revenue_growth';
// F-09 주가 수준 2개 (PRD 4장 F-09 "눈금 범위")
export type ValuationGaugeKey = 'per' | 'pbr';
export type AnyGaugeKey = GaugeKey | ValuationGaugeKey;

// 눈금 값의 단위. percent는 "%", multiple은 "배"
export type GaugeUnit = 'percent' | 'multiple';

export interface GaugeRange {
  // 눈금 끝 값 (단위는 GAUGE_UNIT). 범위 밖 값은 끝에 붙이고 실제 수치는 글자로 보여준다
  min: number;
  max: number;
  // 기준선 값. 기준선이 없는 지표(PER)는 null. 부채비율은 100%(빚과 자본이 같아지는 지점), 영업이익률·매출 증가율은 0%, PBR은 1배
  line: number | null;
}

// PRD 4장 F-05 "눈금 범위" 표 + PRD 4장 F-09 "눈금 범위" (PER 0~50배, PBR 0~5배)
export const GAUGES: Record<AnyGaugeKey, GaugeRange> = {
  debt_ratio: { min: 0, max: 300, line: 100 },
  operating_margin: { min: -50, max: 40, line: 0 },
  revenue_growth: { min: -40, max: 70, line: 0 },
  per: { min: 0, max: 50, line: null },
  pbr: { min: 0, max: 5, line: 1 },
};

export const GAUGE_UNIT: Record<AnyGaugeKey, GaugeUnit> = {
  debt_ratio: 'percent',
  operating_margin: 'percent',
  revenue_growth: 'percent',
  per: 'multiple',
  pbr: 'multiple',
};

export interface GaugePosition {
  // 눈금 왼쪽 끝을 0, 오른쪽 끝을 100으로 본 위치 (0~100으로 잘라서 준다)
  pct: number;
  // 눈금 밖이면 어느 쪽 밖인지. 안이면 null (끝 값과 같은 경우도 안으로 본다)
  clamped: 'low' | 'high' | null;
}

/** 값 하나의 눈금 위치를 구한다. 범위 밖이면 pct를 끝에 붙이고 clamped로 알린다. */
export function gaugePosition(value: number, key: AnyGaugeKey): GaugePosition {
  const { min, max } = GAUGES[key];
  const raw = ((value - min) / (max - min)) * 100;
  const pct = Math.min(100, Math.max(0, raw));
  if (value < min) return { pct, clamped: 'low' };
  if (value > max) return { pct, clamped: 'high' };
  return { pct, clamped: null };
}

// 3개년 점 눈금 (DESIGN-V2 2-2-1, FS 6-3). 값이 없는 연도는 점을 그리지 않는다.
// 점이 이 거리보다 가까우면 잇는 선을 그리지 않는다.
const OVERLAP_THRESHOLD_PX = 4;

// DESIGN-V2 2-2-3: 오른쪽 단처럼 눈금이 짧으면 양끝 숫자와 기준선 값이 겹친다.
// 서버에서는 실제 폭을 못 재서 글자 폭을 근사해 판단한다.
const END_LABEL_KEEP_OUT_PX = 24;
const LINE_LABEL_HALF_WIDTH_PX = 24;

export interface GaugeDot {
  year: number;
  value: number;
  pct: number;
  clamped: 'low' | 'high' | null;
  latest: boolean;
}

/** 점 후보에서 값이 없는 연도를 빼고 눈금 위치를 붙인다. 남은 마지막 점이 최신 연도다. */
export function gaugeDots(
  points: { year: number; value: number | null }[],
  key: AnyGaugeKey,
): GaugeDot[] {
  const drawn = points.flatMap((point) => {
    if (point.value === null) return [];
    const { pct, clamped } = gaugePosition(point.value, key);
    return [{ year: point.year, value: point.value, pct, clamped, latest: false }];
  });
  return drawn.map((dot, index) => ({ ...dot, latest: index === drawn.length - 1 }));
}

/** 점 사이 거리가 4px 이내면 잇는 선을 생략한다 (DESIGN-V2 2-2-1). */
export function dotsOverlap(a: GaugeDot, b: GaugeDot, widthPx: number): boolean {
  const distancePx = (Math.abs(a.pct - b.pct) / 100) * widthPx;
  return distancePx <= OVERLAP_THRESHOLD_PX;
}

/** 기준선이 눈금에서 어디쯤인지 (0~100). 기준선이 없으면 null. */
export function gaugeLinePct(key: AnyGaugeKey): number | null {
  const { min, max, line } = GAUGES[key];
  if (line === null) return null;
  return ((line - min) / (max - min)) * 100;
}

/** 눈금 끝·기준선 옆에 붙이는 단위 글자 ("%" 또는 "배"). */
export function gaugeUnitSuffix(key: AnyGaugeKey): string {
  return GAUGE_UNIT[key] === 'multiple' ? '배' : '%';
}

/**
 * 기준선 값이 양끝 숫자와 겹쳐 막대 위로 올려야 하는지 판단한다 (DESIGN-V2 2-2-3).
 * widthPx는 서버에서 근사한 눈금 폭, linePct는 gaugeLinePct 결과다.
 */
export function shouldRaiseGaugeLineLabel(linePct: number | null, widthPx: number): boolean {
  if (linePct === null || widthPx <= 0) return false;
  const centerPx = (linePct / 100) * widthPx;
  return (
    centerPx - LINE_LABEL_HALF_WIDTH_PX < END_LABEL_KEEP_OUT_PX ||
    centerPx + LINE_LABEL_HALF_WIDTH_PX > widthPx - END_LABEL_KEEP_OUT_PX
  );
}

/** 값을 지표 단위에 맞춰 화면 서식으로 바꾼다 (FS 6-1 formatPercent·formatMultiple). */
export function formatGaugeValue(value: number, key: AnyGaugeKey): string | null {
  return GAUGE_UNIT[key] === 'multiple' ? formatMultiple(value) : formatPercent(value);
}

/**
 * 눈금 스크린 리더 문장을 만든다 (PRD 10장 38번). null 연도는 "계산할 수 없어"로 읽고,
 * 범위 밖 점이 하나라도 있으면 끝에 알린다. dots는 gaugeDots 결과를 그대로 받는다.
 */
export function gaugeAriaLabel(
  name: string,
  points: { year: number; value: number | null }[],
  key: AnyGaugeKey,
  dots: GaugeDot[],
  medianText: string | null,
): string {
  const values = points
    .map(({ year, value }) =>
      `${year}년 ${value === null ? copy.reportCard.noCalc : (formatGaugeValue(value, key) ?? copy.reportCard.noCalc)}`,
    )
    .join(', ');
  const { min, max } = GAUGES[key];
  return copy.reportCard.gauge.ariaLabel({
    name,
    values,
    min,
    max,
    suffix: gaugeUnitSuffix(key),
    medianText,
    hasOutOfRange: dots.some((dot) => dot.clamped !== null),
  });
}
