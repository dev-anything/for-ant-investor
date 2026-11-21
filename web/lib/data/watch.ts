// 추적 종목 DB 조회·등록 (FS 9-12, PRD F-12). 짧은 종목코드 → 검색 대상 확인 → 세션 클라이언트로 등록.
// 공개 데이터(검색 대상·crno)만 서버용 키로 읽고, 사용자 행(watchlist)은 세션 클라이언트 + RLS로만 다룬다.
import 'server-only';
import { db } from '@/lib/supabase/server';
import type { SessionClient } from '@/lib/supabase/session';

// PostgreSQL 오류 코드 (FS 9-12): 같은 종목이 이미 있음(PK 충돌) / 트리거 상한(20개, RAISE P0001)
const UNIQUE_VIOLATION = '23505';
const LIMIT_RAISED = 'P0001';

export interface WatchTarget {
  srtnCd: string;
  crno: string | null;
  // 외국회사는 추적할 수 없다 (PRD F-12, 404)
  isForeign: boolean;
}

export type InsertWatchResult = 'added' | 'exists' | 'limit';

/**
 * 짧은 종목코드로 검색 대상을 찾는다. 검색 대상(목록 있음·코스피/코스닥·스팩 제외)이 아니면 null.
 * 외국회사는 검색 대상에 들어 있으므로 `isForeign`으로 따로 본다. DB 오류는 던진다 (호출하는 쪽이 500).
 */
export async function findWatchTarget(code: string): Promise<WatchTarget | null> {
  const client = db();
  const { data, error } = await client
    .from('v_search_targets')
    .select('srtn_cd, is_foreign')
    .eq('short_code', code)
    .maybeSingle();
  if (error) throw error;
  if (data === null || data.srtn_cd === null) return null;

  // crno는 stocks에만 있다 (v_search_targets에는 없음)
  const { data: stock, error: stockError } = await client
    .from('stocks')
    .select('crno')
    .eq('srtn_cd', data.srtn_cd)
    .maybeSingle();
  if (stockError) throw stockError;
  return { srtnCd: data.srtn_cd, crno: stock?.crno ?? null, isForeign: data.is_foreign === true };
}

/**
 * 추적 목록에 넣는다 (세션 클라이언트, RLS로 본인 행만). 이미 있으면 'exists', 20개 상한이면 'limit'.
 * 그 밖의 DB 오류는 던진다. 로그인 뒤 자동 등록(`/auth/callback`)과 `POST /api/watchlist`가 같이 쓴다.
 */
export async function insertWatch(
  supabase: SessionClient,
  userId: string,
  target: WatchTarget,
): Promise<InsertWatchResult> {
  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: userId, srtn_cd: target.srtnCd, crno: target.crno });
  if (error === null) return 'added';
  if (error.code === UNIQUE_VIOLATION) return 'exists';
  if (error.code === LIMIT_RAISED) return 'limit';
  throw error;
}
