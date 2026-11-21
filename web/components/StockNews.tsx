import { NewsBlock } from '@/components/NewsBlock';
import { ShortNameNotice } from '@/components/ShortNameNotice';
import { copy } from '@/lib/copy';
import { getStockNews } from '@/lib/data/news';
import { isShortName } from '@/lib/news-text';

// FS 9-6 StockNews (PRD 4장 F-18 종목 화면): 정식 종목명으로 회사 기사 5개. 짧은 이름은 안내만 (기사 호출 안 함)
export async function StockNews({ name }: { name: string }) {
  if (isShortName(name)) return <ShortNameNotice name={name} />;
  const result = await getStockNews(name);
  return <NewsBlock title={copy.news.stockTitle} headingId="stock-news-title" result={result} />;
}
