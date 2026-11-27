'use client';

import { useId } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartBar, ChartMetric } from '@/lib/chart-data';
import { getAxisDomain } from '@/lib/chart-data';
import { copy } from '@/lib/copy';
import { Tooltip } from '@/components/Tooltip';

// DESIGN.md 6-4: 최신 연도는 보라, 과거 연도는 연회색. 적자는 빗금으로 구분한다 (색으로 좋고 나쁨을 말하지 않음)
// SVG 속성에 var()를 직접 넣지 않고 style로 넘긴다 (Tailwind @theme 토큰을 그대로 씀)
export const LATEST_FILL = 'var(--color-brand)';
export const PAST_FILL = 'var(--color-bar-past)';
const CHART_HEIGHT_PX = 200;
// 0 기준선은 축선 색, 빗금 선은 흰 카드 색 (DESIGN 2-1)
export const BASELINE_STROKE = 'var(--color-line)';
export const HATCH_STROKE = 'var(--color-surface)';
const VALUE_LABEL_FILL = 'var(--color-ink-sub)';
const TICK_FILL = 'var(--color-muted)';

// 막대 위(양수)·아래(음수) 값 라벨 자리 (px)
const LABEL_GAP_PX = 6;

interface ResultsChartProps {
  metric: ChartMetric;
  bars: ChartBar[];
}

/** 항목 하나의 막대그래프 + 같은 값을 담은 시각적으로 숨긴 표 (PRD 4장 F-02 접근성). */
export function ResultsChart({ metric, bars }: ResultsChartProps) {
  const title = copy.results.metricTitle[metric];
  const domain = getAxisDomain(bars);

  // SVG 패턴 id가 화면 내 여러 차트 간에 충돌하지 않도록 고유 접두사 생성
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hatchPastId = `hatch-past-${uid}`;
  const hatchLatestId = `hatch-latest-${uid}`;

  return (
    <div className="min-w-0">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
          <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
            {/* DESIGN.md 6-4: 적자(음수) 막대용 45° 사선 빗금 패턴 */}
            <defs>
              <pattern
                id={hatchPastId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" style={{ fill: PAST_FILL }} />
                <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: HATCH_STROKE }} strokeWidth="2" />
              </pattern>
              <pattern
                id={hatchLatestId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" style={{ fill: LATEST_FILL }} />
                <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: HATCH_STROKE }} strokeWidth="2" />
              </pattern>
            </defs>

            {/* 세로축 숫자는 숨기고 막대 위 값 라벨만 쓴다. 0을 항상 포함한다 */}
            <YAxis hide domain={domain} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<YearTick bars={bars} />}
              height={44}
            />
            {/* 0 기준선: 모든 값이 양수여도 그래프 바닥에 선이 보이게 한다 (FS 8-2) */}
            <ReferenceLine y={0} stroke={BASELINE_STROKE} strokeWidth={1} ifOverflow="extendDomain" />
            <ChartTooltip cursor={false} content={<BarTooltip />} />
            <Bar dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]}>
              {bars.map((bar, index) => {
                const isLatest = index === bars.length - 1;
                let fill: string;
                if (bar.isNegative) {
                  // DESIGN 6-4: 적자 막대는 빗금 무늬 (url(#...))
                  fill = `url(#${isLatest ? hatchLatestId : hatchPastId})`;
                } else {
                  // DESIGN 6-4: 최신 연도는 보라, 과거 연도는 연회색
                  fill = isLatest ? LATEST_FILL : PAST_FILL;
                }
                return <Cell key={bar.fiscalYear} style={{ fill }} />;
              })}
              <LabelList content={<ValueLabel bars={bars} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-ink">
        {title}
        {/* PRD 4장 F-02: 순이익 제목 옆 정식 이름 툴팁 */}
        {metric === 'netIncome' && (
          <Tooltip text={copy.results.netIncomeTip} label={copy.results.tipButtonLabel} />
        )}
      </h3>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.results.yearHeader}</th>
            <th scope="col">{title}</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.fiscalYear}>
              <th scope="row">{bar.label}</th>
              <td>{bar.exactText ?? copy.results.notProvided}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// X축 연도 라벨. 값이 null인 연도는 두 번째 줄에 "제공되지 않음"을 적는다 (PRD 4장 F-02 예외)
function YearTick({
  x,
  y,
  payload,
  bars,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  bars: ChartBar[];
}) {
  const label = payload?.value ?? '';
  const bar = bars.find((item) => item.label === label);
  const isMissing = bar !== undefined && bar.value === null;
  const baseX = Number(x ?? 0);
  const baseY = Number(y ?? 0);
  return (
    <g>
      <text x={baseX} y={baseY + 12} textAnchor="middle" fontSize={12} style={{ fill: TICK_FILL }}>
        {label}
      </text>
      {isMissing && (
        <text x={baseX} y={baseY + 28} textAnchor="middle" fontSize={11} style={{ fill: TICK_FILL }}>
          {copy.results.notProvided}
        </text>
      )}
    </g>
  );
}

// 막대 위·아래 값 라벨 (적자는 막대 아래에 둔다)
function ValueLabel({
  x,
  y,
  width,
  height,
  index,
  bars,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
  bars: ChartBar[];
}) {
  const bar = index === undefined ? undefined : bars[index];
  if (!bar || bar.valueText === null) return null;
  const baseX = Number(x ?? 0) + Number(width ?? 0) / 2;
  const top = Number(y ?? 0);
  const bottom = top + Number(height ?? 0);
  const labelY = bar.isNegative ? bottom + LABEL_GAP_PX + 10 : top - LABEL_GAP_PX;
  return (
    <text x={baseX} y={labelY} textAnchor="middle" fontSize={13} style={{ fill: VALUE_LABEL_FILL }}>
      {bar.valueText}
    </text>
  );
}

// 툴팁: 정확한 금액 + 전년 대비 증감률 (DESIGN 6-10 흰 팝오버, 12px 모서리, border-line)
function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload?: unknown }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const bar = payload[0].payload as ChartBar | undefined;
  if (!bar) return null;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink">
      <p className="font-medium">{bar.label}</p>
      <p className="tabular-nums">{bar.exactText ?? copy.results.notProvided}</p>
      {bar.growthText && <p className="text-ink-sub tabular-nums">{copy.results.growth(bar.growthText)}</p>}
    </div>
  );
}
