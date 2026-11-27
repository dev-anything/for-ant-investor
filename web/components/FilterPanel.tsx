'use client';

import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { blockedBy, FILTER_GROUPS, FILTERS, findFilter, type FilterGroup } from '@/lib/filters';
import { filterTooltip } from '@/lib/screener-view';

// FS 8-3 FilterPanel: 묶음 6개 순서대로 버튼 + 툴팁, 고른 필터는 칩으로 한 번 더 보여 주고 ✕로 뺀다.
// 흐린 버튼은 aria-disabled로 두어 포커스는 가고, 올리거나 누르면 이유 문장을 보여 준다.
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
  return (
    <section aria-labelledby="filter-panel-title" className="mt-6 rounded border border-line bg-surface p-4">
      <h2 id="filter-panel-title" className="sr-only">
        고를 조건
      </h2>

      {selected.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="고른 조건">
          {selected.map((id) => {
            const label = findFilter(id)?.label ?? '';
            return (
              <li
                key={id}
                className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1 text-sm font-bold text-ink"
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

      <div className="space-y-4">
        {FILTER_GROUPS.map((group: FilterGroup) => (
          <div key={group} className="flex flex-wrap items-center gap-2">
            <h3 className="w-24 shrink-0 text-sm font-semibold text-ink-sub">{group}</h3>
            <div className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f.group === group).map((filter) => {
                const isSelected = selected.includes(filter.id);
                const partner = blockedBy(selected, filter.id);
                const isBlocked = partner !== null;
                return (
                  <span key={filter.id} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={isBlocked || undefined}
                      onClick={() => onToggle(filter.id)}
                      onMouseEnter={() => onHover(isBlocked ? filter.id : null)}
                      onMouseLeave={() => onHover(null)}
                      onFocus={() => onHover(isBlocked ? filter.id : null)}
                      onBlur={() => onHover(null)}
                      className={`rounded px-3 py-1 text-left text-sm transition-colors ${
                        isSelected
                          ? 'border-2 border-ink bg-white font-bold text-ink'
                          : 'border border-line bg-white text-ink hover:bg-surface'
                      } ${isBlocked ? 'opacity-40' : ''}`}
                    >
                      {filter.label}
                    </button>
                    <Tooltip text={filterTooltip(filter, refYear)} label={`${filter.label} 설명 보기`} />
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm text-ink-sub">
        {notice ?? ''}
      </p>
    </section>
  );
}
