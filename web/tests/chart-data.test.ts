import { describe, expect, it } from 'vitest';
import type { YearRow } from '@/lib/data/stock';
import {
  buildMetricBars,
  chartMetricsFor,
  getAxisDomain,
  getDisplayYears,
} from '@/lib/chart-data';

// 테스트용 연도 행. 값을 안 준 항목은 null
function yearRow(overrides: Partial<YearRow> & { fiscalYear: number }): YearRow {
  return {
    fsDiv: 'CFS',
    isDisplayYear: true,
    isLatest: false,
    revenue: null,
    operatingIncome: null,
    netIncome: null,
    totalAssets: null,
    totalLiabilities: null,
    totalEquity: null,
    capitalStock: null,
    debtRatio: null,
    operatingMargin: null,
    revenueGrowth: null,
    ...overrides,
  };
}

describe('getDisplayYears', () => {
  it('화면 연도만 오래된 순서로 돌려준다', () => {
    const years = [
      yearRow({ fiscalYear: 2025 }),
      yearRow({ fiscalYear: 2022, isDisplayYear: false }),
      yearRow({ fiscalYear: 2023 }),
      yearRow({ fiscalYear: 2024 }),
    ];
    expect(getDisplayYears(years).map((row) => row.fiscalYear)).toEqual([2023, 2024, 2025]);
  });
});

describe('buildMetricBars', () => {
  it('금액을 PRD 3-8 단위와 원 단위 정확한 값으로 바꾼다', () => {
    const years = [yearRow({ fiscalYear: 2025, revenue: 258935494000000 })];
    const [bar] = buildMetricBars(years, 'revenue');
    expect(bar.label).toBe('2025년');
    expect(bar.valueText).toBe('258.9조 원');
    expect(bar.exactText).toBe('258,935,494,000,000원');
  });

  it('적자 값은 음수 막대로 표시하고 라벨에 -를 붙인다', () => {
    const years = [yearRow({ fiscalYear: 2025, netIncome: -65670000000 })];
    const [bar] = buildMetricBars(years, 'netIncome');
    expect(bar.isNegative).toBe(true);
    expect(bar.valueText).toBe('-657억 원');
  });

  it('값이 null이면 라벨·정확한 값·증감률이 모두 null이다', () => {
    const years = [yearRow({ fiscalYear: 2025, operatingIncome: null })];
    const [bar] = buildMetricBars(years, 'operatingIncome');
    expect(bar.value).toBeNull();
    expect(bar.valueText).toBeNull();
    expect(bar.exactText).toBeNull();
    expect(bar.growthText).toBeNull();
    expect(bar.isNegative).toBe(false);
  });

  it('전년 행이 저장되어 있으면 전년 대비 증감률을 계산한다 (전년이 화면 연도 밖이어도)', () => {
    const years = [
      yearRow({ fiscalYear: 2022, isDisplayYear: false, revenue: 100 }),
      yearRow({ fiscalYear: 2023, revenue: 110 }),
    ];
    const [bar] = buildMetricBars(years, 'revenue');
    expect(bar.growthText).toBe('+10.0%');
  });

  it('전년 행이 없거나 전년 값이 0이면 증감률을 생략한다', () => {
    const noPrev = [yearRow({ fiscalYear: 2023, revenue: 110 })];
    expect(buildMetricBars(noPrev, 'revenue')[0].growthText).toBeNull();

    const zeroPrev = [
      yearRow({ fiscalYear: 2022, isDisplayYear: false, revenue: 0 }),
      yearRow({ fiscalYear: 2023, revenue: 110 }),
    ];
    expect(buildMetricBars(zeroPrev, 'revenue')[0].growthText).toBeNull();
  });

  it('전년 값이 null이면 증감률을 생략한다', () => {
    const years = [
      yearRow({ fiscalYear: 2022, isDisplayYear: false, netIncome: null }),
      yearRow({ fiscalYear: 2023, netIncome: 50 }),
    ];
    expect(buildMetricBars(years, 'netIncome')[0].growthText).toBeNull();
  });
});

describe('chartMetricsFor', () => {
  it('금융회사는 영업이익·순이익 두 그래프만 그린다', () => {
    expect(chartMetricsFor(true)).toEqual(['operatingIncome', 'netIncome']);
  });

  it('일반 회사는 매출액·영업이익·순이익 세 그래프를 그린다', () => {
    expect(chartMetricsFor(false)).toEqual(['revenue', 'operatingIncome', 'netIncome']);
  });
});

describe('getAxisDomain', () => {
  it('모두 양수면 0부터 시작하고 위쪽에 라벨 자리를 둔다', () => {
    const bars = buildMetricBars(
      [yearRow({ fiscalYear: 2024, revenue: 100 }), yearRow({ fiscalYear: 2025, revenue: 200 })],
      'revenue'
    );
    expect(getAxisDomain(bars)).toEqual([0, 200 * 1.15]);
  });

  it('적자가 있으면 0 아래까지 축을 늘린다', () => {
    const bars = buildMetricBars(
      [yearRow({ fiscalYear: 2024, netIncome: -100 }), yearRow({ fiscalYear: 2025, netIncome: 50 })],
      'netIncome'
    );
    expect(getAxisDomain(bars)).toEqual([-100 * 1.15, 50 * 1.15]);
  });

  it('값이 하나도 없으면 [0, 1]을 돌려준다', () => {
    const bars = buildMetricBars([yearRow({ fiscalYear: 2025 })], 'revenue');
    expect(getAxisDomain(bars)).toEqual([0, 1]);
  });
});
