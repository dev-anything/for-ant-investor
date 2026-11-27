import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { SortHeaderLink } from '@/components/SortHeaderLink';

// FS 7장 DataTable, DESIGN 6-6: PC는 흰 카드 안 표(세로선 없이 행 사이 1px line), 모바일은 같은 열 정의의 카드 목록.
// 래퍼만 가로 스크롤을 허용하고 페이지 전체는 밀리지 않게 한다.

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

function ariaSortOf(isSorted: boolean, dir: SortDir): 'ascending' | 'descending' | 'none' {
  if (!isSorted) return 'none';
  return dir === 'asc' ? 'ascending' : 'descending';
}

// 정렬 방향은 글자(▲▼)가 아니라 lucide 화살표로 보여 준다 (DESIGN 6-6)
function SortIcon({ dir }: { dir: SortDir }) {
  const Icon = dir === 'asc' ? ArrowUp : ArrowDown;
  return <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />;
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
  const isSorted = (key: string) => key === sort.key;

  // PC 머리칸과 모바일 정렬 줄이 같은 열 정의·같은 정렬 동작을 쓰도록 한 곳에서 만든다
  const headerNode = (column: DataColumn<T>) => {
    const key = column.sortKey ?? null;
    if (key === null) return column.header;
    const sorted = isSorted(key);
    if (mode === 'link' && sortHref) {
      return <SortHeaderLink href={sortHref(key)} label={column.header} sorted={sorted} dir={sort.dir} />;
    }
    if (onSort) {
      return (
        <button
          type="button"
          onClick={() => onSort(key)}
          className={`inline-flex items-center gap-1 hover:text-ink ${sorted ? 'font-bold text-ink' : ''}`}
        >
          {column.header}
          {sorted && <SortIcon dir={sort.dir} />}
        </button>
      );
    }
    return column.header;
  };

  // 모바일 카드에서 종목명(첫 열)과 시장·코드는 한 줄에, 나머지 숫자는 "이름 값" 짝으로 둔다 (DESIGN 6-6)
  const metaColumns = columns.filter((column) => column.id === 'code' || column.id === 'market');
  const valueColumns = columns.filter(
    (column) => column.id !== 'name' && column.id !== 'code' && column.id !== 'market'
  );

  return (
    <div className={`max-w-full transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      {/* PC(lg 이상): 표 */}
      <div className="hidden overflow-x-auto rounded-lg bg-surface p-4 sm:p-6 lg:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    column.sortKey != null ? ariaSortOf(isSorted(column.sortKey), sort.dir) : undefined
                  }
                  className={`whitespace-nowrap px-3 py-2 text-meta font-medium text-muted ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {headerNode(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="relative border-b border-line align-top text-ink hover:bg-subtle">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`whitespace-nowrap px-3 py-3 ${
                      column.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일(lg 미만): 같은 열 정의로 만든 카드 목록. 표를 옆으로 밀어 보지 않는다 */}
      <ul className="space-y-2 lg:hidden" aria-label={caption}>
        {columns.some((column) => column.sortKey != null) && (
          <li className="flex flex-wrap items-center gap-2 px-1 text-meta text-muted">
            {columns.map((column) => {
              if (column.sortKey == null) return null;
              return (
                <span key={column.id} className="rounded-full border border-line bg-white px-3 py-1">
                  {headerNode(column)}
                </span>
              );
            })}
          </li>
        )}
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-lg bg-surface p-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold text-ink">{columns[0]?.cell(row)}</span>
              {metaColumns.map((column) => (
                <span key={column.id} className="text-meta text-muted tabular-nums">
                  {column.cell(row)}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {valueColumns.map((column) => (
                <div key={column.id} className="text-sm">
                  <span className="block text-meta text-muted">{column.header}</span>
                  <span className="block tabular-nums text-ink">{column.cell(row)}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
