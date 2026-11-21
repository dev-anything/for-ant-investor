import { describe, expect, it } from 'vitest';
import type { ScreenerRow, ScreenerYear } from '@/lib/data/screener';
import { DEFAULT_SCREENER_STATE, type ScreenerState } from '@/lib/params';
import {
  applySize,
  applySort,
  applyToggle,
  evidenceSlots,
  filterTooltip,
  isScreenerResult,
  readEvidenceCell,
  threeYears,
} from '@/lib/screener-view';
import { findFilter } from '@/lib/filters';

// 연도 칸 한 개 만들기 (기본값은 모두 null)
function year(fiscalYear: number, patch: Partial<ScreenerYear> = {}): ScreenerYear {
  return {
    fiscalYear,
    revenue: null,
    operatingIncome: null,
    netIncome: null,
    totalAssets: null,
    totalEquity: null,
    capitalStock: null,
    debtRatio: null,
    operatingMargin: null,
    revenueGrowth: null,
    ...patch,
  };
}

// 결과 한 행 만들기
function row(patch: Partial<ScreenerRow> = {}): ScreenerRow {
  return {
    shortCode: '005930',
    name: '테스트',
    market: 'KOSPI',
    accMt: '12',
    isFinancial: false,
    marketCap: null,
    years: [],
    dividends: [],
    ...patch,
  };
}

describe('threeYears / filterTooltip', () => {
  it('기준 연도가 없으면 3개년도 없다', () => {
    expect(threeYears(null)).toBeNull();
    expect(threeYears(2025)).toEqual([2023, 2024, 2025]);
  });

  it('툴팁은 뜻 뒤에 계산식을 실제 연도로 채워 붙인다', () => {
    const filter = findFilter(2);
    if (!filter) throw new Error('필터 2가 없다');
    expect(filterTooltip(filter, 2025)).toBe(
      `${filter.tooltip} 계산: (2025년 매출 − 2024년 매출) ÷ 2024년 매출 ≥ 20%`
    );
  });

  it('기준 연도가 없으면 뜻만 쓴다 (자리표시자를 남기지 않는다)', () => {
    const filter = findFilter(2);
    if (!filter) throw new Error('필터 2가 없다');
    expect(filterTooltip(filter, null)).toBe(filter.tooltip);
  });
});

describe('evidenceSlots (근거 값 열)', () => {
  it('필터 1 하나는 매출 연도 칸 3개를 만든다', () => {
    const slots = evidenceSlots([1], 2025);
    expect(slots.map((s) => s.header)).toEqual(['매출 2023년', '매출 2024년', '매출 2025년']);
  });

  it('같은 열은 한 번만 (필터 1과 12는 매출 2024·2025년이 겹친다)', () => {
    const slots = evidenceSlots([1, 12], 2025);
    expect(slots.filter((s) => s.header.startsWith('매출 '))).toHaveLength(3);
    expect(slots.map((s) => s.header)).toContain('영업이익률 2024년');
  });

  it('정렬은 최근 연도 칸에만 붙고, 허용된 키만 쓴다', () => {
    const slots = evidenceSlots([1], 2025);
    expect(slots.map((s) => s.sortKey)).toEqual([null, null, 'revenue']);
  });

  it('자본금 열은 보이지만 정렬 키가 허용되지 않아 정렬할 수 없다', () => {
    const slots = evidenceSlots([19], 2025);
    expect(slots.find((s) => s.key === 'capital_stock_y3')?.sortKey).toBeNull();
    expect(slots.find((s) => s.key === 'total_equity_y3')?.sortKey).toBe('total_equity');
  });

  it('기준 연도가 없으면 열 제목에 연도를 붙이지 않는다', () => {
    expect(evidenceSlots([13], null)[0].header).toBe('부채비율');
  });
});

describe('readEvidenceCell (칸 값 서식)', () => {
  const [slotY3] = evidenceSlots([13], 2025);

  it('값이 없으면 -이다', () => {
    expect(readEvidenceCell(row({ years: [year(2025)] }), slotY3, 2025).text).toBe('-');
  });

  it('부채비율은 소수 1자리 %로 쓴다', () => {
    const cell = readEvidenceCell(row({ years: [year(2023), year(2024), year(2025, { debtRatio: 87.34 })] }), slotY3, 2025);
    expect(cell.text).toBe('87.3%');
  });

  it('회사 연도가 기준 연도와 다르면 실제 연도를 표시하고 표시 대상으로 본다', () => {
    const cell = readEvidenceCell(row({ years: [year(2022), year(2023), year(2024, { debtRatio: 50 })] }), slotY3, 2025);
    expect(cell.actualYear).toBe(2024);
    expect(cell.isOtherYear).toBe(true);
  });

  it('회사 연도가 같으면 실제 연도를 따로 붙이지 않는다', () => {
    const cell = readEvidenceCell(row({ years: [year(2023), year(2024), year(2025, { debtRatio: 50 })] }), slotY3, 2025);
    expect(cell.isOtherYear).toBe(false);
  });

  it('금액이 억 단위로 쓰인다 (0원 경계 포함)', () => {
    const [slot] = evidenceSlots([17], 2025).filter((s) => s.index === 2);
    expect(readEvidenceCell(row({ years: [year(2023), year(2024), year(2025, { totalAssets: 0 })] }), slot, 2025).text).toBe('0억 원');
  });

  it('배당 칸: 무배당(none)은 없음, 값이 없으면 -, 있으면 원 단위', () => {
    const [slot] = evidenceSlots([20], 2025).filter((s) => s.index === 2);
    const yearsOf = [year(2023), year(2024), year(2025)];
    expect(
      readEvidenceCell(
        row({ years: yearsOf, dividends: [{ fiscalYear: 2025, dpsStatus: 'none', dps: null }] }),
        slot,
        2025
      ).text
    ).toBe('없음');
    expect(
      readEvidenceCell(
        row({ years: yearsOf, dividends: [{ fiscalYear: 2025, dpsStatus: 'paid', dps: 1444 }] }),
        slot,
        2025
      ).text
    ).toBe('1,444원');
    expect(readEvidenceCell(row({ years: yearsOf, dividends: [] }), slot, 2025).text).toBe('-');
  });
});

describe('applyToggle / applySort / applySize (상태 전이)', () => {
  const base: ScreenerState = { ...DEFAULT_SCREENER_STATE, filters: [1], sort: 'revenue', dir: 'desc', page: 3 };

  it('필터를 더하면 1쪽으로 가고, 정렬 열이 살아 있으면 정렬을 유지한다', () => {
    const outcome = applyToggle(base, 4);
    expect(outcome.error).toBeNull();
    expect(outcome.state).toMatchObject({ filters: [1, 4], sort: 'revenue', dir: 'desc', page: 1 });
  });

  it('필터를 빼서 정렬 열이 사라지면 종목명 오름차순으로 바꾼다', () => {
    const state: ScreenerState = { ...base, filters: [1, 4], sort: 'operating_income' };
    const outcome = applyToggle(state, 4);
    expect(outcome.state).toMatchObject({ filters: [1], sort: 'name', dir: 'asc', page: 1 });
  });

  it('네 번째 필터는 max 오류이고 상태는 그대로다', () => {
    const state: ScreenerState = { ...base, filters: [4, 5, 6] };
    const outcome = applyToggle(state, 7);
    expect(outcome.error).toEqual({ kind: 'max' });
    expect(outcome.state).toBe(state);
  });

  it('부딪히는 짝을 고르면 conflict 오류와 짝 id를 준다', () => {
    const outcome = applyToggle({ ...base, filters: [9] }, 4);
    expect(outcome.error).toEqual({ kind: 'conflict', with: 9 });
  });

  it('13을 고른 상태에서 14를 고르면 13이 빠진다', () => {
    const outcome = applyToggle({ ...base, filters: [13] }, 14);
    expect(outcome.state.filters).toEqual([14]);
  });

  it('같은 정렬 열을 누르면 방향을 뒤집고, 다른 열이면 오름차순이다', () => {
    expect(applySort(base, 'revenue')).toMatchObject({ sort: 'revenue', dir: 'asc', page: 1 });
    expect(applySort(base, 'market_cap')).toMatchObject({ sort: 'market_cap', dir: 'asc', page: 1 });
  });

  it('개수를 바꾸면 1쪽으로 간다', () => {
    expect(applySize(base, 50)).toMatchObject({ size: 50, page: 1 });
  });
});

describe('isScreenerResult', () => {
  it('총계·행·기준일 모양이 맞으면 참이다', () => {
    expect(isScreenerResult({ total: 0, basDt: null, rows: [] })).toBe(true);
  });

  it('행이 배열이 아니거나 총계가 숫자가 아니면 거짓이다', () => {
    expect(isScreenerResult({ total: '3', basDt: null, rows: [] })).toBe(false);
    expect(isScreenerResult({ total: 3, basDt: null, rows: {} })).toBe(false);
    expect(isScreenerResult(null)).toBe(false);
  });
});
