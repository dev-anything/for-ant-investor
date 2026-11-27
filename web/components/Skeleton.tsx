// FS 7장, DESIGN.md 5-6: 로딩 자리 (서버 컴포넌트, 옅은 회색 빈 칸). 화면 낭독에서는 숨긴다
export function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-skeleton rounded bg-skeleton ${className}`} />;
}
