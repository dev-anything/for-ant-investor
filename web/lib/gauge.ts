// 리포트카드 눈금 범위·위치 계산 (PRD 4장 F-05, FS 6-3). 화면 없이 계산만 한다.
// 범위는 모든 회사 공통이고 batch/rules.py의 GAUGES와 같아야 한다 (tests/rules-sync.test.ts가 확인).

export type GaugeKey = 'debt_ratio' | 'operating_margin' | 'revenue_growth';

export interface GaugeRange {
  // 눈금 끝 값 (%). 범위 밖 값은 끝에 붙이고 실제 수치는 글자로 보여준다
  min: number;
  max: number;
  // 기준선 값 (%). 부채비율은 100%(빚과 자본이 같아지는 지점), 나머지는 0%
  line: number;
}

// PRD 4장 F-05 "눈금 범위" 표
export const GAUGES: Record<GaugeKey, GaugeRange> = {
  debt_ratio: { min: 0, max: 300, line: 100 },
  operating_margin: { min: -50, max: 40, line: 0 },
  revenue_growth: { min: -40, max: 70, line: 0 },
};

export interface GaugePosition {
  // 눈금 왼쪽 끝을 0, 오른쪽 끝을 100으로 본 위치 (0~100으로 잘라서 준다)
  pct: number;
  // 눈금 밖이면 어느 쪽 밖인지. 안이면 null (끝 값과 같은 경우도 안으로 본다)
  clamped: 'low' | 'high' | null;
}

/** 값 하나의 눈금 위치를 구한다. 범위 밖이면 pct를 끝에 붙이고 clamped로 알린다. */
export function gaugePosition(value: number, key: GaugeKey): GaugePosition {
  const { min, max } = GAUGES[key];
  const raw = ((value - min) / (max - min)) * 100;
  const pct = Math.min(100, Math.max(0, raw));
  if (value < min) return { pct, clamped: 'low' };
  if (value > max) return { pct, clamped: 'high' };
  return { pct, clamped: null };
}

/** 기준선이 눈금에서 어디쯤인지 (0~100). */
export function gaugeLinePct(key: GaugeKey): number {
  const { min, max, line } = GAUGES[key];
  return ((line - min) / (max - min)) * 100;
}
