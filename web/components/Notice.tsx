import type { ReactNode } from 'react';

// DESIGN.md 4-6 안내 박스: 연한 회색 면(#F5F5F5) + 왼쪽 갈색 세로선(#6B4423)
export function Notice({ variant, children }: { variant: 'box' | 'line'; children: ReactNode }) {
  if (variant === 'box') {
    return (
      <div className="rounded border-l-4 border-brand bg-surface px-4 py-3 text-sm font-semibold text-ink">
        {children}
      </div>
    );
  }
  return <p className="mt-2 border-l-4 border-brand pl-2 text-sm font-medium text-ink">{children}</p>;
}
