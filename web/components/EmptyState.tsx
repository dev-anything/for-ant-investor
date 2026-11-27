import { Inbox } from 'lucide-react';

// FS 7장, DESIGN.md 6-12: 데이터 없음 (48px 회색 아이콘 + 16px 문장)
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-md bg-subtle px-4 py-10 text-center">
      <Inbox size={48} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
      <p className="text-base text-ink-sub">{message}</p>
    </div>
  );
}
