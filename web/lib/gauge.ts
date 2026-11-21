// 눈금 범위·위치 계산 (PRD 4장 F-05·F-09, FS 6-3). 화면 없이 계산만 한다.
// F-05 지표 3개 범위는 batch/rules.py의 GAUGES와 같아야 한다 (tests/rules-sync.test.ts가 확인). PER·PBR은 배치에 없는 웹앱 전용 범위다.
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

/** 값을 지표 단위에 맞춰 화면 서식으로 바꾼다 (FS 6-1 formatPercent·formatMultiple). */
export function formatGaugeValue(value: number, key: AnyGaugeKey): string | null {
  return GAUGE_UNIT[key] === 'multiple' ? formatMultiple(value) : formatPercent(value);
}
