import type { NewsItem } from '@/lib/news-text';

// FS 9-6 NewsList, DESIGN.md 6-9: 제목(최대 2줄) + 아래 메타(도메인·시각). 요약·썸네일은 넣지 않는다.
// 제목은 텍스트 노드로만 넣는다 (HTML 삽입 금지). 줄 사이에 다른 요소를 넣지 않는다 (네이버 약관: 가공 금지)
export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
      {items.map((item, index) => {
        // 도메인·시각을 못 읽었으면 메타 줄만 뺀다
        const meta = [item.domain, item.time].filter((part) => part !== '').join(' · ');
        return (
          <li key={`${index}-${item.title}`} className="px-4 py-3">
            {item.href === null ? (
              <div>
                <p className="line-clamp-2 text-base font-medium text-ink">{item.title}</p>
                {meta !== '' && <p className="mt-1 text-meta text-muted">{meta}</p>}
              </div>
            ) : (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="line-clamp-2 text-base font-medium text-ink group-hover:text-brand">
                  {item.title}
                </span>
                {meta !== '' && <span className="mt-1 block text-meta text-muted">{meta}</span>}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
