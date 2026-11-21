// 종목 화면 조회 (FS 4-1, MVP 1·2·3번). 2차 추가 조회(주가·업종·배당)는 해당 단계에서 붙인다.
// DB 컬럼 snake_case는 이 파일에서 camelCase로 한 번만 바꾼다 (TypeScript 규칙 C1).
import { db } from '@/lib/supabase/server';
import type { Insight } from '@/lib/insights';

export type StockStatus = 'ok' | 'no_financials' | 'foreign';

// PRD 4장 F-05: 자본잠식 상태 (배치가 저장한 값 그대로)
export type CapitalImpairment = 'none' | 'partial' | 'full' | 'unknown';

export interface StockInfo {
  srtnCd: string;
  shortCode: string;
  name: string;
  market: string;
  isForeign: boolean;
  divisionCode: string | null;
  divisionName: string | null;
  // 결산월 원본 (예: '03'). 12월 결산 표시는 formatAccMt가 맡는다
  accMt: string | null;
}

export interface StockSummary {
  fsDiv: string;
  years: number[];
  latestYear: number;
  isFinancial: boolean;
  capitalImpairment: CapitalImpairment;
  insights: Insight[];
}

// 연도별 한 행 (v_company_years). 저장된 연도 전부, 화면은 isDisplayYear만 쓴다
export interface YearRow {
  fiscalYear: number;
  fsDiv: string;
  isDisplayYear: boolean;
  isLatest: boolean;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  capitalStock: number | null;
  debtRatio: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
}

export interface StockPage {
  stock: StockInfo;
  status: StockStatus;
  summary: StockSummary | null;
  years: YearRow[];
}

/**
 * 종목 화면에 필요한 값을 한 번에 가져온다. 없는 종목이면 null (호출한 쪽이 404 처리).
 * 외국회사는 재무를 조회하지 않는다. 조회 오류는 throw해서 error.tsx가 오류 화면을 보여준다.
 */
export async function getStockPage(shortCode: string): Promise<StockPage | null> {
  const code = shortCode.toUpperCase();
  const lookup = await findStock(code);
  if (!lookup) return null;
  const { info: stock, corpCode } = lookup;

  if (stock.isForeign) {
    return { stock, status: 'foreign', summary: null, years: [] };
  }
  // corp_code가 없으면 재무 조회 자체를 건너뛴다 (FS 4-1 2번)
  if (corpCode === null) {
    return { stock, status: 'no_financials', summary: null, years: [] };
  }

  const [summary, years] = await Promise.all([findSummary(corpCode), findYears(corpCode)]);
  if (!summary) {
    return { stock, status: 'no_financials', summary: null, years: [] };
  }
  return { stock, status: 'ok', summary, years };
}

// corp_code는 재무 조회용이라 화면으로 넘기는 StockInfo에는 넣지 않는다
type StockLookup = { info: StockInfo; corpCode: string | null };

async function findStock(code: string): Promise<StockLookup | null> {
  const { data, error } = await db()
    .from('v_search_targets')
    .select('srtn_cd,short_code,itms_nm,mrkt_ctg,is_foreign,corp_code,division_code,division_name,acc_mt')
    .eq('short_code', code)
    .maybeSingle();
  if (error) throw new Error(`DB 조회 오류(v_search_targets): ${error.message}`);
  if (!data) return null;

  return {
    info: {
      srtnCd: required(data.srtn_cd, 'srtn_cd'),
      shortCode: required(data.short_code, 'short_code'),
      name: required(data.itms_nm, 'itms_nm'),
      market: required(data.mrkt_ctg, 'mrkt_ctg'),
      // is_foreign은 generated 열이라 null이 올 수 없다. 혹시 null이면 국내 회사로 본다 (화면에서 "지원하지 않음" 아님)
      isForeign: data.is_foreign === true,
      divisionCode: data.division_code,
      divisionName: data.division_name,
      accMt: data.acc_mt,
    },
    corpCode: data.corp_code,
  };
}

// PRD 3-6, 3-7: company_summary 행이 없으면 재무 없음 (null)
async function findSummary(corpCode: string): Promise<StockSummary | null> {
  const { data, error } = await db()
    .from('company_summary')
    .select('fs_div,years,latest_year,is_financial,capital_impairment,insights')
    .eq('corp_code', corpCode)
    .maybeSingle();
  if (error) throw new Error(`DB 조회 오류(company_summary): ${error.message}`);
  if (!data) return null;

  return {
    fsDiv: data.fs_div,
    years: data.years,
    latestYear: data.latest_year,
    isFinancial: data.is_financial,
    capitalImpairment: toCapitalImpairment(data.capital_impairment),
    insights: toInsights(data.insights),
  };
}

async function findYears(corpCode: string): Promise<YearRow[]> {
  const { data, error } = await db()
    .from('v_company_years')
    .select(
      'fiscal_year,fs_div,is_display_year,is_latest,revenue,operating_income,net_income,total_assets,total_liabilities,total_equity,capital_stock,debt_ratio,operating_margin,revenue_growth'
    )
    .eq('corp_code', corpCode)
    .order('fiscal_year', { ascending: true });
  if (error) throw new Error(`DB 조회 오류(v_company_years): ${error.message}`);

  return (data ?? []).map((row) => ({
    fiscalYear: required(row.fiscal_year, 'fiscal_year'),
    fsDiv: required(row.fs_div, 'fs_div'),
    isDisplayYear: row.is_display_year === true,
    isLatest: row.is_latest === true,
    revenue: row.revenue,
    operatingIncome: row.operating_income,
    netIncome: row.net_income,
    totalAssets: row.total_assets,
    totalLiabilities: row.total_liabilities,
    totalEquity: row.total_equity,
    capitalStock: row.capital_stock,
    debtRatio: row.debt_ratio,
    operatingMargin: row.operating_margin,
    revenueGrowth: row.revenue_growth,
  }));
}

// 필수 DB 값이 비어 있으면 throw. 값 자체는 메시지에 넣지 않는다 (컬럼 이름만)
function required<T>(value: T | null, column: string): T {
  if (value === null || value === undefined) {
    throw new Error(`DB 값 누락: ${column}`);
  }
  return value;
}

// DB check 제약(none·partial·full·unknown)과 맞춤. 모르는 값은 unknown으로 둔다
function toCapitalImpairment(value: string): CapitalImpairment {
  if (value === 'none' || value === 'partial' || value === 'full') return value;
  return 'unknown';
}

// insights jsonb 배열을 모양 확인하며 읽는다. id가 숫자가 아니면 건너뛴다 (화면을 깨지 않게)
function toInsights(value: unknown): Insight[] {
  if (!Array.isArray(value)) return [];
  const result: Insight[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    // JSON 객체라는 것을 위에서 확인했다. 필드는 아래에서 타입을 하나씩 검사한다
    const obj = item as Record<string, unknown>;
    if (typeof obj.id !== 'number') continue;
    result.push({
      id: obj.id,
      year: numberOrNull(obj.year),
      n: numberOrNull(obj.n),
      prev: numberOrNull(obj.prev),
      curr: numberOrNull(obj.curr),
    });
  }
  return result;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
