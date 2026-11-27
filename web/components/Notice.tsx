import type { ReactNode } from 'react';

// DESIGN-remember 안내 박스: 흰 면 + 회색 테두리 + 왼쪽 검정 4px 세로선 (흰 페이지·회색 구역 어디서든 보이게)
export function Notice({ variant, children }: { variant: 'box' | 'line'; children: ReactNode }) {
  if (variant === 'box') {
    return (
      <div className="rounded border border-line border-l-4 border-l-ink bg-white px-4 py-3 text-sm font-semibold text-ink">
        {children}
      </div>
    );
  }
  return <p className="mt-2 border-l-4 border-ink pl-2 text-sm font-medium text-ink">{children}</p>;
}
