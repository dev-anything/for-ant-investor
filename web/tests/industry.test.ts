import { describe, expect, it } from 'vitest';
import { MIN_INDUSTRY_COUNT, compareToIndustry, groupIndustryTree } from '@/lib/industry';

describe('compareToIndustry', () => {
  it('업종 정보가 없으면 no_industry다', () => {
    expect(compareToIndustry(25, 40, 10, false)).toEqual({ kind: 'no_industry' });
  });

  it('회사 수가 최소 기준(3) 미만이면 too_few다', () => {
    expect(MIN_INDUSTRY_COUNT).toBe(3);
    expect(compareToIndustry(25, 40, 2, true)).toEqual({ kind: 'too_few' });
  });

  it('회사 수가 정확히 3이면 ok다', () => {
    expect(compareToIndustry(25, 40, 3, true)).toEqual({
      kind: 'ok',
      median: 40,
      n: 3,
      relation: 'lower',
    });
  });

  it('가운데 값이 null이면 too_few다', () => {
    expect(compareToIndustry(25, null, 10, true)).toEqual({ kind: 'too_few' });
  });

  it('이 회사 값이 null이면 ok이지만 relation은 null이다', () => {
    expect(compareToIndustry(null, 40, 10, true)).toEqual({
      kind: 'ok',
      median: 40,
      n: 10,
      relation: null,
    });
  });

  it('값이 가운데 값보다 크면 higher, 작으면 lower다', () => {
    const high = compareToIndustry(60, 40, 5, true);
    const low = compareToIndustry(20, 40, 5, true);
    expect(high).toMatchObject({ kind: 'ok', relation: 'higher' });
    expect(low).toMatchObject({ kind: 'ok', relation: 'lower' });
  });

  it('소수 1자리로 반올림한 뒤 같으면 same이다 (화면에 찍히는 값 기준)', () => {
    // 40.04 → 40.0, 40.0 → 40.0 : 화면에서는 같은 값으로 보인다
    expect(compareToIndustry(40.04, 40.0, 5, true)).toMatchObject({ relation: 'same' });
    // 40.06 → 40.1 이므로 40.0보다 높다
    expect(compareToIndustry(40.06, 40.0, 5, true)).toMatchObject({ relation: 'higher' });
  });

  it('음수 값도 같은 규칙으로 비교한다 (영업적자 업종 가운데 값)', () => {
    expect(compareToIndustry(-3.2, -1.0, 4, true)).toMatchObject({ relation: 'lower' });
  });
});

describe('groupIndustryTree', () => {
  const row = (
    sectionOrder: number,
    sectionCode: string,
    divisionOrder: number,
    divisionCode: string,
    companyCount: number
  ) => ({
    sectionCode,
    sectionName: `대분류${sectionCode}`,
    sectionOrder,
    divisionCode,
    divisionName: `중분류${divisionCode}`,
    divisionOrder,
    companyCount,
  });

  it('대분류 회사 수는 중분류 회사 수의 합이다', () => {
    const sections = groupIndustryTree([row(1, 'C', 10, '10', 41), row(1, 'C', 11, '11', 7)]);
    expect(sections).toHaveLength(1);
    expect(sections[0].companyCount).toBe(48);
    expect(sections[0].divisions.map((d) => d.divisionCode)).toEqual(['10', '11']);
  });

  it('입력이 섞여 와도 대분류·중분류 번호순으로 정렬한다', () => {
    const input = [row(2, 'J', 60, '60', 3), row(1, 'C', 11, '11', 2), row(1, 'C', 10, '10', 5)];
    const sections = groupIndustryTree(input);
    expect(sections.map((s) => s.sectionCode)).toEqual(['C', 'J']);
    expect(sections[0].divisions.map((d) => d.divisionCode)).toEqual(['10', '11']);
  });

  it('원본 배열 순서는 바꾸지 않는다', () => {
    const input = [row(2, 'J', 60, '60', 3), row(1, 'C', 10, '10', 5)];
    groupIndustryTree(input);
    expect(input[0].sectionCode).toBe('J');
  });

  it('빈 입력이면 빈 목록이다', () => {
    expect(groupIndustryTree([])).toEqual([]);
  });
});
