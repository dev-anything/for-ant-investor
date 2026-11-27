import type { ReactNode } from 'react';

// DESIGN-remember 안내 박스: 연한 회색 면(surface) + 왼쪽 검정 세로선(ink)
export function Notice({ variant, children }: { variant: 'box' | 'line'; children: ReactNode }) {
  if (variant === 'box') {
    return (
      <div className="rounded border-l-4 border-ink bg-surface px-4 py-3 text-sm font-semibold text-ink">
        {children}
      </div>
    );
  }
  return <p className="mt-2 border-l-4 border-ink pl-2 text-sm font-medium text-ink">{children}</p>;
}
