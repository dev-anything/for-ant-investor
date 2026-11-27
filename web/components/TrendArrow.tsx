import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react';

import { Tooltip } from '@/components/Tooltip';
import { copy } from '@/lib/copy';
import { TREND_ARROW, type Trend } from '@/lib/trend';

// FS 7장 TrendArrow, DESIGN.md 6-5: 방향 화살표는 검정(ink) lucide 아이콘 + 말. 보라·신호등 색은 쓰지 않는다.
// 텍스트 화살표 대신 아이콘을 쓰되, 말 문구는 copy 그대로다
const ARROW_ICONS: Record<Trend['arrow'], LucideIcon> = {
  [TREND_ARROW.up]: ArrowUp,
  [TREND_ARROW.down]: ArrowDown,
  [TREND_ARROW.mixed]: ArrowUpDown,
  [TREND_ARROW.flat]: ArrowRight,
};

// "비슷한 수준"이면 툴팁을 붙인다
export function TrendArrow({ trend }: { trend: Trend }) {
  const isFlat = trend.arrow === TREND_ARROW.flat;
  const Icon = ARROW_ICONS[trend.arrow];

  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink">
      {/* 화살표는 말(label)과 같은 뜻이라 스크린 리더에서 뺀다 */}
      <Icon size={16} strokeWidth={2} className="shrink-0 text-ink" aria-hidden="true" />
      <span>{trend.label}</span>
      {isFlat && <Tooltip text={copy.reportCard.trend.flatTip} label={copy.reportCard.tipButtonLabel} />}
    </span>
  );
}
