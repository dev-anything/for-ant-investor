// POST /api/chat — 조건 찾기 챗봇 (FS 9-9, 4-2, PRD 4장 F-10). 키가 없거나 한도를 넘으면 unavailable로 답한다.
import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/auth';
import { parseChatRequest } from '@/lib/chat';
import { askChat } from '@/lib/data/chat';

// FS 9-9: 챗봇 응답은 캐시하지 않는다 (같은 문장의 AI 결과 캐시는 lib/data/chat.ts가 맡는다)
const NO_STORE = 'no-store';

export async function POST(request: Request) {
  // FS 4-2: 다른 사이트에서 온 POST는 거부한다 (Host와 Origin 호스트 비교)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!isSameOrigin(origin, host)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'Cache-Control': NO_STORE } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // JSON이 아닌 본문은 잘못된 입력이다 (FS 4-2)
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: { 'Cache-Control': NO_STORE } });
  }

  const text = parseChatRequest(body);
  if (text === null) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: { 'Cache-Control': NO_STORE } });
  }

  // askChat은 실패를 던지지 않는다 (unavailable로 돌려준다)
  const result = await askChat(text);
  return NextResponse.json(result, { headers: { 'Cache-Control': NO_STORE } });
}
