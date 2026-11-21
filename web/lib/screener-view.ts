// 스크리너 화면 계산 (FS 8-3, 6-6): 근거 값 열, 필터 툴팁 문장, 상태 전이. 모두 순수 함수다.
import { fillYears, findFilter, toggleFilter, type EvidenceKey, type FilterDef, type ScreenerSortKey } from '@/lib/filters';
import { formatAmount, formatPercent, formatWon } from '@/lib/format';
import { allowedSortKeys, DEFAULT_SCREENER_STATE, type ScreenerState, type SortDir } from '@/lib/params';
import type { ScreenerResult, ScreenerRow } from '@/lib/data/screener';

// 기준 연도 (PRD 10장 9번): 검색 대상에서 가장 많은 최신 연도. 3개년은 기준 연도 -2 ~ 기준 연도
const YEAR_SPAN = 3;

/** 최신 연도 목록에서 가장 많이 나온 연도를 고른다. 같은 횟수면 더 최근 연도. 목록이 비면 null. */
export function modeYear(years: number[]): number | null {
  const counts = new Map<number, number>();
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [year, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && year > best)) {
      best = year;
      bestCount = count;
    }
  }
  return best;
}

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

// 근거 값 열 하나의 계산 방식 (FS 8-3 `evidenceColumns`). kind는 서식을 고른다
type EvidenceKind = 'amount' | 'percent' | 'won';

interface EvidenceSpec {
  label: string; // 열 제목 (PRD 4장 F-03 근거 값 열 이름)
  kind: EvidenceKind;
  indexes: number[]; // 연도 칸 번호 (0=Y1 가장 오래된 해, 2=Y3 최근 해)
  sortKey: ScreenerSortKey; // 정렬 키 (FS 5-2: 3개년 열은 최근 연도 값으로 정렬)
}

// 근거 값 열 표 (PRD 4장 F-03 "근거 값 열" 표와 같다)
const EVIDENCE_SPEC: Record<EvidenceKey, EvidenceSpec> = {
  revenue: { label: '매출', kind: 'amount', indexes: [0, 1, 2], sortKey: 'revenue' },
  revenue_growth_y3: { label: '매출 증가율', kind: 'percent', indexes: [2], sortKey: 'revenue_growth' },
  operating_income: { label: '영업이익', kind: 'amount', indexes: [0, 1, 2], sortKey: 'operating_income' },
  net_income: { label: '순이익', kind: 'amount', indexes: [0, 1, 2], sortKey: 'net_income' },
  operating_margin: { label: '영업이익률', kind: 'percent', indexes: [0, 1, 2], sortKey: 'operating_margin' },
  operating_margin_y3: { label: '영업이익률', kind: 'percent', indexes: [2], sortKey: 'operating_margin' },
  revenue_y2y3: { label: '매출', kind: 'amount', indexes: [1, 2], sortKey: 'revenue' },
  operating_margin_y2y3: { label: '영업이익률', kind: 'percent', indexes: [1, 2], sortKey: 'operating_margin' },
  debt_ratio_y3: { label: '부채비율', kind: 'percent', indexes: [2], sortKey: 'debt_ratio' },
  debt_ratio: { label: '부채비율', kind: 'percent', indexes: [0, 1, 2], sortKey: 'debt_ratio' },
  total_assets: { label: '자산총계', kind: 'amount', indexes: [0, 1, 2], sortKey: 'total_assets' },
  total_equity: { label: '자본총계', kind: 'amount', indexes: [0, 1, 2], sortKey: 'total_equity' },
  total_equity_y3: { label: '자본총계', kind: 'amount', indexes: [2], sortKey: 'total_equity' },
  capital_stock_y3: { label: '자본금', kind: 'amount', indexes: [2], sortKey: 'capital_stock' },
  dps: { label: '주당 배당금', kind: 'won', indexes: [0, 1, 2], sortKey: 'dps' },
};

/** 표의 근거 값 열 한 칸 (연도 칸 하나). */
export interface EvidenceSlot {
  id: string; // 같은 열을 두 번 그리지 않도록 만든 고유 키
  key: EvidenceKey;
  index: number; // 회사 연도 배열의 칸 번호 (0~2)
  header: string; // "매출 2023년" 같은 열 제목 (기준 연도가 없으면 연도 없이)
  sortKey: ScreenerSortKey | null; // 정렬할 수 있으면 키, 아니면 null
}

/**
 * 고른 필터에서 근거 값 열 칸 목록을 만든다 (PRD 4장 F-03: 같은 열은 한 번만).
 * 같은 이름·같은 연도 칸은 한 번만 (예: 매출 Y2·Y3는 필터 1과 12에서 겹친다).
 * 정렬은 Y3 칸에만 붙이고, 허용 정렬 키에 있을 때만 쓴다.
 */
export function evidenceSlots(filters: number[], refYear: number | null): EvidenceSlot[] {
  const allowed = allowedSortKeys(filters);
  const slots: EvidenceSlot[] = [];
  const seen = new Set<string>();
  const years = threeYears(refYear);

  for (const id of filters) {
    const keys: EvidenceKey[] = findFilter(id)?.evidence ?? [];
    for (const key of keys) {
      const spec = EVIDENCE_SPEC[key];
      for (const index of spec.indexes) {
        const dedupeKey = `${spec.label}|${index}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const isLastYear = index === YEAR_SPAN - 1;
        const year = years === null ? null : years[index];
        const sortable = isLastYear && allowed.includes(spec.sortKey);
        slots.push({
          id: `${key}-${index}`,
          key,
          index,
          header: year === null ? spec.label : `${spec.label} ${year}년`,
          sortKey: sortable ? spec.sortKey : null,
        });
      }
    }
  }
  return slots;
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
  const spec = EVIDENCE_SPEC[slot.key];
  const year = row.years[slot.index] ?? null;
  const actualYear = year?.fiscalYear ?? null;
  const expected = threeYears(refYear)?.[slot.index] ?? null;
  const isOtherYear = actualYear !== null && expected !== null && actualYear !== expected;

  let text = EMPTY_TEXT;
  if (spec.kind === 'won') {
    text = wonText(row, actualYear);
  } else if (year !== null) {
    const value = spec.kind === 'amount' ? formatAmount(amountOf(year, slot.key)) : formatPercent(percentOf(year, slot.key));
    text = value ?? EMPTY_TEXT;
  }
  return { text, actualYear, isOtherYear };
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
