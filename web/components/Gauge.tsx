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

// FS 7장 Gauge: 가로 막대 + 점(이 회사) + 기준선(툴팁) + 업종 가운데 값(▲ 눈금 + 라벨 + 툴팁).
// 색 없이 모양(점·세로 선·▲)으로 구분한다 (PRD 8장)
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
      {/* 막대 그림만 role="img"로 묶는다. 툴팁 버튼은 안에 두지 않는다 (img 안 버튼은 읽히지 않음) */}
      <div role="img" aria-label={ariaLabel} className="relative h-3 rounded-full bg-neutral-200">
        {linePct !== null && (
          <div
            className="absolute top-[-4px] bottom-[-4px] w-px -translate-x-1/2 bg-neutral-700"
            style={{ left: `${linePct}%` }}
          />
        )}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900"
          style={{ left: `${pct}%` }}
        />
        {/* 가운데 값: 막대 아래쪽 ▲ 모양 (점과 모양이 달라 색 없이 구분) */}
        {medianPct !== null && (
          <div
            aria-hidden="true"
            className="absolute top-full mt-1 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent border-b-neutral-700"
            style={{ left: `${medianPct}%` }}
          />
        )}
      </div>
      <div className={`relative h-6 text-xs text-neutral-600 ${median ? 'mt-3' : 'mt-1'}`}>
        <span className="absolute left-0 top-0">{`${min}${suffix}`}</span>
        <span className="absolute right-0 top-0">{`${max}${suffix}`}</span>
        {linePct !== null && line !== null && lineTip !== null && (
          <span
            className="absolute top-0 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap"
            style={{ left: `${linePct}%` }}
          >
            {`${line}${suffix}`}
            <Tooltip text={lineTip} label={copy.reportCard.tipButtonLabel} />
          </span>
        )}
      </div>
      {median && medianText && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-700">
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
