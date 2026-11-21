// "눈여겨볼 변화" 문장 (PRD 4장 F-05, FS 6-5). 배치가 판정해 저장한 insights를 문장으로 바꾼다.
// 배치(batch/rules.py)가 이미 우선순위 순으로 저장하므로 여기서는 순서를 다시 정하지 않는다.
import { copy } from '@/lib/copy';

// 화면에 보여주는 문장 최대 개수 (PRD 4장 F-05)
export const INSIGHT_SHOW_LIMIT = 3;

// insights jsonb 한 항목. 필드는 문장 종류에 따라 있을 때만 값이 있다 (없으면 null)
export interface Insight {
  id: number;
  year: number | null;
  n: number | null;
  prev: number | null;
  curr: number | null;
}

/**
 * 문장 하나를 만든다. 모르는 id이거나 필요한 값이 없으면 null (그 항목은 건너뛴다).
 * 부채비율은 저장된 소수 1자리 값을 그대로 쓴다 (다시 반올림하지 않음, toFixed는 1자리에서 값이 바뀌지 않음).
 */
export function insightText(insight: Insight): string | null {
  const text = copy.reportCard.insight;
  switch (insight.id) {
    case 1:
      return text[1];
    case 2:
      return text[2];
    case 3:
      return text[3];
    case 4:
      return insight.year === null ? null : text[4](insight.year);
    case 5:
      return insight.year === null ? null : text[5](insight.year);
    case 6:
      return insight.n === null ? null : text[6](insight.n);
    case 7:
      return insight.prev === null || insight.curr === null
        ? null
        : text[7](insight.prev.toFixed(1), insight.curr.toFixed(1));
    case 8:
      return text[8];
    default:
      return null;
  }
}

/**
 * 화면에 보여줄 문장을 앞에서 k개 고른다. 문장이 안 만들어지는 항목은 세지 않는다.
 * 저장된 순서를 그대로 유지한다. 0개면 빈 배열 (영역을 숨기는 판단은 화면이 한다).
 */
export function topInsights(
  list: Insight[],
  k: number = INSIGHT_SHOW_LIMIT
): { insight: Insight; text: string }[] {
  const result: { insight: Insight; text: string }[] = [];
  for (const insight of list) {
    if (result.length >= k) break;
    const text = insightText(insight);
    if (text !== null) result.push({ insight, text });
  }
  return result;
}
