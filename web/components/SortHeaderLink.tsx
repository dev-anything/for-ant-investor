import Link from 'next/link';

// FS 7장 SortHeaderLink: 링크 모드 열 제목. 주소는 호출하는 쪽이 nextListSort + listHref로 만들어 준다 (서버가 다시 그림)
export function SortHeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-ink underline underline-offset-2 hover:decoration-2">
      {label}
    </Link>
  );
}
