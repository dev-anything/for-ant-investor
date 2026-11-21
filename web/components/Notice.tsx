import type { ReactNode } from 'react';

// FS 7장 Notice: 색 없이 테두리·굵기로 구분한다 (box = 눈에 띄는 상자, line = 한 줄)
export function Notice({ variant, children }: { variant: 'box' | 'line'; children: ReactNode }) {
  if (variant === 'box') {
    return (
      <div className="rounded border-2 border-neutral-900 bg-white px-4 py-3 text-sm font-semibold text-neutral-900">
        {children}
      </div>
    );
  }
  return <p className="mt-2 border-l-4 border-neutral-900 pl-2 text-sm font-medium text-neutral-800">{children}</p>;
}
