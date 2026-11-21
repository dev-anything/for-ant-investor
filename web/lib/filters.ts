// 필터 20개 상수·충돌 규칙·근거 값 열 (PRD 4장 F-03, FS 6-4). 판정은 배치가 하고 여기서는 문구·규칙만 가진다.
// CONFLICTS·FINANCIAL_BLOCKED는 batch/rules.py와 같아야 한다 (tests/rules-sync.test.ts가 확인).

// 묶음 6개 (주제별 이름, 판정하지 않는 이름) — PRD 4장 F-03
export type FilterGroup = '매출' | '이익' | '이익률' | '빚' | '자산과 자본' | '배당';

// 근거 값 열 하나 = 화면의 열 하나 (연도 칸은 열 안에서 Y1~Y3로 나뉜다)
export type EvidenceKey =
  | 'revenue' | 'revenue_growth_y3' | 'operating_income' | 'net_income'
  | 'operating_margin' | 'operating_margin_y3' | 'revenue_y2y3' | 'operating_margin_y2y3'
  | 'debt_ratio_y3' | 'debt_ratio' | 'total_assets' | 'total_equity'
  | 'total_equity_y3' | 'capital_stock_y3' | 'dps';

// 스크리너 정렬 키 (FS 5-2). 3개년 열은 최근 연도(Y3) 값으로 정렬한다
export type ScreenerSortKey =
  | 'name' | 'market_cap' | 'revenue' | 'operating_income' | 'net_income'
  | 'total_assets' | 'total_equity' | 'capital_stock' | 'debt_ratio'
  | 'operating_margin' | 'revenue_growth' | 'dps';

export interface FilterDef {
  id: number;
  group: FilterGroup;
  label: string; // 필터 버튼 문구 (PRD 4장 F-03 표 그대로)
  tooltip: string; // 뜻 한 줄 ({Y1}~{Y3} 자리표시자 포함)
  calc: string; // 계산식 ({Y1}~{Y3} 자리표시자 포함)
  evidence: EvidenceKey[]; // 근거 값 열 (PRD 4장 F-03 "근거 값 열" 표)
  sortKey: ScreenerSortKey; // 그 열을 눌렀을 때 쓰는 정렬 키
  financialBlocked: boolean; // 금융회사에서 계산 불가 (PRD 4장 F-03 "금융회사" 열)
}

// 묶음 표시 순서 (PRD 4장 F-03)
export const FILTER_GROUPS: FilterGroup[] = ['매출', '이익', '이익률', '빚', '자산과 자본', '배당'];

// 같이 고르면 반드시 0건인 짝 (PRD 4장 F-03 "부딪히는 필터" 10쌍)
export const CONFLICTS: [number, number][] = [
  [3, 1], [3, 2], [3, 12], [9, 4], [9, 6], [9, 8], [9, 10], [6, 8], [11, 12], [15, 16],
];

// 포함 관계: 13 ⊃ 14. 둘이 같이 들어오면 더 좁은 14번만 남긴다 (PRD 4장 F-03)
export const INCLUDES: [number, number][] = [[13, 14]];

// 금융회사에서 계산하지 않는 필터 (PRD 4장 F-03 "금융회사" 열, batch/rules.py FINANCIAL_BLOCKED)
export const FINANCIAL_BLOCKED: number[] = [1, 2, 3, 10, 11, 12, 13, 14, 15, 16];

// 고를 수 있는 최대 개수 (PRD 4장 F-07 "필터는 3개까지")
export const MAX_FILTERS = 3;

// PRD 4장 F-03 표 그대로 (문구·툴팁·계산식은 글자 단위로 맞춘다)
export const FILTERS: FilterDef[] = [
  { id: 1, group: '매출', label: '매출이 2년 연속 늘어난 회사',
    tooltip: '매출(팔아서 번 돈)이 해마다 전년보다 많았어.',
    calc: '매출 {Y1}년 < {Y2}년 < {Y3}년',
    evidence: ['revenue'], sortKey: 'revenue', financialBlocked: true },
  { id: 2, group: '매출', label: '매출이 1년 사이 20% 이상 늘어난 회사',
    tooltip: '최근 1년 매출이 전년보다 20% 이상 늘었어 (예: 100억 → 120억 이상).',
    calc: '({Y3}년 매출 − {Y2}년 매출) ÷ {Y2}년 매출 ≥ 20%',
    evidence: ['revenue_growth_y3'], sortKey: 'revenue_growth', financialBlocked: true },
  { id: 3, group: '매출', label: '매출이 2년 연속 줄어든 회사',
    tooltip: '매출이 해마다 전년보다 적었어.',
    calc: '매출 {Y1}년 > {Y2}년 > {Y3}년',
    evidence: ['revenue'], sortKey: 'revenue', financialBlocked: true },
  { id: 4, group: '이익', label: '영업이익이 2년 연속 늘어난 회사',
    tooltip: '영업이익은 본업으로 번 돈에서 본업에 쓴 돈을 뺀 거야. 해마다 늘었고, 최근 해는 흑자야.',
    calc: '영업이익 {Y1} < {Y2} < {Y3}, {Y3}년 > 0',
    evidence: ['operating_income'], sortKey: 'operating_income', financialBlocked: false },
  { id: 5, group: '이익', label: '순이익이 2년 연속 늘어난 회사',
    tooltip: '순이익(정식 이름: 당기순이익)은 모든 비용과 세금까지 빼고 남은 마지막 이익이야. 해마다 늘었고, 최근 해는 흑자야.',
    calc: '순이익 {Y1} < {Y2} < {Y3}, {Y3}년 > 0',
    evidence: ['net_income'], sortKey: 'net_income', financialBlocked: false },
  { id: 6, group: '이익', label: '3년 내내 영업이익을 낸 회사',
    tooltip: '3년 모두 영업이익이 0보다 컸어 (흑자).',
    calc: '영업이익 {Y1}, {Y2}, {Y3} 모두 > 0',
    evidence: ['operating_income'], sortKey: 'operating_income', financialBlocked: false },
  { id: 7, group: '이익', label: '3년 내내 순이익을 낸 회사',
    tooltip: '3년 모두 순이익이 0보다 컸어 (흑자).',
    calc: '순이익 {Y1}, {Y2}, {Y3} 모두 > 0',
    evidence: ['net_income'], sortKey: 'net_income', financialBlocked: false },
  { id: 8, group: '이익', label: '영업이익이 흑자로 돌아선 회사',
    tooltip: '전년에는 영업이익이 0보다 작았는데(적자), 최근 해에는 0보다 커졌어(흑자).',
    calc: '영업이익 {Y2}년 < 0, {Y3}년 > 0',
    evidence: ['operating_income'], sortKey: 'operating_income', financialBlocked: false },
  { id: 9, group: '이익', label: '영업적자가 2년 이상 이어진 회사',
    tooltip: '최근 2년 연속 영업이익이 0보다 작았어 (적자).',
    calc: '영업이익 {Y2}년 < 0, {Y3}년 < 0',
    evidence: ['operating_income'], sortKey: 'operating_income', financialBlocked: false },
  { id: 10, group: '이익률', label: '영업이익률이 10% 이상인 회사',
    tooltip: '영업이익률은 매출 중 영업이익의 비율이야. 10%면 100원어치 팔아서 10원을 남긴 거야.',
    calc: '{Y3}년 영업이익 ÷ 매출 ≥ 10%',
    evidence: ['operating_margin_y3'], sortKey: 'operating_margin', financialBlocked: true },
  { id: 11, group: '이익률', label: '영업이익률이 2년 연속 오른 회사',
    tooltip: '100원어치 팔아서 남기는 돈의 비율이 해마다 올랐어.',
    calc: '영업이익률 {Y1} < {Y2} < {Y3}',
    evidence: ['operating_margin'], sortKey: 'operating_margin', financialBlocked: true },
  { id: 12, group: '이익률', label: '매출은 늘었지만 영업이익률은 줄어든 회사',
    tooltip: '최근 1년 매출은 늘었는데, 100원어치 팔아서 남기는 돈의 비율은 줄었어.',
    calc: '매출 {Y3}년 > {Y2}년, 영업이익률 {Y3}년 < {Y2}년',
    evidence: ['revenue_y2y3', 'operating_margin_y2y3'], sortKey: 'operating_margin', financialBlocked: true },
  { id: 13, group: '빚', label: '부채비율이 100% 이하인 회사',
    tooltip: '부채비율은 빚(부채)이 자기 돈(자본)의 몇 %인지야. 100% 이하면 빚이 자기 돈보다 많지 않아.',
    calc: '{Y3}년 부채총계 ÷ 자본총계 ≤ 100%',
    evidence: ['debt_ratio_y3'], sortKey: 'debt_ratio', financialBlocked: true },
  { id: 14, group: '빚', label: '부채비율이 50% 이하인 회사',
    tooltip: '빚이 자기 돈의 절반을 넘지 않아.',
    calc: '{Y3}년 부채총계 ÷ 자본총계 ≤ 50%',
    evidence: ['debt_ratio_y3'], sortKey: 'debt_ratio', financialBlocked: true },
  { id: 15, group: '빚', label: '부채비율이 2년 연속 내린 회사',
    tooltip: '자기 돈에 견준 빚의 비율이 해마다 낮아졌어.',
    calc: '부채비율 {Y1} > {Y2} > {Y3}',
    evidence: ['debt_ratio'], sortKey: 'debt_ratio', financialBlocked: true },
  { id: 16, group: '빚', label: '부채비율이 2년 연속 오른 회사',
    tooltip: '자기 돈에 견준 빚의 비율이 해마다 높아졌어.',
    calc: '부채비율 {Y1} < {Y2} < {Y3}',
    evidence: ['debt_ratio'], sortKey: 'debt_ratio', financialBlocked: true },
  { id: 17, group: '자산과 자본', label: '자산이 2년 연속 늘어난 회사',
    tooltip: '자산은 회사가 가진 모든 것(현금·건물·설비 등)이야. 빌린 돈으로 산 것도 들어가.',
    calc: '자산총계 {Y1} < {Y2} < {Y3}',
    evidence: ['total_assets'], sortKey: 'total_assets', financialBlocked: false },
  { id: 18, group: '자산과 자본', label: '자본이 2년 연속 늘어난 회사',
    tooltip: '자본은 자산에서 빚을 뺀 회사 자기 돈이야.',
    calc: '자본총계 {Y1} < {Y2} < {Y3}',
    evidence: ['total_equity'], sortKey: 'total_equity', financialBlocked: false },
  { id: 19, group: '자산과 자본', label: '자본잠식 상태인 회사',
    tooltip: '자본총계가 자본금(주식 수 × 액면가)보다 적은 상태야. 그동안 쌓인 손실이 자본금 아래까지 깎아 먹은 거야.',
    calc: '{Y3}년 자본총계 < 자본금 (자본금이 0으로 오면 판단하지 않아)',
    evidence: ['total_equity_y3', 'capital_stock_y3'], sortKey: 'total_equity', financialBlocked: false },
  { id: 20, group: '배당', label: '3년 내내 현금배당한 회사',
    tooltip: '3년 모두 보통주 한 주에 현금배당을 줬어. 주식으로 준 배당은 세지 않아.',
    calc: '보통주 주당 현금배당금 {Y1}, {Y2}, {Y3} 모두 > 0',
    evidence: ['dps'], sortKey: 'dps', financialBlocked: false },
];

const FILTER_BY_ID = new Map<number, FilterDef>(FILTERS.map((f) => [f.id, f]));

/** 필터 id로 정의를 찾는다. 모르는 id면 null. */
export function findFilter(id: number): FilterDef | null {
  return FILTER_BY_ID.get(id) ?? null;
}

/** 두 필터가 부딪히는지 (순서 상관없이). */
export function isConflictPair(a: number, b: number): boolean {
  return CONFLICTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 13·14 포함 짝인지 (순서 상관없이). */
function isIncludePair(a: number, b: number): boolean {
  return INCLUDES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// toggleFilter 결과. conflict는 부딪히는 상대 id, max는 3개가 이미 찼다는 뜻
export type ToggleResult =
  | { selected: number[]; error?: undefined }
  | { selected: number[]; error: 'conflict'; with: number }
  | { selected: number[]; error: 'max' };

/** 필터 버튼을 눌렀을 때 선택 목록을 바꾼다. 이미 있으면 뺀다 (PRD 4장 F-03·F-07). */
export function toggleFilter(selected: number[], id: number): ToggleResult {
  if (!findFilter(id)) return { selected };
  if (selected.includes(id)) return { selected: selected.filter((x) => x !== id) };

  const partner = selected.find((s) => isConflictPair(s, id));
  if (partner !== undefined) return { selected, error: 'conflict', with: partner };

  // 13↔14는 개수가 그대로이므로 한도 검사 전에 짝을 바꾼다 (포함 관계: 더 좁은 쪽 14만 남김)
  const includePartner = selected.find((s) => isIncludePair(s, id));
  if (includePartner !== undefined) {
    return { selected: [...selected.filter((s) => s !== includePartner), id] };
  }

  if (selected.length >= MAX_FILTERS) return { selected, error: 'max' };
  return { selected: [...selected, id] };
}

/** 이 버튼을 흐리게 할 이유: 이미 고른 필터 중 부딪히는 상대 id, 없으면 null. */
export function blockedBy(selected: number[], id: number): number | null {
  if (selected.includes(id)) return null;
  return selected.find((s) => isConflictPair(s, id)) ?? null;
}

/** 문구의 {Y1}~{Y3} 자리표시자를 실제 연도로 채운다. */
export function fillYears(text: string, years: [number, number, number]): string {
  return text
    .replace(/\{Y1\}/g, String(years[0]))
    .replace(/\{Y2\}/g, String(years[1]))
    .replace(/\{Y3\}/g, String(years[2]));
}

/** 고른 필터의 근거 값 열 목록. 같은 열은 한 번만, 고른 순서대로 (PRD 4장 F-03). */
export function evidenceColumns(selected: number[]): EvidenceKey[] {
  const out: EvidenceKey[] = [];
  for (const id of selected) {
    for (const key of findFilter(id)?.evidence ?? []) {
      if (!out.includes(key)) out.push(key);
    }
  }
  return out;
}

/** 금융회사 빠짐 안내를 띄울지: 고른 필터 중 금융회사에서 계산 안 되는 것이 있는지. */
export function hasFinancialBlocked(selected: number[]): boolean {
  return selected.some((id) => FINANCIAL_BLOCKED.includes(id));
}
