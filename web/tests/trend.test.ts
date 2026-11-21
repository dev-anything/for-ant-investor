import { describe, expect, it } from 'vitest';
import { flatTolerance, getTrend } from '@/lib/trend';

describe('getTrend', () => {
  it('3년 연속 증가면 ↗ 3년째 증가다', () => {
    expect(getTrend([10, 50, 120], 'revenue_growth')).toEqual({ arrow: '↗', label: '3년째 증가' });
  });

  it('3년 연속 감소면 ↘ 3년째 감소다', () => {
    expect(getTrend([200, 150, 90], 'debt_ratio')).toEqual({ arrow: '↘', label: '3년째 감소' });
  });

  it('올랐다 내려가면 ↕ 오르내림이다', () => {
    expect(getTrend([10, 50, 20], 'operating_margin')).toEqual({ arrow: '↕', label: '오르내림' });
  });

  it('내렸다 올라가도 ↕ 오르내림이다', () => {
    expect(getTrend([50, 10, 40], 'operating_margin')).toEqual({ arrow: '↕', label: '오르내림' });
  });

  it('두 변화가 모두 폭 이내면 → 비슷한 수준이다 (증가 규칙보다 먼저)', () => {
    // 부채비율 폭 300 × 3% = 9%p
    expect(getTrend([100, 105, 108], 'debt_ratio')).toEqual({ arrow: '→', label: '비슷한 수준' });
    expect(getTrend([100, 95, 88], 'debt_ratio')).toEqual({ arrow: '→', label: '비슷한 수준' });
  });

  it('두 변화 중 하나라도 폭을 넘으면 비슷한 수준이 아니다', () => {
    // 첫 변화 0, 둘째 변화 10 > 9
    expect(getTrend([100, 100, 110], 'debt_ratio')).toBeNull();
    // 증가 3년 규칙이 적용되지 않는 같은 값 조합 (PRD에 규칙 없음)
    expect(getTrend([100, 100, 120], 'debt_ratio')).toBeNull();
  });

  it('정확히 3% 폭이면 비슷한 수준이다 (경계 포함)', () => {
    // 영업이익률 폭 90 × 3% = 2.7%p, 매출 증가율 폭 110 × 3% = 3.3%p
    expect(flatTolerance('operating_margin')).toBeCloseTo(2.7, 10);
    expect(getTrend([10, 12.7, 10], 'operating_margin')).toEqual({ arrow: '→', label: '비슷한 수준' });
    expect(getTrend([0, 3.3, 3.3], 'revenue_growth')).toEqual({ arrow: '→', label: '비슷한 수준' });
  });

  it('정확히 3%를 넘으면 비슷한 수준이 아니다', () => {
    // 부채비율 9%p는 경계, 9.5%p는 넘음
    expect(getTrend([100, 109, 109], 'debt_ratio')).toEqual({ arrow: '→', label: '비슷한 수준' });
    expect(getTrend([100, 109.5, 109.5], 'debt_ratio')).toBeNull();
  });

  it('값이 2개면 전년보다 증가·감소, 폭 이내면 비슷한 수준', () => {
    expect(getTrend([50, 80], 'revenue_growth')).toEqual({ arrow: '↗', label: '전년보다 증가' });
    expect(getTrend([80, 50], 'revenue_growth')).toEqual({ arrow: '↘', label: '전년보다 감소' });
    expect(getTrend([50, 51], 'revenue_growth')).toEqual({ arrow: '→', label: '비슷한 수준' });
  });

  it('null은 빼고 판정한다 (Y1 매출 증가율 null → 2개로 본다)', () => {
    expect(getTrend([null, 10, 30], 'revenue_growth')).toEqual({ arrow: '↗', label: '전년보다 증가' });
    expect(getTrend([10, null, 30], 'revenue_growth')).toEqual({ arrow: '↗', label: '전년보다 증가' });
  });

  it('값이 1개 이하면 화살표가 없다 (null)', () => {
    expect(getTrend([42], 'debt_ratio')).toBeNull();
    expect(getTrend([null, 42, null], 'debt_ratio')).toBeNull();
    expect(getTrend([null, null, null], 'debt_ratio')).toBeNull();
    expect(getTrend([], 'debt_ratio')).toBeNull();
  });

  it('적자에서 흑자로 가는 영업이익률도 방향을 판정한다', () => {
    expect(getTrend([-30, -10, 5], 'operating_margin')).toEqual({ arrow: '↗', label: '3년째 증가' });
  });
});
