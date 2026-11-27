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

// FS 7장 Gauge, DESIGN.md 6-5: 8px 둥근 막대(bg-line) + 보라 점(16px, 흰 테두리) + 기준선(bg-ink) + 업종 가운데 값(회색 세로 선 + 라벨).
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
      {/* DESIGN.md 6-5: 8px 둥근 막대(bg-line) 위 보라 점. 막대 그림만 role="img"로 묶는다 */}
      <div role="img" aria-label={ariaLabel} className="relative my-3 h-2 rounded-full bg-line">
        {linePct !== null && (
          <div
            className="absolute top-[-6px] bottom-[-6px] w-px -translate-x-1/2 bg-ink"
            style={{ left: `${linePct}%` }}
          />
        )}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand"
          style={{ left: `${pct}%` }}
        />
        {/* 가운데 값: 삼각형 대신 회색 세로 선으로 같은 위치를 알린다 (DESIGN 6-5) */}
        {medianPct !== null && (
          <div
            aria-hidden="true"
            className="absolute top-full mt-1 h-1.5 w-px -translate-x-1/2 bg-muted"
            style={{ left: `${medianPct}%` }}
          />
        )}
      </div>
      <div className="relative mt-1 h-6 text-meta text-muted">
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
        <p className="mt-1 inline-flex items-center gap-1 text-meta text-ink-sub">
          <span>{copy.industry.medianLabel(medianText)}</span>
          <Tooltip text={copy.industry.medianTip(median.n)} label={copy.reportCard.tipButtonLabel} />
        </p>
      )}
    </div>
  );
}
