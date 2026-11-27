import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { copy } from '@/lib/copy';
import type { CapitalImpairment } from '@/lib/data/stock';

// PRD 4장 F-05 자본잠식 안내, DESIGN.md 6-12: subtle 바탕 안내 박스 + ⓘ(muted). 경고색은 쓰지 않는다.
// none·unknown은 아무것도 그리지 않는다 (PRD 4장 F-05 표). 문구는 copy 그대로다
export function CapitalNotice({ impairment }: { impairment: CapitalImpairment }) {
  if (impairment === 'full') return <CapitalBox>{copy.reportCard.capital.full}</CapitalBox>;
  if (impairment === 'partial') return <CapitalBox>{copy.reportCard.capital.partial}</CapitalBox>;
  return null;
}

function CapitalBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
