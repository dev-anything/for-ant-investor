import type { ReactNode } from 'react';
import { NaverAttribution } from '@/components/NaverAttribution';
import { NewsList } from '@/components/NewsList';
import { copy } from '@/lib/copy';
import type { NewsResult } from '@/lib/news-text';

// FS 9-6 NewsBlock, DESIGN.md 4-1·6-9: 칸 제목 줄(오른쪽 네이버 표시) + 결과를 흰 카드에 담는다
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
    <section aria-labelledby={headingId} className="rounded-lg bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading id={headingId} className="text-lg font-semibold text-ink">
          {title}
        </Heading>
        <NaverAttribution />
      </div>

      {result.status === 'error' && <p className="mt-4 text-sm text-ink-sub">{copy.news.error}</p>}
      {result.status === 'ok' && result.items.length === 0 && (
        <p className="mt-4 text-sm text-ink-sub">{copy.news.empty}</p>
      )}
      {result.status === 'ok' && result.items.length > 0 && <NewsList items={result.items} />}

      {footer && <div className="mt-4 text-sm text-brand">{footer}</div>}
    </section>
  );
}
