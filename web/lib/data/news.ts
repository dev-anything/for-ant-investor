// 경제 기사 조회 (FS 9-6, PRD 4장 F-18). DB에 저장하지 않고 화면을 열 때 네이버 검색 API(NAVER API HUB)를 부른다.
// 네이버 약관: 저장 금지(함수 단위 캐시만), 결과 가공 금지(변환만), AI 입력 금지 (이 파일은 chat에서 import하지 않는다).
import 'server-only';
import { unstable_cache } from 'next/cache';
import {
  buildStockNewsQuery,
  NEWS_PAGE_SIZE,
  parseNaverNewsResponse,
  type NaverNewsPage,
  type NewsResult,
  NewsShapeError,
} from '@/lib/news-text';

// PRD 5-8: 주소·헤더는 NAVER API HUB 문서 그대로
const NAVER_NEWS_URL = 'https://naverapihub.apigw.ntruss.com/search/v1/news';
// PRD 5-8·FS 9-6: 한 번 호출이 이 시간을 넘으면 실패로 본다
const NAVER_TIMEOUT_MS = 5000;

// FS 3-3: 첫 화면·/news 30분, 종목 기사 1시간 (초 단위)
const SHORT_CACHE_SECONDS = 1800;
const STOCK_CACHE_SECONDS = 3600;

// PRD 10장 28번: 일반 경제 검색어. 초안(`경제 정책`·`기업 실적`) 중 표본 검증 전 임시 값 (PRD 11장 17번). 검증 뒤 이 상수만 바꾼다
const HOME_NEWS_QUERY = '경제 정책';
// PRD 4장 F-18: 첫 화면·종목 화면 각 5개
const HOME_NEWS_COUNT = 5;
const STOCK_NEWS_COUNT = 5;

type NewsQuery = {
  query: string;
  display: number;
  start: number;
  sort: 'date' | 'sim';
};

// 로그에 남길 수 있는 HTTP 오류 (메시지는 상태 코드뿐이라 키·URL이 없다)
class NaverHttpError extends Error {
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.name = 'NaverHttpError';
  }
}

// 키 두 개를 모두 읽는다. 하나라도 없으면 null (호출하지 않는다, FS 3-1)
function readCredentials(): { id: string; key: string } | null {
  const id = process.env.NAVER_API_HUB_KEY_ID;
  const key = process.env.NAVER_API_HUB_KEY;
  if (!id || !key) return null;
  return { id, key };
}

/**
 * 네이버 뉴스 검색 한 번. 상태가 200이 아니거나 모양이 틀리면 throw.
 * 성공한 결과만 캐시된다 (FS 3-3): throw한 결과는 저장되지 않아 다음 요청에서 다시 부른다.
 * 요청 URL·키는 로그에 남기지 않는다.
 */
async function fetchNews(params: NewsQuery): Promise<NaverNewsPage> {
  const credentials = readCredentials();
  if (!credentials) throw new Error('NAVER_API_HUB 키 없음');

  const search = new URLSearchParams({
    query: params.query,
    display: String(params.display),
    start: String(params.start),
    sort: params.sort,
  });
  const res = await fetch(`${NAVER_NEWS_URL}?${search.toString()}`, {
    cache: 'no-store',
    headers: {
      'X-NCP-APIGW-API-KEY-ID': credentials.id,
      'X-NCP-APIGW-API-KEY': credentials.key,
    },
    signal: AbortSignal.timeout(NAVER_TIMEOUT_MS),
  });
  if (!res.ok) throw new NaverHttpError(res.status);
  const body: unknown = await res.json();
  return parseNaverNewsResponse(body);
}

// FS 3-3: 함수 단위 캐시. 검색어·개수·시작 위치가 캐시 키에 들어가 자동으로 나뉜다
const cachedShortNews = unstable_cache(fetchNews, ['naver-news-short'], {
  revalidate: SHORT_CACHE_SECONDS,
});
const cachedStockNews = unstable_cache(fetchNews, ['naver-news-stock'], {
  revalidate: STOCK_CACHE_SECONDS,
});

// 바깥 함수: 실패를 던지지 않고 `{ status: 'error' }`로 바꾼다 (기사 칸만 실패 문구, PRD 4장 F-18)
async function loadNews(
  run: (params: NewsQuery) => Promise<NaverNewsPage>,
  params: NewsQuery,
): Promise<NewsResult> {
  if (!readCredentials()) {
    // 변수 이름만 적는다 (값 금지)
    console.error('[기사] NAVER_API_HUB_KEY_ID·NAVER_API_HUB_KEY가 없어 기사를 부르지 않아');
    return { status: 'error' };
  }
  try {
    const page = await run(params);
    return { status: 'ok', items: page.items, total: page.total };
  } catch (error) {
    console.error('[기사] 기사를 불러오지 못했어:', failureCodeOf(error));
    return { status: 'error' };
  }
}

// 로그용 짧은 이름. 우리가 만든 오류(상태 코드·필드 이름)만 메시지를 쓰고, 그 밖은 종류 이름만 쓴다
function failureCodeOf(error: unknown): string {
  if (error instanceof NaverHttpError || error instanceof NewsShapeError) return error.message;
  return error instanceof Error ? error.name : 'unknown';
}

/** 첫 화면 경제 기사 5개 (PRD 4장 F-18). 쪽 번호 없음 */
export function getHomeNews(): Promise<NewsResult> {
  return loadNews(cachedShortNews, {
    query: HOME_NEWS_QUERY,
    display: HOME_NEWS_COUNT,
    start: 1,
    sort: 'date',
  });
}

/** `/news` 한 쪽 (10개). 네이버 `start`는 1부터라 쪽 번호로 계산한다 (PRD 10장 29번). page는 parseNewsPage로 거른 값 */
export function getNewsPage(page: number): Promise<NewsResult> {
  return loadNews(cachedShortNews, {
    query: HOME_NEWS_QUERY,
    display: NEWS_PAGE_SIZE,
    start: (page - 1) * NEWS_PAGE_SIZE + 1,
    sort: 'date',
  });
}

/** 종목 화면 회사 기사 5개 (`{종목명} {종목코드}` 검색, 정확도순(sim), PRD 4장 F-18, 2026-11-28 DESIGN-V2 2-5 비교 결과) */
export function getStockNews(name: string, shortCode: string): Promise<NewsResult> {
  return loadNews(cachedStockNews, {
    query: buildStockNewsQuery(name, shortCode),
    display: STOCK_NEWS_COUNT,
    start: 1,
    sort: 'sim',
  });
}
