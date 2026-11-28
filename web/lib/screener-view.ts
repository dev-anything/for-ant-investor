// 스크리너 화면 계산 (FS 8-3, 6-6): 근거 값 열, 필터 툴팁 문장, 상태 전이. 모두 순수 함수다.
import {
  EVIDENCE_COLUMNS,
  fillYears,
  findFilter,
  toggleFilter,
  type EvidenceKey,
  type FilterDef,
  type ScreenerSortKey,
} from '@/lib/filters';
import { formatAmount, formatPercent, formatWon } from '@/lib/format';
import { allowedSortKeys, DEFAULT_SCREENER_STATE, type ScreenerState, type SortDir } from '@/lib/params';
import type { ScreenerResult, ScreenerRow } from '@/lib/data/screener';

// 기준 연도 (PRD 10장 9번): 검색 대상에서 가장 많은 최신 연도. 3개년은 기준 연도 -2 ~ 기준 연도
const YEAR_SPAN = 3;

/** 기준 연도에서 3개년 (오래된 → 최근). 기준 연도가 없으면 null. */
export function threeYears(refYear: number | null): [number, number, number] | null {
  if (refYear === null) return null;
  return [refYear - 2, refYear - 1, refYear];
}

/**
 * 필터 버튼 툴팁 문장 (PRD 4장 F-03): "{뜻} 계산: {계산식}". {Y1}~{Y3}은 기준 연도로 채운다.
 * 기준 연도가 없으면 계산식은 자리표시자가 남으므로 뜻만 쓴다.
 */
export function filterTooltip(filter: FilterDef, refYear: number | null): string {
  const years = threeYears(refYear);
  if (years === null) return filter.tooltip;
  return `${filter.tooltip} 계산: ${fillYears(filter.calc, years)}`;
}

// 근거 값 열의 서식 종류 (PRD 3-8). 라벨·연도 칸·정렬 키는 filters.ts EVIDENCE_COLUMNS가 가진다
type EvidenceKind = 'amount' | 'percent' | 'won';

const EVIDENCE_KIND: Record<EvidenceKey, EvidenceKind> = {
  revenue: 'amount',
  revenue_growth_y3: 'percent',
  operating_income: 'amount',
  net_income: 'amount',
  operating_margin: 'percent',
  operating_margin_y3: 'percent',
  revenue_y2y3: 'amount',
  operating_margin_y2y3: 'percent',
  debt_ratio_y3: 'percent',
  debt_ratio: 'percent',
  total_assets: 'amount',
  total_equity: 'amount',
  total_equity_y3: 'amount',
  capital_stock_y3: 'amount',
  dps: 'won',
};

/** 표의 근거 값 열 한 칸 (연도 칸 하나). */
export interface EvidenceSlot {
  id: string; // 같은 열을 두 번 그리지 않도록 만든 고유 키
  key: EvidenceKey;
  index: number; // 회사 연도 배열의 칸 번호 (0~2)
  header: string; // "매출 2023년" 같은 열 제목 (기준 연도가 없으면 연도 없이)
  sortKey: ScreenerSortKey | null; // 정렬할 수 있으면 키, 아니면 null
}

/** 근거 값 열 하나: 지표 하나에 3개년 칸을 묶은 것 (DESIGN-V2 S14). */
export interface EvidenceGroup {
  id: string; // 같은 열을 두 번 그리지 않도록 만든 고유 키 (열 이름)
  keys: EvidenceKey[]; // 같은 이름을 가진 근거 키.값을 읽는 키는 첫 것 하나면 된다
  label: string; // 열 이름 (EVIDENCE_COLUMNS[key].label)
  indexes: number[]; // 회사 연도 배열의 칸 번호, 오름차순
  header: string; // "매출 2023~2025년", "부채비율 2025년", 기준 연도 없으면 "부채비율"
  sortKey: ScreenerSortKey | null;
}

/**
 * 고른 필터에서 근거 값 열을 만든다 (DESIGN-V2 S14).
 * 열 이름이 같으면 한 열로 묶고 연도 칸은 합집합으로 오름차순 정렬한다
 * (예: 필터 1 매출 [0,1,2] + 필터 12 매출 [1,2] → 한 열 [0,1,2]).
 * 정렬은 최근 연도 칸(index 2)이 들어 있고 허용 키일 때만 붙인다 (FS 5-2).
 */
export function evidenceGroups(filters: number[], refYear: number | null): EvidenceGroup[] {
  const allowed = allowedSortKeys(filters);
  const years = threeYears(refYear);
  const groups: EvidenceGroup[] = [];
  const byLabel = new Map<string, EvidenceGroup>();

  for (const id of filters) {
    for (const key of findFilter(id)?.evidence ?? []) {
      const { label, indexes } = EVIDENCE_COLUMNS[key];
      let group = byLabel.get(label);
      if (group === undefined) {
        // 같은 이름의 열은 값을 읽는 방식도 같으므로 첫 키로 충분하다
        group = { id: label, keys: [], label, indexes: [], header: label, sortKey: null };
        byLabel.set(label, group);
        groups.push(group);
      }
      if (!group.keys.includes(key)) group.keys.push(key);
      for (const index of indexes) {
        if (!group.indexes.includes(index)) group.indexes.push(index);
      }
    }
  }

  for (const group of groups) {
    group.indexes.sort((a, b) => a - b);
    if (years !== null && group.indexes.length > 0) {
      const first = years[group.indexes[0]];
      const last = years[group.indexes[group.indexes.length - 1]];
      group.header =
        group.indexes.length === 1 ? `${group.label} ${first}년` : `${group.label} ${first}~${last}년`;
    }
    const sortKey = EVIDENCE_COLUMNS[group.keys[0]].sortKey;
    group.sortKey = group.indexes.includes(YEAR_SPAN - 1) && allowed.includes(sortKey) ? sortKey : null;
  }
  return groups;
}

/** 칸 값 하나: 화면에 쓸 글자, 그 칸의 실제 연도, 기준 연도와 다른지 (다르면 칸에 작은 연도를 붙인다). */
export interface EvidenceCell {
  text: string;
  actualYear: number | null;
  isOtherYear: boolean;
}

const NONE_TEXT = '없음';
const EMPTY_TEXT = '-';

/**
 * 결과 한 행의 근거 값 한 칸을 글자로 만든다 (PRD 3-8 서식, null은 `-`).
 * 회사 연도 칸 번호(index)로 읽는다. 회사 연도가 기준 연도와 다르면 isOtherYear를 true로 준다.
 */
export function readEvidenceCell(row: ScreenerRow, slot: EvidenceSlot, refYear: number | null): EvidenceCell {
  const kind = EVIDENCE_KIND[slot.key];
  const year = row.years[slot.index] ?? null;
  const actualYear = year?.fiscalYear ?? null;
  const expected = threeYears(refYear)?.[slot.index] ?? null;
  const isOtherYear = actualYear !== null && expected !== null && actualYear !== expected;

  let text = EMPTY_TEXT;
  if (kind === 'won') {
    text = wonText(row, actualYear);
  } else if (year !== null) {
    const value = kind === 'amount' ? formatAmount(amountOf(year, slot.key)) : formatPercent(percentOf(year, slot.key));
    text = value ?? EMPTY_TEXT;
  }
  return { text, actualYear, isOtherYear };
}

/** 열의 칸 하나를 읽을 때 쓰는 임시 슬롯. 칸 번호만 의미가 있어 제목·정렬 키는 비워 둔다. */
function cellSlot(key: EvidenceKey, index: number): EvidenceSlot {
  return { id: `${key}-${index}`, key, index, header: EVIDENCE_COLUMNS[key].label, sortKey: null };
}

export interface EvidenceGroupValue {
  text: string; // "518억 → 612억 → 757억 원" (테스트·접근성용)
  parts: string[]; // 칸마다 단위 떼기를 적용한 값. 화살표는 화면에서 값 사이에 둔다
  actualRange: string | null; // 회사 연도가 기준 연도와 다르면 "2022~2024년", 같으면 null
}

/**
 * 한 열의 연도 칸 값을 화살표로 잇는다 (DESIGN-V2 S14).
 * 금액·배당은 마지막 값에만 단위를 남기고, 마지막 값이 비었으면(-·없음) 단위를 그대로 둔다.
 * 비율은 모든 값에 '%'를 그대로 둔다.
 */
export function readEvidenceGroup(
  row: ScreenerRow,
  group: EvidenceGroup,
  refYear: number | null
): EvidenceGroupValue {
  const key = group.keys[0];
  const kind = EVIDENCE_KIND[key];
  const parts: string[] = [];
  const actualYears: number[] = [];

  for (const index of group.indexes) {
    const cell = readEvidenceCell(row, cellSlot(key, index), refYear);
    parts.push(cell.text);
    if (cell.isOtherYear && cell.actualYear !== null) actualYears.push(cell.actualYear);
  }

  const last = parts[parts.length - 1] ?? EMPTY_TEXT;
  if (last !== EMPTY_TEXT && last !== NONE_TEXT && kind !== 'percent') {
    for (let i = 0; i < parts.length - 1; i++) parts[i] = stripUnit(parts[i], kind);
  }

  const years = [...new Set(actualYears)].sort((a, b) => a - b);
  let actualRange: string | null = null;
  if (years.length === 1) actualRange = `${years[0]}년`;
  else if (years.length > 1) actualRange = `${years[0]}~${years[years.length - 1]}년`;

  return { text: parts.join(' → '), parts, actualRange };
}

// 금액은 '억 원'·'조 원'에서, 배당은 '원'에서 단위만 뗀다 (DESIGN-V2 S14)
function stripUnit(text: string, kind: EvidenceKind): string {
  if (kind === 'amount' && text.endsWith(' 원')) return text.slice(0, -2);
  if (kind === 'won' && text.endsWith('원')) return text.slice(0, -1);
  return text;
}

// 근거 값 키가 가리키는 연도 값 (금액)
function amountOf(year: ScreenerRow['years'][number], key: EvidenceKey): number | null {
  switch (key) {
    case 'operating_income':
      return year.operatingIncome;
    case 'net_income':
      return year.netIncome;
    case 'total_assets':
      return year.totalAssets;
    case 'total_equity':
    case 'total_equity_y3':
      return year.totalEquity;
    case 'capital_stock_y3':
      return year.capitalStock;
    default:
      return year.revenue;
  }
}

// 근거 값 키가 가리키는 연도 값 (비율)
function percentOf(year: ScreenerRow['years'][number], key: EvidenceKey): number | null {
  switch (key) {
    case 'revenue_growth_y3':
      return year.revenueGrowth;
    case 'operating_margin':
    case 'operating_margin_y3':
    case 'operating_margin_y2y3':
      return year.operatingMargin;
    default:
      return year.debtRatio;
  }
}

// 주당 배당금 칸: 배당 행은 연도로 찾는다. 배당 상태가 none이면 "없음"
function wonText(row: ScreenerRow, actualYear: number | null): string {
  if (actualYear === null) return EMPTY_TEXT;
  const dividend = row.dividends.find((d) => d.fiscalYear === actualYear);
  if (!dividend) return EMPTY_TEXT;
  if (dividend.dpsStatus === 'none') return NONE_TEXT;
  return formatWon(dividend.dps) ?? EMPTY_TEXT;
}

/** 응답이 ScreenerResult 모양인지 확인한다 (클라이언트가 받은 JSON을 믿지 않고 본다). */
export function isScreenerResult(value: unknown): value is ScreenerResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.total === 'number' && Array.isArray(v.rows) && (v.basDt === null || typeof v.basDt === 'string');
}

/** 필터 버튼 누름의 결과. 오류면 상태를 바꾸지 않고 이유만 돌려준다. */
export type ToggleOutcome =
  | { state: ScreenerState; error: null }
  | { state: ScreenerState; error: { kind: 'max' } }
  | { state: ScreenerState; error: { kind: 'conflict'; with: number } };

// 필터가 바뀌면 page=1, 정렬 열이 사라졌으면 종목명 오름차순 (FS 8-3)
function withFilters(state: ScreenerState, filters: number[]): ScreenerState {
  const sortStillAllowed = allowedSortKeys(filters).includes(state.sort);
  if (sortStillAllowed) return { ...state, filters, page: 1 };
  return { ...state, filters, sort: DEFAULT_SCREENER_STATE.sort, dir: DEFAULT_SCREENER_STATE.dir, page: 1 };
}

/** 필터 버튼을 눌렀을 때 새 상태 (고른 것이면 추가, 이미 고른 것이면 뺀다). */
export function applyToggle(state: ScreenerState, id: number): ToggleOutcome {
  const result = toggleFilter(state.filters, id);
  if (result.error === 'max') return { state, error: { kind: 'max' } };
  if (result.error === 'conflict') return { state, error: { kind: 'conflict', with: result.with } };
  return { state: withFilters(state, result.selected), error: null };
}

/** 정렬 열을 눌렀을 때: 같은 열이면 방향을 뒤집고, 다른 열이면 그 열 오름차순. 쪽은 1쪽. */
export function applySort(state: ScreenerState, key: ScreenerSortKey): ScreenerState {
  if (key === state.sort) {
    const dir: SortDir = state.dir === 'asc' ? 'desc' : 'asc';
    return { ...state, dir, page: 1 };
  }
  return { ...state, sort: key, dir: 'asc', page: 1 };
}

/** 쪽당 개수를 바꾸면 1쪽으로. */
export function applySize(state: ScreenerState, size: ScreenerState['size']): ScreenerState {
  return { ...state, size, page: 1 };
}
