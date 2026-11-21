import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { GAUGES, gaugeLinePct, gaugePosition, type GaugeKey } from '@/lib/gauge';

// FS 7장 Gauge: 가로 막대 + 점(이 회사) + 기준선(툴팁). 색 없이 모양(점·세로 선)으로 구분한다 (PRD 8장)
// value는 Y3 저장 값 (재판정 없이 위치만 계산). valueText는 화면과 같은 소수 1자리 문자열
export function Gauge({
  gauge,
  name,
  value,
  valueText,
}: {
  gauge: GaugeKey;
  name: string;
  value: number;
  valueText: string;
}) {
  const { min, max, line } = GAUGES[gauge];
  const { pct, clamped } = gaugePosition(value, gauge);
  const linePct = gaugeLinePct(gauge);
  const range = copy.reportCard.gauge.range(`${min}%`, `${max}%`);

  // 범위 밖이면 스크린 리더에도 알린다 (점은 끝에 붙는다)
  let ariaLabel = copy.reportCard.gauge.ariaLabel(name, valueText, range);
  if (clamped !== null) ariaLabel += `, ${copy.reportCard.gauge.outOfRange}`;

  return (
    <div className="mt-3">
      {/* 막대 그림만 role="img"로 묶는다. 툴팁 버튼은 안에 두지 않는다 (img 안 버튼은 읽히지 않음) */}
      <div role="img" aria-label={ariaLabel} className="relative h-3 rounded-full bg-neutral-200">
        <div
          className="absolute top-[-4px] bottom-[-4px] w-px -translate-x-1/2 bg-neutral-700"
          style={{ left: `${linePct}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-neutral-900"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="relative mt-1 h-6 text-xs text-neutral-600">
        <span className="absolute left-0 top-0">{min}%</span>
        <span className="absolute right-0 top-0">{max}%</span>
        <span
          className="absolute top-0 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap"
          style={{ left: `${linePct}%` }}
        >
          {line}%
          <Tooltip text={copy.reportCard.lineTip[gauge]} label={copy.reportCard.tipButtonLabel} />
        </span>
      </div>
    </div>
  );
}
