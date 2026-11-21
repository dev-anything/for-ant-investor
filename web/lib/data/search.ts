// 종목 검색 조회 (FS 5-1 `search_stocks`, FS 8-1). DB 컬럼 snake_case는 이 파일에서 camelCase로 한 번만 바꾼다.
import 'server-only';
import { db } from '@/lib/supabase/server';
import { SEARCH_RESULT_LIMIT } from '@/lib/params';

// 연관검색어 한 줄 (FS 8-1 응답 items)
export interface SearchItem {
  shortCode: string;
  name: string;
  market: string | null;
  isForeign: boolean;
}

export interface SearchResult {
  items: SearchItem[];
}

// 위에서 객체인지 확인한 뒤 키로 읽는다 (any 없이)
function asRecord(v: unknown): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Error('search_stocks 응답 모양이 다르다 (객체가 아님)');
  }
  // 위에서 객체인지 확인했다. 키 접근만 하므로 Record로 읽는다
  return v as Record<string, unknown>;
}

// RPC 한 행을 검사하고 camelCase로 바꾼다. 필수 열이 어긋나면 throw (route가 500)
function mapRow(raw: unknown): SearchItem {
  const r = asRecord(raw);
  if (typeof r.short_code !== 'string' || typeof r.itms_nm !== 'string' || typeof r.is_foreign !== 'boolean') {
    throw new Error('search_stocks 응답 모양이 다르다 (필수 열)');
  }
  return {
    shortCode: r.short_code,
    name: r.itms_nm,
    market: typeof r.mrkt_ctg === 'string' ? r.mrkt_ctg : null,
    isForeign: r.is_foreign,
  };
}

/**
 * 검색어로 연관검색어를 가져온다 (최대 10개, 정렬은 DB가 한다: 완전 일치 → 앞부분 → 중간 포함).
 * 호출 전에 parseSearchQuery로 검증된 검색어만 넘긴다. DB 오류는 throw한다 (route가 500).
 */
export async function getSearchItems(q: string): Promise<SearchResult> {
  const { data, error } = await db().rpc('search_stocks', {
    p_q: q,
    p_limit: SEARCH_RESULT_LIMIT,
  });
  if (error) {
    // 로그에는 PostgREST 코드·메시지만 (FS 4-2). 검색어 원문·키는 남기지 않는다
    throw new Error(`search_stocks 실패: ${error.code ?? '코드 없음'} ${error.message}`);
  }
  if (!Array.isArray(data)) throw new Error('search_stocks 응답 모양이 다르다 (배열이 아님)');
  return { items: data.map(mapRow) };
}
