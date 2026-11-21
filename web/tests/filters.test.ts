import { describe, expect, it } from 'vitest';
import {
  CONFLICTS,
  FILTERS,
  FILTER_GROUPS,
  blockedBy,
  evidenceColumns,
  fillYears,
  hasFinancialBlocked,
  toggleFilter,
} from '@/lib/filters';

describe('FILTERS 상수', () => {
  it('필터는 20개이고 id가 1~20을 한 번씩 쓴다', () => {
    expect(FILTERS.map((f) => f.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('묶음은 6개이고 모든 필터가 그 안에 든다', () => {
    expect(FILTER_GROUPS).toEqual(['매출', '이익', '이익률', '빚', '자산과 자본', '배당']);
    for (const f of FILTERS) expect(FILTER_GROUPS).toContain(f.group);
  });

  it('계산식 원문은 {Y1}~{Y3} 자리표시자를 그대로 가진다', () => {
    expect(FILTERS.find((f) => f.id === 1)?.calc).toBe('매출 {Y1}년 < {Y2}년 < {Y3}년');
    expect(FILTERS.find((f) => f.id === 19)?.calc).toContain('자본금이 0으로 오면 판단하지 않아');
  });

  it('금융회사 계산 불가 표시는 PRD 표(1·2·3·10~16)와 같다', () => {
    const blocked = FILTERS.filter((f) => f.financialBlocked).map((f) => f.id);
    expect(blocked).toEqual([1, 2, 3, 10, 11, 12, 13, 14, 15, 16]);
  });

  it('부딪히는 짝은 10쌍이다', () => {
    expect(CONFLICTS).toHaveLength(10);
  });
});

describe('fillYears', () => {
  it('세 자리표시자를 실제 연도로 채운다', () => {
    expect(fillYears('매출 {Y1}년 < {Y2}년 < {Y3}년', [2023, 2024, 2025])).toBe(
      '매출 2023년 < 2024년 < 2025년'
    );
  });

  it('같은 자리표시자가 여러 번 나와도 모두 채운다', () => {
    expect(fillYears('{Y3}년 매출 − {Y2}년 매출 ÷ {Y2}년 매출', [2023, 2024, 2025])).toBe(
      '2025년 매출 − 2024년 매출 ÷ 2024년 매출'
    );
  });
});

describe('toggleFilter', () => {
  it('없는 필터를 누르면 추가한다', () => {
    expect(toggleFilter([], 4)).toEqual({ selected: [4] });
  });

  it('이미 고른 필터를 다시 누르면 뺀다', () => {
    expect(toggleFilter([4, 6], 4)).toEqual({ selected: [6] });
  });

  it('부딪히는 짝은 추가하지 않고 상대 id를 알린다 (양방향)', () => {
    for (const [a, b] of CONFLICTS) {
      expect(toggleFilter([a], b)).toEqual({ selected: [a], error: 'conflict', with: a });
      expect(toggleFilter([b], a)).toEqual({ selected: [b], error: 'conflict', with: b });
    }
  });

  it('4번째 필터는 추가하지 않고 max 오류를 준다', () => {
    expect(toggleFilter([1, 4, 17], 20)).toEqual({ selected: [1, 4, 17], error: 'max' });
  });

  it('13을 고른 상태에서 14를 누르면 13을 빼고 14를 넣는다', () => {
    expect(toggleFilter([13], 14)).toEqual({ selected: [14] });
  });

  it('14를 고른 상태에서 13을 누르면 14를 빼고 13을 넣는다', () => {
    expect(toggleFilter([14], 13)).toEqual({ selected: [13] });
  });

  it('3개가 찼어도 13↔14 교체는 개수가 그대로라 허용된다', () => {
    expect(toggleFilter([13, 4, 17], 14)).toEqual({ selected: [4, 17, 14] });
  });

  it('없는 id는 목록을 바꾸지 않는다', () => {
    expect(toggleFilter([1], 21)).toEqual({ selected: [1] });
  });
});

describe('blockedBy', () => {
  it('부딪히는 상대가 골라져 있으면 그 id를 준다', () => {
    expect(blockedBy([3], 1)).toBe(3);
    expect(blockedBy([16], 15)).toBe(16);
  });

  it('부딪히는 상대가 없거나 이미 고른 필터면 null이다', () => {
    expect(blockedBy([4], 1)).toBeNull();
    expect(blockedBy([3], 3)).toBeNull();
  });
});

describe('evidenceColumns', () => {
  it('같은 열은 한 번만 넣고 고른 순서를 지킨다', () => {
    // 1·3은 둘 다 매출 열, 4·6은 둘 다 영업이익 열
    expect(evidenceColumns([4, 1, 6, 3])).toEqual(['operating_income', 'revenue']);
  });

  it('두 열을 가진 필터(12)는 두 열을 모두 준다', () => {
    expect(evidenceColumns([12])).toEqual(['revenue_y2y3', 'operating_margin_y2y3']);
  });

  it('고른 필터가 없으면 빈 목록이다', () => {
    expect(evidenceColumns([])).toEqual([]);
  });
});

describe('hasFinancialBlocked', () => {
  it('금융회사에서 계산 안 되는 필터가 하나라도 있으면 true', () => {
    expect(hasFinancialBlocked([4, 13])).toBe(true);
  });

  it('금융회사에서도 계산되는 필터만 있으면 false', () => {
    expect(hasFinancialBlocked([4, 17, 20])).toBe(false);
  });
});
