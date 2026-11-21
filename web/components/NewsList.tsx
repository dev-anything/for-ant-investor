import type { NewsItem } from '@/lib/news-text';

// FS 9-6 NewsList: 기사 줄 목록 (서버). 줄은 `{제목} · {도메인} · {시각}` 전체가 원문 링크다.
// 제목은 텍스트 노드로만 넣는다 (HTML 삽입 금지). 줄 사이에 다른 요소를 넣지 않는다 (네이버 약관: 가공 금지)
export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="mt-4 divide-y divide-neutral-200 rounded border border-neutral-300">
      {items.map((item, index) => {
        // 도메인·시각을 못 읽었으면 그 칸만 뺀다
        const line = [item.title, item.domain, item.time].filter((part) => part !== '').join(' · ');
        return (
          <li key={`${index}-${item.title}`} className="px-4 py-3 text-sm">
            {item.href === null ? (
              <span className="text-neutral-900">{line}</span>
            ) : (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                {line}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
