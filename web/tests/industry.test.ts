import { describe, expect, it } from 'vitest';
import {
  MIN_INDUSTRY_COUNT,
  attachTopCompanies,
  compareToIndustry,
  groupIndustryTree,
  groupTopCompanies,
  mapIndustryCompanyRow,
  topCompaniesFor,
} from '@/lib/industry';

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

describe('groupTopCompanies', () => {
  const company = (divisionCode: string, rank: number, shortCode: string, name: string) => ({
    divisionCode,
    rank,
    shortCode,
    name,
  });

  it('중분류별로 묶고 rank순으로 준다', () => {
    const grouped = groupTopCompanies([
      company('10', 3, '000330', 'SK하이닉스'),
      company('26', 1, '005930', '삼성전자'),
      company('10', 1, '005930', '삼성전자'),
      company('10', 2, '066570', 'LG전자'),
    ]);
    expect([...grouped.keys()]).toEqual(['10', '26']);
    expect(topCompaniesFor(grouped, '10').map((c) => c.name)).toEqual(['삼성전자', 'LG전자', 'SK하이닉스']);
    expect(topCompaniesFor(grouped, '26').map((c) => c.shortCode)).toEqual(['005930']);
  });

  it('회사가 없는 중분류는 빈 배열이다', () => {
    const grouped = groupTopCompanies([company('10', 1, '005930', '삼성전자')]);
    expect(topCompaniesFor(grouped, '99')).toEqual([]);
    expect(topCompaniesFor(new Map(), '10')).toEqual([]);
  });

  it('rank가 같으면 종목명 가나다순으로 순서를 고정한다', () => {
    const grouped = groupTopCompanies([
      company('10', 1, '000330', 'SK하이닉스'),
      company('10', 1, '005930', '삼성전자'),
    ]);
    expect(topCompaniesFor(grouped, '10').map((c) => c.name)).toEqual(['SK하이닉스', '삼성전자']);
  });

  it('빈 입력이면 빈 Map이다', () => {
    expect(groupTopCompanies([]).size).toBe(0);
  });

  it('원본 배열의 순서는 바꾸지 않는다', () => {
    const input = [company('10', 2, '066570', 'LG전자'), company('10', 1, '005930', '삼성전자')];
    groupTopCompanies(input);
    expect(input[0].rank).toBe(2);
  });
});

describe('attachTopCompanies', () => {
  const company = (divisionCode: string, rank: number, name: string) => ({
    divisionCode,
    rank,
    shortCode: '005930',
    name,
  });

  const sections = [
    {
      sectionCode: 'C',
      sectionName: '제조업',
      companyCount: 3,
      divisions: [
        { divisionCode: '10', divisionName: '식료품 제조업', companyCount: 2 },
        { divisionCode: '11', divisionName: '음료 제조업', companyCount: 1 },
      ],
    },
  ];

  it('중분류 코드로 회사 이름을 시가총액 순으로 붙인다', () => {
    const grouped = groupTopCompanies([company('10', 2, 'LG전자'), company('10', 1, '삼성전자')]);
    const [card] = attachTopCompanies(sections, grouped);
    expect(card.divisions[0].companyNames).toEqual(['삼성전자', 'LG전자']);
    // 회사 결과가 없는 중분류는 빈 이름 줄이다 (카드에 줄을 그리지 않는다)
    expect(card.divisions[1].companyNames).toEqual([]);
  });

  it('상위 회사 결과가 없으면 모든 이름 줄이 빈다', () => {
    const [card] = attachTopCompanies(sections, new Map());
    expect(card.divisions.every((division) => division.companyNames.length === 0)).toBe(true);
  });

  it('원본 트리를 바꾸지 않는다', () => {
    const grouped = groupTopCompanies([company('10', 1, '삼성전자')]);
    const before = JSON.stringify(sections);
    attachTopCompanies(sections, grouped);
    expect(JSON.stringify(sections)).toBe(before);
  });
});

describe('mapIndustryCompanyRow (업종 회사 목록 행, 2026-11-28 열 추가)', () => {
  const base = {
    total_count: 42,
    srtn_cd: 'A005930',
    short_code: '005930',
    itms_nm: '삼성전자',
    mrkt_ctg: 'KOSPI',
    acc_mt: '12',
    mrkt_tot_amt: 500000000000000,
    bas_dt: '2026-11-16',
  };

  it('주가·PER·PBR·최신 연도 매출액·영업이익·금융회사 여부를 camelCase로 읽는다', () => {
    const { total, row } = mapIndustryCompanyRow({
      ...base,
      clpr: 85000,
      per: 21.5,
      pbr: 2.4,
      fiscal_year: 2025,
      revenue: 300000000000000,
      operating_income: 33000000000000,
      is_financial: false,
    });
    expect(total).toBe(42);
    expect(row).toEqual({
      shortCode: '005930',
      name: '삼성전자',
      market: 'KOSPI',
      accMt: '12',
      marketCap: 500000000000000,
      basDt: '2026-11-16',
      price: 85000,
      per: 21.5,
      pbr: 2.4,
      fiscalYear: 2025,
      revenue: 300000000000000,
      operatingIncome: 33000000000000,
      isFinancial: false,
    });
  });

  it('값이 없는 열은 0이 아니라 null이다', () => {
    const { row } = mapIndustryCompanyRow({
      ...base,
      clpr: null,
      per: null,
      pbr: null,
      fiscal_year: null,
      revenue: null,
      operating_income: null,
      is_financial: null,
    });
    expect(row.price).toBeNull();
    expect(row.per).toBeNull();
    expect(row.pbr).toBeNull();
    expect(row.fiscalYear).toBeNull();
    expect(row.revenue).toBeNull();
    expect(row.operatingIncome).toBeNull();
    expect(row.isFinancial).toBeNull();
  });

  it('금융회사는 isFinancial이 true로 읽힌다', () => {
    const { row } = mapIndustryCompanyRow({ ...base, is_financial: true });
    expect(row.isFinancial).toBe(true);
  });

  it('필수 열이 없으면 모양 오류를 던진다', () => {
    expect(() => mapIndustryCompanyRow(null)).toThrow(/industry_companies/);
    expect(() => mapIndustryCompanyRow({ ...base, total_count: undefined })).toThrow(/total_count/);
    expect(() => mapIndustryCompanyRow({ ...base, short_code: 12345 })).toThrow(/short_code/);
  });
});
