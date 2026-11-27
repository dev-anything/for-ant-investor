import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';

// FS 7장 SortHeaderLink: 링크 모드 열 제목. 주소는 호출하는 쪽이 nextListSort + listHref로 만들어 준다 (서버가 다시 그림)
// DESIGN 6-6: 정렬 중인 열은 ink 굵게 + 작은 화살표 (화살표 글자 대신 lucide 아이콘)
export function SortHeaderLink({
  href,
  label,
  sorted = false,
  dir = 'asc',
}: {
  href: string;
  label: string;
  sorted?: boolean;
  dir?: 'asc' | 'desc';
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 hover:text-ink-sub ${sorted ? 'font-bold text-ink' : 'text-ink-sub'}`}
    >
      {label}
      {sorted &&
        (dir === 'asc' ? (
          <ArrowUp aria-hidden="true" className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowDown aria-hidden="true" className="h-3 w-3 shrink-0" />
        ))}
    </Link>
  );
}
