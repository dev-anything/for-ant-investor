import { Gauge } from '@/components/Gauge';
import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import type { StockIndustry } from '@/lib/data/stock';
import { formatGaugeValue } from '@/lib/gauge';
import {
  buildValuationRows,
  valuationRowNoteText,
  type StockValuation,
  type ValuationRow,
} from '@/lib/valuation';

// FS 9-3 ValuationSection (PRD 4장 F-09), DESIGN-V2 2-2-3: 행을 MetricRow와 같은 3줄로 만든다.
export function ValuationSection({
  valuation,
  industry,
}: {
  valuation: StockValuation | null;
  industry: StockIndustry | null;
}) {
  const rows = valuation ? buildValuationRows(valuation, industry ? industry.medians : null) : [];

  return (
    <section data-tour="valuation" aria-labelledby="valuation-title" className="rounded-lg bg-surface p-4 sm:p-6">
      <h2 id="valuation-title" className="text-lg font-semibold text-ink">
        {copy.valuation.title}
      </h2>
      {valuation === null ? (
        <p className="mt-4 text-sm text-ink-sub">{copy.valuation.noPrice}</p>
      ) : (
        <div className="mt-4">
          {/* 업종 정보가 없으면 지표마다 반복하지 않고 한 번만 알린다 (PRD 4장 F-08) */}
          {industry === null && <p className="pb-4 text-sm text-ink-sub">{copy.industry.noIndustry}</p>}
          {rows.map((row) => (
            <ValuationItem
              key={row.key}
              row={row}
              year={valuation.latestYear}
              note={valuationRowNoteText(valuation)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// 줄 1 = 제목(툴팁) | 값, 줄 2 = 눈금(점 1개), 줄 3 = 기준일·보통주 안내 | 업종 값(툴팁).
// 값이 없으면 눈금 자리에 사유 문장만 둔다 (FS 9-3).
function ValuationItem({ row, year, note }: { row: ValuationRow; year: number; note: string }) {
  const median = row.compare.kind === 'ok' ? { value: row.compare.median, n: row.compare.n } : null;
  const medianText = median ? formatGaugeValue(median.value, row.key) : null;

  return (
    <div className="border-t border-line py-4">
      {/* 좁은 오른쪽 단에서도 제목이 줄바꿈되어도 ⓘ는 첫 줄 오른쪽에 남는다 (DESIGN-V2 2-4) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:flex-nowrap">
        <h3 className="flex min-w-0 flex-1 items-start gap-1 text-base font-semibold text-ink">
          <span className="min-w-0 flex-1">{row.title}</span>
          <span className="shrink-0">
            <Tooltip text={row.tip} label={copy.reportCard.tipButtonLabel} />
          </span>
        </h3>
        <p className="flex shrink-0 items-center gap-2">
          <span className="sr-only">{row.name}</span>
          <span className="text-xl font-bold tabular-nums text-ink">{row.valueText}</span>
        </p>
      </div>
      {row.value === null || row.valueText === null ? (
        <p className="mt-3 text-sm text-ink-sub">{row.notice}</p>
      ) : (
        <Gauge
          gauge={row.key}
          name={row.name}
          points={[{ year, value: row.value }]}
          median={median}
          lineTip={row.lineTip}
          compact
        />
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:flex-nowrap">
        <p className="min-w-0 flex-1 text-meta text-ink-sub">{note}</p>
        {median && medianText && (
          <p className="inline-flex shrink-0 items-center gap-1 text-meta text-ink-sub">
            <span>{copy.industry.medianShort(medianText)}</span>
            <Tooltip text={copy.industry.medianTip(median.n)} label={copy.reportCard.tipButtonLabel} />
          </p>
        )}
      </div>
      {row.compare.kind === 'too_few' && row.value !== null && (
        <p className="mt-2 text-sm text-ink-sub">{copy.industry.tooFew}</p>
      )}
    </div>
  );
}
