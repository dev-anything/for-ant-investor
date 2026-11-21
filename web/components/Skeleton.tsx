// FS 7장 Skeleton: 로딩 자리 (서버 컴포넌트). 화면 낭독에서는 숨긴다
export function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}
