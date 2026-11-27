import { Gauge } from '@/components/Gauge';
import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import type { StockIndustry } from '@/lib/data/stock';
import { buildValuationRows, valuationBasisText, type StockValuation, type ValuationRow } from '@/lib/valuation';

// FS 9-3 ValuationSection (PRD 4장 F-09), DESIGN.md 4-1 구역 면(bg-surface p-4 md:p-6 rounded), 4-3: 주가 수준 영역.
export function ValuationSection({
  valuation,
  industry,
}: {
  valuation: StockValuation | null;
  industry: StockIndustry | null;
}) {
  const rows = valuation ? buildValuationRows(valuation, industry ? industry.medians : null) : [];

  return (
    <section data-tour="valuation" aria-labelledby="valuation-title" className="mt-8 rounded bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="valuation-title" className="text-xl font-semibold text-ink-sub">
          {copy.valuation.title}
        </h2>
        {valuation && <p className="text-xs font-medium text-ink-sub">{valuationBasisText(valuation)}</p>}
      </div>
      {valuation === null ? (
        <p className="mt-4 text-sm text-ink-sub">{copy.valuation.noPrice}</p>
      ) : (
        <>
          <p className="mt-1 text-xs font-medium text-ink-sub">{copy.valuation.commonShareNote}</p>
          <div className="mt-4">
            {/* 업종 정보가 없으면 지표마다 반복하지 않고 한 번만 알린다 (PRD 4장 F-08) */}
            {industry === null && <p className="py-4 text-sm text-ink-sub">{copy.industry.noIndustry}</p>}
            {rows.map((row) => (
              <ValuationItem key={row.key} row={row} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// 지표 하나 = 제목(툴팁) + 값 + 눈금 + 가운데 값. 값이 없으면 눈금 자리에 사유 문장만 쓴다
function ValuationItem({ row }: { row: ValuationRow }) {
  const median = row.compare.kind === 'ok' ? { value: row.compare.median, n: row.compare.n } : null;

  return (
    <div className="border-t border-line py-4">
      <h3 className="inline-flex flex-wrap items-center gap-1 text-base font-normal text-ink">
        {row.title}
        <Tooltip text={row.tip} label={copy.reportCard.tipButtonLabel} />
      </h3>
      {row.value === null || row.valueText === null ? (
        <p className="mt-2 text-sm text-ink-sub">{row.notice}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink">
            {row.name} <span className="font-bold tabular-nums">{row.valueText}</span>
          </p>
          <Gauge
            gauge={row.key}
            name={row.name}
            value={row.value}
            valueText={row.valueText}
            median={median}
            lineTip={row.lineTip}
          />
          {row.compare.kind === 'too_few' && (
            <p className="mt-2 text-sm text-ink-sub">{copy.industry.tooFew}</p>
          )}
        </>
      )}
    </div>
  );
}
