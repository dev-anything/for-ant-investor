// 주가 수준 PER·PBR 화면 행 계산 테스트 (PRD 4장 F-09, FS 9-3)
import { describe, expect, it } from 'vitest';
import { buildValuationRows, valuationBasisText, type StockValuation, type ValuationMedians } from '@/lib/valuation';

const SAMSUNG: StockValuation = { basDt: '2026-11-16', latestYear: 2025, per: 25.5, pbr: 2.64 };
const MEDIANS: ValuationMedians = {
  per: { value: 18.2, n: 12 },
  pbr: { value: 1.1, n: 12 },
};

describe('valuationBasisText', () => {
  it('기준일 두 개(주가 기준일, 순이익·자본 연도)를 한 문장에 담는다', () => {
    expect(valuationBasisText(SAMSUNG)).toBe('주가 2026-11-16 기준 · 순이익·자본 2025년 기준');
  });
});

describe('buildValuationRows', () => {
  it('PER·PBR 값은 소수 1자리 배 단위 글자로 바뀐다 (2.64 → 2.6배)', () => {
    const [per, pbr] = buildValuationRows(SAMSUNG, MEDIANS);
    expect(per.valueText).toBe('25.5배');
    expect(pbr.valueText).toBe('2.6배');
  });

  it('순이익 적자(per null)면 PER 자리에 PER 계산 안내를 두고 값은 없다', () => {
    const [per] = buildValuationRows({ ...SAMSUNG, per: null }, MEDIANS);
    expect(per.value).toBeNull();
    expect(per.valueText).toBeNull();
    expect(per.notice).toBe('순이익이 적자여서 PER을 계산하지 않아.');
  });

  it('자본총계 0 이하(pbr null)면 PBR 자리에 PBR 계산 안내를 둔다', () => {
    const [, pbr] = buildValuationRows({ ...SAMSUNG, pbr: null }, MEDIANS);
    expect(pbr.value).toBeNull();
    expect(pbr.notice).toBe('자본총계가 0 이하라서 PBR을 계산하지 않아.');
  });

  it('값이 있으면 안내 문구는 없다', () => {
    const [per, pbr] = buildValuationRows(SAMSUNG, MEDIANS);
    expect(per.notice).toBeNull();
    expect(pbr.notice).toBeNull();
  });

  it('PBR 기준선 툴팁은 1배 선이 있는 PBR에만 붙고, PER은 기준선 툴팁이 없다', () => {
    const [per, pbr] = buildValuationRows(SAMSUNG, MEDIANS);
    expect(per.lineTip).toBeNull();
    expect(pbr.lineTip).toBe('시가총액과 회사 자본이 같아지는 지점이야. 좋고 나쁨을 가르는 기준은 아니야.');
  });

  it('업종 정보가 없으면 비교가 no_industry이고 가운데 값이 없다', () => {
    const rows = buildValuationRows(SAMSUNG, null);
    expect(rows.map((r) => r.compare.kind)).toEqual(['no_industry', 'no_industry']);
  });

  it('같은 업종 회사가 3개 미만이면 too_few다', () => {
    const rows = buildValuationRows(SAMSUNG, { per: { value: 18.2, n: 2 }, pbr: { value: null, n: 0 } });
    expect(rows[0].compare.kind).toBe('too_few');
    expect(rows[1].compare.kind).toBe('too_few');
  });

  it('회사 수가 충분하면 가운데 값과 회사 수를 그대로 준다 (비교 글자 없음)', () => {
    const [per] = buildValuationRows(SAMSUNG, MEDIANS);
    expect(per.compare).toEqual({ kind: 'ok', median: 18.2, n: 12, relation: 25.5 > 18.2 ? 'higher' : 'lower' });
  });

  it('회사 값이 null이면 가운데 값은 있어도 비교 줄을 쓰지 않는다 (relation null)', () => {
    const [per] = buildValuationRows({ ...SAMSUNG, per: null }, MEDIANS);
    expect(per.compare).toEqual({ kind: 'ok', median: 18.2, n: 12, relation: null });
  });
});
