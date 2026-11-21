// 스크리너 결과 조회 (FS 5-2 `screener_search`, FS 8-3). DB 컬럼 snake_case는 이 파일에서 camelCase로 한 번만 바꾼다.
import { db } from '@/lib/supabase/server';
import type { ScreenerSortKey } from '@/lib/filters';
import { modeYear } from '@/lib/screener-view';
import type { ScreenerState, SortDir } from '@/lib/params';

// 연도 칸 한 개 (FS 5-2 years 원소). 화면 Y1~Y3 순서(오래된 → 최근)로 온다
export interface ScreenerYear {
  fiscalYear: number;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalEquity: number | null;
  capitalStock: number | null;
  debtRatio: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
}

// 배당 한 칸 (FS 5-2 dividends 원소)
export interface ScreenerDividend {
  fiscalYear: number;
  dpsStatus: string | null;
  dps: number | null;
}

// 결과 한 행 (FS 8-3 응답 rows). 종목 표시에 필요한 것만
export interface ScreenerRow {
  shortCode: string;
  name: string;
  market: string | null;
  accMt: string | null;
  isFinancial: boolean;
  marketCap: number | null;
  years: ScreenerYear[];
  dividends: ScreenerDividend[];
}

// 응답 본문 (FS 8-3). 결과 0이면 total 0, rows [], basDt null
export interface ScreenerResult {
  total: number;
  basDt: string | null;
  rows: ScreenerRow[];
}

// RPC 한 행의 모양 (5-2 반환 열). 적용 전이라 타입 파일에 없어 여기서 직접 정의한다
interface RpcRow {
  totalCount: number;
  shortCode: string;
  itmsNm: string;
  mrktCtg: string | null;
  accMt: string | null;
  isFinancial: boolean;
  mrktTotAmt: number | null;
  basDt: string | null;
  years: ScreenerYear[];
  dividends: ScreenerDividend[];
}

// types.ts의 Functions에 screener_search가 아직 없다 (마이그레이션 적용 전, 2026-11-21).
// 적용 뒤 Admin이 types.ts를 재생성하면 이 좁은 타입과 아래 단언을 지우고 db().rpc를 그대로 쓴다.
interface ScreenerRpcClient {
  rpc(
    fn: 'screener_search',
    args: {
      p_filters: number[];
      p_sort: ScreenerSortKey;
      p_dir: SortDir;
      p_page: number;
      p_size: number;
    }
  ): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;
}

function numberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function stringOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

// JSON 객체인지 확인한 뒤 키로 읽는다 (any 없이, 모르는 값은 unknown으로만 다룬다)
function asRecord(v: unknown): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error('screener_search 응답 모양이 다르다 (객체가 아님)');
  }
  // 위에서 객체인지 확인했다. 키 접근만 하므로 Record로 읽는다
  return v as Record<string, unknown>;
}

function asArray(v: unknown): unknown[] {
  if (!Array.isArray(v)) throw new Error('screener_search 응답 모양이 다르다 (배열이 아님)');
  return v;
}

function fiscalYearOf(r: Record<string, unknown>): number {
  if (typeof r.fiscal_year !== 'number') throw new Error('screener_search 응답 모양이 다르다 (fiscal_year)');
  return r.fiscal_year;
}

function mapYear(raw: unknown): ScreenerYear {
  const r = asRecord(raw);
  return {
    fiscalYear: fiscalYearOf(r),
    revenue: numberOrNull(r.revenue),
    operatingIncome: numberOrNull(r.operating_income),
    netIncome: numberOrNull(r.net_income),
    totalAssets: numberOrNull(r.total_assets),
    totalEquity: numberOrNull(r.total_equity),
    capitalStock: numberOrNull(r.capital_stock),
    debtRatio: numberOrNull(r.debt_ratio),
    operatingMargin: numberOrNull(r.operating_margin),
    revenueGrowth: numberOrNull(r.revenue_growth),
  };
}

function mapDividend(raw: unknown): ScreenerDividend {
  const r = asRecord(raw);
  return {
    fiscalYear: fiscalYearOf(r),
    dpsStatus: stringOrNull(r.dps_status),
    dps: numberOrNull(r.dps),
  };
}

// RPC 응답 한 행을 검사하고 camelCase로 바꾼다. 필수 열이 어긋나면 throw (route가 500)
function mapRpcRow(raw: unknown): RpcRow {
  const r = asRecord(raw);
  if (typeof r.total_count !== 'number' || typeof r.short_code !== 'string' || typeof r.itms_nm !== 'string') {
    throw new Error('screener_search 응답 모양이 다르다 (필수 열)');
  }
  if (typeof r.is_financial !== 'boolean') {
    throw new Error('screener_search 응답 모양이 다르다 (is_financial)');
  }
  return {
    totalCount: r.total_count,
    shortCode: r.short_code,
    itmsNm: r.itms_nm,
    mrktCtg: stringOrNull(r.mrkt_ctg),
    accMt: stringOrNull(r.acc_mt),
    isFinancial: r.is_financial,
    mrktTotAmt: numberOrNull(r.mrkt_tot_amt),
    basDt: stringOrNull(r.bas_dt),
    years: asArray(r.years).map(mapYear),
    dividends: asArray(r.dividends).map(mapDividend),
  };
}

// 연결 클라이언트를 좁은 타입으로 본다 (위 ScreenerRpcClient 주석 참고)
function screenerClient(): ScreenerRpcClient {
  // 이유: Database 타입에 screener_search 함수가 없어 db().rpc가 이름을 거부한다.
  // 실제 객체는 같은 supabase 클라이언트다.
  return db() as unknown as ScreenerRpcClient;
}

/**
 * 스크리너 결과 한 페이지를 가져온다 (FS 8-3). 호출 전에 parseScreenerApiParams로 검증된 상태만 넘긴다.
 * 범위를 넘은 페이지는 0행이다 (FS 5-2: total_count도 없음 → 앱이 마지막 페이지로 다시 요청).
 * DB 오류는 throw한다 (route가 500).
 */
export async function getScreenerResult(state: ScreenerState): Promise<ScreenerResult> {
  const { data, error } = await screenerClient().rpc('screener_search', {
    p_filters: state.filters,
    p_sort: state.sort,
    p_dir: state.dir,
    p_page: state.page,
    p_size: state.size,
  });
  if (error) {
    // 로그에는 PostgREST 코드·메시지만 (FS 4-2). 키·요청 URL은 여기 없다
    throw new Error(`screener_search 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  }

  const rows = asArray(data).map(mapRpcRow);
  if (rows.length === 0) return { total: 0, basDt: null, rows: [] };

  return {
    total: rows[0].totalCount,
    basDt: rows.find((r) => r.basDt !== null)?.basDt ?? null,
    rows: rows.map((r) => ({
      shortCode: r.shortCode,
      name: r.itmsNm,
      market: r.mrktCtg,
      accMt: r.accMt,
      isFinancial: r.isFinancial,
      marketCap: r.mrktTotAmt,
      years: r.years,
      dividends: r.dividends,
    })),
  };
}

// PostgREST는 한 번에 최대 1000행만 준다 (Supabase 기본). 기준 연도 계산은 전부 읽어야 하니 나눠서 받는다
const REFERENCE_PAGE_SIZE = 1000;

/**
 * 기준 연도 (PRD 10장 9번): company_summary.latest_year 가운데 가장 많은 값. 행이 없으면 null.
 * 툴팁의 {Y1}~{Y3}과 근거 값 열 제목에 쓴다.
 */
export async function getReferenceYear(): Promise<number | null> {
  const years: number[] = [];
  for (let from = 0; ; from += REFERENCE_PAGE_SIZE) {
    const { data, error } = await db()
      .from('company_summary')
      .select('corp_code,latest_year')
      .order('corp_code', { ascending: true })
      .range(from, from + REFERENCE_PAGE_SIZE - 1);
    if (error) throw new Error(`DB 조회 오류(company_summary.latest_year): ${error.message}`);
    for (const row of data ?? []) years.push(row.latest_year);
    if ((data ?? []).length < REFERENCE_PAGE_SIZE) break;
  }
  return modeYear(years);
}
