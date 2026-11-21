// 페이지 번호 계산 (FS 7장 Pagination). 순수 함수: 화면 코드가 쪽 수·번호 목록만 받아 그린다.

// 현재 쪽 앞뒤로 보여 줄 번호 개수
const NEIGHBOR_COUNT = 2;

/** 전체 개수와 쪽당 개수로 쪽 수를 구한다. 결과가 0개여도 1쪽으로 본다 (빈 목록 화면용). */
export function pageCountOf(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * 쪽 번호 목록. `null`은 생략 자리(…)다.
 * 첫 쪽·마지막 쪽은 항상 넣고, 현재 쪽 앞뒤 2쪽을 넣는다. 끊긴 곳에만 `null`을 넣는다.
 */
export function pageItems(page: number, pageCount: number): (number | null)[] {
  const picked = new Set<number>([1, pageCount]);
  for (let p = page - NEIGHBOR_COUNT; p <= page + NEIGHBOR_COUNT; p += 1) {
    if (p >= 1 && p <= pageCount) picked.add(p);
  }
  const sorted = Array.from(picked).sort((a, b) => a - b);

  const items: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}
