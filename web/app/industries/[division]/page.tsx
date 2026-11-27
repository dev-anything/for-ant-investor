import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { DataTable, type DataColumn } from '@/components/DataTable';
import { PageSizeSelect } from '@/components/PageSizeSelect';
import { Pagination } from '@/components/Pagination';
import { getDivisionName, getIndustryCompanies, type IndustryCompanyRow } from '@/lib/data/industry';
import { copy } from '@/lib/copy';
import { formatAccMt, formatMarketCap } from '@/lib/format';
import { pageCountOf } from '@/lib/pagination';
import {
  INDUSTRY_COMPANY_SORTS,
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

type CompaniesPageProps = {
  params: Promise<{ division: string }>;
  searchParams: Promise<RawParams>;
};

// FS 9-7: 제목 `{중분류 이름} 회사 목록 · 재무 레이더`. 없는 업종은 기본 제목
export async function generateMetadata({ params }: CompaniesPageProps): Promise<Metadata> {
  const { division } = await params;
  if (!isDivisionCode(division)) return {};
  const name = await loadDivisionName(division);
  if (name === null) return {};
  return { title: copy.industry.companyMeta(name) };
}

// 열 정의 (FS 9-7). 종목명은 링크, 결산월은 12월이 아닐 때만 옆에 붙는다 (formatAccMt가 판정)
const COMPANY_COLUMNS: DataColumn<IndustryCompanyRow>[] = [
  {
    id: 'name',
    header: copy.industry.companyColumns.name,
    sortKey: 'name',
    cell: (row) => (
      <>
        <Link href={`/stocks/${row.shortCode}`} className="text-ink underline hover:text-ink-sub">
          {row.name}
        </Link>
        {formatAccMt(row.accMt) && <span className="ml-2 text-xs text-ink-sub">{formatAccMt(row.accMt)}</span>}
      </>
    ),
  },
  { id: 'code', header: copy.industry.companyColumns.code, cell: (row) => row.shortCode },
  { id: 'market', header: copy.industry.companyColumns.market, cell: (row) => row.market ?? '-' },
  {
    id: 'market_cap',
    header: copy.industry.companyColumns.marketCap,
    sortKey: 'market_cap',
    align: 'right',
    cell: (row) => formatMarketCap(row.marketCap),
  },
];

// FS 9-7 `/industries/[division]` (서버): 주소를 읽어 회사 목록을 그린다
export default async function IndustryCompaniesPage({ params, searchParams }: CompaniesPageProps) {
  const { division } = await params;
  if (!isDivisionCode(division)) notFound();
  const path = `/industries/${division}`;
  const state: ListState = parseListParams(await searchParams, INDUSTRY_COMPANY_SORTS);

  const [name, page] = await Promise.all([loadDivisionName(division), getIndustryCompanies(division, state)]);
  if (name === null) notFound();

  if (page.rows.length === 0) {
    if (state.page <= 1) notFound();
    // 쪽을 넘었다: 1쪽으로 전체 수를 얻어 마지막 쪽으로 보낸다 (FS 9-7)
    const first = await getIndustryCompanies(division, { ...state, page: 1 });
    if (first.total === 0) notFound();
    redirect(listHref(path, { ...state, page: pageCountOf(first.total, state.size) }));
  }

  // 기준일은 행의 bas_dt 중 처음 있는 값 (모두 null이면 줄을 생략한다)
  const basDt = page.rows.map((row) => row.basDt).find((d): d is string => d !== null) ?? null;
  const linkState = { path, state };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">{copy.industry.companyTitle(name, page.total)}</h1>
        <Link
          href={`/industries/${division}/compare`}
          className="text-sm text-ink underline underline-offset-2 hover:text-ink-sub"
        >
          {copy.industry.compareFromList}
        </Link>
      </div>
      {basDt !== null && <p className="mt-1 text-xs text-ink-sub">{copy.industry.marketCapBasis(basDt)}</p>}
      <div className="mt-4 flex justify-end">
        <PageSizeSelect size={state.size} link={linkState} />
      </div>
      <div className="mt-2">
        <DataTable
          caption={copy.industry.companyCaption}
          columns={COMPANY_COLUMNS}
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
