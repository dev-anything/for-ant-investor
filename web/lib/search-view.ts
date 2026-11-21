// 종목 검색 화면 계산 (FS 8-1): 응답 모양 검사, 키보드 이동 순환. 순수 함수다.
import type { SearchItem, SearchResult } from '@/lib/data/search';

export type ArrowDirection = 'down' | 'up';

/**
 * 연관검색어에서 ↑↓로 옮긴 다음 칸 번호 (PRD 4장 F-01: 순환).
 * current가 -1이면 아무것도 고르지 않은 상태다. 목록이 비면 -1.
 */
export function nextActiveIndex(current: number, count: number, direction: ArrowDirection): number {
  if (count === 0) return -1;
  if (direction === 'down') return current < 0 ? 0 : (current + 1) % count;
  return current <= 0 ? count - 1 : current - 1;
}

/** 브라우저가 받은 JSON이 검색 응답 모양인지 확인한다 (믿지 않고 본다). */
export function isSearchResult(value: unknown): value is SearchResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.items) && v.items.every(isSearchItem);
}

function isSearchItem(value: unknown): value is SearchItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.shortCode === 'string' &&
    typeof v.name === 'string' &&
    (v.market === null || typeof v.market === 'string') &&
    typeof v.isForeign === 'boolean'
  );
}
