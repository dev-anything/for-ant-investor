import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { buildDividendTable, type DividendCell, type DividendRow } from '@/lib/dividend';

// FS 9-4 DividendCard (PRD 4장 F-14), DESIGN.md 5-2 흰 카드(rounded-lg, p-4 sm:p-6), 6-6: 배당 카드.
export function DividendCard({
  dividends,
  displayYears,
}: {
  dividends: DividendRow[];
  displayYears: number[];
}) {
  const table = buildDividendTable(dividends, displayYears);

  return (
    <section data-tour="dividend" aria-labelledby="dividend-title" className="rounded-lg bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="dividend-title" className="text-lg font-semibold text-ink">
          {copy.dividend.title}
        </h2>
        {table.kind === 'table' && (
          <p className="text-meta text-ink-sub">{copy.dividend.basis(table.sourceYear)}</p>
        )}
      </div>

      {table.kind === 'no_data' && <p className="mt-4 text-sm text-ink-sub">{copy.dividend.noData}</p>}
      {table.kind === 'all_none' && <p className="mt-4 text-sm text-ink-sub">{copy.dividend.allNone}</p>}

      {table.kind === 'table' && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 text-left font-normal" />
                {table.columns.map((col) => (
                  <th key={col.year} scope="col" className="py-2 text-right font-semibold tabular-nums text-ink">
                    {col.year}년
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-2 text-left font-normal text-ink">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {copy.dividend.rowDps}
                    <Tooltip text={copy.dividend.rowDpsTip} label={copy.reportCard.tipButtonLabel} />
                  </span>
                </th>
                {table.columns.map((col) => (
                  <DividendTd key={col.year} cell={col.dps} />
                ))}
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 pr-2 text-left font-normal text-ink">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    {copy.dividend.rowYield}
                    <Tooltip text={copy.dividend.rowYieldTip} label={copy.reportCard.tipButtonLabel} />
                  </span>
                </th>
                {table.columns.map((col) => (
                  <DividendTd key={col.year} cell={col.yield} />
                ))}
              </tr>
            </tbody>
          </table>

          <div className="space-y-1 py-3 text-meta text-ink-sub">
            <p>{copy.dividend.note}</p>
            <p>
              {copy.dividend.noteRecordDatePrefix}
              <span className="inline-flex items-center gap-1">
                {copy.dividend.noteRecordDate}
                <Tooltip text={copy.dividend.noteRecordDateTip} label={copy.reportCard.tipButtonLabel} />
              </span>
              {copy.dividend.noteRecordDateSuffix}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// 칸 하나. 툴팁이 있는 칸(예: "공시 없음")만 버튼을 붙인다
function DividendTd({ cell }: { cell: DividendCell }) {
  return (
    <td className="py-3 text-right tabular-nums text-ink">
      {cell.tooltip === null ? (
        cell.text
      ) : (
        <span className="inline-flex items-center justify-end gap-1">
          {cell.text}
          <Tooltip text={cell.tooltip} label={copy.reportCard.tipButtonLabel} />
        </span>
      )}
    </td>
  );
}
