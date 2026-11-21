// 배치(batch/rules.py)와 웹앱 눈금·비슷한 수준 기준이 어긋나지 않는지 본다 (FS 10장, PRD 4장 F-05)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GAUGES } from '@/lib/gauge';
import { FLAT_SHARE_PERCENT } from '@/lib/trend';

const rulesSource = readFileSync(
  fileURLToPath(new URL('../../batch/rules.py', import.meta.url)),
  'utf8'
);

// GAUGES = {"debt_ratio": (0, 300), ...} 줄에서 키와 (min, max)를 뽑는다
function readPyGauges(): Record<string, [number, number]> {
  const block = rulesSource.match(/^GAUGES = \{(.*)\}$/m);
  if (!block) throw new Error('rules.py에서 GAUGES를 찾지 못했어');
  const result: Record<string, [number, number]> = {};
  for (const m of block[1].matchAll(/"(\w+)": \((-?\d+), (-?\d+)\)/g)) {
    result[m[1]] = [Number(m[2]), Number(m[3])];
  }
  return result;
}

// FLAT_SHARE = Fraction(3, 100) → 3%
function readPyFlatSharePercent(): number {
  const m = rulesSource.match(/^FLAT_SHARE = Fraction\((\d+), (\d+)\)/m);
  if (!m) throw new Error('rules.py에서 FLAT_SHARE를 찾지 못했어');
  return (Number(m[1]) * 100) / Number(m[2]);
}

describe('batch/rules.py와 웹앱 기준 대조', () => {
  it('눈금 범위가 세 지표 모두 같다', () => {
    const py = readPyGauges();
    for (const key of Object.keys(GAUGES) as (keyof typeof GAUGES)[]) {
      expect(py[key], key).toEqual([GAUGES[key].min, GAUGES[key].max]);
    }
  });

  it('비슷한 수준 기준(3%)이 같다', () => {
    expect(readPyFlatSharePercent()).toBe(FLAT_SHARE_PERCENT);
  });
});
