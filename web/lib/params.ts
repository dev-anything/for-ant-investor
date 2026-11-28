// 스크리너 URL 상태 (FS 6-6, PRD 4장 F-07). 페이지는 lenient(잘못된 값을 기본값으로 바로잡음),
// API는 strict(바로잡지 않고 null = 400). 정렬 허용 키는 고른 필터의 열에 따라 달라진다.
import {
  INCLUDES,
  MAX_FILTERS,
  findFilter,
  isConflictPair,
  type ScreenerSortKey,
} from '@/lib/filters';

export type SortDir = 'asc' | 'desc';
export const SORT_DIRS: readonly SortDir[] = ['asc', 'desc'];

// 페이지당 개수 허용값 (FS 6-6, 5-2 p_size). 숫자 기준값이라 이름을 붙인다
export const SCREENER_SIZES = [10, 20, 50] as const;
export type ScreenerSize = (typeof SCREENER_SIZES)[number];

// 페이지 번호 상한: DB의 p_page가 int(4바이트)라서 그보다 크면 DB 오류가 난다
const MAX_PAGE_NUMBER = 2147483647;

// 필터 id 범위 (filters.ts FILTERS와 같아야 한다)
const FILTER_ID_MIN = 1;
const FILTER_ID_MAX = 20;

export interface ScreenerState {
  filters: number[];
  sort: ScreenerSortKey;
  dir: SortDir;
  page: number;
  size: ScreenerSize;
}

// 기본값 (FS 6-6 표): sort=name, dir=asc, page=1, size=10
export const DEFAULT_SCREENER_STATE: ScreenerState = {
  filters: [],
  sort: 'name',
  dir: 'asc',
  page: 1,
  size: 10,
};

// Next.js searchParams와 같은 모양. 같은 키가 여러 번 오면 배열
export type RawParams = Record<string, string | string[] | undefined>;

/** URLSearchParams를 RawParams로 바꾼다 (같은 키가 여러 번 오면 배열로 모은다). */
export function rawParamsFromSearch(search: URLSearchParams): RawParams {
  const out: RawParams = {};
  for (const key of Array.from(new Set(search.keys()))) {
    const values = search.getAll(key);
    out[key] = values.length === 1 ? values[0] : values;
  }
  return out;
}

// --- 조각 파서 (한 값씩) ---

// 한 토큰을 필터 id로. 숫자가 아니거나 범위 밖이면 null.
// 앞자리 0(`01`)은 받지 않는다: API는 문자열 그대로 같은 값만 허용해야 하고 (FS 4-2), 페이지는 버린다.
function tokenToFilterId(token: string): number | null {
  if (!/^[1-9]\d*$/.test(token)) return null;
  const id = Number(token);
  return id >= FILTER_ID_MIN && id <= FILTER_ID_MAX ? id : null;
}

// "1,13" → [1, 13]. 잘못된 토큰은 null로 남긴다 (lenient는 버리고, strict는 400)
function splitFilterIds(text: string): (number | null)[] {
  return text.split(',').map(tokenToFilterId);
}

// 부딪히는 짝·포함 짝·개수·중복 검사 (strict용). 하나라도 어기면 false
export function isValidFilterSet(ids: number[]): boolean {
  if (ids.length < 1 || ids.length > MAX_FILTERS) return false;
  if (new Set(ids).size !== ids.length) return false;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      if (isConflictPair(ids[i], ids[j])) return false;
    }
  }
  return !INCLUDES.some(([wide, narrow]) => ids.includes(wide) && ids.includes(narrow));
}

// lenient 정리 (PRD 4장 F-07): 중복·범위 밖은 버리고, 13·14는 14만, 부딪히면 뒤의 것을 버리고, 3개까지
export function normalizeFilterIds(ids: number[]): number[] {
  const unique = Array.from(new Set(ids));
  const kept: number[] = [];
  for (const id of unique) {
    // 포함 짝: 넓은 쪽(13)은 좁은 쪽(14)이 같이 오면 버린다
    if (INCLUDES.some(([wide, narrow]) => id === wide && unique.includes(narrow))) continue;
    if (kept.some((k) => isConflictPair(k, id))) continue;
    if (kept.length >= MAX_FILTERS) continue;
    kept.push(id);
  }
  return kept;
}

/** 고른 필터에 따라 정렬 키로 허용되는 값: 종목명·시가총액 + 고른 필터 열의 정렬 키 (FS 6-6). */
export function allowedSortKeys(filters: number[]): ScreenerSortKey[] {
  const keys: ScreenerSortKey[] = ['name', 'market_cap'];
  for (const id of filters) {
    const key = findFilter(id)?.sortKey;
    if (key !== undefined && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

function parseSort(text: string, filters: number[]): ScreenerSortKey | null {
  const keys = allowedSortKeys(filters);
  return keys.find((k) => k === text) ?? null;
}

function parseDir(text: string): SortDir | null {
  return SORT_DIRS.find((d) => d === text) ?? null;
}

function parsePage(text: string): number | null {
  if (!/^[1-9]\d*$/.test(text)) return null;
  const page = Number(text);
  return page <= MAX_PAGE_NUMBER ? page : null;
}

// 문자열 그대로 비교한다 (`010`은 10이 아니라 거부). API는 이 값을 바로잡지 않는다
function parseSize(text: string): ScreenerSize | null {
  return SCREENER_SIZES.find((s) => String(s) === text) ?? null;
}

// 키가 없으면 fallback, 있으면 parse 결과 (잘못된 값은 null)
function optional<T>(text: string | undefined, parse: (t: string) => T | null, fallback: T): T | null {
  return text === undefined ? fallback : parse(text);
}

function stringOf(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * 페이지용 파싱 (lenient). 잘못된 값은 기본값으로 바로잡고 오류를 내지 않는다.
 * 필터는 normalizeFilterIds로 정리한 뒤 정렬 키를 고른다 (정렬 열이 없어졌으면 name).
 */
export function parseScreenerParams(raw: RawParams): ScreenerState {
  const text = stringOf(raw, 'f');
  const filters = normalizeFilterIds(
    (text === undefined ? [] : splitFilterIds(text)).filter((id): id is number => id !== null)
  );
  const d = DEFAULT_SCREENER_STATE;
  return {
    filters,
    sort: optional(stringOf(raw, 'sort'), (t) => parseSort(t, filters), d.sort) ?? d.sort,
    dir: optional(stringOf(raw, 'dir'), parseDir, d.dir) ?? d.dir,
    page: optional(stringOf(raw, 'page'), parsePage, d.page) ?? d.page,
    size: optional(stringOf(raw, 'size'), parseSize, d.size) ?? d.size,
  };
}

/**
 * API용 파싱 (strict). 바로잡지 않는다. 하나라도 어긋나면 null → 400 (FS 4-2, 8-3).
 * f는 필수 (1개 이상), 같은 키가 두 번 오면 어긋난 것으로 본다.
 */
export function parseScreenerApiParams(raw: RawParams): ScreenerState | null {
  if (Object.values(raw).some((v) => Array.isArray(v))) return null;

  const fText = stringOf(raw, 'f');
  if (fText === undefined) return null;
  const tokens = splitFilterIds(fText);
  if (tokens.some((t) => t === null)) return null;
  const filters = tokens.filter((t): t is number => t !== null);
  if (!isValidFilterSet(filters)) return null;

  const d = DEFAULT_SCREENER_STATE;
  const sort = optional(stringOf(raw, 'sort'), (t) => parseSort(t, filters), d.sort);
  const dir = optional(stringOf(raw, 'dir'), parseDir, d.dir);
  const page = optional(stringOf(raw, 'page'), parsePage, d.page);
  const size = optional(stringOf(raw, 'size'), parseSize, d.size);
  if (sort === null || dir === null || page === null || size === null) return null;
  return { filters, sort, dir, page, size };
}

/**
 * 상태를 URL 쿼리 문자열로 만든다 (앞의 ?는 없음). 기본값인 키는 생략한다 (FS 6-6).
 * 순서는 f → sort → dir → page → size (PRD 4장 F-07 URL 예시와 같다).
 */
export function toQuery(state: ScreenerState): string {
  const d = DEFAULT_SCREENER_STATE;
  const parts: string[] = [];
  if (state.filters.length > 0) parts.push(`f=${state.filters.join(',')}`);
  if (state.sort !== d.sort) parts.push(`sort=${state.sort}`);
  if (state.dir !== d.dir) parts.push(`dir=${state.dir}`);
  if (state.page !== d.page) parts.push(`page=${state.page}`);
  if (state.size !== d.size) parts.push(`size=${state.size}`);
  return parts.join('&');
}

// --- 종목 검색 (F-01, FS 8-1, 4-2) ---

// 검색어 길이 상한 (글자 수, 앞뒤 공백 제거 뒤). FS 8-1: 1~50자
export const SEARCH_QUERY_MAX_LENGTH = 50;
// 연관검색어 개수 상한 (PRD 4장 F-01 "최대 10개")
export const SEARCH_RESULT_LIMIT = 10;

/**
 * 검색어를 검증한다 (FS 8-1). 앞뒤 공백을 떼고 1~50자면 그 값, 아니면 null (API는 400).
 * 글자 수는 DB의 length와 맞추려고 UTF-16 길이가 아니라 문자(코드 포인트) 수로 센다.
 */
export function parseSearchQuery(raw: string | null): string | null {
  if (raw === null) return null;
  const q = raw.trim();
  if (q.length === 0 || [...q].length > SEARCH_QUERY_MAX_LENGTH) return null;
  return q;
}

// --- 업종 목록 (F-08 지표 비교, F-15 회사 목록, FS 6-6 2차) ---

// 업종 회사 목록 정렬 키 (FS 5-4), 지표 목록 정렬 키 (FS 5-5)
// 회사 목록 표에 주가·PER·PBR·매출액·영업이익 열이 추가됐다 (2026-11-28 사용자 지시). 주가는 정렬하지 않는다.
export const INDUSTRY_COMPANY_SORTS: readonly string[] = [
  'name',
  'market_cap',
  'per',
  'pbr',
  'revenue',
  'operating_income',
];
export const INDUSTRY_METRIC_SORTS: readonly string[] = [
  'name',
  'debt_ratio',
  'operating_margin',
  'revenue_growth',
];

// 업종 목록 상태 (FS 6-6). 필터가 없어서 정렬·쪽·개수만 가진다
export interface ListState {
  sort: string;
  dir: SortDir;
  page: number;
  size: ScreenerSize;
}

export const DEFAULT_LIST_STATE: ListState = { sort: 'name', dir: 'asc', page: 1, size: 10 };

// 링크 모드 컴포넌트(Pagination·PageSizeSelect)에 넘기는 값. 함수는 서버→클라이언트 경계를 못 넘으니 데이터만 넘긴다
export interface ListLink {
  path: string;
  state: ListState;
}

// 중분류 코드는 두 자리 숫자 (FS 5-3~5-5)
export function isDivisionCode(text: string): boolean {
  return /^[0-9]{2}$/.test(text);
}

/** 업종 목록용 파싱 (lenient, FS 6-6). sort는 sorts 안의 값만 받고, 나머지는 스크리너와 같은 규칙. */
export function parseListParams(raw: RawParams, sorts: readonly string[]): ListState {
  const d = DEFAULT_LIST_STATE;
  return {
    sort: optional(stringOf(raw, 'sort'), (t) => sorts.find((s) => s === t) ?? null, d.sort) ?? d.sort,
    dir: optional(stringOf(raw, 'dir'), parseDir, d.dir) ?? d.dir,
    page: optional(stringOf(raw, 'page'), parsePage, d.page) ?? d.page,
    size: optional(stringOf(raw, 'size'), parseSize, d.size) ?? d.size,
  };
}

/** 목록 상태를 URL 쿼리로 만든다 (앞의 ?는 없음). 기본값인 키는 생략한다 (FS 6-6). */
export function toListQuery(state: ListState): string {
  const d = DEFAULT_LIST_STATE;
  const parts: string[] = [];
  if (state.sort !== d.sort) parts.push(`sort=${state.sort}`);
  if (state.dir !== d.dir) parts.push(`dir=${state.dir}`);
  if (state.page !== d.page) parts.push(`page=${state.page}`);
  if (state.size !== d.size) parts.push(`size=${state.size}`);
  return parts.join('&');
}

/** 목록 주소. 쿼리가 없으면 경로만 준다 (기본 상태). */
export function listHref(path: string, state: ListState): string {
  const query = toListQuery(state);
  return query ? `${path}?${query}` : path;
}

/** 열 제목을 눌렀을 때 다음 상태 (FS 6-6): 같은 열이면 방향을 뒤집고, 다른 열이면 asc. 쪽은 1쪽으로. */
export function nextListSort(state: ListState, key: string): ListState {
  const dir: SortDir = key === state.sort && state.dir === 'asc' ? 'desc' : 'asc';
  return { ...state, sort: key, dir, page: 1 };
}
