import Link from 'next/link';
import { SearchBox } from '@/components/SearchBox';
import { copy } from '@/lib/copy';

// FS 8-1 `/` 검색 (F-01). 첫 화면에 조회할 데이터가 없어 서버에서 읽을 것이 없다. 검색은 SearchBox가 API Route를 부른다
export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16">
      <h1 className="sr-only">{copy.search.label}</h1>
      <SearchBox />
      <p className="mt-4 text-sm text-neutral-700">
        {copy.search.hint}{' '}
        <Link href="/screener" className="underline underline-offset-2 hover:text-neutral-900">
          {copy.nav.screener}
        </Link>
      </p>
    </div>
  );
}
