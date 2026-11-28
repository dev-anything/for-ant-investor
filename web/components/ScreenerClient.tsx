'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ChatFilterInput } from '@/components/ChatFilterInput';
import { ErrorState } from '@/components/ErrorState';
import { FilterPanel } from '@/components/FilterPanel';
import { PageSizeSelect } from '@/components/PageSizeSelect';
import { Pagination } from '@/components/Pagination';
import { ResultTable } from '@/components/ResultTable';
import { Skeleton } from '@/components/Skeleton';
import { Tooltip } from '@/components/Tooltip';
import type { ScreenerResult } from '@/lib/data/screener';
import { copy } from '@/lib/copy';
import { blockedBy, findFilter, hasFinancialBlocked } from '@/lib/filters';
import { pageCountOf } from '@/lib/pagination';
import { toQuery, type ScreenerState } from '@/lib/params';
import {
  applySize,
  applySort,
  applyToggle,
  isScreenerResult,
  type ToggleOutcome,
} from '@/lib/screener-view';

const SCREENER_PATH = '/screener';

// 상태를 주소로 (기본값 키는 생략된다, FS 6-6)
function urlOf(state: ScreenerState): string {
  const query = toQuery(state);
  return query ? `${SCREENER_PATH}?${query}` : SCREENER_PATH;
}

// GET /api/screener. 응답 모양이 다르면 오류로 본다
async function fetchResult(state: ScreenerState, signal: AbortSignal): Promise<ScreenerResult> {
  const response = await fetch(`/api/screener?${toQuery(state)}`, { signal });
  if (!response.ok) throw new Error(`screener ${response.status}`);
  const body: unknown = await response.json();
  if (!isScreenerResult(body)) throw new Error('screener 응답 모양이 다르다');
  return body;
}

// 범위를 넘은 쪽이면 마지막 쪽을 찾아 다시 요청한다 (FS 5-2: 0행이면 1쪽으로 전체 수를 얻는다)
async function fetchFinal(
  state: ScreenerState,
  signal: AbortSignal
): Promise<{ state: ScreenerState; result: ScreenerResult }> {
  const result = await fetchResult(state, signal);
  if (result.rows.length > 0 || state.page <= 1) return { state, result };

  const first = await fetchResult({ ...state, page: 1 }, signal);
  if (first.total === 0) return { state: { ...state, page: 1 }, result: first };
  const last = { ...state, page: pageCountOf(first.total, state.size) };
  return { state: last, result: await fetchResult(last, signal) };
}

// 필터 버튼 오류를 안내 문장으로 바꾼다 (PRD 4장 F-07)
function toggleMessage(outcome: ToggleOutcome): string | null {
  if (outcome.error === null) return null;
  if (outcome.error.kind === 'max') return copy.screener.max;
  return copy.screener.conflict(findFilter(outcome.error.with)?.label ?? '');
}

interface ScreenerClientProps {
  initialState: ScreenerState;
  initialResult: ScreenerResult | null;
  initialFailed: boolean;
  refYear: number | null;
}

// FS 8-3 ScreenerClient: 상태 {filters, sort, dir, page, size}. 바뀔 때마다 /api/screener를 부르고 주소를 바꾼다.
export function ScreenerClient({ initialState, initialResult, initialFailed, refYear }: ScreenerClientProps) {
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState<ScreenerResult | null>(initialResult);
  const [failed, setFailed] = useState(initialFailed);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hoverNotice, setHoverNotice] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // 바로잡힌 상태로 주소를 맞춘다 (예: f=0은 기본값으로). 기록은 남기지 않는다 (FS 8-3)
  useEffect(() => {
    window.history.replaceState(null, '', urlOf(initialState));
  }, [initialState]);

  const load = useCallback(async (next: ScreenerState) => {
    setState(next);
    window.history.replaceState(null, '', urlOf(next));

    controllerRef.current?.abort();
    if (next.filters.length === 0) {
      controllerRef.current = null;
      setResult(null);
      setFailed(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    try {
      const final = await fetchFinal(next, controller.signal);
      if (controller.signal.aborted) return;
      setState(final.state);
      window.history.replaceState(null, '', urlOf(final.state));
      setResult(final.result);
      setFailed(false);
    } catch {
      // 취소된 요청은 새 요청이 이어받으므로 조용히 끝낸다. 나머지 실패는 오류 문구로 보여 준다
      if (controller.signal.aborted) return;
      setResult(null);
      setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const handleToggle = (id: number) => {
    const outcome = applyToggle(state, id);
    const message = toggleMessage(outcome);
    if (message !== null) {
      setNotice(message);
      return;
    }
    setNotice(null);
    setHoverNotice(null);
    void load(outcome.state);
  };

  // 흐린 버튼에 올리면 이유를 보여 준다 (PRD 4장 F-07)
  const handleHover = (id: number | null) => {
    if (id === null) {
      setHoverNotice(null);
      return;
    }
    const partner = blockedBy(state.filters, id);
    setHoverNotice(partner === null ? null : copy.screener.conflict(findFilter(partner)?.label ?? ''));
  };

  const handleSort = (key: ScreenerState['sort']) => void load(applySort(state, key));
  const handleSize = (size: ScreenerState['size']) => void load(applySize(state, size));
  // 문장으로 고른 필터는 앞 선택을 이어받지 않고 그 필터로 바꾼다 (PRD 4장 F-10 규칙 5), 쪽은 1쪽
  const handleChatApply = (filters: number[]) => {
    setNotice(null);
    setHoverNotice(null);
    void load({ ...state, filters, page: 1 });
  };
  const handlePage = (page: number) => {
    void load({ ...state, page });
    tableTopRef.current?.scrollIntoView({ block: 'start' });
  };

  const hasFilters = state.filters.length > 0;
  const shownNotice = hoverNotice ?? notice;

  return (
    <>
      <ChatFilterInput onApply={handleChatApply} />

      {/* DESIGN 5-3: PC는 왼쪽 필터 패널(300px) + 오른쪽 결과. 아래에서는 결과가 위로 쌓인다 */}
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-6">
        <FilterPanel
          selected={state.filters}
          refYear={refYear}
          notice={shownNotice}
          onToggle={handleToggle}
          onHover={handleHover}
        />

        {/* 표가 13열로 늘어나도 페이지가 아니라 이 칸 안에서만 가로 스크롤되게 한다 (FS 8-3) */}
        <div ref={tableTopRef} className="mt-6 min-w-0 lg:mt-0">
          {/* 조회 중 안내는 화면에 보이지 않고 스크린 리더에만 알린다 (PRD 3-1 접근성, FS 8-3) */}
          {hasFilters && (
            <p role="status" className="sr-only">
              {loading ? copy.screener.loading : ''}
            </p>
          )}
          {!hasFilters && <EmptyState message={copy.screener.noFilter} />}
          {hasFilters && failed && <ErrorState message={copy.dbError} />}
          {hasFilters && !failed && result === null && loading && <Skeleton className="h-40 w-full" />}

          {hasFilters && !failed && result !== null && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{copy.screener.count(result.total)}</p>
                  {hasFinancialBlocked(state.filters) && (
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-ink-sub">
                      {copy.screener.financialBlocked}
                      <Tooltip text={copy.screener.financialBlockedTip} label="금융회사 안내 설명 보기" />
                    </p>
                  )}
                  {result.basDt && <p className="mt-1 text-meta text-ink-sub">{copy.screener.basis(result.basDt)}</p>}
                </div>
                <PageSizeSelect size={state.size} onChange={handleSize} />
              </div>

              {result.total === 0 ? (
                <EmptyState message={copy.screener.zero} />
              ) : (
                <>
                  <div className="mt-3">
                    <ResultTable
                      rows={result.rows}
                      filters={state.filters}
                      refYear={refYear}
                      sort={{ key: state.sort, dir: state.dir }}
                      dimmed={loading}
                      onSort={handleSort}
                    />
                  </div>
                  <Pagination page={state.page} pageCount={pageCountOf(result.total, state.size)} onChange={handlePage} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
