import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import {
  GAUGES,
  formatGaugeValue,
  gaugeLinePct,
  gaugePosition,
  gaugeUnitSuffix,
  type AnyGaugeKey,
} from '@/lib/gauge';

// FS 7장 Gauge, DESIGN-remember 4-3: 얇은 가로선(bg-muted) + 오렌지 점(bg-accent) + 기준선(bg-ink) + 업종 가운데 값(▲ 눈금 + 라벨).
// value는 저장 값 (재판정 없이 위치만 계산). valueText는 화면과 같은 서식 문자열
// lineTip: 기준선 툴팁 (기준선이 없는 지표는 null이고 기준선 표시도 없다). 단위는 GAUGE_UNIT (F-09 PER·PBR은 배)
export function Gauge({
  gauge,
  name,
  value,
  valueText,
  median,
  lineTip,
}: {
  gauge: AnyGaugeKey;
  name: string;
  value: number;
  valueText: string;
  median?: { value: number; n: number } | null;
  lineTip: string | null;
}) {
  const { min, max, line } = GAUGES[gauge];
  const suffix = gaugeUnitSuffix(gauge);
  const { pct, clamped } = gaugePosition(value, gauge);
  const linePct = gaugeLinePct(gauge);
  const range = copy.reportCard.gauge.range(min, max, suffix);

  // 범위 밖이면 스크린 리더에도 알린다 (점은 끝에 붙는다)
  let ariaLabel = copy.reportCard.gauge.ariaLabel(name, valueText, range);
  if (clamped !== null) ariaLabel += `, ${copy.reportCard.gauge.outOfRange}`;

  const medianText = median ? formatGaugeValue(median.value, gauge) : null;
  const medianPct = median ? gaugePosition(median.value, gauge).pct : null;
  if (median && medianText) ariaLabel += `, ${copy.industry.medianLabel(medianText)}`;

  return (
    <div className="mt-3">
      {/* DESIGN-remember: 얇은 가로선(h-px) + 오렌지 점(bg-accent). 막대 그림만 role="img"로 묶는다 */}
      <div role="img" aria-label={ariaLabel} className="relative my-3 h-px bg-muted">
        {linePct !== null && (
          <div
            className="absolute top-[-6px] bottom-[-6px] w-px -translate-x-1/2 bg-ink"
            style={{ left: `${linePct}%` }}
          />
        )}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent ring-1 ring-ink"
          style={{ left: `${pct}%` }}
        />
        {/* 가운데 값: 막대 아래쪽 ▲ 모양 (검정 한 가지 색상) */}
        {medianPct !== null && (
          <div
            aria-hidden="true"
            className="absolute top-full mt-1 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent border-b-ink"
            style={{ left: `${medianPct}%` }}
          />
        )}
      </div>
      <div className={`relative h-6 text-xs text-ink-sub ${median ? 'mt-3' : 'mt-1'}`}>
        <span className="absolute left-0 top-0 tabular-nums">{`${min}${suffix}`}</span>
        <span className="absolute right-0 top-0 tabular-nums">{`${max}${suffix}`}</span>
        {linePct !== null && line !== null && lineTip !== null && (
          <span
            className="absolute top-0 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap tabular-nums"
            style={{ left: `${linePct}%` }}
          >
            {`${line}${suffix}`}
            <Tooltip text={lineTip} label={copy.reportCard.tipButtonLabel} />
          </span>
        )}
      </div>
      {median && medianText && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-sub">
          <span>
            <span aria-hidden="true">▲ </span>
            {copy.industry.medianLabel(medianText)}
          </span>
          <Tooltip text={copy.industry.medianTip(median.n)} label={copy.reportCard.tipButtonLabel} />
        </p>
      )}
    </div>
  );
}
