import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { DataTable, type DataColumn } from '@/components/DataTable';
import { PageSizeSelect } from '@/components/PageSizeSelect';
import { Pagination } from '@/components/Pagination';
import { getDivisionName, getIndustryMetrics, type IndustryMetricRow } from '@/lib/data/industry';
import { copy } from '@/lib/copy';
import { formatAccMt, formatPercent } from '@/lib/format';
import { modeYear } from '@/lib/reference-year';
import { pageCountOf } from '@/lib/pagination';
import {
  INDUSTRY_METRIC_SORTS,
  isDivisionCode,
  listHref,
  nextListSort,
  parseListParams,
  type ListState,
  type RawParams,
} from '@/lib/params';

// FS 3-3: 업종 화면 1시간
export const revalidate = 3600;

// generateMetadata와 본문이 같은 요청에서 DB를 두 번 치지 않도록 묶는다
const loadDivisionName = cache(getDivisionName);

type ComparePageProps = {
  params: Promise<{ division: string }>;
  searchParams: Promise<RawParams>;
};

// FS 9-2: 제목 `{중분류 이름} 지표 비교 · 재무 레이더`. 없는 업종은 기본 제목
export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { division } = await params;
  if (!isDivisionCode(division)) return {};
  const name = await loadDivisionName(division);
  if (name === null) return {};
  return { title: copy.industry.compareMeta(name) };
}

// 지표 칸: 금융회사는 지표를 보이지 않으니 '-', 회사 연도가 열 기준 연도와 다르면 칸에 작게 적는다
function metricCell(row: IndustryMetricRow, value: number | null, refYear: number | null) {
  if (row.isFinancial === true || value === null) return '-';
  const text = formatPercent(value) ?? '-';
  if (row.fiscalYear === null || refYear === null || row.fiscalYear === refYear) return text;
  return (
    <>
      {text}
      <span className="ml-1 text-meta text-ink-sub">{copy.industry.yearLabel(row.fiscalYear)}</span>
    </>
  );
}

// 열 정의 (FS 9-2). 지표 열 제목에는 기준 연도(이 목록 fiscal_year 최빈값)를 붙인다
function metricColumns(refYear: number | null): DataColumn<IndustryMetricRow>[] {
  const withYear = (label: string) => (refYear === null ? label : `${label} ${copy.industry.yearLabel(refYear)}`);
  const c = copy.industry.compareColumns;
  return [
    {
      id: 'name',
      header: c.name,
      sortKey: 'name',
      cell: (row) => (
        <>
          <Link href={`/stocks/${row.shortCode}`} className="text-ink underline hover:text-ink-sub">
            {row.name}
          </Link>
          {formatAccMt(row.accMt) && (
            <span className="ml-2 text-meta text-ink-sub">{formatAccMt(row.accMt)}</span>
          )}
        </>
      ),
    },
    { id: 'code', header: c.code, cell: (row) => row.shortCode },
    { id: 'market', header: c.market, cell: (row) => row.market ?? '-' },
    {
      id: 'debt_ratio',
      header: withYear(c.debt),
      sortKey: 'debt_ratio',
      align: 'right',
      cell: (row) => metricCell(row, row.debtRatio, refYear),
    },
    {
      id: 'operating_margin',
      header: withYear(c.margin),
      sortKey: 'operating_margin',
      align: 'right',
      cell: (row) => metricCell(row, row.operatingMargin, refYear),
    },
    {
      id: 'revenue_growth',
      header: withYear(c.growth),
      sortKey: 'revenue_growth',
      align: 'right',
      cell: (row) => metricCell(row, row.revenueGrowth, refYear),
    },
  ];
}

// FS 9-2 `/industries/[division]/compare` (서버): 주소를 읽어 지표 비교 목록을 그린다
export default async function IndustryComparePage({ params, searchParams }: ComparePageProps) {
  const { division } = await params;
  if (!isDivisionCode(division)) notFound();
  const path = `/industries/${division}/compare`;
  const state: ListState = parseListParams(await searchParams, INDUSTRY_METRIC_SORTS);

  const [name, page] = await Promise.all([loadDivisionName(division), getIndustryMetrics(division, state)]);
  if (name === null) notFound();

  if (page.rows.length === 0) {
    if (state.page <= 1) notFound();
    // 쪽을 넘었다: 1쪽으로 전체 수를 얻어 마지막 쪽으로 보낸다 (FS 5-5, 9-2)
    const first = await getIndustryMetrics(division, { ...state, page: 1 });
    if (first.total === 0) notFound();
    redirect(listHref(path, { ...state, page: pageCountOf(first.total, state.size) }));
  }

  const refYear = modeYear(
    page.rows.flatMap((row) => (row.fiscalYear === null ? [] : [row.fiscalYear]))
  );
  const linkState = { path, state };

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{copy.industry.compareTitle(name, page.total)}</h1>
      <div className="mt-4 flex justify-end">
        <PageSizeSelect size={state.size} link={linkState} />
      </div>
      <div className="mt-2">
        <DataTable
          caption={copy.industry.compareCaption}
          columns={metricColumns(refYear)}
          rows={page.rows}
          rowKey={(row) => row.shortCode}
          sort={{ key: state.sort, dir: state.dir }}
          mode="link"
          sortHref={(key) => listHref(path, nextListSort(state, key))}
        />
      </div>
      <Pagination page={state.page} pageCount={pageCountOf(page.total, state.size)} link={linkState} />
    </div>
  );
}
