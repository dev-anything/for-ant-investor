// PRD 4장 F-16 처음 읽는 순서 안내, FS 6-11. 화면 없이 단계 목록만 만든다.
// 화면에 실제로 있는 data-tour 영역만 짚는다 (PRD F-16 공통 규칙). 금융회사 판별에 기대지 않는다.
import { copy } from '@/lib/copy';

// localStorage 키 1개 (PRD F-16: 브라우저에 값 하나만 저장, 로그인과 잇지 않는다)
export const TOUR_SEEN_KEY = 'reading-tour-seen';
// 본 것으로 기록했을 때 저장하는 값 (FS 9-8)
export const TOUR_SEEN_VALUE = '1';

// data-tour 속성 값 5개 (FS 9-1). 표 순서가 단계 순서다
export const TOUR_KEYS = ['sales', 'profit', 'debt', 'valuation', 'dividend'] as const;
export type TourKey = (typeof TOUR_KEYS)[number];

interface TourStepDef {
  key: TourKey;
  title: string;
  text: string;
  // 금융회사일 때만 text 대신 쓰는 문구 (profit 단계만 있다)
  financialText?: string;
}

// PRD 4장 F-16 단계 표. 문구는 copy.ts에 있다
export const TOUR_STEPS: readonly TourStepDef[] = [
  { key: 'sales', title: copy.tour.steps.sales.title, text: copy.tour.steps.sales.text },
  {
    key: 'profit',
    title: copy.tour.steps.profit.title,
    text: copy.tour.steps.profit.text,
    financialText: copy.tour.steps.profit.financialText,
  },
  { key: 'debt', title: copy.tour.steps.debt.title, text: copy.tour.steps.debt.text },
  { key: 'valuation', title: copy.tour.steps.valuation.title, text: copy.tour.steps.valuation.text },
  { key: 'dividend', title: copy.tour.steps.dividend.title, text: copy.tour.steps.dividend.text },
];

export interface TourStep {
  key: TourKey;
  title: string;
  text: string;
  // 1부터 시작하는 번호 (화면에 있는 단계 안에서 다시 매긴다)
  index: number;
  total: number;
}

/** data-tour 값이 알려진 키인지 본다. 모르는 값은 무시하도록 좁힌다. */
export function isTourKey(value: string): value is TourKey {
  return (TOUR_KEYS as readonly string[]).includes(value);
}

/** 화면에서 읽은 data-tour 값들을 알려진 키만 남기고 중복을 뺀다. */
export function parseTourKeys(values: readonly string[]): TourKey[] {
  const keys: TourKey[] = [];
  for (const value of values) {
    if (isTourKey(value) && !keys.includes(value)) keys.push(value);
  }
  return keys;
}

/**
 * 화면에 있는 단계만 골라 번호를 다시 매긴다 (PRD F-16 공통 규칙).
 * 금융회사는 profit 단계 문구를 금융회사용으로 바꾼다 (PRD 4장 F-16 예외).
 */
export function buildTourSteps(present: readonly TourKey[], isFinancial: boolean): TourStep[] {
  const shown = TOUR_STEPS.filter((step) => present.includes(step.key));
  return shown.map((step, position) => ({
    key: step.key,
    title: step.title,
    text: isFinancial && step.financialText !== undefined ? step.financialText : step.text,
    index: position + 1,
    total: shown.length,
  }));
}
