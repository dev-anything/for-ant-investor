import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import {
  GAUGES,
  dotsOverlap,
  formatGaugeValue,
  gaugeAriaLabel,
  gaugeDots,
  gaugeLinePct,
  gaugePosition,
  gaugeUnitSuffix,
  type AnyGaugeKey,
} from '@/lib/gauge';

// FS 7장 Gauge, DESIGN-V2 2-2-1: 8px 둥근 막대(bg-line) + 3개년 점 + 2px 잇는 선 + 기준선(bg-ink).
// 서버 컴포넌트라 실제 폭을 못 재서 PC(1440) 막대 폭으로 근사.
// 좁은 화면에서 남는 짧은 선은 점 아래에 가려진다.
const GAUGE_OVERLAP_WIDTH_PX = 720;

// points는 화면 연도 순서(오래된 → 최근)다. 값이 없는 연도는 점을 그리지 않고 aria-label에는 남긴다.
// median은 짧은 회색 선만 그리고 라벨은 MetricRow 3줄째로 옮겼다 (DESIGN-V2 2-2-1).
// lineTip: 기준선 툴팁 (기준선이 없는 지표는 null이고 기준선 표시도 없다). 단위는 GAUGE_UNIT.
export function Gauge({
  gauge,
  name,
  points,
  median,
  lineTip,
}: {
  gauge: AnyGaugeKey;
  name: string;
  points: { year: number; value: number | null }[];
  median?: { value: number; n: number } | null;
  lineTip: string | null;
}) {
  const { min, max, line } = GAUGES[gauge];
  const suffix = gaugeUnitSuffix(gauge);
  const dots = gaugeDots(points, gauge);
  const linePct = gaugeLinePct(gauge);
  const latestDot = dots[dots.length - 1] ?? null;
  const medianText = median ? formatGaugeValue(median.value, gauge) : null;
  const medianPct = median ? gaugePosition(median.value, gauge).pct : null;
  const ariaLabel = gaugeAriaLabel(name, points, gauge, dots, medianText);

  // 점 사이가 4px 이내면 잇는 선을 생략한다 (DESIGN-V2 2-2-1, lib/gauge.ts dotsOverlap).
  const segments = dots.slice(1).flatMap((dot, index) => {
    const prev = dots[index];
    if (dotsOverlap(prev, dot, GAUGE_OVERLAP_WIDTH_PX)) return [];
    return [{ key: dot.year, left: Math.min(prev.pct, dot.pct), width: Math.abs(dot.pct - prev.pct) }];
  });
  const hasLine = segments.length > 0;
  // 화살촉은 최신 점 쪽 끝에 붙인다. 최신 점이 왼쪽이면 화살촉도 왼쪽을 가리킨다.
  const previousDot = dots[dots.length - 2] ?? null;
  const pointsRight = latestDot !== null && previousDot !== null && latestDot.pct >= previousDot.pct;
  const arrowClass = pointsRight
    ? 'border-y-[4px] border-y-transparent border-l-[6px] border-l-muted'
    : 'border-y-[4px] border-y-transparent border-r-[6px] border-r-muted';
  const arrowTransform = pointsRight ? 'translate(-14px, -50%)' : 'translate(8px, -50%)';

  return (
    <div className="mt-3">
      {/* DESIGN-V2 2-2-1: 막대 그림만 role="img"로 묶고 연도별 값은 aria-label에 담는다 */}
      <div role="img" aria-label={ariaLabel} className="relative my-3 h-2 rounded-full bg-line">
        {linePct !== null && (
          <div
            aria-hidden="true"
            className="absolute top-[-6px] bottom-[-6px] w-px -translate-x-1/2 bg-ink"
            style={{ left: `${linePct}%` }}
          />
        )}
        {segments.map((segment) => (
          <div
            key={segment.key}
            aria-hidden="true"
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-muted"
            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
          />
        ))}
        {hasLine && latestDot !== null && (
          <div
            aria-hidden="true"
            className={`absolute top-1/2 h-0 w-0 ${arrowClass}`}
            style={{ left: `${latestDot.pct}%`, transform: arrowTransform }}
          />
        )}
        {dots.map((dot) =>
          dot.latest ? (
            <div
              key={dot.year}
              aria-hidden="true"
              className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand"
              style={{ left: `${dot.pct}%` }}
            />
          ) : (
            <div
              key={dot.year}
              aria-hidden="true"
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-bar-past"
              style={{ left: `${dot.pct}%` }}
            />
          ),
        )}
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
    </div>
  );
}
