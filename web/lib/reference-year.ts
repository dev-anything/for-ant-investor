// 기준 연도 계산 (PRD 10장 9번). DB를 읽지 않는 순수 함수라 lib/에 둔다 (FS 3장 계층 규칙)

/**
 * 최신 연도 목록에서 가장 많이 나온 연도를 고른다. 같은 횟수면 더 최근 연도. 목록이 비면 null.
 * 입력은 회사마다의 최신 사업연도(company_summary.latest_year)다.
 */
export function modeYear(years: number[]): number | null {
  const counts = new Map<number, number>();
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [year, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && year > best)) {
      best = year;
      bestCount = count;
    }
  }
  return best;
}
