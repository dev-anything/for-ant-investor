'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { copy } from '@/lib/copy';
import { pageItems } from '@/lib/pagination';
import { listHref, type ListLink } from '@/lib/params';

// FS 7장 Pagination: 이전·다음 + 쪽 번호 (현재 쪽 앞뒤 2쪽). 쪽 수가 1이면 그리지 않는다.
// onChange(스크리너 버튼) 또는 link(업종 목록 링크 모드: URL 쿼리만 바꿔 서버가 다시 그린다) 가운데 하나를 쓴다.
export function Pagination({
  page,
  pageCount,
  onChange,
  link,
}: {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
  link?: ListLink;
}) {
  if (pageCount <= 1) return null;

  const baseButtonClass =
    'min-w-8 rounded px-2 py-1 text-sm text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 disabled:opacity-40';
  const normalClass = `${baseButtonClass} border border-line bg-white`;
  const currentClass = `${baseButtonClass} border-2 border-brand font-bold bg-white`;

  // 한 칸. 링크 모드는 끝 쪽의 이전·다음을 링크 대신 흐린 글자로 둔다
  const control = (
    target: number,
    content: ReactNode,
    label: string | undefined,
    disabled: boolean,
    isCurrent: boolean
  ) => {
    const className = isCurrent ? currentClass : normalClass;
    if (link) {
      if (disabled) {
        return (
          <span aria-disabled="true" className={`${normalClass} opacity-40`}>
            {content}
          </span>
        );
      }
      return (
        <Link
          href={listHref(link.path, { ...link.state, page: target })}
          aria-label={label}
          aria-current={isCurrent ? 'page' : undefined}
          className={className}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        aria-label={label}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={() => onChange?.(target)}
      >
        {content}
      </button>
    );
  };

  return (
    <nav aria-label={copy.screener.pageLabel} className="mt-4 flex flex-wrap items-center justify-center gap-1">
      {control(page - 1, '‹', copy.screener.prevPage, page <= 1, false)}
      {pageItems(page, pageCount).map((item, i) =>
        item === null ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-sub">
            …
          </span>
        ) : (
          <span key={item}>
            {control(item, item, `${item}${copy.screener.pageLabel}`, false, item === page)}
          </span>
        )
      )}
      {control(page + 1, '›', copy.screener.nextPage, page >= pageCount, false)}
    </nav>
  );
}
