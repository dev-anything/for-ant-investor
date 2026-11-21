// 금액·비율·배수·날짜 등의 서식을 다루는 순수 함수 모음
// PRD 3-8: 숫자 표시 규칙
// FS 6-1: lib/format.ts 명세

const WON_IN_EOK = 100_000_000;
const WON_IN_JO = 1_000_000_000_000;
const EOK_IN_JO = 10_000;

/**
 * 금액 서식 (PRD 3-8, FS 6-1)
 * 절댓값 1조 이상은 '{x.x}조 원', 1조 미만은 '{n,nnn}억 원' (억 단위 반올림).
 * 음수는 앞에 '-'를 붙인다.
 */
export function formatAmount(won: number | null | undefined): string | null {
  if (won === null || won === undefined || Number.isNaN(won)) return null;

  const abs = Math.abs(won);
  const isNegative = won < 0;

  // 1조 원 이상: {x.x}조 원
  if (abs >= WON_IN_JO) {
    const jo = (abs / WON_IN_JO).toFixed(1);
    return `${isNegative ? '-' : ''}${jo}조 원`;
  }

  // 1조 원 미만: 억 단위 반올림
  const eok = Math.round(abs / WON_IN_EOK);
  if (eok >= EOK_IN_JO) {
    // 반올림으로 10,000억(1조)이 되는 경우 (예: 999,950,000,000원)
    return `${isNegative ? '-' : ''}1.0조 원`;
  }
  if (eok === 0) {
    return '0억 원';
  }
  return `${isNegative ? '-' : ''}${eok.toLocaleString('ko-KR')}억 원`;
}

/**
 * 시가총액 서식 (FS 6-1)
 * '{조}조 {억}억' (억은 쉼표, 0이면 생략), 1조 미만은 '{억}억', null은 '-'
 */
export function formatMarketCap(won: number | null | undefined): string {
  if (won === null || won === undefined || Number.isNaN(won)) return '-';

  const totalEok = Math.round(won / WON_IN_EOK);
  const jo = Math.floor(totalEok / EOK_IN_JO);
  const remEok = totalEok % EOK_IN_JO;

  if (jo > 0) {
    if (remEok > 0) {
      return `${jo.toLocaleString('ko-KR')}조 ${remEok.toLocaleString('ko-KR')}억`;
    }
    return `${jo.toLocaleString('ko-KR')}조`;
  }
  return `${remEok.toLocaleString('ko-KR')}억`;
}

/**
 * 비율(%) 서식 (PRD 3-8, FS 6-1)
 * 소수 1자리 + '%', null은 null
 */
export function formatPercent(v: number | null | undefined): string | null {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return `${v.toFixed(1)}%`;
}

/**
 * 배수(배) 서식 (PRD 3-8, FS 6-1)
 * 소수 1자리 + '배'
 */
export function formatMultiple(v: number | null | undefined): string | null {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return `${v.toFixed(1)}배`;
}

/**
 * 원화 서식 (FS 6-1)
 * 쉼표 + '원'
 */
export function formatWon(n: number | null | undefined): string | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

/**
 * 전년 대비 증감률 서식 (FS 6-1)
 * 전년 대비 증감률 소수 1자리, 전년이 null이거나 0이면 null
 */
export function formatGrowth(
  curr: number | null | undefined,
  prev: number | null | undefined
): string | null {
  if (
    curr === null ||
    curr === undefined ||
    prev === null ||
    prev === undefined ||
    prev === 0 ||
    Number.isNaN(curr) ||
    Number.isNaN(prev)
  ) {
    return null;
  }

  const rate = ((curr - prev) / Math.abs(prev)) * 100;
  const formatted = rate.toFixed(1);
  if (formatted === '0.0' || formatted === '-0.0') {
    return '0.0%';
  }
  return rate > 0 ? `+${formatted}%` : `${formatted}%`;
}

/**
 * 재무제표 구분 서식 (FS 6-1)
 * CFS -> '연결재무제표', OFS -> '별도재무제표'
 */
export function formatFsDiv(fsDiv: string | null | undefined): string | null {
  if (fsDiv === 'CFS') return '연결재무제표';
  if (fsDiv === 'OFS') return '별도재무제표';
  return null;
}

/**
 * 사업연도 범위 서식 (FS 6-1)
 * 예: [2023, 2024, 2025] -> '2023~2025'
 */
export function formatYearRange(years: number[] | null | undefined): string | null {
  if (!years || years.length === 0) return null;
  const sorted = [...years].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) return `${min}`;
  return `${min}~${max}`;
}

/**
 * 결산월 서식 (PRD 3-5, FS 6-1)
 * '12'이면 null, 그 외 '{M}월 결산' (앞자리 0 제거)
 */
export function formatAccMt(accMt: string | null | undefined): string | null {
  if (!accMt) return null;
  const trimmed = accMt.trim();
  const month = parseInt(trimmed, 10);
  if (Number.isNaN(month) || month === 12) return null;
  return `${month}월 결산`;
}

/**
 * KSIC 대분류 이름 공백 정리 (PRD 3-3, FS 6-1)
 * 화면 표시용. 한 글자씩 띄어쓰기된 표기(예: '제 조 업', '광 업', '건 설 업')의 공백을 제거한다.
 */
export function cleanSectionName(name: string | null | undefined): string | null {
  if (name === null || name === undefined) return null;
  const trimmed = name.trim();
  if (trimmed === '') return '';

  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 1 && tokens.every((token) => token.length === 1)) {
    return tokens.join('');
  }
  return trimmed;
}

/**
 * DART 접수일자 서식 (FS 603)
 * YYYYMMDD -> YYYY-MM-DD
 */
export function formatRceptDt(dt: string | null | undefined): string | null {
  if (!dt) return null;
  const trimmed = dt.trim();
  if (!/^\d{8}$/.test(trimmed)) return null;
  return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
}
