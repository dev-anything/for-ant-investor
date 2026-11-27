// FS 7장, DESIGN.md 4-6, 8-2: 데이터 없음 안내 (서버 컴포넌트, 안내 박스 스타일)
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded border-l-4 border-brand bg-surface px-4 py-6 text-ink">{message}</p>
  );
}
