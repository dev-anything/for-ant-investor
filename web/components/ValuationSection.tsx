import { Gauge } from '@/components/Gauge';
import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import type { StockIndustry } from '@/lib/data/stock';
import { buildValuationRows, valuationBasisText, type StockValuation, type ValuationRow } from '@/lib/valuation';

// FS 9-3 ValuationSection (PRD 4장 F-09): 주가 수준 영역. 서버 컴포넌트, 계산은 lib/valuation.ts가 맡는다.
// 리포트카드와 분리된 별도 영역 (실적 그래프 아래). 평가하는 글자 판정과 비교 한 줄은 쓰지 않는다 (FS 12장 동작 기본안 1번)
// data-tour="valuation"은 13단계 읽는 순서 안내가 이 영역을 짚을 때 쓴다 (FS 9-1)
export function ValuationSection({
  valuation,
  industry,
}: {
  valuation: StockValuation | null;
  industry: StockIndustry | null;
}) {
  const rows = valuation ? buildValuationRows(valuation, industry ? industry.medians : null) : [];

  return (
    <section data-tour="valuation" aria-labelledby="valuation-title" className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="valuation-title" className="text-lg font-bold text-neutral-900">
          {copy.valuation.title}
        </h2>
        {valuation && <p className="text-xs text-neutral-600">{valuationBasisText(valuation)}</p>}
      </div>
      <p className="mt-1 text-xs text-neutral-600">{copy.valuation.commonShareNote}</p>

      {valuation === null ? (
        <p className="mt-4 text-sm text-neutral-700">{copy.valuation.noPrice}</p>
      ) : (
        <div className="mt-4 rounded border border-neutral-300 px-4">
          {/* 업종 정보가 없으면 지표마다 반복하지 않고 한 번만 알린다 (PRD 4장 F-08) */}
          {industry === null && <p className="py-4 text-sm text-neutral-700">{copy.industry.noIndustry}</p>}
          {rows.map((row) => (
            <ValuationItem key={row.key} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

// 지표 하나 = 제목(툴팁) + 값 + 눈금 + 가운데 값. 값이 없으면 눈금 자리에 사유 문장만 쓴다
function ValuationItem({ row }: { row: ValuationRow }) {
  const median = row.compare.kind === 'ok' ? { value: row.compare.median, n: row.compare.n } : null;

  return (
    <div className="border-t border-neutral-200 py-4">
      <h3 className="inline-flex flex-wrap items-center gap-1 text-base font-semibold text-neutral-900">
        {row.title}
        <Tooltip text={row.tip} label={copy.reportCard.tipButtonLabel} />
      </h3>
      {row.value === null || row.valueText === null ? (
        <p className="mt-2 text-sm text-neutral-700">{row.notice}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-neutral-800">
            {row.name} <span className="font-bold">{row.valueText}</span>
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
            <p className="mt-2 text-sm text-neutral-700">{copy.industry.tooFew}</p>
          )}
        </>
      )}
    </div>
  );
}
