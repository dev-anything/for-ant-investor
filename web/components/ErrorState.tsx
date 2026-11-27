// FS 7장, DESIGN.md 4-6, 8-2: 오류 안내 (서버 컴포넌트, 안내 박스 스타일, PRD 10장 20번 문구)
export function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-6 rounded border-l-4 border-ink bg-surface px-4 py-6 text-ink">
      {message}
    </p>
  );
}
