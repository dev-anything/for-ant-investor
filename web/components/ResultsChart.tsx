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

// DESIGN-remember Colors 액센트: 최신 연도 막대만 오렌지(#FF6A0D), 과거 연도 막대는 회색(#808080)
// 적자 막대는 색상 경고 대신 빗금 패턴으로 채운다
export const LATEST_FILL = '#FF6A0D';
export const PAST_FILL = '#808080';
const CHART_HEIGHT_PX = 200;
// 0 기준선 색 (1px 검정 기준선)
export const BASELINE_STROKE = '#000000';

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
            {/* DESIGN-remember Colors: 적자(음수) 막대용 사선 빗금 패턴. 과거 적자=흰 바탕+검정 사선, 최신 적자=오렌지 바탕+흰 사선 */}
            <defs>
              <pattern
                id={hatchPastId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#FFFFFF" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#000000" strokeWidth="2" />
              </pattern>
              <pattern
                id={hatchLatestId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill="#FF6A0D" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#FFFFFF" strokeWidth="2" />
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
            <Bar dataKey="value" isAnimationActive={false}>
              {bars.map((bar, index) => {
                const isLatest = index === bars.length - 1;
                let fill: string;
                if (bar.isNegative) {
                  // DESIGN-remember: 적자 막대는 빗금 무늬 (url(#...))
                  fill = `url(#${isLatest ? hatchLatestId : hatchPastId})`;
                } else {
                  // 최신 연도 오렌지(#FF6A0D), 과거 연도 회색(#808080)
                  fill = isLatest ? LATEST_FILL : PAST_FILL;
                }
                // D-3: 최신(오렌지) 막대는 흰 바탕 대비 2.87:1이라 검정 1px 외곽; 적자 막대도 검정 1px 외곽
                const stroke = isLatest || bar.isNegative ? '#000000' : undefined;
                return (
                  <Cell key={bar.fiscalYear} fill={fill} stroke={stroke} strokeWidth={1} />
                );
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
      <text x={baseX} y={baseY + 12} textAnchor="middle" fontSize={12} fill="#000000">
        {label}
      </text>
      {isMissing && (
        <text x={baseX} y={baseY + 28} textAnchor="middle" fontSize={11} fill="#424242">
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
    <text x={baseX} y={labelY} textAnchor="middle" fontSize={12} fill="#000000">
      {bar.valueText}
    </text>
  );
}

// 툴팁: 정확한 금액 + 전년 대비 증감률 (그림자 없음, rounded border border-line bg-white text-ink)
function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload?: unknown }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const bar = payload[0].payload as ChartBar | undefined;
  if (!bar) return null;
  return (
    <div className="rounded border border-line bg-white px-3 py-2 text-sm text-ink">
      <p className="font-medium">{bar.label}</p>
      <p className="tabular-nums">{bar.exactText ?? copy.results.notProvided}</p>
      {bar.growthText && <p className="text-ink-sub tabular-nums">{copy.results.growth(bar.growthText)}</p>}
    </div>
  );
}
