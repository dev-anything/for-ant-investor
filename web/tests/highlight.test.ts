import { describe, expect, it } from 'vitest';
import { highlightParts } from '@/lib/highlight';

describe('highlightParts (일치 부분 굵게, PRD 4장 F-01)', () => {
  it('앞부분이 일치하면 앞부분만 굵게 나눈다', () => {
    expect(highlightParts('삼성전자', '삼성')).toEqual([
      { text: '삼성', match: true },
      { text: '전자', match: false },
    ]);
  });

  it('가운데 일치는 앞뒤를 굵지 않게 둔다', () => {
    expect(highlightParts('삼성바이오로직스', '바이오')).toEqual([
      { text: '삼성', match: false },
      { text: '바이오', match: true },
      { text: '로직스', match: false },
    ]);
  });

  it('검색어의 띄어쓰기를 무시하고 원문의 같은 부분을 찾는다', () => {
    expect(highlightParts('삼성전자', '삼성 전자')).toEqual([{ text: '삼성전자', match: true }]);
  });

  it('원문에 띄어쓰기가 있어도 검색어 붙여쓰기로 찾는다', () => {
    expect(highlightParts('NAVER 우', 'naver')).toEqual([
      { text: 'NAVER', match: true },
      { text: ' 우', match: false },
    ]);
  });

  it('대소문자를 무시한다', () => {
    expect(highlightParts('NAVER', 'nav')).toEqual([
      { text: 'NAV', match: true },
      { text: 'ER', match: false },
    ]);
  });

  it('종목코드 영문 섞인 검색어도 찾는다', () => {
    expect(highlightParts('0220W0', '0220w0')).toEqual([{ text: '0220W0', match: true }]);
  });

  it('일치하지 않으면 원문 한 조각이다', () => {
    expect(highlightParts('삼성전자', '카카오')).toEqual([{ text: '삼성전자', match: false }]);
  });

  it('검색어가 비면 원문 한 조각이다', () => {
    expect(highlightParts('삼성전자', '   ')).toEqual([{ text: '삼성전자', match: false }]);
  });

  it('원문 조각을 이어 붙이면 원문과 같다 (글자 손실 없음)', () => {
    const text = '삼성 전자 우';
    const joined = highlightParts(text, '전자').map((p) => p.text).join('');
    expect(joined).toBe(text);
  });
});
