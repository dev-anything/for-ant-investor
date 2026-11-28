import { Fragment } from 'react';
import Link from 'next/link';
import { DataTable, type DataColumn, type SortDir } from '@/components/DataTable';
import { copy } from '@/lib/copy';
import { formatAccMt, formatMarketCap } from '@/lib/format';
import type { ScreenerSortKey } from '@/lib/filters';
import type { ScreenerRow } from '@/lib/data/screener';
import { evidenceGroups, readEvidenceGroup, type EvidenceGroup } from '@/lib/screener-view';

// FS 8-3 ResultTable, DESIGN.md 6-6: 고정 열(종목명·코드·시장·시가총액) + 고른 필터의 근거 값 열.
export function ResultTable({
  rows,
  filters,
  refYear,
  sort,
  dimmed,
  onSort,
}: {
  rows: ScreenerRow[];
  filters: number[];
  refYear: number | null;
  sort: { key: ScreenerSortKey; dir: SortDir };
  dimmed: boolean;
  onSort: (key: ScreenerSortKey) => void;
}) {
  const groups = evidenceGroups(filters, refYear);
  const columns: DataColumn<ScreenerRow>[] = [
    {
      id: 'name',
      header: copy.screener.name,
      sortKey: 'name',
      cell: (row) => (
        <Link
          href={`/stocks/${row.shortCode}`}
          className="font-medium text-ink after:absolute after:inset-0 hover:text-brand"
        >
          {row.name}
          {formatAccMt(row.accMt) && (
            <span className="ml-1 text-meta font-normal text-ink-sub">{formatAccMt(row.accMt)}</span>
          )}
        </Link>
      ),
    },
    { id: 'code', header: copy.screener.code, cell: (row) => <span className="tabular-nums">{row.shortCode}</span> },
    { id: 'market', header: copy.screener.market, cell: (row) => row.market ?? '-' },
    {
      id: 'marketCap',
      header: copy.screener.marketCap,
      sortKey: 'market_cap',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatMarketCap(row.marketCap)}</span>,
    },
    ...groups.map((group) => evidenceColumn(group, refYear)),
  ];

  return (
    <DataTable
      caption={copy.screener.tableCaption}
      columns={columns}
      rows={rows}
      rowKey={(row) => row.shortCode}
      sort={sort}
      onSort={(key) => onSort(key as ScreenerSortKey)}
      dimmed={dimmed}
    />
  );
}

// 근거 값 열 하나 → 표 열 하나. 3개년 값을 화살표로 잇고, 회사 연도가 다르면 작은 글자로 실제 연도를 붙인다 (DESIGN-V2 S14, PRD 10장 9번)
function evidenceColumn(group: EvidenceGroup, refYear: number | null): DataColumn<ScreenerRow> {
  return {
    id: group.id,
    header: group.header,
    sortKey: group.sortKey,
    align: 'right',
    cell: (row) => {
      const value = readEvidenceGroup(row, group, refYear);
      return (
        // td의 nowrap을 덮어 좁을 때 값 사이에서 줄바꿈되게 한다. 화살표는 앞 값 span 안에 둬서 줄 맨 앞에 오지 않게 한다 (S14 고침)
        <span className="tabular-nums whitespace-normal">
          {value.parts.map((part, index) => (
            <Fragment key={index}>
              <span className="whitespace-nowrap">
                {index < value.parts.length - 1 ? `${part} →` : part}
              </span>
              {index < value.parts.length - 1 ? ' ' : null}
            </Fragment>
          ))}
          {value.actualRange && (
            <span className="ml-1 whitespace-nowrap text-meta text-ink-sub">{value.actualRange}</span>
          )}
        </span>
      );
    },
  };
}
