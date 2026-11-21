'use client';

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

// PRD 4장 F-02: 적자 막대는 빨강이 아니라 옅은 회색으로 구분한다 (무채색만)
// 마이페이지 작은 막대(MiniBars)와 같은 색을 쓰려고 export한다 (FS 9-12)
export const POSITIVE_FILL = '#525252';
export const NEGATIVE_FILL = '#c4c4c4';
const CHART_HEIGHT_PX = 200;
// 0 기준선 색 (FS 8-2: 무채색, 막대 채움보다 진한 회색)
export const BASELINE_STROKE = '#737373';

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

  return (
    <div className="min-w-0">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
          <BarChart data={bars} margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
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
            <Bar dataKey="value" isAnimationActive={false}>
              {bars.map((bar) => (
                <Cell
                  key={bar.fiscalYear}
                  fill={bar.isNegative ? NEGATIVE_FILL : POSITIVE_FILL}
                />
              ))}
              <LabelList content={<ValueLabel bars={bars} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-neutral-800">
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
      <text x={baseX} y={baseY + 12} textAnchor="middle" fontSize={12} fill="#404040">
        {label}
      </text>
      {isMissing && (
        <text x={baseX} y={baseY + 28} textAnchor="middle" fontSize={11} fill="#737373">
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
    <text x={baseX} y={labelY} textAnchor="middle" fontSize={12} fill="#262626">
      {bar.valueText}
    </text>
  );
}

// 툴팁: 정확한 금액 + 전년 대비 증감률 (증감률은 전년 값이 있을 때만)
function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload?: unknown }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const bar = payload[0].payload as ChartBar | undefined;
  if (!bar) return null;
  return (
    <div className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow">
      <p className="font-medium">{bar.label}</p>
      <p>{bar.exactText ?? copy.results.notProvided}</p>
      {bar.growthText && <p className="text-neutral-600">{copy.results.growth(bar.growthText)}</p>}
    </div>
  );
}
