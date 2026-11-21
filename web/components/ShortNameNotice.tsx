import { copy } from '@/lib/copy';
import { naverNewsSearchUrl } from '@/lib/news-text';

// FS 9-6 ShortNameNotice (PRD 10장 23번): 짧은 종목명은 기사를 부르지 않고 안내와 네이버 검색 링크만 준다
export function ShortNameNotice({ name }: { name: string }) {
  return (
    <section aria-labelledby="stock-news-title">
      <h2 id="stock-news-title" className="text-lg font-bold text-neutral-900">
        {copy.news.stockTitle}
      </h2>
      <p className="mt-4 text-sm text-neutral-700">
        {copy.news.shortName}{' '}
        <a
          href={naverNewsSearchUrl(name)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-neutral-900"
        >
          {copy.news.shortNameLink}
        </a>
      </p>
    </section>
  );
}
