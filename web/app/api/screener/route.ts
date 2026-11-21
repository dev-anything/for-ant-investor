// GET /api/screener — 스크리너 결과 (FS 8-3, 4-2). 브라우저에서 필터·정렬·페이지가 바뀔 때 부른다.
import { NextResponse } from 'next/server';
import { getScreenerResult } from '@/lib/data/screener';
import { parseScreenerApiParams, rawParamsFromSearch } from '@/lib/params';

// FS 3-3: 응답 캐시 헤더 (성공 응답에만 붙인다. 잘못된 요청·오류는 캐시하지 않는다)
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(request: Request) {
  const raw = rawParamsFromSearch(new URL(request.url).searchParams);
  // API는 바로잡지 않는다. 어긋나면 400 (FS 4-2)
  const state = parseScreenerApiParams(raw);
  if (state === null) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  try {
    const result = await getScreenerResult(state);
    return NextResponse.json(result, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (error) {
    // FS 4-2: 로그에는 DB 오류 코드·메시지만 남기고 요청 URL·키는 남기지 않는다
    console.error(error instanceof Error ? error.message : 'screener 알 수 없는 오류');
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
