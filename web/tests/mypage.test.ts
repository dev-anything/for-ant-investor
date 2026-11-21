import { describe, expect, it } from 'vitest';
import type { YearRow } from '@/lib/data/stock';
import type { Insight } from '@/lib/insights';
import {
  buildMiniCharts,
  capitalImpairmentText,
  latestGrowthText,
  summarizeInsights,
  WATCH_LIMIT,
} from '@/lib/mypage';

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

// 문장 id 1·2·3은 연도·숫자 없이 문장이 만들어진다 (lib/insights 규칙)
function insight(id: number): Insight {
  return { id, year: null, n: null, prev: null, curr: null };
}

describe('capitalImpairmentText (FS 12장 11번)', () => {
  it('완전 잠식이면 "완전 자본잠식"이다', () => {
    expect(capitalImpairmentText('full')).toBe('완전 자본잠식');
  });

  it('부분 잠식이면 "부분 자본잠식"이다', () => {
    expect(capitalImpairmentText('partial')).toBe('부분 자본잠식');
  });

  it('잠식이 아니거나 모르는 값이면 표시하지 않는다 (null)', () => {
    expect(capitalImpairmentText('none')).toBeNull();
    expect(capitalImpairmentText('unknown')).toBeNull();
  });
});

describe('summarizeInsights (PRD F-12 "외 N건")', () => {
  it('문장이 없으면 첫 문장도 나머지 개수도 없다', () => {
    expect(summarizeInsights([])).toEqual({ first: null, extraCount: 0 });
  });

  it('문장이 하나면 나머지는 0건이다', () => {
    const result = summarizeInsights([insight(1)]);
    expect(result.first).not.toBeNull();
    expect(result.extraCount).toBe(0);
  });

  it('문장이 셋이면 첫 문장과 "외 2건"에 해당하는 나머지 2를 돌려준다', () => {
    const result = summarizeInsights([insight(1), insight(2), insight(3)]);
    expect(result.extraCount).toBe(2);
    expect(result.first).toBe(summarizeInsights([insight(1)]).first);
  });

  it('문장을 만들 수 없는 항목(모르는 id)은 세지 않는다', () => {
    const result = summarizeInsights([insight(99), insight(1), insight(98), insight(2)]);
    expect(result.extraCount).toBe(1);
    expect(result.first).toBe(summarizeInsights([insight(1)]).first);
  });
});

describe('buildMiniCharts (FS 9-12, F-02와 같은 항목 순서)', () => {
  const years = [yearRow({ fiscalYear: 2024, revenue: 1000, operatingIncome: 100, netIncome: 50 })];

  it('일반 회사는 매출액·영업이익·순이익 세 묶음을 이 순서로 만든다', () => {
    expect(buildMiniCharts(years, false).map((chart) => chart.metric)).toEqual([
      'revenue',
      'operatingIncome',
      'netIncome',
    ]);
  });

  it('금융회사는 영업이익·순이익 두 묶음만 만든다 (PRD 3-6)', () => {
    expect(buildMiniCharts(years, true).map((chart) => chart.metric)).toEqual(['operatingIncome', 'netIncome']);
  });
});

describe('latestGrowthText (FS 9-12 최신 연도 전년 대비 증감률)', () => {
  it('매출이 늘었으면 "{연도}년 매출액 전년보다 {n}% 증가"', () => {
    const years = [
      yearRow({ fiscalYear: 2024, revenue: 1000 }),
      yearRow({ fiscalYear: 2025, revenue: 1162 }),
    ];
    expect(latestGrowthText(years, false)).toBe('2025년 매출액 전년보다 16.2% 증가');
  });

  it('매출이 줄었으면 "감소"로 쓰고 부호는 뺀다', () => {
    const years = [
      yearRow({ fiscalYear: 2024, revenue: 1000 }),
      yearRow({ fiscalYear: 2025, revenue: 900 }),
    ];
    expect(latestGrowthText(years, false)).toBe('2025년 매출액 전년보다 10.0% 감소');
  });

  it('증감률이 0.0%면 "전년과 같아"', () => {
    const years = [
      yearRow({ fiscalYear: 2024, revenue: 1000 }),
      yearRow({ fiscalYear: 2025, revenue: 1000 }),
    ];
    expect(latestGrowthText(years, false)).toBe('2025년 매출액 전년과 같아');
  });

  it('금융회사는 영업이익 기준으로 쓴다', () => {
    const years = [
      yearRow({ fiscalYear: 2024, operatingIncome: 100 }),
      yearRow({ fiscalYear: 2025, operatingIncome: 150 }),
    ];
    expect(latestGrowthText(years, true)).toBe('2025년 영업이익 전년보다 50.0% 증가');
  });

  it('전년이 없으면 null (증감률을 만들지 않는다)', () => {
    expect(latestGrowthText([yearRow({ fiscalYear: 2025, revenue: 1000 })], false)).toBeNull();
  });

  it('전년이 0이면 null', () => {
    const years = [
      yearRow({ fiscalYear: 2024, revenue: 0 }),
      yearRow({ fiscalYear: 2025, revenue: 1000 }),
    ];
    expect(latestGrowthText(years, false)).toBeNull();
  });

  it('최신 연도 값이 비면 null (데이터 없음과 0을 구분한다)', () => {
    const years = [
      yearRow({ fiscalYear: 2024, revenue: 1000 }),
      yearRow({ fiscalYear: 2025, revenue: null }),
    ];
    expect(latestGrowthText(years, false)).toBeNull();
  });

  it('연도 행이 없으면 null', () => {
    expect(latestGrowthText([], false)).toBeNull();
  });
});

describe('추적 상한 (PRD F-12)', () => {
  it('상한은 20개다', () => {
    expect(WATCH_LIMIT).toBe(20);
  });
});
