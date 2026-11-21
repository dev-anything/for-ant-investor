import type { ReactNode } from 'react';
import { copy } from '@/lib/copy';
import type { NewsResult } from '@/lib/news-text';
import { NaverAttribution } from '@/components/NaverAttribution';
import { NewsList } from '@/components/NewsList';

// FS 9-6 NewsBlock: 칸 제목 + 안내 + 네이버 표시 + 결과(목록 / 실패 / 0건). 서버 컴포넌트
// titleTag: /news는 페이지 제목이라 h1, 나머지 칸은 h2
export function NewsBlock({
  title,
  headingId,
  titleTag = 'h2',
  result,
  footer,
}: {
  title: string;
  headingId: string;
  titleTag?: 'h1' | 'h2';
  result: NewsResult;
  footer?: ReactNode;
}) {
  const Heading = titleTag;
  return (
    <section aria-labelledby={headingId}>
      <Heading id={headingId} className="text-lg font-bold text-neutral-900">
        {title}
      </Heading>
      <p className="mt-2 text-sm text-neutral-700">{copy.news.notice}</p>
      <NaverAttribution />

      {result.status === 'error' && <p className="mt-4 text-sm text-neutral-700">{copy.news.error}</p>}
      {result.status === 'ok' && result.items.length === 0 && (
        <p className="mt-4 text-sm text-neutral-700">{copy.news.empty}</p>
      )}
      {result.status === 'ok' && result.items.length > 0 && <NewsList items={result.items} />}

      {footer && <div className="mt-4 text-sm">{footer}</div>}
    </section>
  );
}
