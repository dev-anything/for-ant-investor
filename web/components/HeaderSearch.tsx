'use client';

import { Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SearchBox } from '@/components/SearchBox';
import { copy } from '@/lib/copy';

// FS 7장 AppHeader, DESIGN.md 4-2·7: 헤더 가운데 작은 검색창.
// 홈에서는 숨기고, 640px 미만은 돋보기 버튼으로 헤더 아래에 펼친다. 검색 로직은 기존 SearchBox 그대로.
export function HeaderSearch() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  if (pathname === '/') return null;

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label={copy.search.label}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-subtle sm:hidden"
      >
        <Search size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      <div
        className={`${
          isExpanded ? 'block' : 'hidden'
        } fixed left-4 right-4 top-16 z-40 rounded-md border border-line bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0/0.08)] sm:static sm:mt-0 sm:block sm:w-[360px] sm:border-0 sm:p-0 sm:shadow-none`}
      >
        <SearchBox compact />
      </div>
    </div>
  );
}
