import { describe, expect, it } from 'vitest';
import {
  cleanSectionName,
  formatAccMt,
  formatAmount,
  formatFsDiv,
  formatGrowth,
  formatMarketCap,
  formatMultiple,
  formatPercent,
  formatRceptDt,
  formatWon,
  formatYearRange,
} from '@/lib/format';

describe('formatAmount', () => {
  it('1조 원 이상은 조 단위 소수 1자리로 표시된다', () => {
    expect(formatAmount(258935494000000)).toBe('258.9조 원');
    expect(formatAmount(1000000000000)).toBe('1.0조 원');
  });

  it('1조 원 미만은 억 단위 쉼표와 함께 반올림하여 표시된다', () => {
    expect(formatAmount(999900000000)).toBe('9,999억 원');
    expect(formatAmount(123456789000)).toBe('1,235억 원');
    expect(formatAmount(0)).toBe('0억 원');
    expect(formatAmount(40000000)).toBe('0억 원');
  });

  it('9,999억 원 반올림으로 1조 원이 되는 경계값을 처리한다', () => {
    expect(formatAmount(999950000000)).toBe('1.0조 원');
  });

  it('음수 금액은 숫자 앞에 마이너스 부호를 붙인다', () => {
    expect(formatAmount(-65670000000)).toBe('-657억 원');
    expect(formatAmount(-1000000000000)).toBe('-1.0조 원');
    expect(formatAmount(-999950000000)).toBe('-1.0조 원');
  });

  it('null이나 undefined, NaN이면 null을 돌려준다', () => {
    expect(formatAmount(null)).toBeNull();
    expect(formatAmount(undefined)).toBeNull();
    expect(formatAmount(Number.NaN)).toBeNull();
  });
});

describe('formatMarketCap', () => {
  it('1조 이상이면 조와 억을 함께 표시한다', () => {
    expect(formatMarketCap(1165351200000000)).toBe('1,165조 3,512억');
  });

  it('1조 이상에서 억 단위가 0이면 억을 생략한다', () => {
    expect(formatMarketCap(1000000000000)).toBe('1조');
  });

  it('1조 미만은 억 단위로만 표시한다', () => {
    expect(formatMarketCap(999900000000)).toBe('9,999억');
    expect(formatMarketCap(0)).toBe('0억');
  });

  it('null이나 undefined이면 대시(-)를 돌려준다', () => {
    expect(formatMarketCap(null)).toBe('-');
    expect(formatMarketCap(undefined)).toBe('-');
    expect(formatMarketCap(Number.NaN)).toBe('-');
  });
});

describe('formatPercent', () => {
  it('소수 1자리로 반올림하고 %를 붙인다', () => {
    expect(formatPercent(87.345)).toBe('87.3%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(-12.56)).toBe('-12.6%');
  });

  it('null이나 undefined이면 null을 돌려준다', () => {
    expect(formatPercent(null)).toBeNull();
    expect(formatPercent(undefined)).toBeNull();
    expect(formatPercent(Number.NaN)).toBeNull();
  });
});

describe('formatMultiple', () => {
  it('소수 1자리로 반올림하고 배를 붙인다', () => {
    expect(formatMultiple(25.53)).toBe('25.5배');
    expect(formatMultiple(0)).toBe('0.0배');
  });

  it('null이나 undefined이면 null을 돌려준다', () => {
    expect(formatMultiple(null)).toBeNull();
    expect(formatMultiple(undefined)).toBeNull();
  });
});

describe('formatWon', () => {
  it('원 단위 금액을 쉼표와 함께 포맷한다', () => {
    expect(formatWon(1668)).toBe('1,668원');
    expect(formatWon(0)).toBe('0원');
  });

  it('null이나 undefined이면 null을 돌려준다', () => {
    expect(formatWon(null)).toBeNull();
    expect(formatWon(undefined)).toBeNull();
  });
});

describe('formatGrowth', () => {
  it('전년 대비 증가율을 +와 함께 소수 1자리로 계산한다', () => {
    expect(formatGrowth(110, 100)).toBe('+10.0%');
  });

  it('전년 대비 감소율을 -와 함께 소수 1자리로 계산한다', () => {
    expect(formatGrowth(90, 100)).toBe('-10.0%');
  });

  it('변화가 없으면 0.0%를 돌려준다', () => {
    expect(formatGrowth(100, 100)).toBe('0.0%');
  });

  it('음수 기준값에서 개선된 경우를 올바르게 계산한다', () => {
    expect(formatGrowth(-50, -100)).toBe('+50.0%');
  });

  it('전년 값이 0이거나 null이면 null을 돌려준다', () => {
    expect(formatGrowth(100, 0)).toBeNull();
    expect(formatGrowth(100, null)).toBeNull();
    expect(formatGrowth(null, 100)).toBeNull();
    expect(formatGrowth(undefined, 100)).toBeNull();
  });
});

describe('formatFsDiv', () => {
  it('CFS는 연결재무제표, OFS는 별도재무제표를 돌려준다', () => {
    expect(formatFsDiv('CFS')).toBe('연결재무제표');
    expect(formatFsDiv('OFS')).toBe('별도재무제표');
  });

  it('정의되지 않은 값이거나 null이면 null을 돌려준다', () => {
    expect(formatFsDiv(null)).toBeNull();
    expect(formatFsDiv(undefined)).toBeNull();
    expect(formatFsDiv('OTHER')).toBeNull();
  });
});

describe('formatYearRange', () => {
  it('연도 배열을 작은 값부터 정렬하여 범위로 표시한다', () => {
    expect(formatYearRange([2023, 2024, 2025])).toBe('2023~2025');
    expect(formatYearRange([2025, 2023, 2024])).toBe('2023~2025');
  });

  it('연도가 1개이면 그 연도만 표시한다', () => {
    expect(formatYearRange([2025])).toBe('2025');
  });

  it('배열이 비었거나 null이면 null을 돌려준다', () => {
    expect(formatYearRange([])).toBeNull();
    expect(formatYearRange(null)).toBeNull();
    expect(formatYearRange(undefined)).toBeNull();
  });
});

describe('formatAccMt', () => {
  it('12월 결산은 표시를 생략하여 null을 돌려준다', () => {
    expect(formatAccMt('12')).toBeNull();
  });

  it('12월이 아니면 앞자리 0을 떼고 M월 결산으로 표시한다', () => {
    expect(formatAccMt('03')).toBe('3월 결산');
    expect(formatAccMt('06')).toBe('6월 결산');
    expect(formatAccMt('9')).toBe('9월 결산');
  });

  it('null이나 빈 문자열이면 null을 돌려준다', () => {
    expect(formatAccMt(null)).toBeNull();
    expect(formatAccMt(undefined)).toBeNull();
    expect(formatAccMt('')).toBeNull();
  });
});

describe('cleanSectionName', () => {
  it('한 글자씩 띄어쓰기된 대분류 명칭의 공백을 제거한다', () => {
    expect(cleanSectionName('제 조 업')).toBe('제조업');
    expect(cleanSectionName('광 업')).toBe('광업');
    expect(cleanSectionName('건 설 업')).toBe('건설업');
  });

  it('일반 단어 사이의 띄어쓰기는 유지한다', () => {
    expect(cleanSectionName('농업, 임업 및 어업')).toBe('농업, 임업 및 어업');
    expect(cleanSectionName('도매 및 소매업')).toBe('도매 및 소매업');
    expect(cleanSectionName('제조업')).toBe('제조업');
  });

  it('null이나 빈 문자열을 안전하게 처리한다', () => {
    expect(cleanSectionName(null)).toBeNull();
    expect(cleanSectionName(undefined)).toBeNull();
    expect(cleanSectionName('')).toBe('');
  });
});

describe('formatRceptDt', () => {
  it('8자리 접수일자를 YYYY-MM-DD 형식으로 포맷한다', () => {
    expect(formatRceptDt('20261120')).toBe('2026-11-20');
  });

  it('형식이 맞지 않거나 null이면 null을 돌려준다', () => {
    expect(formatRceptDt(null)).toBeNull();
    expect(formatRceptDt(undefined)).toBeNull();
    expect(formatRceptDt('2026-11-20')).toBeNull();
    expect(formatRceptDt('invalid')).toBeNull();
  });
});
