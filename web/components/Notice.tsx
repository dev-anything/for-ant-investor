import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

// DESIGN.md 6-12 안내 박스: subtle 바탕 + 왼쪽 ⓘ(muted) + 14px 글. 경고색은 쓰지 않는다.
export function Notice({ variant, children }: { variant: 'box' | 'line'; children: ReactNode }) {
  if (variant === 'box') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
        <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
        <span>{children}</span>
      </div>
    );
  }
  return (
    <p className="mt-2 flex items-start gap-2 text-sm text-ink">
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
