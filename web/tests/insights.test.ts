import { describe, expect, it } from 'vitest';
import { type Insight, insightText, topInsights } from '@/lib/insights';

// 필드 없는 항목 기본값 (DB에서 온 insights와 같은 모양)
function item(partial: Partial<Insight> & { id: number }): Insight {
  return { year: null, n: null, prev: null, curr: null, ...partial };
}

describe('insightText', () => {
  it('필드 없는 문장 1·2·3·8번은 PRD 문장 그대로다', () => {
    expect(insightText(item({ id: 1 }))).toBe('매출은 늘었는데 영업이익률은 줄었어');
    expect(insightText(item({ id: 2 }))).toBe('매출은 줄었는데 영업이익은 늘었어');
    expect(insightText(item({ id: 3 }))).toBe('영업이익은 흑자인데 순이익은 적자야');
    expect(insightText(item({ id: 8 }))).toBe('영업이익은 적자인데 순이익은 흑자야');
  });

  it('4·5번은 연도를 넣는다', () => {
    expect(insightText(item({ id: 4, year: 2025 }))).toBe('2025년에 영업이익이 흑자로 돌아섰어');
    expect(insightText(item({ id: 5, year: 2024 }))).toBe('2024년에 영업이익이 적자로 돌아섰어');
  });

  it('6번은 연속 적자 년수를 넣는다 (2~4)', () => {
    expect(insightText(item({ id: 6, n: 2 }))).toBe('영업적자가 2년째 이어지고 있어');
    expect(insightText(item({ id: 6, n: 4 }))).toBe('영업적자가 4년째 이어지고 있어');
  });

  it('7번은 저장된 값을 소수 1자리로 보여준다 (160 → 160.0)', () => {
    expect(insightText(item({ id: 7, prev: 120.5, curr: 160.2 }))).toBe(
      '부채비율이 1년 사이 120.5%에서 160.2%로 올랐어'
    );
    expect(insightText(item({ id: 7, prev: 120, curr: 160 }))).toBe(
      '부채비율이 1년 사이 120.0%에서 160.0%로 올랐어'
    );
  });

  it('모르는 id는 null이다', () => {
    expect(insightText(item({ id: 0 }))).toBeNull();
    expect(insightText(item({ id: 9 }))).toBeNull();
  });

  it('필요한 값이 없으면 null이다 (4·5·6·7번)', () => {
    expect(insightText(item({ id: 4 }))).toBeNull();
    expect(insightText(item({ id: 5 }))).toBeNull();
    expect(insightText(item({ id: 6 }))).toBeNull();
    expect(insightText(item({ id: 7, prev: 120 }))).toBeNull();
  });
});

describe('topInsights', () => {
  it('저장된 순서를 유지하고 앞에서 3개만 고른다', () => {
    const list = [
      item({ id: 5, year: 2025 }),
      item({ id: 6, n: 3 }),
      item({ id: 3 }),
      item({ id: 8 }),
    ];
    const result = topInsights(list);
    expect(result.map((r) => r.insight.id)).toEqual([5, 6, 3]);
    expect(result[0].text).toBe('2025년에 영업이익이 적자로 돌아섰어');
  });

  it('3개보다 적으면 있는 만큼만 돌려준다', () => {
    expect(topInsights([item({ id: 1 })])).toHaveLength(1);
  });

  it('빈 목록이면 빈 배열이다 (영역 숨김은 화면이 맡는다)', () => {
    expect(topInsights([])).toEqual([]);
  });

  it('모르는 id는 건너뛰고, 그 자리는 개수에 세지 않는다', () => {
    const list = [item({ id: 42 }), item({ id: 1 }), item({ id: 2 }), item({ id: 3 }), item({ id: 8 })];
    expect(topInsights(list).map((r) => r.insight.id)).toEqual([1, 2, 3]);
  });

  it('필드가 모자란 항목도 건너뛴다', () => {
    const list = [item({ id: 4 }), item({ id: 8 })];
    expect(topInsights(list).map((r) => r.insight.id)).toEqual([8]);
  });

  it('k를 바꾸면 그 개수만큼 자른다', () => {
    const list = [item({ id: 1 }), item({ id: 2 }), item({ id: 3 })];
    expect(topInsights(list, 1)).toHaveLength(1);
  });
});
