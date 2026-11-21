import type { ReactNode } from 'react';
import { SortHeaderLink } from '@/components/SortHeaderLink';

// FS 7장 DataTable: 열 정의 + 행. 정렬 제목 버튼(aria-sort), 넓으면 표 안에서만 가로 스크롤.
// mode: 'button'은 onSort로 상태를 바꾸는 버튼, 'link'는 sortHref가 주는 주소로 가는 링크 (2차 업종 목록, FS 7장)

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
    <div className={`overflow-x-auto transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      <table className="min-w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-neutral-300 text-neutral-700">
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
                  ) :sortKey !== null && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKey)}
                      className="hover:text-neutral-900"
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
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-neutral-200 align-top">
              {columns.map((column) => {
                const alignClass = column.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <td key={column.id} className={`px-3 py-2 whitespace-nowrap ${alignClass}`}>
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
