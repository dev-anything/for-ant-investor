import { describe, expect, it } from 'vitest';
import { TOUR_SEEN_KEY, TOUR_STEPS, buildTourSteps, parseTourKeys } from '@/lib/tour';
import { copy } from '@/lib/copy';

const ALL_KEYS = ['sales', 'profit', 'debt', 'valuation', 'dividend'] as const;
// 금융회사 화면: 매출액 그래프와 부채비율 칸이 없다 (PRD 4장 F-16 예외)
const FINANCIAL_KEYS = ['profit', 'valuation', 'dividend'] as const;

describe('처음 읽는 순서 단계 (PRD 4장 F-16)', () => {
  it('브라우저 저장 키는 reading-tour-seen 하나다', () => {
    expect(TOUR_SEEN_KEY).toBe('reading-tour-seen');
  });

  it('일반 회사에서 영역 5개가 모두 있으면 1/5부터 5/5까지 나온다', () => {
    const steps = buildTourSteps(ALL_KEYS, false);
    expect(steps.map((step) => step.key)).toEqual(['sales', 'profit', 'debt', 'valuation', 'dividend']);
    expect(steps.map((step) => step.index)).toEqual([1, 2, 3, 4, 5]);
    expect(steps.every((step) => step.total === 5)).toBe(true);
  });

  it('일반 회사의 영업이익·순이익 단계는 기본 문구를 쓴다', () => {
    const profit = buildTourSteps(ALL_KEYS, false).find((step) => step.key === 'profit');
    expect(profit?.text).toBe(copy.tour.steps.profit.text);
  });

  it('금융회사 (매출·부채 영역 없음)는 3단계로 1/3부터 나온다', () => {
    const steps = buildTourSteps(FINANCIAL_KEYS, true);
    expect(steps.map((step) => step.key)).toEqual(['profit', 'valuation', 'dividend']);
    expect(steps.map((step) => step.index)).toEqual([1, 2, 3]);
    expect(steps.every((step) => step.total === 3)).toBe(true);
  });

  it('금융회사의 영업이익·순이익 단계는 금융회사 문구를 쓴다', () => {
    const profit = buildTourSteps(FINANCIAL_KEYS, true)[0];
    expect(profit.text).toBe(copy.tour.steps.profit.financialText);
    expect(profit.text).toContain('금융회사는 매출액 항목이 없어서');
  });

  it('금융회사여도 영역이 있는 일반 회사 단계 문구는 바뀌지 않는다', () => {
    // 금융회사 판별과 무관하게 profit 외 단계는 같은 문구다
    const valuation = buildTourSteps(ALL_KEYS, true).find((step) => step.key === 'valuation');
    expect(valuation?.text).toBe(copy.tour.steps.valuation.text);
  });

  it('가운데 영역 하나가 빠지면 나머지 번호를 다시 매긴다', () => {
    const steps = buildTourSteps(['sales', 'profit', 'valuation', 'dividend'], false);
    expect(steps.map((step) => step.key)).toEqual(['sales', 'profit', 'valuation', 'dividend']);
    expect(steps.map((step) => step.index)).toEqual([1, 2, 3, 4]);
    expect(steps.every((step) => step.total === 4)).toBe(true);
  });

  it('영역이 하나도 없으면 단계도 없다', () => {
    expect(buildTourSteps([], false)).toEqual([]);
  });

  it('화면 순서가 뒤섞여 와도 PRD 표 순서로 나온다', () => {
    const steps = buildTourSteps(['dividend', 'debt', 'sales', 'valuation', 'profit'], false);
    expect(steps.map((step) => step.key)).toEqual(['sales', 'profit', 'debt', 'valuation', 'dividend']);
  });

  it('단계 목록은 PRD 표의 5개 키를 모두 가진다', () => {
    expect(TOUR_STEPS.map((step) => step.key)).toEqual(['sales', 'profit', 'debt', 'valuation', 'dividend']);
  });
});

describe('data-tour 값 읽기', () => {
  it('모르는 값은 버리고 중복은 한 번만 남긴다', () => {
    expect(parseTourKeys(['sales', 'news', 'sales', 'dividend', ''])).toEqual(['sales', 'dividend']);
  });

  it('빈 목록이면 빈 배열이다', () => {
    expect(parseTourKeys([])).toEqual([]);
  });
});
