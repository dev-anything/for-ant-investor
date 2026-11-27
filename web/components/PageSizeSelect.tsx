'use client';

import { useRouter } from 'next/navigation';
import { copy } from '@/lib/copy';
import { listHref, SCREENER_SIZES, type ListLink, type ScreenerSize } from '@/lib/params';

// FS 7장 PageSizeSelect: 쪽당 개수 상자 (10 / 20 / 50, PRD 4장 F-07).
// onChange(스크리너) 또는 link(업종 목록: 고르면 1쪽 주소로 이동, FS 9-2)를 쓴다.
export function PageSizeSelect({
  size,
  onChange,
  link,
}: {
  size: ScreenerSize;
  onChange?: (size: ScreenerSize) => void;
  link?: ListLink;
}) {
  const router = useRouter();

  const handleChange = (next: ScreenerSize) => {
    if (onChange) {
      onChange(next);
      return;
    }
    // 개수를 바꾸면 1쪽으로 간다 (쪽 번호는 새 개수에서 의미가 없다)
    if (link) router.push(listHref(link.path, { ...link.state, size: next, page: 1 }));
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-sub">
      <span>{copy.screener.sizeLabel}</span>
      <select
        value={size}
        onChange={(event) => handleChange(Number(event.target.value) as ScreenerSize)}
        className="rounded border border-line bg-white px-2 py-1 text-sm text-ink focus:border-brand focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        {SCREENER_SIZES.map((option) => (
          <option key={option} value={option}>
            {copy.screener.sizeOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
