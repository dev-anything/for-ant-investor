import type { ReactNode } from 'react';
import { copy } from '@/lib/copy';
import type { NewsResult } from '@/lib/news-text';
import { NaverAttribution } from '@/components/NaverAttribution';
import { NewsList } from '@/components/NewsList';

// FS 9-6 NewsBlock, DESIGN.md 4-1 구역 면(bg-surface p-4 md:p-6 rounded): 칸 제목 + 네이버 표시 + 결과
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
    <section aria-labelledby={headingId} className="rounded bg-surface p-4 md:p-6">
      <Heading id={headingId} className="text-xl font-semibold text-ink-sub">
        {title}
      </Heading>
      <NaverAttribution />

      {result.status === 'error' && <p className="mt-4 text-sm text-ink-sub">{copy.news.error}</p>}
      {result.status === 'ok' && result.items.length === 0 && (
        <p className="mt-4 text-sm text-ink-sub">{copy.news.empty}</p>
      )}
      {result.status === 'ok' && result.items.length > 0 && <NewsList items={result.items} />}

      {footer && <div className="mt-4 text-sm text-ink">{footer}</div>}
    </section>
  );
}
