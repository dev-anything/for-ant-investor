// 배당 표 칸 계산 테스트 (PRD 4장 F-14, FS 6-9)
import { describe, expect, it } from 'vitest';
import { buildDividendTable, type DividendRow } from '@/lib/dividend';

const YEARS = [2023, 2024, 2025];

const paid = (fiscalYear: number, dps: number, dividendYield: number, sourceBsnsYear = 2025): DividendRow => ({
  fiscalYear,
  dpsStatus: 'paid',
  dps,
  yieldStatus: 'value',
  dividendYield,
  sourceBsnsYear,
});
const none = (fiscalYear: number, sourceBsnsYear = 2025): DividendRow => ({
  fiscalYear,
  dpsStatus: 'none',
  dps: null,
  yieldStatus: 'none',
  dividendYield: null,
  sourceBsnsYear,
});

describe('buildDividendTable', () => {
  it('행이 하나도 없으면 no_data다 (배당 없음과 구분)', () => {
    expect(buildDividendTable([], YEARS)).toEqual({ kind: 'no_data' });
  });

  it('화면 연도 밖 행만 있으면 no_data다', () => {
    expect(buildDividendTable([paid(2019, 100, 1)], YEARS)).toEqual({ kind: 'no_data' });
  });

  it('3년 모두 none이면 all_none이다', () => {
    const rows = [none(2023), none(2024), none(2025)];
    expect(buildDividendTable(rows, YEARS)).toEqual({ kind: 'all_none' });
  });

  it('2년만 행이 있고 둘 다 none이면 table이다 (3년 모두 행이 있어야 all_none)', () => {
    const result = buildDividendTable([none(2024), none(2025)], YEARS);
    expect(result.kind).toBe('table');
    if (result.kind !== 'table') return;
    expect(result.columns.map((col) => col.year)).toEqual([2024, 2025]);
    expect(result.columns[0].dps.text).toBe('없음');
    expect(result.columns[0].yield.text).toBe('없음');
  });

  it('삼성전자 값은 원·퍼센트 글자로 바뀌고 열 순서는 오래된 연도부터다', () => {
    const rows = [paid(2025, 1668, 1.5), paid(2023, 1444, 1.9), paid(2024, 1446, 2.7)];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind).toBe('table');
    if (result.kind !== 'table') return;
    expect(result.columns.map((col) => col.dps.text)).toEqual(['1,444원', '1,446원', '1,668원']);
    expect(result.columns.map((col) => col.yield.text)).toEqual(['1.9%', '2.7%', '1.5%']);
  });

  it('기준 연도는 행들의 source_bsns_year 최댓값이다', () => {
    const rows = [paid(2023, 100, 1, 2024), paid(2024, 100, 1, 2025)];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind === 'table' && result.sourceYear).toBe(2025);
  });

  it('paid인데 not_disclosed면 배당수익률 칸은 "공시 없음"과 툴팁이고 값을 계산하지 않는다', () => {
    const rows: DividendRow[] = [
      { fiscalYear: 2025, dpsStatus: 'paid', dps: 500, yieldStatus: 'not_disclosed', dividendYield: null, sourceBsnsYear: 2025 },
    ];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind === 'table' && result.columns[0].yield).toEqual({
      text: '공시 없음',
      tooltip: '회사가 이 해 배당수익률을 공시하지 않았어.',
    });
    expect(result.kind === 'table' && result.columns[0].dps.text).toBe('500원');
  });

  it('dps_status가 check면 주당 배당금 칸이 "확인 필요"다', () => {
    const rows: DividendRow[] = [
      { fiscalYear: 2025, dpsStatus: 'check', dps: null, yieldStatus: 'check', dividendYield: null, sourceBsnsYear: 2025 },
    ];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind === 'table' && result.columns[0].dps.text).toBe('확인 필요');
    expect(result.kind === 'table' && result.columns[0].yield.text).toBe('확인 필요');
  });

  it('dps가 check여도 yield가 value면 배당수익률 값은 그대로 보여준다', () => {
    const rows: DividendRow[] = [
      { fiscalYear: 2025, dpsStatus: 'check', dps: null, yieldStatus: 'value', dividendYield: 2.1, sourceBsnsYear: 2025 },
    ];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind === 'table' && result.columns[0].yield.text).toBe('2.1%');
  });

  it('부분 무배당: 한 해만 none이면 그 해 칸만 없음이다', () => {
    const rows = [paid(2023, 1444, 1.9), none(2024), paid(2025, 1668, 1.5)];
    const result = buildDividendTable(rows, YEARS);
    expect(result.kind === 'table' && result.columns.map((col) => col.dps.text)).toEqual(['1,444원', '없음', '1,668원']);
  });
});
