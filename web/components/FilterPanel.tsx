'use client';

import { ChevronDown } from 'lucide-react';

import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { blockedBy, FILTER_GROUPS, FILTERS, findFilter, MAX_FILTERS, type FilterGroup } from '@/lib/filters';
import { filterTooltip } from '@/lib/screener-view';

// FS 8-3 FilterPanel, DESIGN 5-3·6-3: 주제별 묶음은 <details>로 접는다 (기본 펼침).
// 흐린 버튼은 aria-disabled로 두어 포커스는 가고, 충돌이면 이유 문장을 보여 준다.
// 3개를 다 골랐으면 나머지 칩은 클릭을 무시하고, 이미 고른 칩은 눌러서 해제할 수 있게 둔다 (PRD 4장 F-07)
export function FilterPanel({
  selected,
  refYear,
  notice,
  onToggle,
  onHover,
}: {
  selected: number[];
  refYear: number | null;
  notice: string | null;
  onToggle: (id: number) => void;
  onHover: (id: number | null) => void;
}) {
  // 모바일 요약의 '고른 조건'과 개수는 이미 화면에 있는 칸 목록 이름·선택 수를 그대로 재사용한다 (새 문구 금지)
  const selectedCount = selected.length;
  const isFull = selectedCount >= MAX_FILTERS;

  const body = (
    <>
      {selectedCount > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="고른 조건">
          {selected.map((id) => {
            const label = findFilter(id)?.label ?? '';
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-3 py-1 text-sm font-bold text-brand"
              >
                <span>{label}</span>
                <button
                  type="button"
                  aria-label={copy.screener.removeChip(label)}
                  onClick={() => onToggle(id)}
                  className="px-1 text-ink-sub hover:text-ink"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-1">
        {FILTER_GROUPS.map((group: FilterGroup) => (
          <details key={group} open className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded py-2 text-sm font-semibold text-ink-sub [&::-webkit-details-marker]:hidden">
              <span>{group}</span>
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            {/* DESIGN-V2 1-2: 칩 하나가 한 줄을 채우고 ⓘ는 오른쪽 고정 폭 자리에 둔다. 글자가 길면 줄바꿈하며 높이가 늘어난다 */}
            <div className="space-y-2 pb-3">
              {FILTERS.filter((f) => f.group === group).map((filter) => {
                const isSelected = selected.includes(filter.id);
                const partner = blockedBy(selected, filter.id);
                const isFullBlocked = isFull && !isSelected;
                const isBlocked = partner !== null || isFullBlocked;
                return (
                  <div key={filter.id} className="flex w-full items-start gap-1">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={isBlocked || undefined}
                      onClick={() => {
                        if (!isFullBlocked) onToggle(filter.id);
                      }}
                      onMouseEnter={() => onHover(partner !== null ? filter.id : null)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(partner !== null ? filter.id : null)}
                      onBlur={() => onHover(null)}
                      className={`inline-flex min-h-9 min-w-0 flex-1 items-center whitespace-normal break-words rounded-full border px-4 py-1 text-left text-sm transition-colors ${
                        isSelected
                          ? 'border-brand bg-brand-soft font-bold text-brand'
                          : 'border-line bg-white text-ink hover:bg-subtle'
                      } ${isBlocked ? 'opacity-40' : ''}`}
                    >
                      {filter.label}
                    </button>
                    <span className="flex h-9 w-5 shrink-0 items-center justify-center">
                      <Tooltip text={filterTooltip(filter, refYear)} label={`${filter.label} 설명 보기`} />
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-ink-sub">
        {notice ?? ''}
      </p>
    </>
  );

  return (
    <>
      {/* 모바일(lg 미만): 패널 전체를 접고, 요약에 고른 조건 수를 그대로 보여 준다 */}
      <details className="rounded-lg bg-surface p-4 sm:p-6 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span>고른 조건</span>
            {selectedCount > 0 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-meta font-bold tabular-nums text-brand">
                {selectedCount}
              </span>
            )}
          </span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted" />
        </summary>
        <div className="pt-4">{body}</div>
      </details>

      {/* PC(lg 이상): 필터 묶음은 기본 펼침 상태로 항상 보인다 */}
      <section aria-labelledby="filter-panel-title" className="hidden rounded-lg bg-surface p-4 sm:p-6 lg:block">
        <h2 id="filter-panel-title" className="sr-only">
          고를 조건
        </h2>
        {body}
      </section>
    </>
  );
}
