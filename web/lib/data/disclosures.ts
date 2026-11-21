// 최근 공시 조회 (FS 9-5, PRD 4장 F-17). DB에 저장하지 않고 화면을 열 때 DART를 부른다.
import 'server-only';
import { unstable_cache } from 'next/cache';
import {
  DART_PAGE_COUNT,
  DISCLOSURE_COUNT,
  DartStatusError,
  dartDateRange,
  OWNERSHIP_PBLNTF_TYPE,
  excludeOwnershipDisclosures,
  ownershipCoverageFrom,
  parseDartList,
  takeRecent,
  type DartListPage,
  type DisclosureRow,
} from '@/lib/disclosure';

export type DisclosureResult = { status: 'ok'; items: DisclosureRow[] } | { status: 'error' };

const DART_BASE = 'https://opendart.fss.or.kr/api/list.json';
// PRD 5-8·FS 9-5: 한 번 호출이 이 시간을 넘으면 실패로 본다
const DART_TIMEOUT_MS = 5000;

/**
 * DART 공시 목록 두 번 (전체 최신순, 지분공시만). 상태가 000·013이 아니거나 모양이 틀리면 throw.
 * 성공한 결과만 캐시된다 (FS 3-3): throw한 결과는 저장되지 않아 다음 요청에서 다시 부른다.
 * 요청 URL·키는 로그에 남기지 않는다 (호출하는 쪽도 오류 이름만 남긴다).
 */
async function fetchDisclosureLists(
  corpCode: string,
): Promise<{ all: DartListPage; ownership: DartListPage }> {
  const key = process.env.DART_OPENAPI_KEY;
  if (!key) throw new Error('DART_OPENAPI_KEY 없음');

  const { bgnDe, endDe } = dartDateRange(new Date());
  const common = new URLSearchParams({
    crtfc_key: key,
    corp_code: corpCode,
    bgn_de: bgnDe,
    end_de: endDe,
    sort: 'date',
    sort_mth: 'desc',
    page_count: String(DART_PAGE_COUNT),
  });
  const ownershipParams = new URLSearchParams(common);
  ownershipParams.set('pblntf_ty', OWNERSHIP_PBLNTF_TYPE);

  const [all, ownership] = await Promise.all([
    callDart(common),
    callDart(ownershipParams),
  ]);
  return { all, ownership };
}

async function callDart(params: URLSearchParams): Promise<DartListPage> {
  const res = await fetch(`${DART_BASE}?${params.toString()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(DART_TIMEOUT_MS),
  });
  // HTTP 상태만 기록한다 (URL에는 키가 있다)
  if (!res.ok) throw new DartStatusError(`HTTP ${res.status}`);
  return parseDartList((await res.json()) as unknown);
}

// FS 3-3: 함수 단위 캐시 1시간. 키는 인자(corp_code)로 자동 구분된다
const cachedDisclosureLists = unstable_cache(fetchDisclosureLists, ['disclosure-lists'], {
  revalidate: 3600,
});

/**
 * 종목의 최근 공시 5개 (지분공시 제외, 최신순).
 * corpCode가 없으면 DART를 부르지 않고 0건. 실패하면 던지지 않고 `{ status: 'error' }` (PRD 10장 22번).
 */
export async function getRecentDisclosures(corpCode: string | null): Promise<DisclosureResult> {
  if (corpCode === null) return { status: 'ok', items: [] };
  try {
    const { all, ownership } = await cachedDisclosureLists(corpCode);
    const ownershipSet = new Set(ownership.rows.map((row) => row.rceptNo));
    const kept = excludeOwnershipDisclosures(all.rows, ownershipSet, ownershipCoverageFrom(ownership));
    return { status: 'ok', items: takeRecent(kept, DISCLOSURE_COUNT) };
  } catch (error) {
    // 메시지는 이 파일이 만든 것(상태 코드·필드 이름)이나 네트워크 오류 문구라 키·URL이 없다
    console.error('[공시] 최근 공시를 불러오지 못했어:', failureCodeOf(error));
    return { status: 'error' };
  }
}

// 로그에는 상태 코드만 남긴다 (FS 3-3). 그 밖의 오류는 종류 이름만 쓴다 (메시지에 URL·키가 섞일 수 있어서)
function failureCodeOf(error: unknown): string {
  if (error instanceof DartStatusError) return error.message;
  return error instanceof Error ? error.name : 'unknown';
}
