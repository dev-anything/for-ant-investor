// GET /api/search?q= — 종목 연관검색어 (FS 8-1, 4-2). 입력할 때마다 SearchBox가 부른다.
import { NextResponse } from 'next/server';
import { getSearchItems } from '@/lib/data/search';
import { parseSearchQuery } from '@/lib/params';

// FS 3-3: 응답 캐시 헤더 (성공 응답에만 붙인다)
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(request: Request) {
  const q = parseSearchQuery(new URL(request.url).searchParams.get('q'));
  if (q === null) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  try {
    const result = await getSearchItems(q);
    return NextResponse.json(result, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (error) {
    // FS 4-2: 로그에는 DB 오류 코드·메시지만 남긴다
    console.error(error instanceof Error ? error.message : 'search 알 수 없는 오류');
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
