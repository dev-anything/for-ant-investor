import { copy } from '@/lib/copy';

// 업종 목록의 회사 수 배지 (PRD 10장 35번, DESIGN-V2 3-2, FS 9-7). 서버 부품이라 'use client'가 없다.
// 대분류 제목과 중분류 카드에서 같이 쓴다.
export function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-subtle px-2.5 text-meta font-semibold tabular-nums text-ink-sub">
      {/* 보이는 글자와 읽어 주는 글자를 분리해 '45개 회사'를 한 번만 읽는다 */}
      <span aria-hidden="true">{copy.industry.countBadge(count)}</span>
      <span className="sr-only">{copy.industry.countBadgeAria(count)}</span>
    </span>
  );
}
