import Link from 'next/link';
import { DataTable, type DataColumn, type SortDir } from '@/components/DataTable';
import { copy } from '@/lib/copy';
import { formatAccMt, formatMarketCap } from '@/lib/format';
import type { ScreenerSortKey } from '@/lib/filters';
import type { ScreenerRow } from '@/lib/data/screener';
import { evidenceSlots, readEvidenceCell, type EvidenceSlot } from '@/lib/screener-view';

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
  const slots = evidenceSlots(filters, refYear);
  const columns: DataColumn<ScreenerRow>[] = [
    {
      id: 'name',
      header: copy.screener.name,
      sortKey: 'name',
      cell: (row) => (
        <Link
          href={`/stocks/${row.shortCode}`}
          className="font-medium text-ink after:absolute after:inset-0 hover:underline"
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
    ...slots.map((slot) => evidenceColumn(slot, refYear)),
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

// 근거 값 칸 하나 → 표 열 하나. 회사 연도가 기준 연도와 다르면 칸에 작은 글자로 실제 연도를 붙인다 (PRD 10장 9번)
function evidenceColumn(slot: EvidenceSlot, refYear: number | null): DataColumn<ScreenerRow> {
  return {
    id: slot.id,
    header: slot.header,
    sortKey: slot.sortKey,
    align: 'right',
    cell: (row) => {
      const cell = readEvidenceCell(row, slot, refYear);
      return (
        <span className="tabular-nums">
          {cell.text}
          {cell.isOtherYear && cell.actualYear !== null && (
            <span className="ml-1 text-meta text-ink-sub">{cell.actualYear}년</span>
          )}
        </span>
      );
    },
  };
}
