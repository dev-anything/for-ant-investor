'use client';

import { useState, type FormEvent } from 'react';
import { copy } from '@/lib/copy';
import {
  CHAT_EXAMPLES,
  CHAT_MAX_INPUT,
  describeChatResult,
  parseChatApiBody,
  type ChatResult,
} from '@/lib/chat';

// FS 9-9 ChatFilterInput, DESIGN.md 5-1: 문장으로 필터 고르기 (PRD 4장 F-10). 스크리너 맨 위, 필터 버튼 위에 놓인다.
// 적용은 부모(ScreenerClient)의 상태로 한다. 필터 버튼과 같은 상태를 쓰며 따로 상태를 두지 않는다.

const CHAT_PATH = '/api/chat';

// POST /api/chat. 모양이 다르거나 오류면 null (규칙 6처럼 unavailable로 본다)
async function askServer(text: string): Promise<ChatResult | 'unavailable'> {
  try {
    const response = await fetch(CHAT_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const body: unknown = await response.json().catch(() => null);
    const parsed = parseChatApiBody(body);
    if (!response.ok || parsed === null || parsed.status === 'unavailable') return 'unavailable';
    // status 필드는 여기서 쓰지 않는다. 나머지는 ChatResult 모양이라 그대로 넘긴다
    return parsed;
  } catch {
    // 네트워크 오류: 규칙 6 문구로 바꾼다 (FS 9-9). 화면 상태를 바꾸는 catch라 빈 catch가 아니다
    return 'unavailable';
  }
}

interface ChatFilterInputProps {
  onApply: (filters: number[]) => void;
}

export function ChatFilterInput({ onApply }: ChatFilterInputProps) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  // 결과 문구 줄 (aria-live로 읽힌다)
  const [messages, setMessages] = useState<string[]>([]);
  // 규칙 6: AI를 못 쓰면 입력창·예시를 이 화면에서 숨긴다 (필터 버튼은 그대로)
  const [unavailable, setUnavailable] = useState(false);

  // 결과 하나를 화면에 반영한다. 적용할 필터가 있으면 부모 상태를 바꾼다 (PRD 규칙 1·5)
  function showResult(result: ChatResult) {
    const { messages: lines, applyFilters } = describeChatResult(result);
    if (applyFilters !== null) onApply(applyFilters);
    setMessages(lines);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length === 0 || pending) return;
    setPending(true);
    const outcome = await askServer(trimmed);
    setPending(false);
    if (outcome === 'unavailable') {
      setUnavailable(true);
      return;
    }
    showResult(outcome);
  }

  // 예시 문장은 AI 없이 정해진 필터를 바로 적용한다 (PRD 4장 F-10, 기본안)
  function handleExample(filters: number[]) {
    showResult({ filters, conflict: null, truncated: null, unsupported: [], notCondition: false });
  }

  return (
    <section aria-label={copy.chat.inputLabel} className="mb-4 rounded border border-line p-4">
      {unavailable ? (
        <p className="text-sm text-ink">{copy.chat.unavailable}</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <label htmlFor="chat-filter-text" className="text-sm font-semibold text-ink">
              {copy.chat.inputLabel}
            </label>
            <input
              id="chat-filter-text"
              type="text"
              value={text}
              maxLength={CHAT_MAX_INPUT}
              onChange={(event) => setText(event.target.value)}
              className="min-w-0 flex-1 rounded border border-line px-3 py-1 text-sm text-ink focus:border-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
            />
            {/* DESIGN.md 5-1: 필터 적용 버튼은 주요 버튼 (갈색 채움) */}
            <button
              type="submit"
              disabled={pending || text.trim().length === 0}
              className="rounded bg-brand px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {copy.chat.submit}
            </button>
          </form>
          <p className="mt-1 text-xs text-ink-sub">{copy.chat.externalNotice}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-sub">{copy.chat.examplesLead}</span>
            {CHAT_EXAMPLES.map((example) => (
              <button
                key={example.text}
                type="button"
                onClick={() => handleExample(example.filters)}
                className="rounded border border-line bg-white px-2 py-1 text-left text-sm text-ink hover:bg-surface"
              >
                {example.text}
              </button>
            ))}
          </div>
        </>
      )}

      <div aria-live="polite" className="mt-2 space-y-1 text-sm text-ink">
        {messages.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
