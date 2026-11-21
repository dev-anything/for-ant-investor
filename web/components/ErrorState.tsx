// FS 7장 ErrorState: 오류 안내 (서버 컴포넌트, PRD 10장 20번 문구)
export function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-6 rounded border border-neutral-400 px-4 py-6 text-neutral-800">
      {message}
    </p>
  );
}
