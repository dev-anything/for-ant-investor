'use client';

import { copy } from '@/lib/copy';
import { pageItems } from '@/lib/pagination';

// FS 7장 Pagination: 이전·다음 + 쪽 번호 (현재 쪽 앞뒤 2쪽). 쪽 수가 1이면 그리지 않는다.
export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const buttonClass = 'min-w-8 rounded border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-40';

  return (
    <nav aria-label={copy.screener.pageLabel} className="mt-4 flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        className={buttonClass}
        disabled={page <= 1}
        aria-label={copy.screener.prevPage}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pageItems(page, pageCount).map((item, i) =>
        item === null ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-neutral-500">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`${item}${copy.screener.pageLabel}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
            className={`${buttonClass} ${item === page ? 'bg-neutral-900 text-white hover:bg-neutral-900' : ''}`}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        className={buttonClass}
        disabled={page >= pageCount}
        aria-label={copy.screener.nextPage}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
