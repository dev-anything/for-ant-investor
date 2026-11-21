import { describe, expect, it } from 'vitest';
import { isSearchResult, nextActiveIndex } from '@/lib/search-view';
import { parseSearchQuery, SEARCH_QUERY_MAX_LENGTH } from '@/lib/params';

describe('nextActiveIndex (↑↓ 순환, PRD 4장 F-01)', () => {
  it('아래로 가면 다음 칸, 마지막에서는 처음으로 돈다', () => {
    expect(nextActiveIndex(0, 3, 'down')).toBe(1);
    expect(nextActiveIndex(2, 3, 'down')).toBe(0);
  });

  it('위로 가면 이전 칸, 처음에서는 마지막으로 돈다', () => {
    expect(nextActiveIndex(2, 3, 'up')).toBe(1);
    expect(nextActiveIndex(0, 3, 'up')).toBe(2);
  });

  it('아무것도 고르지 않은 상태에서 아래는 첫 칸, 위는 마지막 칸이다', () => {
    expect(nextActiveIndex(-1, 3, 'down')).toBe(0);
    expect(nextActiveIndex(-1, 3, 'up')).toBe(2);
  });

  it('목록이 비면 -1이다', () => {
    expect(nextActiveIndex(-1, 0, 'down')).toBe(-1);
  });
});

describe('isSearchResult (응답 모양 검사)', () => {
  it('정상 응답을 통과시킨다', () => {
    const body = { items: [{ shortCode: '005930', name: '삼성전자', market: 'KOSPI', isForeign: false }] };
    expect(isSearchResult(body)).toBe(true);
  });

  it('빈 목록과 market null도 맞는 모양이다', () => {
    expect(isSearchResult({ items: [] })).toBe(true);
    expect(isSearchResult({ items: [{ shortCode: 'A', name: 'B', market: null, isForeign: true }] })).toBe(true);
  });

  it('items가 없거나 항목 필드가 어긋나면 거부한다', () => {
    expect(isSearchResult({})).toBe(false);
    expect(isSearchResult(null)).toBe(false);
    expect(isSearchResult({ items: [{ shortCode: '005930', name: '삼성전자', isForeign: 'no' }] })).toBe(false);
  });
});

describe('parseSearchQuery (검색어 검증, FS 8-1)', () => {
  it('앞뒤 공백을 떼고 돌려준다', () => {
    expect(parseSearchQuery('  삼성 전자 ')).toBe('삼성 전자');
  });

  it('비었거나 공백만 있으면 null이다', () => {
    expect(parseSearchQuery(null)).toBeNull();
    expect(parseSearchQuery('')).toBeNull();
    expect(parseSearchQuery('   ')).toBeNull();
  });

  it('50자까지는 받고 51자는 null이다', () => {
    expect(parseSearchQuery('가'.repeat(SEARCH_QUERY_MAX_LENGTH))).not.toBeNull();
    expect(parseSearchQuery('가'.repeat(SEARCH_QUERY_MAX_LENGTH + 1))).toBeNull();
  });
});
