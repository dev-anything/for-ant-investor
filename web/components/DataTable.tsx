import type { ReactNode } from 'react';
import { SortHeaderLink } from '@/components/SortHeaderLink';

// FS 7장 DataTable, DESIGN.md 4-7, 5-5: 가는 가로선만 (border-b border-line), 세로선·줄무늬 없음, 숫자 text-right tabular-nums.
// 래퍼만 overflow-x-auto, 페이지 전체는 밀리지 않게 한다.

export type SortDir = 'asc' | 'desc';

export interface DataColumn<T> {
  id: string;
  header: string;
  sortKey?: string | null; // 정렬할 수 있는 열이면 키, 아니면 없음
  align?: 'left' | 'right';
  cell: (row: T) => ReactNode;
}

export interface DataSort {
  key: string;
  dir: SortDir;
}

interface DataTableProps<T> {
  caption: string;
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort: DataSort;
  mode?: 'button' | 'link';
  onSort?: (key: string) => void;
  sortHref?: (key: string) => string;
  dimmed?: boolean; // 조회 중에는 흐리게 (내용은 그대로 둔다)
}

// 오른쪽 화살표 글자: 정렬 중인 열에만 방향을 붙인다
function arrowOf(isSorted: boolean, dir: SortDir): string {
  if (!isSorted) return '';
  return dir === 'asc' ? ' ▲' : ' ▼';
}

function ariaSortOf(isSorted: boolean, dir: SortDir): 'ascending' | 'descending' | 'none' {
  if (!isSorted) return 'none';
  return dir === 'asc' ? 'ascending' : 'descending';
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  mode = 'button',
  onSort,
  sortHref,
  dimmed = false,
}: DataTableProps<T>) {
  return (
    <div className={`max-w-full overflow-x-auto transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      <table className="min-w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-ink-sub">
            {columns.map((column) => {
              const sortKey = column.sortKey ?? null;
              const sortable = sortKey !== null;
              const isSorted = sortKey !== null && sortKey === sort.key;
              const alignClass = column.align === 'right' ? 'text-right' : 'text-left';
              const label = `${column.header}${arrowOf(isSorted, sort.dir)}`;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={sortable ? ariaSortOf(isSorted, sort.dir) : undefined}
                  className={`whitespace-nowrap px-3 py-2 font-semibold ${alignClass}`}
                >
                  {sortKey !== null && mode === 'link' && sortHref ? (
                    <SortHeaderLink href={sortHref(sortKey)} label={label} />
                  ) : sortKey !== null && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKey)}
                      className="hover:decoration-2"
                    >
                      {label}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-lite">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="align-top text-ink">
              {columns.map((column) => {
                const alignClass = column.align === 'right' ? 'text-right tabular-nums' : 'text-left';
                return (
                  <td key={column.id} className={`whitespace-nowrap px-3 py-2 ${alignClass}`}>
                    {column.cell(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
