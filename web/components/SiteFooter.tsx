import { copy } from '@/lib/copy';

// FS 7장, PRD 3-2, PRD 10장 1번: 공통 푸터 컴포넌트 (서버 컴포넌트, 존댓말)
export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-8 text-xs text-neutral-500">
      <div className="mx-auto max-w-5xl space-y-2 px-4">
        <p>{copy.footer.disclaimer}</p>
        <p>{copy.footer.source}</p>
        <p>{copy.footer.sourceNote}</p>
      </div>
    </footer>
  );
}
