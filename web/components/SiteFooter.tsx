import { copy } from '@/lib/copy';

// FS 7장, PRD 3-2, DESIGN.md 4-3: 공통 푸터 (서버 컴포넌트, 존댓말, page 바탕, 접지 않음)
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-page py-8 text-meta text-muted">
      <div className="mx-auto max-w-content space-y-2 px-4 sm:px-6">
        <p>{copy.footer.disclaimer}</p>
        <p>{copy.footer.source}</p>
        <p>{copy.footer.sourceNote}</p>
      </div>
    </footer>
  );
}
