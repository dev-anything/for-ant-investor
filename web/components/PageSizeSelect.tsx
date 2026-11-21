'use client';

import { copy } from '@/lib/copy';
import { SCREENER_SIZES, type ScreenerSize } from '@/lib/params';

// FS 7장 PageSizeSelect: 쪽당 개수 상자 (10 / 20 / 50, PRD 4장 F-07)
export function PageSizeSelect({ size, onChange }: { size: ScreenerSize; onChange: (size: ScreenerSize) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
      <span>{copy.screener.sizeLabel}</span>
      <select
        value={size}
        onChange={(event) => onChange(Number(event.target.value) as ScreenerSize)}
        className="rounded border border-neutral-300 bg-white px-2 py-1"
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
