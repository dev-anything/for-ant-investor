import { describe, expect, it } from 'vitest';
import { modeYear } from '@/lib/reference-year';

describe('modeYear (기준 연도, PRD 10장 9번)', () => {
  it('가장 많이 나온 연도를 고른다', () => {
    expect(modeYear([2025, 2025, 2024])).toBe(2025);
  });

  it('같은 횟수면 더 최근 연도를 고른다', () => {
    expect(modeYear([2024, 2025])).toBe(2025);
  });

  it('목록이 비면 null이다', () => {
    expect(modeYear([])).toBeNull();
  });
});
