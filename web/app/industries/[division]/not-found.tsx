import { Info } from 'lucide-react';
import { copy } from '@/lib/copy';

// 없는 업종 주소 (FS 12장 5번 기본안). /industries/[division]의 notFound()가 여기로 온다
// DESIGN.md 6-12: 흰 카드 가운데 + subtle 안내 박스 + ⓘ
export default function IndustryCompaniesNotFound() {
  return (
    <div className="mx-auto max-w-content px-4 py-16">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-lg bg-surface p-6 sm:p-12">
        <h1 className="flex w-full items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
          <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <span>{copy.industry.notFoundDivision}</span>
        </h1>
      </div>
    </div>
  );
}
