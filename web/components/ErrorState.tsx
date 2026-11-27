import { Info } from 'lucide-react';

// FS 7장, DESIGN.md 6-12: 오류 안내 (서버 컴포넌트, subtle 박스 + ⓘ, PRD 10장 20번 문구)
export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="mt-6 flex items-start gap-2 rounded-md bg-subtle px-4 py-3 text-sm text-ink">
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
