// 조건 찾기 챗봇 규칙 (FS 6-10, PRD 4장 F-10). AI는 필터 ID·종류 코드·조건이 아닌 말 여부만 고른다.
// 순수 함수만 둔다: 외부 호출·DB는 lib/data/chat.ts가 맡는다.
import { FILTERS, INCLUDES, findFilter, isConflictPair } from '@/lib/filters';
import { copy } from '@/lib/copy';

// PRD 10장 33번: 하루 AI 호출 상한 (chat_usage_take 인자)
export const CHAT_DAILY_LIMIT = 40;
// FS 12장 동작 기본안 3번: 입력 글자 상한 (입력창 maxLength와 같은 값)
export const CHAT_MAX_INPUT = 200;

// OpenRouter 무료 모델 (PRD 10장 19번·R6, 2026-11-22 사용자 결정).
// 빈 문자열이면 호출하지 않는다 (lib/data/chat.ts가 꺼진 것으로 본다).
// 타입을 string으로 넓혀 빈 값 검사(lib/data/chat.ts)가 타입 오류 없이 남게 한다
export const CHAT_MODEL: string = 'google/gemma-4-26b-a4b-it:free';

// 지원하지 않는 조건의 종류 코드 4개 (PRD 4장 F-10 규칙 3 표)
export const UNSUPPORTED_KINDS = ['industry', 'dividend_yield', 'price', 'other'] as const;
export type UnsupportedKind = (typeof UNSUPPORTED_KINDS)[number];

export interface ChatExample {
  text: string;
  filters: number[];
}

// PRD 4장 F-10 예시 문장 3개 (AI 없이 필터를 바로 적용). 필터 ID는 PRD 표 그대로
export const CHAT_EXAMPLES: ChatExample[] = [
  { text: '빚이 적고 매출이 늘어나는 회사', filters: [13, 1] },
  { text: '적자에서 흑자로 돌아선 회사', filters: [8] },
  { text: '꾸준히 배당하는 회사', filters: [20] },
];

// AI가 돌려준 원래 모양 (검사를 통과한 것만)
export interface ChatOutput {
  filters: number[];
  unsupported: UnsupportedKind[];
  notCondition: boolean;
}

// 규칙을 적용한 결과 (화면이 문구를 고른다)
export interface ChatResult {
  filters: number[];
  conflict: [number, number] | null;
  truncated: number[] | null;
  unsupported: UnsupportedKind[];
  notCondition: boolean;
}

// API 응답 (FS 9-9). 오류·한도는 모두 unavailable로 묶는다 (PRD 규칙 6)
export type ChatApiResponse = ({ status: 'ok' } & ChatResult) | { status: 'unavailable' };

/** 캐시 키로 쓸 정규화 문장 (앞뒤 공백 제거, 연속 공백 하나로, 영문 소문자). PRD F-10 무료 한도 보호 ①. */
export function normalizeChatInput(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** 입력 검사: 문자열이고 trim 뒤 1~CHAT_MAX_INPUT자면 그 문장, 아니면 null (API는 400). */
export function validateChatInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const length = Array.from(trimmed).length;
  if (length < 1 || length > CHAT_MAX_INPUT) return null;
  return trimmed;
}

/** 요청 본문 `{ text }`에서 문장을 꺼낸다. 모양이 틀리면 null. */
export function parseChatRequest(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('text' in body)) return null;
  return validateChatInput(body.text);
}

/** AI 응답 문자열을 JSON으로 읽고 모양을 검사한다. JSON이 아니거나 모양이 틀리면 null (규칙 6).
 *  모양이 맞으면 모르는 ID·중복·범위 밖 값만 그 항목에서 버리고 순서는 그대로 둔다. */
export function parseChatOutput(raw: unknown): ChatOutput | null {
  if (typeof raw !== 'string') return null;
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    // AI가 JSON이 아닌 글을 보냈을 때: 버린다 (PRD F-10 "AI 출력이 JSON이 아니면 버린다")
    return null;
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  if (!('filters' in body) || !('unsupported' in body) || !('not_condition' in body)) return null;
  const { filters, unsupported, not_condition: notCondition } = body;
  if (!Array.isArray(filters) || !Array.isArray(unsupported) || typeof notCondition !== 'boolean') return null;

  return {
    filters: uniqueKeep(filters.filter(isFilterId)),
    unsupported: uniqueKeep(unsupported.filter(isUnsupportedKind)),
    notCondition,
  };
}

// 필터 ID 1~20 (정수)인지
function isFilterId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && findFilter(value) !== null;
}

// 지원하지 않는 종류 코드인지
function isUnsupportedKind(value: unknown): value is UnsupportedKind {
  return typeof value === 'string' && (UNSUPPORTED_KINDS as readonly string[]).includes(value);
}

// 처음 나온 순서대로 중복을 뺀다
function uniqueKeep<T>(items: T[]): T[] {
  return items.filter((item, index) => items.indexOf(item) === index);
}

/**
 * 규칙 적용 (PRD 4장 F-10 규칙 2·4, FS 6-10).
 * ① 13·14가 같이 있으면 14만 ② 부딪히는 짝이 있으면 필터를 비우고 conflict
 * ③ 4개 이상이면 문장 순서대로 앞의 3개와 truncated ④ 조건이 아닌 말이면 필터를 비운다.
 * ④는 다른 결과보다 먼저 판정해 한 번에 한 문구만 보인다 (구현 판단, FS 6-10 순서와 같은 결과).
 */
export function applyChatRules(output: ChatOutput): ChatResult {
  const base = { unsupported: output.unsupported };
  if (output.notCondition) {
    return { ...base, filters: [], conflict: null, truncated: null, notCondition: true };
  }

  // ① 포함 관계: 더 좁은 14만 남긴다
  let filters = output.filters;
  for (const [wide, narrow] of INCLUDES) {
    if (filters.includes(wide) && filters.includes(narrow)) {
      filters = filters.filter((id) => id !== wide);
    }
  }

  // ② 부딪히는 짝은 전체 목록으로 판정한다
  for (let i = 0; i < filters.length; i += 1) {
    for (let j = i + 1; j < filters.length; j += 1) {
      if (isConflictPair(filters[i], filters[j])) {
        return { ...base, filters: [], conflict: [filters[i], filters[j]], truncated: null, notCondition: false };
      }
    }
  }

  // ③ 4개 이상이면 앞의 3개만 적용하고 알린다
  if (filters.length > 3) {
    const kept = filters.slice(0, 3);
    return { ...base, filters: kept, conflict: null, truncated: kept, notCondition: false };
  }

  return { ...base, filters, conflict: null, truncated: null, notCondition: false };
}

/** AI에게 줄 system 메시지 (PRD 4장 F-10 AI의 역할: ID·종류 코드·조건이 아닌 말 여부만 JSON으로). */
export function buildSystemPrompt(): string {
  const list = FILTERS.map((filter) => `${filter.id}: ${filter.label}`).join('\n');
  return [
    '너는 주식 재무 조건을 골라 주는 도우미다.',
    '사용자 문장을 아래 필터 번호로 바꿔라. 문장에 나온 순서대로 적어라.',
    '숫자, 의견, 설명은 만들지 마라. 답은 JSON 한 개로만 써라.',
    '',
    '필터 목록:',
    list,
    '',
    `지원하지 않는 조건 종류 코드: ${UNSUPPORTED_KINDS.join(', ')}`,
    '(industry=업종, dividend_yield=배당수익률, price=주가·PER·PBR, other=그 밖)',
    '',
    '출력 형식: {"filters":[필터 번호...],"unsupported":[종류 코드...],"not_condition":false}',
    '조건이 아닌 질문(예: 사도 될지 묻는 말)이면 filters를 비우고 not_condition을 true로 써라.',
  ].join('\n');
}

/** API 응답 본문이 우리 모양인지 검사한다 (클라이언트). 맞지 않으면 null. */
export function parseChatApiBody(body: unknown): ChatApiResponse | null {
  if (typeof body !== 'object' || body === null || !('status' in body)) return null;
  if (body.status === 'unavailable') return { status: 'unavailable' };
  if (body.status !== 'ok') return null;
  if (!('filters' in body) || !('conflict' in body) || !('truncated' in body) || !('unsupported' in body) || !('notCondition' in body)) {
    return null;
  }
  const { filters, conflict, truncated, unsupported, notCondition } = body;
  if (!Array.isArray(filters) || !filters.every(isFilterId)) return null;
  if (!Array.isArray(unsupported) || !unsupported.every(isUnsupportedKind)) return null;
  if (typeof notCondition !== 'boolean') return null;
  const conflictOk = conflict === null || (Array.isArray(conflict) && conflict.length === 2 && conflict.every(isFilterId));
  const truncatedOk = truncated === null || (Array.isArray(truncated) && truncated.every(isFilterId));
  if (!conflictOk || !truncatedOk) return null;
  return {
    status: 'ok',
    filters,
    conflict: conflict === null ? null : [Number(conflict[0]), Number(conflict[1])],
    truncated: truncated === null ? null : truncated.filter(isFilterId),
    unsupported,
    notCondition,
  };
}

/**
 * 결과를 화면 문구와 "적용할 필터"로 바꾼다 (PRD 4장 F-10 규칙 1~4, FS 9-9).
 * applyFilters가 null이면 필터 선택을 그대로 둔다 (부딪힘·조건 아님·고른 필터 없음).
 */
export function describeChatResult(result: ChatResult): { messages: string[]; applyFilters: number[] | null } {
  if (result.notCondition) return { messages: [copy.chat.notCondition], applyFilters: null };
  if (result.conflict !== null) {
    const [a, b] = result.conflict;
    return { messages: [copy.chat.conflict(labelOf(a), labelOf(b))], applyFilters: null };
  }

  const messages: string[] = [];
  if (result.filters.length > 0) {
    messages.push(copy.chat.found(result.filters.map(labelOf).join(', ')));
  }
  if (result.truncated !== null) {
    messages.push(copy.chat.truncated(result.truncated.map(labelOf).join(', ')));
  }
  for (const kind of result.unsupported) {
    messages.push(copy.chat.unsupported[kind]);
  }
  return { messages, applyFilters: result.filters.length > 0 ? result.filters : null };
}

// 필터 문구 한 개 (없는 ID면 빈 문자열. 검사를 거친 값만 들어오므로 실제로는 없다)
function labelOf(id: number): string {
  return findFilter(id)?.label ?? '';
}
