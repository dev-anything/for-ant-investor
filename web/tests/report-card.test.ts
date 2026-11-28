import { describe, expect, it } from 'vitest';
import type { StockIndustry, StockSummary, YearRow } from '@/lib/data/stock';
import type { IndustryMedian } from '@/lib/industry';
import {
  REPORT_METRIC_KEYS,
  formatValueLine,
  latestValue,
  metricValues,
  shouldShowReportCard,
} from '@/lib/report-card';

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

describe('REPORT_METRIC_KEYS', () => {
  it('화면 순서는 매출 증가율 → 영업이익률 → 부채비율이다', () => {
    expect(REPORT_METRIC_KEYS).toEqual(['revenue_growth', 'operating_margin', 'debt_ratio']);
  });
});

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
  it('연도와 값을 소수 1자리 % 와 화살표로 잇는다', () => {
    expect(
      formatValueLine([
        { year: 2023, value: 112 },
        { year: 2024, value: 95 },
        { year: 2025, value: 87 },
      ]),
    ).toBe('2023 112.0% → 2024 95.0% → 2025 87.0%');
  });

  it('null 칸은 "계산할 수 없어"로 적는다', () => {
    expect(
      formatValueLine([
        { year: 2023, value: null },
        { year: 2024, value: 95 },
        { year: 2025, value: 87 },
      ]),
    ).toBe('2023 계산할 수 없어 → 2024 95.0% → 2025 87.0%');
  });

  it('음수와 0도 그대로 적는다 (0은 데이터 없음이 아님)', () => {
    expect(
      formatValueLine([
        { year: 2023, value: -2.5 },
        { year: 2024, value: 0 },
        { year: 2025, value: 3 },
      ]),
    ).toBe('2023 -2.5% → 2024 0.0% → 2025 3.0%');
  });
});

// 배치 판단 테스트용 최소 값. 필요한 필드만 덮어쓴다
function makeSummary(overrides: Partial<StockSummary> = {}): StockSummary {
  return {
    fsDiv: 'CFS',
    years: [2023, 2024, 2025],
    latestYear: 2025,
    isFinancial: false,
    capitalImpairment: 'none',
    insights: [],
    ...overrides,
  };
}

function makeIndustry(): StockIndustry {
  const median: IndustryMedian = { value: 50, n: 10 };
  return {
    divisionCode: '26',
    divisionName: '전자부품 제조업',
    medians: {
      revenue_growth: median,
      operating_margin: median,
      debt_ratio: median,
      per: median,
      pbr: median,
    },
  };
}

describe('shouldShowReportCard', () => {
  const years = [row(2023), row(2024), row(2025)];

  it('일반 회사에 화면 연도가 있으면 그린다', () => {
    expect(shouldShowReportCard(makeSummary(), years, null)).toBe(true);
  });

  it('화면 연도가 하나도 없으면 숨긴다', () => {
    expect(shouldShowReportCard(makeSummary(), [row(2022, { isDisplayYear: false })], makeIndustry())).toBe(false);
  });

  it('보여줄 것이 없는 금융회사는 숨긴다', () => {
    expect(shouldShowReportCard(makeSummary({ isFinancial: true }), years, null)).toBe(false);
  });

  it('금융회사도 업종이 있으면 같은 업종 링크 때문에 그린다', () => {
    expect(shouldShowReportCard(makeSummary({ isFinancial: true }), years, makeIndustry())).toBe(true);
  });

  it('금융회사도 자본잠식 안내가 있으면 그린다', () => {
    expect(
      shouldShowReportCard(makeSummary({ isFinancial: true, capitalImpairment: 'partial' }), years, null)
    ).toBe(true);
  });

  it('금융회사도 문장이 있으면 그린다', () => {
    const insights = [{ id: 1, year: null, n: null, prev: null, curr: null }];
    expect(shouldShowReportCard(makeSummary({ isFinancial: true, insights }), years, null)).toBe(true);
  });
});
