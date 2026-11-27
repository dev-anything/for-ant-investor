import type { Metadata } from 'next';
import Link from 'next/link';
import { NewsBlock } from '@/components/NewsBlock';
import { Pagination } from '@/components/Pagination';
import { copy } from '@/lib/copy';
import { getNewsPage } from '@/lib/data/news';
import { DEFAULT_LIST_STATE, listHref } from '@/lib/params';
import {
  NEWS_MAX_PAGE,
  NEWS_PAGE_SIZE,
  parseNewsPage,
} from '@/lib/news-text';

// FS 9-6 /news (PRD 4장 F-18): 경제 기사 목록. 상단 메뉴에는 넣지 않는다 (첫 화면 "기사 더 보기"로만 들어간다)
export const revalidate = 1800;

const NEWS_PATH = '/news';

type NewsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy.news.pageMeta };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: rawPage } = await searchParams;
  const page = parseNewsPage(rawPage);
  const result = await getNewsPage(page);

  // 전체 개수를 알면 쪽 수를 정하고, 모르면 이전·다음 링크만 둔다
  const total = result.status === 'ok' ? result.total : null;
  const pageCount = total === null ? page : Math.min(NEWS_MAX_PAGE, Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)));
  const hasMore = result.status === 'ok' && result.items.length === NEWS_PAGE_SIZE && page < NEWS_MAX_PAGE;
  const pageState = (target: number) => ({ ...DEFAULT_LIST_STATE, page: target });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <NewsBlock
        title={copy.news.homeTitle}
        headingId="news-page-title"
        titleTag="h1"
        result={result}
      />
      {total !== null ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          link={{ path: NEWS_PATH, state: pageState(page) }}
        />
      ) : (
        <nav aria-label={copy.news.pageLabel} className="mt-4 flex justify-center gap-4 text-sm">
          {page > 1 && (
            <Link href={listHref(NEWS_PATH, pageState(page - 1))} className="text-ink underline hover:text-ink-sub">
              {copy.news.prevPage}
            </Link>
          )}
          {hasMore && (
            <Link href={listHref(NEWS_PATH, pageState(page + 1))} className="text-ink underline hover:text-ink-sub">
              {copy.news.nextPage}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
