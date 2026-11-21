// FS 7장 EmptyState: 데이터 없음 안내 (서버 컴포넌트)
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded border border-neutral-300 px-4 py-6 text-neutral-700">{message}</p>
  );
}
