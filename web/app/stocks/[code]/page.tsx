import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ReportCard } from '@/components/ReportCard';
import { ResultsCharts } from '@/components/ResultsCharts';
import { DividendCard } from '@/components/DividendCard';
import { ValuationSection } from '@/components/ValuationSection';
import { StockFeedSection } from '@/components/StockFeedSection';
import { StockHeader } from '@/components/StockHeader';
import { getStockPage } from '@/lib/data/stock';
import { getDisplayYears } from '@/lib/chart-data';
import { copy } from '@/lib/copy';

// FS 3-3: 종목 화면 1시간 캐시
export const revalidate = 3600;

// generateMetadata와 본문이 같은 요청에서 DB를 두 번 치지 않도록 묶는다
const loadStockPage = cache(getStockPage);

type StockPageProps = { params: Promise<{ code: string }> };

// FS 8-2: 제목 `{종목명} ({code}) · 재무 레이더`. 없는 종목은 기본 제목을 쓴다
export async function generateMetadata({ params }: StockPageProps): Promise<Metadata> {
  const { code } = await params;
  const page = await loadStockPage(code);
  if (!page) return {};
  return { title: copy.meta.stockTitle(page.stock.name, page.stock.shortCode) };
}

// FS 8-2 status별 화면. ok일 때 본문은 리포트카드(3b) 다음 실적 그래프(2b)
export default async function StockPage({ params }: StockPageProps) {
  const { code } = await params;
  const page = await loadStockPage(code);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 알림 띠·읽는 순서 버튼은 재무 화면(ok)에서만 (PRD 4장 F-16, 재무 없음·외국회사는 없음) */}
      <StockHeader
        stock={page.stock}
        // 외국회사 제외 (PRD F-12): 재무 있음·재무 없음에서만 추적 버튼
        watchable={page.status !== 'foreign'}
        readingTour={page.status === 'ok' && page.summary ? { isFinancial: page.summary.isFinancial } : undefined}
      />
      {page.status === 'foreign' && <EmptyState message={copy.stock.foreign} />}
      {page.status === 'no_financials' && (
        <>
          <EmptyState message={copy.stock.noFinancials} />
          {/* PRD 10장 26번: 재무 없음 화면에도 기사·공시 칸은 둔다 */}
          <StockFeedSection name={page.stock.name} corpCode={page.corpCode} />
        </>
      )}
      {page.status === 'ok' && page.summary && (
        <>
          <ReportCard summary={page.summary} years={page.years} industry={page.industry} />
          <ResultsCharts
            years={page.years}
            fsDiv={page.summary.fsDiv}
            isFinancial={page.summary.isFinancial}
          />
          <ValuationSection valuation={page.valuation} industry={page.industry} />
          <DividendCard
            dividends={page.dividends}
            displayYears={getDisplayYears(page.years).map((row) => row.fiscalYear)}
          />
          <StockFeedSection name={page.stock.name} corpCode={page.corpCode} />
        </>
      )}
    </div>
  );
}
