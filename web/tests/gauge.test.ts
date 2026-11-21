import { describe, expect, it } from 'vitest';
import { GAUGES, gaugeLinePct, gaugePosition } from '@/lib/gauge';

describe('gaugePosition', () => {
  it('범위 안의 값은 눈금 위 비율로 바뀌고 잘리지 않는다', () => {
    expect(gaugePosition(150, 'debt_ratio')).toEqual({ pct: 50, clamped: null });
    expect(gaugePosition(-5, 'operating_margin')).toEqual({ pct: 50, clamped: null });
  });

  it('범위 끝 값은 안으로 보고 끝 위치에 놓인다', () => {
    expect(gaugePosition(0, 'debt_ratio')).toEqual({ pct: 0, clamped: null });
    expect(gaugePosition(300, 'debt_ratio')).toEqual({ pct: 100, clamped: null });
    expect(gaugePosition(-50, 'operating_margin')).toEqual({ pct: 0, clamped: null });
    expect(gaugePosition(70, 'revenue_growth')).toEqual({ pct: 100, clamped: null });
  });

  it('범위 밖 값은 끝에 붙이고 어느 쪽인지 알린다 (부채비율 450%)', () => {
    expect(gaugePosition(450, 'debt_ratio')).toEqual({ pct: 100, clamped: 'high' });
    expect(gaugePosition(-0.1, 'debt_ratio')).toEqual({ pct: 0, clamped: 'low' });
    expect(gaugePosition(-80, 'operating_margin')).toEqual({ pct: 0, clamped: 'low' });
    expect(gaugePosition(90, 'revenue_growth')).toEqual({ pct: 100, clamped: 'high' });
  });
});

describe('gaugeLinePct', () => {
  it('부채비율 기준선 100%는 눈금 3분의 1 지점이다', () => {
    expect(gaugeLinePct('debt_ratio')).toBeCloseTo(100 / 3, 10);
  });

  it('영업이익률·매출 증가율 기준선 0%는 범위에 따라 다른 위치다', () => {
    // −50~+40 → 0%는 50/90 지점
    expect(gaugeLinePct('operating_margin')).toBeCloseTo((50 / 90) * 100, 10);
    // −40~+70 → 0%는 40/110 지점
    expect(gaugeLinePct('revenue_growth')).toBeCloseTo((40 / 110) * 100, 10);
  });

  it('기준선은 항상 눈금 안에 있다', () => {
    for (const key of Object.keys(GAUGES) as (keyof typeof GAUGES)[]) {
      const pct = gaugeLinePct(key);
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(100);
    }
  });
});
