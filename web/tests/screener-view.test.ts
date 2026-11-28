import { describe, expect, it } from 'vitest';
import type { ScreenerRow, ScreenerYear } from '@/lib/data/screener';
import type { EvidenceKey } from '@/lib/filters';
import { DEFAULT_SCREENER_STATE, type ScreenerState } from '@/lib/params';
import {
  applySize,
  applySort,
  applyToggle,
  evidenceGroups,
  filterTooltip,
  isScreenerResult,
  readEvidenceCell,
  readEvidenceGroup,
  threeYears,
  type EvidenceSlot,
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

// readEvidenceCell은 키와 칸 번호만 쓰므로 칸을 직접 만든다
function slot(key: EvidenceKey, index: number): EvidenceSlot {
  return { id: `${key}-${index}`, key, index, header: '', sortKey: null };
}

describe('evidenceGroups (근거 값 열 묶기)', () => {
  it('필터 1+12는 매출을 한 열 [0,1,2], 영업이익률을 한 열 [1,2]로 묶는다', () => {
    const groups = evidenceGroups([1, 12], 2025);
    expect(groups.map((g) => g.label)).toEqual(['매출', '영업이익률']);
    expect(groups[0].indexes).toEqual([0, 1, 2]);
    expect(groups[0].keys).toEqual(['revenue', 'revenue_y2y3']);
    expect(groups[1].indexes).toEqual([1, 2]);
    expect(groups[1].keys).toEqual(['operating_margin_y2y3']);
  });

  it('순서는 처음 나온 순서, 같은 연도 칸은 합집합으로 오름차순이다', () => {
    const groups = evidenceGroups([12, 1], 2025);
    expect(groups.map((g) => g.label)).toEqual(['매출', '영업이익률']);
    expect(groups[0].indexes).toEqual([0, 1, 2]);
  });

  it('칸이 하나면 "{이름} {연도}년", 여러 칸이면 "{이름} {첫}~{끝}년"이다', () => {
    expect(evidenceGroups([13], 2025)[0].header).toBe('부채비율 2025년');
    expect(evidenceGroups([1], 2025)[0].header).toBe('매출 2023~2025년');
    expect(evidenceGroups([1, 12], 2025)[1].header).toBe('영업이익률 2024~2025년');
  });

  it('기준 연도가 없으면 열 제목에 연도를 붙이지 않는다', () => {
    expect(evidenceGroups([13], null)[0].header).toBe('부채비율');
    expect(evidenceGroups([1], null)[0].header).toBe('매출');
  });

  it('정렬은 최근 연도 칸이 들어 있고 허용된 키일 때만 붙는다', () => {
    expect(evidenceGroups([1], 2025)[0].sortKey).toBe('revenue');
    expect(evidenceGroups([19], 2025).map((g) => [g.label, g.sortKey])).toEqual([
      ['자본총계', 'total_equity'],
      ['자본금', null],
    ]);
  });
});

describe('readEvidenceCell (칸 값 서식)', () => {
  const slotY3 = slot('debt_ratio_y3', 2);

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
    const slotAssets = slot('total_assets', 2);
    expect(readEvidenceCell(row({ years: [year(2023), year(2024), year(2025, { totalAssets: 0 })] }), slotAssets, 2025).text).toBe('0억 원');
  });

  it('배당 칸: 무배당(none)은 없음, 값이 없으면 -, 있으면 원 단위', () => {
    const slotDps = slot('dps', 2);
    const yearsOf = [year(2023), year(2024), year(2025)];
    expect(
      readEvidenceCell(
        row({ years: yearsOf, dividends: [{ fiscalYear: 2025, dpsStatus: 'none', dps: null }] }),
        slotDps,
        2025
      ).text
    ).toBe('없음');
    expect(
      readEvidenceCell(
        row({ years: yearsOf, dividends: [{ fiscalYear: 2025, dpsStatus: 'paid', dps: 1444 }] }),
        slotDps,
        2025
      ).text
    ).toBe('1,444원');
    expect(readEvidenceCell(row({ years: yearsOf, dividends: [] }), slotDps, 2025).text).toBe('-');
  });
});

describe('readEvidenceGroup (3개년 값을 화살표로 잇기)', () => {
  const revenueGroup = evidenceGroups([1], 2025)[0];
  const debtGroup = evidenceGroups([15], 2025)[0];
  const debtY3Group = evidenceGroups([13], 2025)[0];
  const dpsGroup = evidenceGroups([20], 2025)[0];

  it('금액은 마지막 값에만 단위를 남긴다', () => {
    const result = readEvidenceGroup(
      row({
        years: [
          year(2023, { revenue: 51_800_000_000 }),
          year(2024, { revenue: 61_200_000_000 }),
          year(2025, { revenue: 75_700_000_000 }),
        ],
      }),
      revenueGroup,
      2025
    );
    expect(result.text).toBe('518억 → 612억 → 757억 원');
    expect(result.parts).toEqual(['518억', '612억', '757억 원']);
    expect(result.actualRange).toBeNull();
  });

  it('억과 조가 섞여도 마지막 값에만 단위를 남긴다', () => {
    const result = readEvidenceGroup(
      row({
        years: [
          year(2023, { revenue: 1_200_000_000_000 }),
          year(2024, { revenue: 980_000_000_000 }),
          year(2025, { revenue: 1_100_000_000_000 }),
        ],
      }),
      revenueGroup,
      2025
    );
    expect(result.text).toBe('1.2조 → 9,800억 → 1.1조 원');
    expect(result.parts).toEqual(['1.2조', '9,800억', '1.1조 원']);
  });

  it('배당은 마지막 값에만 원을 남긴다', () => {
    const result = readEvidenceGroup(
      row({
        years: [year(2023), year(2024), year(2025)],
        dividends: [
          { fiscalYear: 2023, dpsStatus: 'paid', dps: 1000 },
          { fiscalYear: 2024, dpsStatus: 'paid', dps: 1200 },
          { fiscalYear: 2025, dpsStatus: 'paid', dps: 1500 },
        ],
      }),
      dpsGroup,
      2025
    );
    expect(result.text).toBe('1,000 → 1,200 → 1,500원');
    expect(result.parts).toEqual(['1,000', '1,200', '1,500원']);
  });

  it('중간 값이 -여도 화살표로 잇는다', () => {
    const result = readEvidenceGroup(
      row({
        years: [year(2023), year(2024, { revenue: 61_200_000_000 }), year(2025, { revenue: 75_700_000_000 })],
      }),
      revenueGroup,
      2025
    );
    expect(result.text).toBe('- → 612억 → 757억 원');
    expect(result.parts).toEqual(['-', '612억', '757억 원']);
  });

  it('마지막 값이 -면 앞 값의 단위를 그대로 둔다', () => {
    const result = readEvidenceGroup(
      row({ years: [year(2023, { revenue: 51_800_000_000 }), year(2024, { revenue: 61_200_000_000 }), year(2025)] }),
      revenueGroup,
      2025
    );
    expect(result.text).toBe('518억 원 → 612억 원 → -');
    expect(result.parts).toEqual(['518억 원', '612억 원', '-']);
  });

  it('마지막 값이 없음이면 앞 값의 단위를 그대로 둔다', () => {
    const result = readEvidenceGroup(
      row({
        years: [year(2023), year(2024), year(2025)],
        dividends: [
          { fiscalYear: 2023, dpsStatus: 'paid', dps: 1000 },
          { fiscalYear: 2024, dpsStatus: 'paid', dps: 1200 },
          { fiscalYear: 2025, dpsStatus: 'none', dps: null },
        ],
      }),
      dpsGroup,
      2025
    );
    expect(result.text).toBe('1,000원 → 1,200원 → 없음');
    expect(result.parts).toEqual(['1,000원', '1,200원', '없음']);
  });

  it('비율은 모든 값에 %를 그대로 둔다', () => {
    const result = readEvidenceGroup(
      row({ years: [year(2023, { debtRatio: 80 }), year(2024, { debtRatio: 70 }), year(2025, { debtRatio: 50 })] }),
      debtGroup,
      2025
    );
    expect(result.text).toBe('80.0% → 70.0% → 50.0%');
    expect(result.parts).toEqual(['80.0%', '70.0%', '50.0%']);
    expect(result.actualRange).toBeNull();
  });

  it('회사 연도가 한 칸만 다르면 그 연도만 실제 연도로 붙인다', () => {
    const result = readEvidenceGroup(
      row({ years: [year(2022), year(2023), year(2024, { debtRatio: 50 })] }),
      debtY3Group,
      2025
    );
    expect(result.parts).toEqual(['50.0%']);
    expect(result.actualRange).toBe('2024년');
  });

  it('회사 연도가 여러 칸 다르면 실제 연도 범위를 붙인다', () => {
    const result = readEvidenceGroup(
      row({
        years: [
          year(2022, { revenue: 51_800_000_000 }),
          year(2023, { revenue: 61_200_000_000 }),
          year(2024, { revenue: 75_700_000_000 }),
        ],
      }),
      revenueGroup,
      2025
    );
    expect(result.parts).toEqual(['518억', '612억', '757억 원']);
    expect(result.actualRange).toBe('2022~2024년');
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
