// 업종 조회 (FS 5-3~5-5, 9-2). DB 컬럼 snake_case는 이 파일에서 camelCase로 한 번만 바꾼다.
import 'server-only';
import { db } from '@/lib/supabase/server';
import { groupTopCompanies, mapIndustryCompanyRow } from '@/lib/industry';
import type { IndustryCompanyRow, IndustryTopCompany } from '@/lib/industry';
import type { ListState } from '@/lib/params';

// 화면이 쓰는 행 타입은 순수 매핑 함수가 있는 lib/industry.ts에 두고 여기서 다시 내보낸다
export type { IndustryCompanyRow } from '@/lib/industry';

// 업종 목록 한 쪽 (total은 전체 회사 수, 쪽을 넘으면 rows가 비어 total도 0이다)
export interface IndustryPage<T> {
  total: number;
  rows: T[];
}

// 지표 비교 목록 한 행 (FS 5-5 반환 열). 재무가 없는 회사는 지표·fiscalYear가 null
export interface IndustryMetricRow {
  shortCode: string;
  name: string;
  market: string | null;
  accMt: string | null;
  isFinancial: boolean | null;
  fiscalYear: number | null;
  debtRatio: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
}

// 업종 트리 한 행 (FS 5-3 반환 열, F-15 목록)
export interface IndustryTreeRow {
  sectionCode: string;
  sectionName: string;
  sectionOrder: number;
  divisionCode: string;
  divisionName: string;
  divisionOrder: number;
  companyCount: number;
}

// 업종 카드에 보여 줄 회사 수 (DESIGN-V2 3-1)
const INDUSTRY_TOP_COMPANIES_LIMIT = 3;

// 모양 검사는 DB 결과를 unknown으로 받아 확인한 뒤 쓴다 (any 금지). 메시지에는 함수 이름만 쓴다
function asRecord(v: unknown, fn: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error(`${fn} 응답 모양이 다르다 (객체가 아님)`);
  }
  // 위에서 객체인지 확인했다. 키 접근만 하므로 Record로 읽는다
  return v as Record<string, unknown>;
}

function asRows(v: unknown, fn: string): unknown[] {
  if (!Array.isArray(v)) throw new Error(`${fn} 응답 모양이 다르다 (배열이 아님)`);
  return v;
}

function requiredString(r: Record<string, unknown>, key: string, fn: string): string {
  const v = r[key];
  if (typeof v !== 'string') throw new Error(`${fn} 응답 모양이 다르다 (${key})`);
  return v;
}

function requiredNumber(r: Record<string, unknown>, key: string, fn: string): number {
  const v = r[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${fn} 응답 모양이 다르다 (${key})`);
  return v;
}

function stringOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function numberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function boolOrNull(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

// 쪽 결과의 total은 행마다 같은 값이라 첫 행에서 읽는다 (0행이면 0)
function pageOf<T>(mapped: { total: number; row: T }[]): IndustryPage<T> {
  return { total: mapped[0]?.total ?? 0, rows: mapped.map((m) => m.row) };
}

function mapMetricRow(raw: unknown): { total: number; row: IndustryMetricRow } {
  const fn = 'industry_metrics';
  const r = asRecord(raw, fn);
  return {
    total: requiredNumber(r, 'total_count', fn),
    row: {
      shortCode: requiredString(r, 'short_code', fn),
      name: requiredString(r, 'itms_nm', fn),
      market: stringOrNull(r.mrkt_ctg),
      accMt: stringOrNull(r.acc_mt),
      isFinancial: boolOrNull(r.is_financial),
      fiscalYear: numberOrNull(r.fiscal_year),
      debtRatio: numberOrNull(r.debt_ratio),
      operatingMargin: numberOrNull(r.operating_margin),
      revenueGrowth: numberOrNull(r.revenue_growth),
    },
  };
}

/**
 * 지표 비교 목록 한 쪽 (FS 5-5). 재무 없는 회사도 들어간다 (제목의 회사 수와 F-15 목록이 같아야 함).
 * DB 오류는 throw한다 (error.tsx가 오류 화면).
 */
export async function getIndustryMetrics(division: string, state: ListState): Promise<IndustryPage<IndustryMetricRow>> {
  const { data, error } = await db().rpc('industry_metrics', {
    p_division: division,
    p_sort: state.sort,
    p_dir: state.dir,
    p_page: state.page,
    p_size: state.size,
  });
  if (error) throw new Error(`industry_metrics 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  return pageOf(asRows(data, 'industry_metrics').map(mapMetricRow));
}

/** 업종 회사 목록 한 쪽 (FS 5-4, F-15). 시가총액이 없으면 null. */
export async function getIndustryCompanies(division: string, state: ListState): Promise<IndustryPage<IndustryCompanyRow>> {
  const { data, error } = await db().rpc('industry_companies', {
    p_division: division,
    p_sort: state.sort,
    p_dir: state.dir,
    p_page: state.page,
    p_size: state.size,
  });
  if (error) throw new Error(`industry_companies 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  return pageOf(asRows(data, 'industry_companies').map(mapIndustryCompanyRow));
}

/** 업종 트리 (FS 5-3, F-15). 대분류·중분류를 분류 번호순으로 준다. */
export async function getIndustryTree(): Promise<IndustryTreeRow[]> {
  const fn = 'industry_tree';
  const { data, error } = await db().rpc('industry_tree');
  if (error) throw new Error(`industry_tree 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  return asRows(data, fn).map((raw) => {
    const r = asRecord(raw, fn);
    return {
      sectionCode: requiredString(r, 'section_code', fn),
      // 대분류 이름은 포털 표기 그대로 (화면에서만 공백 정리, PRD 3-3)
      sectionName: requiredString(r, 'section_name', fn),
      sectionOrder: requiredNumber(r, 'section_order', fn),
      divisionCode: requiredString(r, 'division_code', fn),
      divisionName: requiredString(r, 'division_name', fn),
      divisionOrder: requiredNumber(r, 'division_order', fn),
      companyCount: requiredNumber(r, 'company_count', fn),
    };
  });
}

/**
 * 업종 카드용 시가총액 상위 회사 (FS 5-9). 중분류 코드 → rank순 회사 목록.
 * 시가총액 없는 회사는 RPC에서 빼므로 여기서 다시 거르지 않는다. 결과가 없으면 빈 Map이다.
 */
export async function getIndustryTopCompanies(
  limit: number = INDUSTRY_TOP_COMPANIES_LIMIT
): Promise<Map<string, IndustryTopCompany[]>> {
  const fn = 'industry_top_companies';
  const { data, error } = await db().rpc(fn, { p_limit: limit });
  if (error) throw new Error(`${fn} 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  const rows = asRows(data, fn).map((raw): IndustryTopCompany => {
    const r = asRecord(raw, fn);
    return {
      divisionCode: requiredString(r, 'division_code', fn),
      rank: requiredNumber(r, 'rank', fn),
      shortCode: requiredString(r, 'short_code', fn),
      name: requiredString(r, 'itms_nm', fn),
    };
  });
  return groupTopCompanies(rows);
}

/**
 * 업종 카드용 상위 회사 (FS 9-7). 5-9가 실패하면 회사 줄만 빼고 카드는 그린다.
 * 실패를 로그로 남기고 빈 결과를 돌려준다 (조용히 삼키지 않는다).
 */
export async function getIndustryTopCompaniesForCards(): Promise<Map<string, IndustryTopCompany[]>> {
  try {
    return await getIndustryTopCompanies();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('industry_top_companies 실패 (업종 카드 회사 줄 생략):', detail);
    return new Map();
  }
}

/** 중분류 이름 (ksic_classes, level division). 없으면 null → 404 (FS 9-2). */
export async function getDivisionName(division: string): Promise<string | null> {
  const { data, error } = await db()
    .from('ksic_classes')
    .select('name')
    .eq('code', division)
    .eq('level', 'division')
    .maybeSingle();
  if (error) throw new Error(`DB 조회 오류(ksic_classes): ${error.message}`);
  return data?.name ?? null;
}
