import { describe, expect, it } from 'vitest';
import {
  cleanNewsTitle,
  formatPubDate,
  isShortName,
  naverNewsSearchUrl,
  newsDomain,
  newsHref,
  NEWS_MAX_PAGE,
  NewsShapeError,
  parseNaverNewsResponse,
  parseNewsPage,
} from '@/lib/news-text';

// 네이버 응답을 흉내 낸 가짜 데이터 (실제 응답은 키가 생긴 뒤 확인, PRD 11장 16번)
const fakeRow = (overrides: Record<string, unknown> = {}) => ({
  title: '<b>기준금리</b> 동결 &quot;신중&quot; 결정',
  originallink: 'https://www.example-news.co.kr/article/1',
  link: 'https://n.news.naver.com/article/1',
  description: '요약 문장은 쓰지 않는다',
  pubDate: 'Thu, 20 Nov 2026 09:12:00 +0900',
  ...overrides,
});

describe('cleanNewsTitle (PRD 4장 F-18: 태그 제거·엔티티 풀기, 글자는 그대로)', () => {
  it('<b> 태그를 지운다', () => {
    expect(cleanNewsTitle('<b>삼성</b>전자 실적')).toBe('삼성전자 실적');
  });

  it('&quot;·&amp;·&#39;를 글자로 푼다', () => {
    expect(cleanNewsTitle('&quot;A&quot; &amp; &#39;B&#39;')).toBe(`"A" & 'B'`);
  });

  it('16진 숫자 엔티티도 푼다', () => {
    expect(cleanNewsTitle('&#x41;&#66;')).toBe('AB');
  });

  it('&amp;lt;는 한 번만 풀어 "&lt;" 글자로 남긴다 (두 번 풀지 않는다)', () => {
    expect(cleanNewsTitle('&amp;lt;')).toBe('&lt;');
  });

  it('태그가 아닌 <는 글자로 남긴다', () => {
    expect(cleanNewsTitle('매출 1조 < 2조 기업')).toBe('매출 1조 < 2조 기업');
  });

  it('모르는 엔티티와 prototype 이름 엔티티는 그대로 둔다', () => {
    expect(cleanNewsTitle('&foo; &constructor;')).toBe('&foo; &constructor;');
  });

  it('범위를 벗어난 숫자 엔티티는 그대로 둔다', () => {
    expect(cleanNewsTitle('&#99999999;')).toBe('&#99999999;');
  });

  it('앞뒤 공백을 뗀다', () => {
    expect(cleanNewsTitle('  제목  ')).toBe('제목');
  });
});

describe('newsDomain (PRD 10장 30번: 원문 호스트, 앞 www. 뗌)', () => {
  it('originallink의 호스트에서 www.를 뗀다', () => {
    expect(newsDomain('https://www.example-news.co.kr/a', 'https://n.news.naver.com/x')).toBe('example-news.co.kr');
  });

  it('originallink가 비었으면 link의 호스트를 쓴다', () => {
    expect(newsDomain('', 'https://n.news.naver.com/x')).toBe('n.news.naver.com');
  });

  it('originallink가 잘못되면 link의 호스트를 쓴다', () => {
    expect(newsDomain('not a url', 'https://news.example.com/y')).toBe('news.example.com');
  });

  it('둘 다 없으면 빈 문자열', () => {
    expect(newsDomain('', '')).toBe('');
  });
});

describe('newsHref (원문 링크, http·https만)', () => {
  it('originallink가 있으면 그것을 쓴다', () => {
    expect(newsHref('https://a.example.com/1', 'https://n.naver.com/2')).toBe('https://a.example.com/1');
  });

  it('originallink가 비었으면 link를 쓴다 (빈 값 → link)', () => {
    expect(newsHref('', 'https://n.naver.com/2')).toBe('https://n.naver.com/2');
  });

  it('javascript: 같은 주소는 null (링크 없이 보인다)', () => {
    expect(newsHref('javascript:alert(1)', '')).toBeNull();
  });

  it('잘못된 주소는 null', () => {
    expect(newsHref('', 'not a url')).toBeNull();
  });
});

describe('formatPubDate (한국 시간 YYYY-MM-DD HH:mm)', () => {
  it('+0900 표기는 그대로 한국 시간이다', () => {
    expect(formatPubDate('Thu, 20 Nov 2026 09:12:00 +0900')).toBe('2026-11-20 09:12');
  });

  it('UTC 자정 직전은 한국 시간 다음 날 아침으로 넘어간다', () => {
    expect(formatPubDate('Thu, 20 Nov 2026 23:30:00 GMT')).toBe('2026-11-21 08:30');
  });

  it('날짜가 바뀌는 경계 (UTC 15:00 = 한국 00:00)', () => {
    expect(formatPubDate('Thu, 20 Nov 2026 15:00:00 +0000')).toBe('2026-11-21 00:00');
  });

  it('읽을 수 없는 값은 빈 문자열', () => {
    expect(formatPubDate('어제')).toBe('');
  });
});

describe('isShortName (PRD 10장 24번: 한글 2글자 이하, 영문·숫자 3글자 이하)', () => {
  it('한글 2글자는 짧다', () => {
    expect(isShortName('한솔')).toBe(true);
  });

  it('한글 3글자는 짧지 않다', () => {
    expect(isShortName('현대차')).toBe(false);
  });

  it('영문·숫자 3글자는 짧다', () => {
    expect(isShortName('LG')).toBe(true);
    expect(isShortName('CJ1')).toBe(true);
  });

  it('영문·숫자 4글자는 짧지 않다', () => {
    expect(isShortName('NAVER')).toBe(false);
    expect(isShortName('SK이노')).toBe(false);
  });

  it('한글이 섞인 이름은 한글 기준을 쓴다 (전체 3글자면 짧지 않다)', () => {
    expect(isShortName('S오일')).toBe(false);
    expect(isShortName('K오')).toBe(true);
  });

  it('공백만 있거나 빈 이름은 짧은 것으로 본다', () => {
    expect(isShortName('   ')).toBe(true);
  });
});

describe('parseNewsPage (PRD 10장 29번: 1~100, 잘못된 값은 1)', () => {
  it('정상 값은 그대로', () => {
    expect(parseNewsPage('3')).toBe(3);
    expect(parseNewsPage(String(NEWS_MAX_PAGE))).toBe(NEWS_MAX_PAGE);
  });

  it('없거나 빈 값은 1', () => {
    expect(parseNewsPage(undefined)).toBe(1);
    expect(parseNewsPage('')).toBe(1);
  });

  it('숫자가 아니거나 음수·0이면 1', () => {
    expect(parseNewsPage('abc')).toBe(1);
    expect(parseNewsPage('-2')).toBe(1);
    expect(parseNewsPage('0')).toBe(1);
    expect(parseNewsPage('1.5')).toBe(1);
  });

  it('상한(100)을 넘으면 1', () => {
    expect(parseNewsPage(String(NEWS_MAX_PAGE + 1))).toBe(1);
  });

  it('같은 키가 여러 번 오면 첫 값만 쓴다', () => {
    expect(parseNewsPage(['4', '9'])).toBe(4);
  });
});

describe('naverNewsSearchUrl', () => {
  it('종목명을 인코딩해 네이버 뉴스 검색 주소를 만든다', () => {
    expect(naverNewsSearchUrl('LG')).toBe('https://search.naver.com/search.naver?where=news&query=LG');
  });
});

describe('parseNaverNewsResponse (가짜 응답 JSON, 순서·개수 그대로)', () => {
  it('받은 순서와 개수를 그대로 유지한다 (정렬·빼기 없음)', () => {
    const json = {
      total: 1234,
      items: [fakeRow({ title: '첫째' }), fakeRow({ title: '둘째' }), fakeRow({ title: '셋째' })],
    };
    const page = parseNaverNewsResponse(json);
    expect(page.items.map((item) => item.title)).toEqual(['첫째', '둘째', '셋째']);
    expect(page.total).toBe(1234);
  });

  it('제목 정리·도메인·시각·링크를 한 번에 바꾼다', () => {
    const [item] = parseNaverNewsResponse({ items: [fakeRow()] }).items;
    expect(item).toEqual({
      title: '기준금리 동결 "신중" 결정',
      domain: 'example-news.co.kr',
      time: '2026-11-20 09:12',
      href: 'https://www.example-news.co.kr/article/1',
    });
  });

  it('description은 쓰지 않는다 (요약 없음)', () => {
    const [item] = parseNaverNewsResponse({ items: [fakeRow({ description: '요약' })] }).items;
    expect(Object.keys(item)).not.toContain('description');
  });

  it('originallink가 없어도 link로 대신한다', () => {
    const row = fakeRow();
    const { originallink: _unused, ...withoutOriginal } = row;
    void _unused;
    const [item] = parseNaverNewsResponse({ items: [withoutOriginal] }).items;
    expect(item.href).toBe('https://n.news.naver.com/article/1');
    expect(item.domain).toBe('n.news.naver.com');
  });

  it('total이 없으면 null', () => {
    expect(parseNaverNewsResponse({ items: [] })).toEqual({ items: [], total: null });
  });

  it('total이 숫자가 아니면 null', () => {
    expect(parseNaverNewsResponse({ items: [], total: '5' }).total).toBeNull();
  });

  it('items가 없으면 모양 오류', () => {
    expect(() => parseNaverNewsResponse({ errorMessage: 'x' })).toThrow(NewsShapeError);
  });

  it('items가 배열이 아니면 모양 오류', () => {
    expect(() => parseNaverNewsResponse({ items: 'nope' })).toThrow(NewsShapeError);
  });

  it('응답 자체가 객체가 아니면 모양 오류', () => {
    expect(() => parseNaverNewsResponse(null)).toThrow(NewsShapeError);
    expect(() => parseNaverNewsResponse([])).toThrow(NewsShapeError);
  });

  it('한 줄이라도 title이 문자열이 아니면 전체를 모양 오류로 본다', () => {
    expect(() => parseNaverNewsResponse({ items: [fakeRow(), fakeRow({ title: 3 })] })).toThrow(NewsShapeError);
  });

  it('pubDate가 없으면 모양 오류', () => {
    const row = fakeRow();
    const { pubDate: _unused, ...withoutDate } = row;
    void _unused;
    expect(() => parseNaverNewsResponse({ items: [withoutDate] })).toThrow(NewsShapeError);
  });

  it('오류 메시지에는 값이 없고 필드 이름만 있다', () => {
    try {
      parseNaverNewsResponse({ items: [fakeRow({ link: 12345 })] });
      expect.fail('오류가 나야 한다');
    } catch (error) {
      expect(error).toBeInstanceOf(NewsShapeError);
      expect((error as Error).message).toContain('link');
      expect((error as Error).message).not.toContain('12345');
    }
  });

  it('빈 목록은 0건', () => {
    expect(parseNaverNewsResponse({ items: [], total: 0 })).toEqual({ items: [], total: 0 });
  });
});
