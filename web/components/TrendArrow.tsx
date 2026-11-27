import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { TREND_ARROW, type Trend } from '@/lib/trend';

// FS 7장 TrendArrow, DESIGN.md 4-4: 화살표 + 말 ("↘ 3년째 감소"). 검정(#171717 = text-ink) 한 가지 색만 쓴다.
// "비슷한 수준"이면 툴팁을 붙인다
export function TrendArrow({ trend }: { trend: Trend }) {
  const isFlat = trend.arrow === TREND_ARROW.flat;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink">
      {/* 화살표는 말(label)과 같은 뜻이라 스크린 리더에서 뺀다 */}
      <span aria-hidden="true" className="font-bold">
        {trend.arrow}
      </span>
      <span>{trend.label}</span>
      {isFlat && <Tooltip text={copy.reportCard.trend.flatTip} label={copy.reportCard.tipButtonLabel} />}
    </span>
  );
}
