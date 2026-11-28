import { describe, expect, it } from 'vitest';
import {
  GAUGES,
  dotsOverlap,
  formatGaugeValue,
  gaugeAriaLabel,
  gaugeDots,
  gaugeLinePct,
  gaugePosition,
  gaugeUnitSuffix,
  type AnyGaugeKey,
  type GaugeDot,
} from '@/lib/gauge';

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

  it('기준선은 항상 눈금 안에 있다 (기준선이 없는 PER은 null)', () => {
    for (const key of Object.keys(GAUGES) as AnyGaugeKey[]) {
      const pct = gaugeLinePct(key);
      if (GAUGES[key].line === null) {
        expect(pct, key).toBeNull();
        continue;
      }
      expect(pct, key).toBeGreaterThan(0);
      expect(pct, key).toBeLessThan(100);
    }
  });

  it('PBR 기준선 1배는 눈금 0~5배의 5분의 1 지점이다', () => {
    expect(gaugeLinePct('pbr')).toBeCloseTo(20, 10);
  });
});

describe('gaugeDots', () => {
  it('3개년 값에 눈금 위치를 붙이고 마지막 점만 최신으로 표시한다', () => {
    const dots = gaugeDots(
      [
        { year: 2023, value: 3.1 },
        { year: 2024, value: 7.0 },
        { year: 2025, value: 12.4 },
      ],
      'revenue_growth',
    );

    expect(dots.map((dot) => dot.year)).toEqual([2023, 2024, 2025]);
    expect(dots[0].pct).toBeCloseTo(((3.1 + 40) / 110) * 100, 10);
    expect(dots[1].pct).toBeCloseTo(((7.0 + 40) / 110) * 100, 10);
    expect(dots[2].pct).toBeCloseTo(((12.4 + 40) / 110) * 100, 10);
    expect(dots.map((dot) => dot.latest)).toEqual([false, false, true]);
  });

  it('값이 없는 연도는 빼고 남은 점만 잇는다', () => {
    const dots = gaugeDots(
      [
        { year: 2023, value: 150 },
        { year: 2024, value: null },
        { year: 2025, value: 75 },
      ],
      'debt_ratio',
    );

    expect(dots.map((dot) => dot.year)).toEqual([2023, 2025]);
    expect(dots.map((dot) => dot.latest)).toEqual([false, true]);
  });

  it('최신 연도 값이 없으면 직전 연도를 최신으로 표시한다', () => {
    const dots = gaugeDots(
      [
        { year: 2023, value: 150 },
        { year: 2024, value: 75 },
        { year: 2025, value: null },
      ],
      'debt_ratio',
    );

    expect(dots.map((dot) => dot.year)).toEqual([2023, 2024]);
    expect(dots.map((dot) => dot.latest)).toEqual([false, true]);
  });

  it('점이 하나뿐이어도 최신으로 표시하고, 값이 모두 없으면 빈 배열이다', () => {
    const one = gaugeDots([{ year: 2025, value: 12.4 }], 'revenue_growth');
    expect(one).toHaveLength(1);
    expect(one[0].latest).toBe(true);

    expect(
      gaugeDots(
        [
          { year: 2023, value: null },
          { year: 2024, value: null },
        ],
        'debt_ratio',
      ),
    ).toEqual([]);
  });

  it('범위 밖 값은 끝에 붙이고 어느 쪽 밖인지 알린다', () => {
    const dots = gaugeDots(
      [
        { year: 2023, value: -80 },
        { year: 2024, value: 150 },
        { year: 2025, value: 450 },
      ],
      'debt_ratio',
    );

    expect(dots.map((dot) => dot.pct)).toEqual([0, 50, 100]);
    expect(dots.map((dot) => dot.clamped)).toEqual(['low', null, 'high']);
  });
});

describe('dotsOverlap', () => {
  const dot = (pct: number): GaugeDot => ({
    year: 2025,
    value: 0,
    pct,
    clamped: null,
    latest: false,
  });

  it('100px 눈금에서 4px 이내면 선을 생략한다', () => {
    expect(dotsOverlap(dot(50), dot(54), 100)).toBe(true);
    expect(dotsOverlap(dot(50), dot(46), 100)).toBe(true);
  });

  it('4px를 넘으면 선을 그린다', () => {
    expect(dotsOverlap(dot(50), dot(54.1), 100)).toBe(false);
    expect(dotsOverlap(dot(50), dot(45.9), 100)).toBe(false);
  });

  it('같은 pct 차이도 눈금이 넓으면 더 멀어져 선을 그린다', () => {
    expect(dotsOverlap(dot(50), dot(52), 100)).toBe(true);
    expect(dotsOverlap(dot(50), dot(52), 280)).toBe(false);
  });

  it('두 점이 같은 위치면 눈금 폭과 무관하게 겹친다', () => {
    expect(dotsOverlap(dot(0), dot(0), 280)).toBe(true);
  });
});

describe('gaugeAriaLabel', () => {
  const points = (values: (number | null)[]) =>
    values.map((value, index) => ({ year: 2023 + index, value }));

  it('지표 이름·연도별 값·눈금 범위를 순서대로 읽는다 (PRD 10장 38번)', () => {
    const three = points([3.1, 7.0, 12.4]);
    expect(gaugeAriaLabel('매출 증가율', three, 'revenue_growth', gaugeDots(three, 'revenue_growth'), null)).toBe(
      '매출 증가율, 2023년 3.1%, 2024년 7.0%, 2025년 12.4%, 눈금 −40~+70%',
    );
  });

  it('값이 없는 연도도 "계산할 수 없어"로 읽고 점 목록에는 남지 않는다', () => {
    const withNull = points([150, null, 75]);
    const dots = gaugeDots(withNull, 'debt_ratio');
    expect(dots.map((dot) => dot.year)).toEqual([2023, 2025]);
    expect(gaugeAriaLabel('부채비율', withNull, 'debt_ratio', dots, null)).toBe(
      '부채비율, 2023년 150.0%, 2024년 계산할 수 없어, 2025년 75.0%, 눈금 0~300%',
    );
  });

  it('업종 가운데 값과 범위 밖 알림을 뒤에 붙인다', () => {
    const outside = points([150, 200, 450]);
    expect(
      gaugeAriaLabel('부채비율', outside, 'debt_ratio', gaugeDots(outside, 'debt_ratio'), '62.0%'),
    ).toBe('부채비율, 2023년 150.0%, 2024년 200.0%, 2025년 450.0%, 눈금 0~300%, 업종 가운데 값 62.0%, 눈금 밖 값이 있어');
  });

  it('PER은 배 단위 범위를 읽는다', () => {
    const one = [{ year: 2025, value: 25.5 }];
    expect(gaugeAriaLabel('PER', one, 'per', gaugeDots(one, 'per'), null)).toBe('PER, 2025년 25.5배, 눈금 0~50배');
  });
});

describe('F-09 PER·PBR 눈금', () => {
  it('PER 80배는 눈금 끝(50배)을 넘어 high로 잘린다', () => {
    expect(gaugePosition(80, 'per')).toEqual({ pct: 100, clamped: 'high' });
  });

  it('PER 눈금에는 기준선이 없다', () => {
    expect(GAUGES.per.line).toBeNull();
    expect(gaugeLinePct('per')).toBeNull();
  });

  it('PER·PBR 끝 값은 안으로 본다', () => {
    expect(gaugePosition(0, 'pbr')).toEqual({ pct: 0, clamped: null });
    expect(gaugePosition(5, 'pbr')).toEqual({ pct: 100, clamped: null });
  });

  it('PER·PBR은 배 단위 글자, 나머지 지표는 %', () => {
    expect(gaugeUnitSuffix('per')).toBe('배');
    expect(gaugeUnitSuffix('pbr')).toBe('배');
    expect(gaugeUnitSuffix('debt_ratio')).toBe('%');
    expect(formatGaugeValue(25.5, 'per')).toBe('25.5배');
    expect(formatGaugeValue(2.64, 'pbr')).toBe('2.6배');
    expect(formatGaugeValue(12.34, 'debt_ratio')).toBe('12.3%');
  });
});
