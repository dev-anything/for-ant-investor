// 조건 찾기 챗봇 조회 (FS 9-9, 3-3, PRD 4장 F-10). 사용자 문장을 OpenRouter에 보내 필터 ID만 받는다.
// 이 파일은 기사 데이터를 다루지 않는다 (PRD F-18: AI 입력 금지, chat-isolation.test.ts가 import를 확인한다).
import 'server-only';
import { unstable_cache } from 'next/cache';
import {
  CHAT_DAILY_LIMIT,
  CHAT_MODEL,
  applyChatRules,
  buildSystemPrompt,
  normalizeChatInput,
  parseChatOutput,
  type ChatApiResponse,
  type ChatOutput,
} from '@/lib/chat';
import { db } from '@/lib/supabase/server';

// PRD 5-7·OpenRouter 공식 문서(chat/completions 주소·Bearer 인증 확인). 문서에 맞춰 한 곳에만 둔다
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// FS 6-10: AI 호출 제한 시간 5초
const OPENROUTER_TIMEOUT_MS = 5000;
// FS 3-3: 같은 문장은 하루 동안 AI 결과를 재사용한다
const CHAT_CACHE_SECONDS = 86400;

// 꺼짐·실패의 원인 (로그에는 이 종류만 남긴다. 문장·응답 원문 금지, FS 9-9)
type ChatFailureKind = 'nokey' | 'nomodel' | 'limit' | 'timeout' | 'error';

class ChatFailure extends Error {
  constructor(readonly kind: ChatFailureKind) {
    super(kind);
    this.name = 'ChatFailure';
  }
}

// 하루 호출 수 확인: AI를 부르기 전에 센다 (FS 9-9). 상한을 넘으면 false
async function takeDailyUsage(): Promise<boolean> {
  const { data, error } = await db().rpc('chat_usage_take', { p_limit: CHAT_DAILY_LIMIT });
  // DB 오류는 AI를 부르지 않고 실패로 본다 (상한을 확인할 수 없으니 안전하게)
  if (error) throw new ChatFailure('error');
  return data === true;
}

// OpenRouter 응답에서 메시지 본문 문자열만 꺼낸다. 모양이 다르면 null
function contentOf(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('choices' in body)) return null;
  const { choices } = body;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first: unknown = choices[0];
  if (typeof first !== 'object' || first === null || !('message' in first)) return null;
  const { message } = first;
  if (typeof message !== 'object' || message === null || !('content' in message)) return null;
  return typeof message.content === 'string' ? message.content : null;
}

// AI 한 번 호출. 실패하면 throw (throw한 결과는 캐시되지 않는다, FS 3-3).
// 키·URL은 로그에 남기지 않는다. 사용자 문장은 user 메시지로만 보낸다 (기사 데이터 없음).
async function askModel(key: string): Promise<ChatOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new ChatFailure('nokey');
  if (CHAT_MODEL === '') throw new ChatFailure('nomodel');
  if (!(await takeDailyUsage())) throw new ChatFailure('limit');

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: key },
        ],
      }),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ChatFailure('timeout');
    }
    throw new ChatFailure('error');
  }
  if (!res.ok) throw new ChatFailure('error');

  const body: unknown = await res.json();
  const out = parseChatOutput(contentOf(body));
  // 모양이 틀린 응답은 버린다 (PRD 규칙 6)
  if (out === null) throw new ChatFailure('error');
  return out;
}

// FS 3-3: 정규화 문장을 키로 하루 캐시. 성공만 저장된다
const cachedAskModel = unstable_cache(askModel, ['chat-ai'], { revalidate: CHAT_CACHE_SECONDS });

// 실패 원인을 로그에 한 줄로 남긴다 (문장·응답 원문은 남기지 않는다)
function logFailure(error: unknown): void {
  const kind = error instanceof ChatFailure ? error.kind : 'error';
  console.error(`[챗봇] 결과: ${kind}`);
}

/**
 * 문장 한 개를 필터 결과로 바꾼다 (FS 9-9). 어떤 실패든 `unavailable`로 돌려주고 페이지를 죽이지 않는다.
 * 같은 문장(정규화 뒤 같은 값)은 캐시에서 나오므로 AI도 호출 수도 늘지 않는다.
 */
export async function askChat(text: string): Promise<ChatApiResponse> {
  try {
    const out = await cachedAskModel(normalizeChatInput(text));
    return { status: 'ok', ...applyChatRules(out) };
  } catch (error) {
    logFailure(error);
    return { status: 'unavailable' };
  }
}
