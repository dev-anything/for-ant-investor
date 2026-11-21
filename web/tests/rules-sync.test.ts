// 배치(batch/rules.py)와 웹앱 눈금·비슷한 수준 기준이 어긋나지 않는지 본다 (FS 10장, PRD 4장 F-05)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONFLICTS, FILTERS, FINANCIAL_BLOCKED } from '@/lib/filters';
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

// CONFLICTS = ((3, 1), (3, 2), ...) 의 짝들을 뽑는다
function readPyConflicts(): [number, number][] {
  // 바깥 괄호 하나만 빼고 안쪽을 넘겨야 첫 짝 (3, 1)이 빠지지 않는다
  const block = rulesSource.match(/^CONFLICTS = \((.*)\)$/m);
  if (!block) throw new Error('rules.py에서 CONFLICTS를 찾지 못했어');
  return [...block[1].matchAll(/\((\d+), (\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

// FINANCIAL_BLOCKED = frozenset({1, 2, ...}) 의 번호들을 뽑는다
function readPyFinancialBlocked(): number[] {
  const block = rulesSource.match(/^FINANCIAL_BLOCKED = frozenset\(\{(.*?)\}\)/m);
  if (!block) throw new Error('rules.py에서 FINANCIAL_BLOCKED를 찾지 못했어');
  return [...block[1].matchAll(/\d+/g)].map((m) => Number(m[0])).sort((a, b) => a - b);
}

// 기준값 숫자(예: 20, 10, 100, 50)가 필터 문구에 그대로 보여야 어긋나지 않는다
function readPyNumber(name: string): number {
  const m = rulesSource.match(new RegExp(`^${name} = (\\d+)`, 'm'));
  if (!m) throw new Error(`rules.py에서 ${name}을 찾지 못했어`);
  return Number(m[1]);
}

describe('batch/rules.py와 웹앱 기준 대조', () => {
  it('부딪히는 짝 10쌍이 같은 순서로 같다', () => {
    expect(CONFLICTS).toEqual(readPyConflicts());
  });

  it('금융회사 계산 불가 필터 번호가 같다', () => {
    expect([...FINANCIAL_BLOCKED].sort((a, b) => a - b)).toEqual(readPyFinancialBlocked());
  });

  it('필터 문구·툴팁의 기준 숫자가 rules.py 기준값과 같다 (2·10·13·14)', () => {
    const text = (id: number) => {
      const f = FILTERS.find((x) => x.id === id);
      if (!f) throw new Error(`필터 ${id}가 없어`);
      return `${f.label} ${f.tooltip} ${f.calc}`;
    };
    expect(text(2)).toContain(`${readPyNumber('REVENUE_GROWTH_MIN')}%`);
    expect(text(10)).toContain(`${readPyNumber('OP_MARGIN_MIN')}%`);
    expect(text(13)).toContain(`${readPyNumber('DEBT_RATIO_MAX_WIDE')}%`);
    expect(text(14)).toContain(`${readPyNumber('DEBT_RATIO_MAX_NARROW')}%`);
  });

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
