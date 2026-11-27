import Link from 'next/link';
import { NewsBlock } from '@/components/NewsBlock';
import { copy } from '@/lib/copy';
import { getHomeNews } from '@/lib/data/news';

// FS 9-6 HomeNews (PRD 3-5 첫 화면): 일반 경제 기사 5개 + 기사 더 보기 (→ /news). 서버 컴포넌트, Suspense 안에서 부른다
export async function HomeNews() {
  const result = await getHomeNews();
  return (
    <NewsBlock
      title={copy.news.homeTitle}
      headingId="home-news-title"
      result={result}
      footer={
        <Link href="/news" className="text-ink underline underline-offset-2 hover:decoration-2">
          {copy.news.moreLink}
        </Link>
      }
    />
  );
}
