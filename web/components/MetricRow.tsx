import type { ReactNode } from 'react';
import { Gauge } from '@/components/Gauge';
import { Tooltip } from '@/components/Tooltip';
import { TrendArrow } from '@/components/TrendArrow';
import { copy } from '@/lib/copy';
import { formatGaugeValue, type GaugeKey } from '@/lib/gauge';
import { formatPercent } from '@/lib/format';
import type { IndustryCompare } from '@/lib/industry';
import { formatValueLine, latestValue } from '@/lib/report-card';
import { getTrend } from '@/lib/trend';

// FS 8-2 MetricRow, DESIGN-V2 2-2-2: 지표 하나를 3줄로 줄인다.
// 줄 1 = 질문형 제목 | 큰 숫자 + 방향 화살표(지표 이름은 sr-only), 줄 2 = 3개년 점 눈금,
// 줄 3 = `2023 a → 2024 b → 2025 c` | `업종 {값}` + ⓘ. 업종 비교 문장은 줄 3 아래.
// (2차) compare: 업종 가운데 값 비교 결과 (FS 6-8). no_industry는 ReportCard가 한 번만 보여 주므로 여기서 그리지 않는다.
// 금융회사에는 쓰지 않는다 (ReportCard가 거른다, PRD 3-6).
// gaugeSlot: 눈금 자리를 대신하는 것 (완전 자본잠식 상자). belowGauge: 줄 3 아래 한 줄 (부분 자본잠식).
export function MetricRow({
  gauge,
  values,
  years,
  compare,
  gaugeSlot,
  belowGauge,
}: {
  gauge: GaugeKey;
  values: (number | null)[];
  years: number[];
  compare: IndustryCompare;
  gaugeSlot?: ReactNode;
  belowGauge?: ReactNode;
}) {
  const { question, name } = copy.reportCard.metric[gauge];
  const latest = latestValue(values);
  const latestText = formatPercent(latest) ?? copy.reportCard.noCalc;
  const trend = getTrend(values, gauge);
  const points = years.map((year, index) => ({ year, value: values[index] ?? null }));

  // 가운데 값은 이 회사 값이 있을 때만 그린다 (Y3 null이면 사유 문장이 눈금을 대신한다)
  const median = compare.kind === 'ok' ? { value: compare.median, n: compare.n } : null;
  const medianText = median ? formatGaugeValue(median.value, gauge) : null;
  const relationText = compare.kind === 'ok' && compare.relation ? copy.industry.relation[compare.relation] : null;

  return (
    <div className="border-t border-line py-4">
      {/* 줄 1: 좁은 화면에서는 큰 숫자가 제목 아래로 내려간다 (DESIGN-V2 2-2-2) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold text-ink">{question}</h3>
        <p className="flex items-center gap-2">
          <span className="sr-only">{name}</span>
          <span className="text-xl font-bold tabular-nums text-ink">{latestText}</span>
          {trend && <TrendArrow trend={trend} />}
        </p>
      </div>
      {/* 줄 2: 눈금 또는 그 자리를 대신하는 안내 */}
      {gaugeSlot ? (
        <div className="mt-3">{gaugeSlot}</div>
      ) : latest === null ? (
        <p className="mt-3 text-sm text-ink-sub">{copy.reportCard.unavailable[gauge]}</p>
      ) : (
        <Gauge
          gauge={gauge}
          name={name}
          points={points}
          median={median}
          lineTip={copy.reportCard.lineTip[gauge]}
        />
      )}
      {/* 줄 3: 3개년 값 줄 오른쪽 끝에 짧은 업종 값 라벨 (DESIGN-V2 2-2-1) */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-meta text-ink-sub tabular-nums">{formatValueLine(points)}</p>
        {median && medianText && (
          <p className="inline-flex items-center gap-1 text-meta text-ink-sub">
            <span>{copy.industry.medianShort(medianText)}</span>
            <Tooltip text={copy.industry.medianTip(median.n)} label={copy.reportCard.tipButtonLabel} />
          </p>
        )}
      </div>
      {/* 예외 문장은 줄 3 아래: 부분 자본잠식 → too_few → 업종 비교 순 (DESIGN-V2 2-2-2) */}
      {belowGauge}
      {compare.kind === 'too_few' && latest !== null && (
        <p className="mt-2 text-sm text-ink-sub">{copy.industry.tooFew}</p>
      )}
      {relationText && <p className="mt-1 text-sm text-ink">{relationText}</p>}
    </div>
  );
}
