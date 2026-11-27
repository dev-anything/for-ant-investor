'use client';

// FS 8-1 SearchBox, DESIGN.md 5-2: 종목 연관검색어 (WAI-ARIA combobox 패턴, PRD 4장 F-01)
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { SearchItem } from '@/lib/data/search';
import { copy } from '@/lib/copy';
import { highlightParts } from '@/lib/highlight';
import { parseSearchQuery } from '@/lib/params';
import { isSearchResult, nextActiveIndex } from '@/lib/search-view';

// PRD 4장 F-01: 입력이 멈추고 약 0.3초 뒤 검색 (디바운스)
const SEARCH_DEBOUNCE_MS = 300;

// GET /api/search. 응답 모양이 다르면 오류로 본다
async function fetchItems(q: string, signal: AbortSignal): Promise<SearchItem[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
  if (!response.ok) throw new Error(`search ${response.status}`);
  const body: unknown = await response.json();
  if (!isSearchResult(body)) throw new Error('search 응답 모양이 다르다');
  return body.items;
}

// 일치 부분을 굵게 그린다 (dangerouslySetInnerHTML 없이 React 요소로)
function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <strong key={index} className="font-bold text-ink">
            {part.text}
          </strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

interface SearchBoxProps {
  // 헤더의 작은 검색창 여부. 표시 크기만 다르고 검색 로직은 같다 (DESIGN 4-2)
  compact?: boolean;
}

// FS 8-1, DESIGN.md 5-2: 종목명 입력 상자와 연관검색어 목록.
// compact는 헤더 재사용용 크기 변형이다. 요청·이동·디바운스는 그대로 둔다.
export function SearchBox({ compact = false }: SearchBoxProps) {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;

  const [query, setQuery] = useState('');
  // null: 아직 받은 결과가 없음 (또는 오류). 빈 배열: 결과 없음
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // 첫 화면의 큰 검색창만 진입 시 포커스. 헤더 작은 검색창은 페이지마다 포커스를 뺏지 않는다 (FS 8-1)
  useEffect(() => {
    if (compact) return;
    inputRef.current?.focus();
  }, [compact]);

  // 떠날 때 대기 중인 디바운스와 요청을 정리한다
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    };
  }, []);

  // 새 입력이 오면 대기 중인 요청을 끊고 다시 기다린다 (FS 8-1: 이전 요청 취소, 늦은 응답은 버림)
  const cancelPending = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const runSearch = (q: string) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    fetchItems(q, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        setItems(list);
        setOpen(true);
        setActive(-1);
      })
      .catch((error: unknown) => {
        // 취소된 요청은 새 입력이 이어받으므로 조용히 끝낸다. 나머지 오류는 목록만 닫는다 (FS 8-1)
        if (controller.signal.aborted) return;
        console.warn(error instanceof Error ? error.message : 'search 알 수 없는 오류');
        setItems(null);
        setOpen(false);
        setActive(-1);
      });
  };

  const handleChange = (value: string) => {
    setQuery(value);
    cancelPending();
    const q = parseSearchQuery(value);
    // 빈 입력이거나 50자를 넘으면 요청하지 않고 목록을 닫는다
    if (q === null) {
      setItems(null);
      setOpen(false);
      setActive(-1);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      runSearch(q);
    }, SEARCH_DEBOUNCE_MS);
  };

  const showList = open && items !== null && items.length > 0;
  const showNoResult = open && items !== null && items.length === 0 && query.trim().length > 0;
  const shownQuery = parseSearchQuery(query) ?? '';

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  // FS 8-1: 외국회사는 선택해도 이동하지 않는다
  const choose = (item: SearchItem) => {
    if (item.isForeign) return;
    close();
    router.push(`/stocks/${item.shortCode}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (items === null || items.length === 0) return;
      event.preventDefault();
      // 닫혀 있으면 화살표로 다시 연다
      if (!open) {
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 'down' : 'up';
      setActive(nextActiveIndex(active, items.length, direction));
      return;
    }
    if (event.key === 'Enter') {
      if (!showList || active < 0 || items === null) return;
      event.preventDefault();
      choose(items[active]);
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor={inputId} className="sr-only">
        {copy.search.label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        role="combobox"
        autoComplete="off"
        value={query}
        placeholder={copy.search.placeholder}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={close}
        className={
          compact
            ? 'h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-sub focus:border-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2'
            : 'w-full rounded border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-ink-sub focus:border-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2'
        }
      />

      {/* 목록 상자는 항상 두고 (aria-controls 대상이 있어야 함), 내용만 필요할 때 그린다 */}
      <ul
        id={listId}
        role="listbox"
        aria-label={copy.search.listLabel}
        hidden={!showList}
        // 목록을 누를 때 입력창의 포커스가 빠지지 않게 한다 (blur로 목록이 먼저 닫히는 것 방지)
        onMouseDown={(event) => event.preventDefault()}
        className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-line bg-white"
      >
        {showList &&
          items.map((item, index) => (
            <li
              key={item.shortCode}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              aria-disabled={item.isForeign ? true : undefined}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(item)}
              className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
                index === active ? 'bg-surface' : ''
              } ${item.isForeign ? 'text-muted' : 'cursor-pointer text-ink'}`}
            >
              <span>
                <Marked text={item.name} query={shownQuery} />{' '}
                <span className="text-ink-sub">
                  (<Marked text={item.shortCode} query={shownQuery} />)
                </span>
              </span>
              {item.isForeign && <span className="text-xs text-ink-sub">{copy.search.foreign}</span>}
            </li>
          ))}
      </ul>

      {showNoResult && (
        <p role="status" className="absolute z-10 mt-1 w-full rounded border border-line bg-white px-4 py-2 text-sm text-ink-sub">
          {copy.search.noResult}
        </p>
      )}
    </div>
  );
}
