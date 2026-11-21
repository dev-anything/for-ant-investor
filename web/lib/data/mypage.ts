// 마이페이지 조회 (FS 9-12, PRD F-12). DB 컬럼 snake_case는 여기서 camelCase로 한 번만 바꾼다 (TypeScript 규칙 C1).
// 사용자 행(watchlist·user_settings)은 세션 클라이언트 + RLS로만 읽고, 공개 데이터(stocks·company_summary·v_company_years)만 서버용 키로 읽는다.
import 'server-only';
import { db } from '@/lib/supabase/server';
import type { SessionClient } from '@/lib/supabase/session';
import {
  toCapitalImpairment,
  toInsights,
  toYearRow,
  YEAR_COLUMNS,
  type CapitalImpairment,
  type YearRow,
} from '@/lib/data/stock';
import type { Insight } from '@/lib/insights';

// 추적 카드 한 장에 필요한 재무 요약 (company_summary 중 카드가 읽는 열)
export interface WatchSummary {
  capitalImpairment: CapitalImpairment;
  isFinancial: boolean;
  insights: Insight[];
}

export interface WatchEntry {
  srtnCd: string;
  // 종목 화면 주소의 짧은 코드. 목록에서 빠진 종목도 코드는 남긴다
  shortCode: string | null;
  name: string;
  market: string | null;
  // KRX 목록에 있는지 (PRD F-12 "목록에서 빠짐"). 빠진 종목은 종목 화면이 404라 카드에 링크를 두지 않는다
  isListed: boolean;
  // 재무 요약이 없으면 null (카드가 "재무 데이터 없음")
  summary: WatchSummary | null;
  // 저장된 연도 전부 (전년 값 계산용). 화면 연도 선택은 lib/chart-data가 한다
  years: YearRow[];
}

export interface MypageData {
  // watchlist 최근 등록순 (PRD F-12)
  watches: WatchEntry[];
  // 알림 메일 수신 설정. 설정 행이 없으면 꺼짐 (PRD F-12 기본 꺼짐)
  emailOptIn: boolean;
}

// 조회 대상 행 (watchlist에서 읽는 열)
interface WatchRow {
  srtnCd: string;
}

// 조회 순서 (FS 9-12): 사용자 행 ①⑤ 병렬 → 공개 종목 ② → 재무 ③ (②의 corp_code 필요)
export async function getMypage(supabase: SessionClient): Promise<MypageData> {
  const [watchRows, emailOptIn] = await Promise.all([findWatchRows(supabase), findEmailOptIn(supabase)]);
  if (watchRows.length === 0) return { watches: [], emailOptIn };

  const stocks = await findStocks(watchRows.map((row) => row.srtnCd));
  const corpCodes = uniqueCorpCodes(stocks);
  const [summaries, yearsByCorp] = await Promise.all([findSummaries(corpCodes), findYearsByCorp(corpCodes)]);

  const watches = watchRows.map((row): WatchEntry => {
    const stock = stocks.get(row.srtnCd);
    // watchlist.srtn_cd는 stocks를 참조하므로 보통 없을 수 없다. 그래도 화면이 깨지지 않게 "목록에서 빠짐"으로 본다
    if (stock === undefined) {
      return { srtnCd: row.srtnCd, shortCode: null, name: row.srtnCd, market: null, isListed: false, summary: null, years: [] };
    }
    const corpCode = stock.corpCode;
    return {
      srtnCd: row.srtnCd,
      shortCode: stock.shortCode,
      name: stock.name,
      market: stock.market,
      isListed: stock.isListed,
      summary: corpCode === null ? null : (summaries.get(corpCode) ?? null),
      years: corpCode === null ? [] : (yearsByCorp.get(corpCode) ?? []),
    };
  });
  return { watches, emailOptIn };
}

// ① 추적 목록 (세션, RLS로 본인 행만). 최근 등록순
async function findWatchRows(supabase: SessionClient): Promise<WatchRow[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('srtn_cd')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`DB 조회 오류(watchlist): ${error.message}`);
  return (data ?? []).map((row) => ({ srtnCd: row.srtn_cd }));
}

// ⑤ 알림 메일 설정 (세션). 행이 없으면 꺼짐
async function findEmailOptIn(supabase: SessionClient): Promise<boolean> {
  const { data, error } = await supabase.from('user_settings').select('email_opt_in').maybeSingle();
  if (error) throw new Error(`DB 조회 오류(user_settings): ${error.message}`);
  return data?.email_opt_in === true;
}

// 종목 정보 (서버용 키, 공개 데이터). 키는 srtn_cd
interface StockCard {
  shortCode: string;
  name: string;
  market: string;
  isListed: boolean;
  corpCode: string | null;
}

// ② stocks 조회 (서버용 키). 추적 종목 코드 목록으로 한 번에 받는다
async function findStocks(srtnCds: string[]): Promise<Map<string, StockCard>> {
  const { data, error } = await db()
    .from('stocks')
    .select('srtn_cd,short_code,itms_nm,mrkt_ctg,is_listed,corp_code')
    .in('srtn_cd', srtnCds);
  if (error) throw new Error(`DB 조회 오류(stocks): ${error.message}`);

  const map = new Map<string, StockCard>();
  for (const row of data ?? []) {
    map.set(row.srtn_cd, {
      shortCode: row.short_code,
      name: row.itms_nm,
      market: row.mrkt_ctg,
      isListed: row.is_listed,
      corpCode: row.corp_code,
    });
  }
  return map;
}

// 재무가 있을 수 있는 회사 고유번호 (중복 제거, 없으면 빈 배열)
function uniqueCorpCodes(stocks: Map<string, StockCard>): string[] {
  const codes = new Set<string>();
  for (const stock of stocks.values()) {
    if (stock.corpCode !== null) codes.add(stock.corpCode);
  }
  return [...codes];
}

// ③ company_summary (서버용 키). 재무 요약이 없는 회사는 맵에 없다
async function findSummaries(corpCodes: string[]): Promise<Map<string, WatchSummary>> {
  const map = new Map<string, WatchSummary>();
  if (corpCodes.length === 0) return map;

  const { data, error } = await db()
    .from('company_summary')
    .select('corp_code,capital_impairment,is_financial,insights')
    .in('corp_code', corpCodes);
  if (error) throw new Error(`DB 조회 오류(company_summary): ${error.message}`);

  for (const row of data ?? []) {
    map.set(row.corp_code, {
      capitalImpairment: toCapitalImpairment(row.capital_impairment),
      isFinancial: row.is_financial,
      insights: toInsights(row.insights),
    });
  }
  return map;
}

// ③ v_company_years (서버용 키). 회사 고유번호별로 묶는다
async function findYearsByCorp(corpCodes: string[]): Promise<Map<string, YearRow[]>> {
  const map = new Map<string, YearRow[]>();
  if (corpCodes.length === 0) return map;

  const { data, error } = await db()
    .from('v_company_years')
    .select(`corp_code,${YEAR_COLUMNS}`)
    .in('corp_code', corpCodes)
    .order('fiscal_year', { ascending: true });
  if (error) throw new Error(`DB 조회 오류(v_company_years): ${error.message}`);

  for (const row of data ?? []) {
    // corp_code가 비면 묶을 곳이 없어 건너뛴다 (뷰 행은 보통 회사가 있다)
    if (row.corp_code === null) continue;
    const list = map.get(row.corp_code) ?? [];
    list.push(toYearRow(row));
    map.set(row.corp_code, list);
  }
  return map;
}
