import { describe, expect, it } from 'vitest';
import { pageCountOf, pageItems } from '@/lib/pagination';

describe('pageCountOf', () => {
  it('나누어 떨어지지 않으면 올림한다', () => {
    expect(pageCountOf(21, 10)).toBe(3);
    expect(pageCountOf(20, 10)).toBe(2);
  });

  it('결과가 0개여도 1쪽이다', () => {
    expect(pageCountOf(0, 10)).toBe(1);
  });
});

describe('pageItems', () => {
  it('쪽 수가 적으면 생략 없이 모두 보여 준다', () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it('첫 쪽 근처는 뒤만 생략한다', () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, null, 10]);
  });

  it('끝 쪽 근처는 앞만 생략한다', () => {
    expect(pageItems(10, 10)).toEqual([1, null, 8, 9, 10]);
  });

  it('가운데는 양쪽을 생략하고 현재 쪽 앞뒤 2쪽을 넣는다', () => {
    expect(pageItems(5, 10)).toEqual([1, null, 3, 4, 5, 6, 7, null, 10]);
  });

  it('생략 자리가 한 쪽뿐이면 빈 칸 없이 그 쪽을 넣는다', () => {
    expect(pageItems(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
