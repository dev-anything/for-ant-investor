import { Notice } from '@/components/Notice';
import { copy } from '@/lib/copy';
import type { CapitalImpairment } from '@/lib/data/stock';

// PRD 4장 F-05 자본잠식 안내. full = 상자, partial = 한 줄. none·unknown은 아무것도 그리지 않는다 (PRD 4장 F-05 표)
export function CapitalNotice({ impairment }: { impairment: CapitalImpairment }) {
  if (impairment === 'full') return <Notice variant="box">{copy.reportCard.capital.full}</Notice>;
  if (impairment === 'partial') return <Notice variant="line">{copy.reportCard.capital.partial}</Notice>;
  return null;
}
