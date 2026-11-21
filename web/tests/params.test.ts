import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIST_STATE,
  DEFAULT_SCREENER_STATE,
  INDUSTRY_METRIC_SORTS,
  isDivisionCode,
  listHref,
  nextListSort,
  parseListParams,
  toListQuery,
  type ListState,
  allowedSortKeys,
  normalizeFilterIds,
  parseScreenerApiParams,
  parseScreenerParams,
  rawParamsFromSearch,
  toQuery,
  type RawParams,
  type ScreenerState,
} from '@/lib/params';

// URL 쿼리 문자열을 RawParams로 (페이지·API가 실제로 받는 모양과 같다)
function raw(query: string): RawParams {
  return rawParamsFromSearch(new URLSearchParams(query));
}

describe('parseScreenerParams (페이지, 바로잡기)', () => {
  it('아무 키도 없으면 기본 상태다', () => {
    expect(parseScreenerParams({})).toEqual(DEFAULT_SCREENER_STATE);
  });

  it('정상 값은 그대로 읽는다', () => {
    expect(parseScreenerParams(raw('f=1,13&sort=market_cap&dir=desc&page=3&size=20'))).toEqual({
      filters: [1, 13],
      sort: 'market_cap',
      dir: 'desc',
      page: 3,
      size: 20,
    });
  });

  it('범위 밖·문자·0 필터 id는 버린다', () => {
    expect(parseScreenerParams(raw('f=0,21,abc,4')).filters).toEqual([4]);
  });

  it('앞자리 0이 붙은 필터 id(01)는 버리고 기본 상태로 바로잡는다', () => {
    expect(parseScreenerParams(raw('f=01')).filters).toEqual([]);
    expect(parseScreenerParams(raw('f=01,4')).filters).toEqual([4]);
  });

  it('앞자리 0이 붙은 size(010)는 기본값 10으로 바로잡는다', () => {
    expect(parseScreenerParams(raw('size=010&f=4')).size).toBe(10);
  });

  it('필터가 4개 이상이면 앞의 3개만 남긴다', () => {
    expect(parseScreenerParams(raw('f=4,5,6,7')).filters).toEqual([4, 5, 6]);
  });

  it('13과 14가 같이 오면 14만 남긴다 (순서 상관없음)', () => {
    expect(parseScreenerParams(raw('f=13,14')).filters).toEqual([14]);
    expect(parseScreenerParams(raw('f=14,13')).filters).toEqual([14]);
  });

  it('부딪히는 짝이 오면 뒤의 것을 버린다 (1과 3)', () => {
    expect(parseScreenerParams(raw('f=1,3,4')).filters).toEqual([1, 4]);
  });

  it('같은 필터 id가 두 번 오면 한 번만 쓴다', () => {
    expect(parseScreenerParams(raw('f=4,4,5')).filters).toEqual([4, 5]);
  });

  it('정렬 열이 고른 필터의 열이 아니면 name으로 바로잡는다', () => {
    expect(parseScreenerParams(raw('f=1&sort=revenue_growth')).sort).toBe('name');
    expect(parseScreenerParams(raw('f=1&sort=revenue')).sort).toBe('revenue');
  });

  it('없는 정렬 키·방향은 기본값으로 바로잡는다', () => {
    const state = parseScreenerParams(raw('sort=bogus&dir=up'));
    expect(state.sort).toBe('name');
    expect(state.dir).toBe('asc');
  });

  it('페이지는 1 미만·소수·문자면 1로 바로잡는다', () => {
    expect(parseScreenerParams(raw('page=0')).page).toBe(1);
    expect(parseScreenerParams(raw('page=1.5')).page).toBe(1);
    expect(parseScreenerParams(raw('page=abc')).page).toBe(1);
    expect(parseScreenerParams(raw('page=2147483648')).page).toBe(1);
  });

  it('페이지당 개수는 10·20·50 밖이면 10으로 바로잡는다', () => {
    expect(parseScreenerParams(raw('size=7')).size).toBe(10);
    expect(parseScreenerParams(raw('size=50')).size).toBe(50);
  });

  it('같은 키가 두 번 와도 오류 없이 바로잡는다', () => {
    expect(parseScreenerParams(raw('page=2&page=3')).page).toBe(1);
  });
});

describe('parseScreenerApiParams (API, 바로잡지 않고 null = 400)', () => {
  it('f=1,13은 통과한다', () => {
    expect(parseScreenerApiParams(raw('f=1,13'))).toEqual({
      ...DEFAULT_SCREENER_STATE,
      filters: [1, 13],
    });
  });

  it('f가 없거나 빈 값이면 null', () => {
    expect(parseScreenerApiParams(raw(''))).toBeNull();
    expect(parseScreenerApiParams(raw('f='))).toBeNull();
  });

  it('필터 id가 0·21·문자면 null', () => {
    expect(parseScreenerApiParams(raw('f=0'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=21'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=a'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=1,'))).toBeNull();
  });

  it('필터가 4개면 null', () => {
    expect(parseScreenerApiParams(raw('f=1,2,4,5'))).toBeNull();
  });

  it('부딪히는 짝(1·3)이나 13·14 같이 오면 null', () => {
    expect(parseScreenerApiParams(raw('f=1,3'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=13,14'))).toBeNull();
  });

  it('같은 필터 id가 두 번 오면 null', () => {
    expect(parseScreenerApiParams(raw('f=4,4'))).toBeNull();
  });

  it('앞자리 0이 붙은 필터 id(f=01)는 null', () => {
    expect(parseScreenerApiParams(raw('f=01'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4,05'))).toBeNull();
  });

  it('앞자리 0이 붙은 size(010)는 null (10으로 바로잡지 않는다)', () => {
    expect(parseScreenerApiParams(raw('f=4&size=010'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&size=050'))).toBeNull();
  });

  it('size가 7이면 null, 허용값이면 통과', () => {
    expect(parseScreenerApiParams(raw('f=4&size=7'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&size=20'))?.size).toBe(20);
  });

  it('page가 0·소수·범위 밖이면 null', () => {
    expect(parseScreenerApiParams(raw('f=4&page=0'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&page=1.5'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&page=2147483648'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&page=2'))?.page).toBe(2);
  });

  it('sort가 허용 밖이거나 빈 값이면 null', () => {
    expect(parseScreenerApiParams(raw('f=4&sort='))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&sort=revenue'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=1&sort=revenue'))?.sort).toBe('revenue');
  });

  it('dir이 asc·desc가 아니면 null', () => {
    expect(parseScreenerApiParams(raw('f=4&dir=up'))).toBeNull();
  });

  it('같은 키가 두 번 오면 null', () => {
    expect(parseScreenerApiParams(raw('f=4&f=5'))).toBeNull();
    expect(parseScreenerApiParams(raw('f=4&size=10&size=20'))).toBeNull();
  });
});

describe('normalizeFilterIds', () => {
  it('정리 결과는 3개를 넘지 않는다', () => {
    expect(normalizeFilterIds([4, 5, 6, 7, 8])).toHaveLength(3);
  });
});

describe('allowedSortKeys', () => {
  it('필터가 없으면 종목명·시가총액만 허용한다', () => {
    expect(allowedSortKeys([])).toEqual(['name', 'market_cap']);
  });

  it('20번(배당)을 고르면 dps 정렬 키를 허용한다', () => {
    expect(allowedSortKeys([20])).toContain('dps');
  });

  it('고른 필터의 정렬 키를 더한다 (중복 없음)', () => {
    expect(allowedSortKeys([1, 2, 12])).toEqual(['name', 'market_cap', 'revenue', 'revenue_growth', 'operating_margin']);
  });
});

describe('toQuery', () => {
  it('기본 상태는 빈 문자열이다 (기본값 키는 생략)', () => {
    expect(toQuery(DEFAULT_SCREENER_STATE)).toBe('');
  });

  it('f·sort·dir·page·size 순서로 쓰고, 쉼표는 그대로 둔다', () => {
    const state: ScreenerState = { filters: [1, 13], sort: 'market_cap', dir: 'desc', page: 2, size: 50 };
    expect(toQuery(state)).toBe('f=1,13&sort=market_cap&dir=desc&page=2&size=50');
  });

  it('쓴 쿼리를 다시 읽으면 같은 상태가 된다 (왕복)', () => {
    const states: ScreenerState[] = [
      DEFAULT_SCREENER_STATE,
      { filters: [4, 5], sort: 'net_income', dir: 'desc', page: 4, size: 20 },
      { filters: [19], sort: 'total_equity', dir: 'asc', page: 1, size: 10 },
    ];
    for (const state of states) {
      expect(parseScreenerParams(raw(toQuery(state)))).toEqual(state);
    }
  });
});

describe('업종 목록 URL 상태 (FS 6-6, F-08)', () => {
  it('아무 키도 없으면 기본 상태다 (가나다순, 1쪽, 10개)', () => {
    expect(parseListParams({}, INDUSTRY_METRIC_SORTS)).toEqual(DEFAULT_LIST_STATE);
  });

  it('정상 값은 그대로 읽는다', () => {
    expect(parseListParams(raw('sort=debt_ratio&dir=desc&page=2&size=20'), INDUSTRY_METRIC_SORTS)).toEqual({
      sort: 'debt_ratio',
      dir: 'desc',
      page: 2,
      size: 20,
    });
  });

  it('목록에 없는 정렬 키는 name으로 바로잡는다 (스크리너 키 market_cap은 지표 목록에 없음)', () => {
    expect(parseListParams(raw('sort=market_cap'), INDUSTRY_METRIC_SORTS).sort).toBe('name');
    expect(parseListParams(raw('sort=zzz'), INDUSTRY_METRIC_SORTS).sort).toBe('name');
  });

  it('잘못된 dir·page·size는 기본값으로 바로잡는다', () => {
    expect(parseListParams(raw('dir=up&page=0&size=15'), INDUSTRY_METRIC_SORTS)).toEqual(DEFAULT_LIST_STATE);
    expect(parseListParams(raw('page=abc&size=010'), INDUSTRY_METRIC_SORTS)).toEqual(DEFAULT_LIST_STATE);
  });

  it('기본값인 키는 쿼리에서 생략한다', () => {
    expect(toListQuery(DEFAULT_LIST_STATE)).toBe('');
    expect(toListQuery({ ...DEFAULT_LIST_STATE, sort: 'debt_ratio', dir: 'desc', page: 2, size: 20 })).toBe(
      'sort=debt_ratio&dir=desc&page=2&size=20'
    );
  });

  it('쿼리를 만들고 다시 읽으면 같은 상태가 된다 (왕복)', () => {
    const state: ListState = { sort: 'revenue_growth', dir: 'asc', page: 3, size: 50 };
    const back = parseListParams(raw(toListQuery(state)), INDUSTRY_METRIC_SORTS);
    expect(back).toEqual(state);
  });

  it('listHref는 쿼리가 없으면 경로만 준다', () => {
    expect(listHref('/industries/26/compare', DEFAULT_LIST_STATE)).toBe('/industries/26/compare');
    expect(listHref('/industries/26/compare', { ...DEFAULT_LIST_STATE, page: 2 })).toBe(
      '/industries/26/compare?page=2'
    );
  });

  it('nextListSort: 같은 열이면 방향을 뒤집고, 다른 열이면 asc로 하며, 쪽은 1쪽이 된다', () => {
    const state: ListState = { sort: 'debt_ratio', dir: 'asc', page: 4, size: 10 };
    expect(nextListSort(state, 'debt_ratio')).toEqual({ ...state, dir: 'desc', page: 1 });
    expect(nextListSort({ ...state, dir: 'desc' }, 'debt_ratio').dir).toBe('asc');
    expect(nextListSort({ ...state, dir: 'desc' }, 'name')).toEqual({ ...state, sort: 'name', dir: 'asc', page: 1 });
  });

  it('isDivisionCode는 두 자리 숫자만 받는다', () => {
    expect(isDivisionCode('26')).toBe(true);
    expect(isDivisionCode('01')).toBe(true);
    expect(isDivisionCode('abc')).toBe(false);
    expect(isDivisionCode('2')).toBe(false);
    expect(isDivisionCode('264')).toBe(false);
  });
});
