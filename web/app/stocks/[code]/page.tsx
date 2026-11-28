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
import { shouldShowReportCard } from '@/lib/report-card';

// FS 3-3: 종목 화면 1시간 캐시
export const revalidate = 3600;

// 빌드 때 미리 만드는 종목 페이지는 없다 (FS 3-3 "요청 시 생성").
// 동적 세그먼트는 이 함수가 있어야 ISR(revalidate)이 적용된다. 빈 배열이면 첫 요청 때 만들고 1시간 캐시한다.
export function generateStaticParams() {
  return [];
}

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

// FS 8-2 status별 화면. DESIGN-V2 2-1: ok일 때 본문은 실적 → 두 단(리포트 | PER·PBR·배당) → 기사·공시
export default async function StockPage({ params }: StockPageProps) {
  const { code } = await params;
  const page = await loadStockPage(code);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-content px-4 py-8">
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
          <StockFeedSection name={page.stock.name} shortCode={page.stock.shortCode} corpCode={page.corpCode} />
        </>
      )}
      {page.status === 'ok' && page.summary && (
        <>
          {/* DESIGN-V2 2-1: 실적은 전체 폭 맨 위. DOM 순서(실적 → 리포트 → PER·PBR → 배당 → 기사·공시)가
              곧 화면 순서이자 읽는 순서다 (2-3, CSS order로 순서를 바꾸지 않는다) */}
          <ResultsCharts
            years={page.years}
            fsDiv={page.summary.fsDiv}
            isFinancial={page.summary.isFinancial}
          />
          {/* 리포트카드가 숨는 금융회사에서는 PER·PBR | 배당 두 칸을 같은 폭으로 놓는다 (DESIGN-V2 2-1) */}
          {shouldShowReportCard(page.summary, page.years, page.industry) ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-6">
              <div className="min-w-0 lg:col-span-2">
                <ReportCard summary={page.summary} years={page.years} industry={page.industry} />
              </div>
              <div className="min-w-0 space-y-4">
                <ValuationSection valuation={page.valuation} industry={page.industry} />
                <DividendCard
                  dividends={page.dividends}
                  displayYears={getDisplayYears(page.years).map((row) => row.fiscalYear)}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6">
              <div className="min-w-0">
                <ValuationSection valuation={page.valuation} industry={page.industry} />
              </div>
              <div className="min-w-0">
                <DividendCard
                  dividends={page.dividends}
                  displayYears={getDisplayYears(page.years).map((row) => row.fiscalYear)}
                />
              </div>
            </div>
          )}
          <StockFeedSection name={page.stock.name} shortCode={page.stock.shortCode} corpCode={page.corpCode} />
        </>
      )}
    </div>
  );
}
