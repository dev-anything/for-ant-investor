// 3년 방향 화살표 판정 (PRD 4장 F-05, FS 6-2). 화면 없이 계산만 한다.
// "비슷한 수준" 판정 폭은 눈금 폭의 3%이고, batch/rules.py의 is_flat과 같은 규칙이다 (경계 포함 `<=`).
import { copy } from '@/lib/copy';
import { GAUGES, type GaugeKey } from '@/lib/gauge';

// PRD 4장 F-05: 두 번의 변화가 눈금 폭의 3% 이내면 비슷한 수준
export const FLAT_SHARE_PERCENT = 3;

// 화살표는 한 가지 색으로 쓴다 (PRD 4장 F-05)
export const TREND_ARROW = {
  up: '↗',
  down: '↘',
  mixed: '↕',
  flat: '→',
} as const;

export type TrendArrow = (typeof TREND_ARROW)[keyof typeof TREND_ARROW];

export interface Trend {
  arrow: TrendArrow;
  label: string;
}

// 비슷한 수준 판정 폭 (눈금 폭 × 3%)
export function flatTolerance(key: GaugeKey): number {
  const { min, max } = GAUGES[key];
  return ((max - min) * FLAT_SHARE_PERCENT) / 100;
}

/**
 * 오래된 → 최근 순 값으로 화살표를 정한다. null은 뺀 뒤 판정한다.
 * 값이 1개 이하면 null (화살표 없이 값만 보여준다). 3개를 넘으면 최근 3개만 본다.
 * 같은 값이 끼어서 PRD 표의 어떤 모양에도 안 맞으면 null이다 (PRD 4장 F-05에 규칙 없음, 보고 필요).
 */
export function getTrend(values: (number | null)[], key: GaugeKey): Trend | null {
  const present = values.filter((v): v is number => v !== null).slice(-3);
  if (present.length <= 1) return null;

  const tol = flatTolerance(key);
  const text = copy.reportCard.trend;

  if (present.length === 2) {
    const [first, second] = present;
    if (Math.abs(second - first) <= tol) return { arrow: TREND_ARROW.flat, label: text.flat };
    return second > first
      ? { arrow: TREND_ARROW.up, label: text.risingYear }
      : { arrow: TREND_ARROW.down, label: text.fallingYear };
  }

  // 3개: "비슷한 수준"을 먼저 본다 (두 변화가 모두 폭 이내)
  const [a, b, c] = present;
  if (Math.abs(b - a) <= tol && Math.abs(c - b) <= tol) {
    return { arrow: TREND_ARROW.flat, label: text.flat };
  }
  if (a < b && b < c) return { arrow: TREND_ARROW.up, label: text.risingYears };
  if (a > b && b > c) return { arrow: TREND_ARROW.down, label: text.fallingYears };
  // 올랐다 내렸거나 내렸다 올랐을 때
  if ((a < b && b > c) || (a > b && b < c)) return { arrow: TREND_ARROW.mixed, label: text.mixed };
  return null;
}
