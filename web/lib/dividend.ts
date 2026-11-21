// 배당 표 칸 계산 (PRD 4장 F-14, FS 6-9). 행을 표 모양으로 바꾸고 칸 문구를 고른다. 화면 없이 순수 함수로만 둔다.
// 배당수익률을 직접 계산하지 않는다 (PRD 1-5 원칙 6): 공시 안 된 값은 "공시 없음"으로만 보여준다.
import { copy } from '@/lib/copy';
import { formatPercent, formatWon } from '@/lib/format';

// PRD 4장 F-14: 화면 연도는 최근 3개. 3년 모두 행이 있고 모두 none이면 "현금배당이 없었어"
const DIVIDEND_YEAR_COUNT = 3;

// DB check 제약(paid·none·check)과 맞춤 (FS 4-1 6번)
export type DpsStatus = 'paid' | 'none' | 'check';
// DB check 제약(value·not_disclosed·none)과 맞춤. check는 DB 밖의 값이 와도 "확인 필요"로 받기 위한 자리
export type YieldStatus = 'value' | 'not_disclosed' | 'none' | 'check';

// dividends 한 행 (FS 4-1 6번). DB 컬럼은 lib/data/stock.ts가 camelCase로 한 번만 바꿔 넘긴다
export interface DividendRow {
  fiscalYear: number;
  dpsStatus: DpsStatus;
  // 원 단위. paid인데 값이 없으면 칸은 "확인 필요"
  dps: number | null;
  yieldStatus: YieldStatus;
  // % 단위 (예: 1.9 = 1.9%). 회사가 공시한 값만 쓴다
  dividendYield: number | null;
  // 이 행을 가져온 사업보고서 기준 연도 (카드 오른쪽 기준 표시에 쓴다)
  sourceBsnsYear: number;
}

export interface DividendCell {
  text: string;
  // 툴팁이 있는 칸만 값이 있다 (예: "공시 없음")
  tooltip: string | null;
}

export interface DividendColumn {
  year: number;
  dps: DividendCell;
  yield: DividendCell;
}

// 카드 본문 모양 3가지 (FS 9-4). table만 표와 고정 설명을 그린다
export type DividendTable =
  | { kind: 'no_data' }
  | { kind: 'all_none' }
  | { kind: 'table'; sourceYear: number; columns: DividendColumn[] };

/**
 * 화면 연도 안의 배당 행으로 카드 본문을 만든다.
 * 행이 하나도 없으면 no_data (배당 없음과 데이터 없음을 구분하려고 따로 둔다, PRD 4장 F-14).
 * 열은 행이 있는 화면 연도만 쓴다. 기준 연도는 그 행들의 source_bsns_year 최댓값.
 */
export function buildDividendTable(rows: DividendRow[], displayYears: number[]): DividendTable {
  const yearSet = new Set(displayYears);
  const shown = rows.filter((row) => yearSet.has(row.fiscalYear)).sort((a, b) => a.fiscalYear - b.fiscalYear);

  if (shown.length === 0) return { kind: 'no_data' };

  const isAllYearsNone =
    displayYears.length === DIVIDEND_YEAR_COUNT &&
    shown.length === DIVIDEND_YEAR_COUNT &&
    shown.every((row) => row.dpsStatus === 'none');
  if (isAllYearsNone) return { kind: 'all_none' };

  return {
    kind: 'table',
    sourceYear: Math.max(...shown.map((row) => row.sourceBsnsYear)),
    columns: shown.map((row) => ({ year: row.fiscalYear, dps: dpsCell(row), yield: yieldCell(row) })),
  };
}

// 주당 배당금 칸 (FS 6-9 표)
function dpsCell(row: DividendRow): DividendCell {
  if (row.dpsStatus === 'none') return plainCell(copy.dividend.none);
  if (row.dpsStatus === 'check') return plainCell(copy.dividend.check);
  // paid인데 금액이 없으면 추측하지 않고 확인 필요로 둔다
  return plainCell(formatWon(row.dps) ?? copy.dividend.check);
}

// 배당수익률 칸 (FS 6-9 표). 공시 안 된 값은 계산하지 않고 "공시 없음"만 쓴다
function yieldCell(row: DividendRow): DividendCell {
  if (row.dpsStatus === 'none') return plainCell(copy.dividend.none);
  if (row.yieldStatus === 'value') return plainCell(formatPercent(row.dividendYield) ?? copy.dividend.check);
  if (row.yieldStatus === 'not_disclosed' && row.dpsStatus === 'paid') {
    return { text: copy.dividend.notDisclosed, tooltip: copy.dividend.notDisclosedTip };
  }
  return plainCell(copy.dividend.check);
}

function plainCell(text: string): DividendCell {
  return { text, tooltip: null };
}
