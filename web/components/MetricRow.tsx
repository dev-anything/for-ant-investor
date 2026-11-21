import type { ReactNode } from 'react';
import { Gauge } from '@/components/Gauge';
import { TrendArrow } from '@/components/TrendArrow';
import { copy } from '@/lib/copy';
import type { GaugeKey } from '@/lib/gauge';
import { formatPercent } from '@/lib/format';
import { formatValueLine, latestValue } from '@/lib/report-card';
import { getTrend } from '@/lib/trend';

// FS 8-2 MetricRow: 지표 하나 = 질문형 제목 + 최근 값 + 방향 화살표 + 눈금 + 값 3개 줄
// 금융회사에는 쓰지 않는다 (ReportCard가 거른다, PRD 3-6)
// gaugeSlot: 눈금 자리를 대신하는 것 (완전 자본잠식 상자). belowGauge: 눈금 아래 한 줄 (부분 자본잠식)
export function MetricRow({
  gauge,
  values,
  gaugeSlot,
  belowGauge,
}: {
  gauge: GaugeKey;
  values: (number | null)[];
  gaugeSlot?: ReactNode;
  belowGauge?: ReactNode;
}) {
  const { question, name } = copy.reportCard.metric[gauge];
  const latest = latestValue(values);
  const latestText = formatPercent(latest) ?? copy.reportCard.noCalc;
  const trend = getTrend(values, gauge);

  return (
    <div className="border-t border-neutral-200 py-4">
      <h3 className="text-base font-semibold text-neutral-900">{question}</h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-800">
        <span>
          {name} <span className="font-bold">{latestText}</span>
        </span>
        {trend && <TrendArrow trend={trend} />}
      </p>
      {gaugeSlot ? (
        <div className="mt-3">{gaugeSlot}</div>
      ) : latest === null ? (
        <p className="mt-3 text-sm text-neutral-700">{copy.reportCard.unavailable[gauge]}</p>
      ) : (
        <Gauge gauge={gauge} name={name} value={latest} valueText={latestText} />
      )}
      {belowGauge}
      <p className="mt-2 text-xs text-neutral-600">{formatValueLine(values)}</p>
    </div>
  );
}
