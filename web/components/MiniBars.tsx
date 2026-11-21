'use client';

// FS 9-12 MiniBars: 추적 카드의 작은 막대 묶음 (PRD F-12, F-02와 같은 기준·단위).
// 값 라벨은 없고, 같은 값을 담은 시각적으로 숨긴 표를 붙인다 (F-02 접근성 규칙과 같음).
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BASELINE_STROKE, NEGATIVE_FILL, POSITIVE_FILL } from '@/components/ResultsChart';
import { getAxisDomain } from '@/lib/chart-data';
import { copy } from '@/lib/copy';
import type { MiniChart } from '@/lib/mypage';

// 카드 안에서 세 막대가 한 줄에 들어가는 높이 (px). 실적 그래프(200px)보다 작다
const MINI_CHART_HEIGHT_PX = 72;

interface MiniBarsProps {
  charts: MiniChart[];
}

export function MiniBars({ charts }: MiniBarsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {charts.map((chart) => (
        <MiniBar key={chart.metric} chart={chart} />
      ))}
    </div>
  );
}

// 막대 하나. 적자 막대는 빨강이 아니라 옅은 회색 (PRD 4장 F-02)
function MiniBar({ chart }: { chart: MiniChart }) {
  const domain = getAxisDomain(chart.bars);
  return (
    <div className="min-w-0">
      <div className="w-full" style={{ height: MINI_CHART_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height={MINI_CHART_HEIGHT_PX}>
          <BarChart data={chart.bars} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
            <YAxis hide domain={domain} />
            <XAxis dataKey="label" hide />
            <ReferenceLine y={0} stroke={BASELINE_STROKE} strokeWidth={1} ifOverflow="extendDomain" />
            <Bar dataKey="value" isAnimationActive={false}>
              {chart.bars.map((bar) => (
                <Cell key={bar.fiscalYear} fill={bar.isNegative ? NEGATIVE_FILL : POSITIVE_FILL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-xs text-neutral-700">{chart.title}</p>
      <table className="sr-only">
        <caption>{chart.title}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.results.yearHeader}</th>
            <th scope="col">{chart.title}</th>
          </tr>
        </thead>
        <tbody>
          {chart.bars.map((bar) => (
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
