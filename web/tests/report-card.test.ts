import { describe, expect, it } from 'vitest';
import type { YearRow } from '@/lib/data/stock';
import { formatValueLine, latestValue, metricValues } from '@/lib/report-card';

// 테스트용 연도 행. 필요한 값만 덮어쓴다
function row(fiscalYear: number, overrides: Partial<YearRow> = {}): YearRow {
  return {
    fiscalYear,
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

describe('metricValues', () => {
  it('지표 키에 맞는 연도 행 필드를 오래된 순서 그대로 뽑는다', () => {
    const years = [
      row(2023, { debtRatio: 120.5, operatingMargin: 5, revenueGrowth: null }),
      row(2024, { debtRatio: 110, operatingMargin: -2, revenueGrowth: 8 }),
    ];
    expect(metricValues(years, 'debt_ratio')).toEqual([120.5, 110]);
    expect(metricValues(years, 'operating_margin')).toEqual([5, -2]);
    expect(metricValues(years, 'revenue_growth')).toEqual([null, 8]);
  });
});

describe('latestValue', () => {
  it('목록이 비었으면 null이다', () => {
    expect(latestValue([])).toBeNull();
  });

  it('마지막 칸이 null이면 앞에 값이 있어도 null이다 (최근 연도가 없음)', () => {
    expect(latestValue([10, 20, null])).toBeNull();
  });

  it('마지막 칸이 값이면 그 값이다', () => {
    expect(latestValue([null, 20, 30])).toBe(30);
  });

  it('최근 값이 0이면 0이다 (데이터 없음과 구분)', () => {
    expect(latestValue([5, 0])).toBe(0);
  });
});

describe('formatValueLine', () => {
  it('세 값을 소수 1자리 % 와 화살표로 잇는다', () => {
    expect(formatValueLine([112, 95, 87])).toBe('(112.0% → 95.0% → 87.0%)');
  });

  it('null 칸은 "계산할 수 없어"로 적는다', () => {
    expect(formatValueLine([null, 95, 87])).toBe('(계산할 수 없어 → 95.0% → 87.0%)');
  });

  it('음수와 0도 그대로 적는다 (0은 데이터 없음이 아님)', () => {
    expect(formatValueLine([-2.5, 0, 3])).toBe('(-2.5% → 0.0% → 3.0%)');
  });
});
