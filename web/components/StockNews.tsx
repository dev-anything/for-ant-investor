import { NewsBlock } from '@/components/NewsBlock';
import { copy } from '@/lib/copy';
import { getStockNews } from '@/lib/data/news';

// FS 9-6 StockNews (PRD 4장 F-18 종목 화면): `{종목명} {종목코드}`로 회사 기사 5개 (2026-11-23 사용자 결정). 모든 종목이 기사를 부른다
export async function StockNews({ name, shortCode }: { name: string; shortCode: string }) {
  const result = await getStockNews(name, shortCode);
  return <NewsBlock title={copy.news.stockTitle} headingId="stock-news-title" result={result} />;
}
