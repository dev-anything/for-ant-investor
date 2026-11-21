import { describe, expect, it } from 'vitest';
import {
  DISCLOSURE_COUNT,
  dartDateRange,
  dartViewerUrl,
  excludeOwnershipDisclosures,
  ownershipCoverageFrom,
  parseDartList,
  takeRecent,
  type DisclosureRow,
} from '@/lib/disclosure';

const row = (rceptNo: string, rceptDt: string, reportNm = '분기보고서 (2026.09)'): DisclosureRow => ({
  rceptNo,
  reportNm,
  filer: '삼성전자',
  rceptDt,
});

const dartItem = (rcept_no: string, rcept_dt: string, report_nm: string) => ({
  corp_cls: 'Y',
  corp_code: '00126380',
  corp_name: '삼성전자',
  flr_nm: '삼성전자',
  rcept_dt,
  rcept_no,
  report_nm,
  rm: '',
  stock_code: '005930',
});

describe('parseDartList', () => {
  it('status 013이면 데이터 없음으로 보고 빈 목록을 돌려준다', () => {
    expect(parseDartList({ status: '013', message: '조회된 데이타가 없습니다.' })).toEqual({
      totalCount: 0,
      rows: [],
    });
  });

  it('status 000이면 행을 공백 패딩을 뗀 값으로 돌려준다', () => {
    const body = {
      status: '000',
      total_count: 2,
      list: [
        dartItem('20261114000001', '20261114', '주식소각결정              '),
        dartItem('20261113000002', '20261113', '분기보고서 (2026.09)'),
      ],
    };
    const page = parseDartList(body);
    expect(page.totalCount).toBe(2);
    expect(page.rows[0]).toEqual({
      rceptNo: '20261114000001',
      reportNm: '주식소각결정',
      filer: '삼성전자',
      rceptDt: '20261114',
    });
  });

  it('status가 000·013이 아니면 throw한다 (한도 초과 등 실패를 빈 목록으로 바꾸지 않음)', () => {
    expect(() => parseDartList({ status: '020', message: '요청 제한' })).toThrow();
  });

  it('행 하나라도 모양이 틀리면 전체를 throw한다', () => {
    const body = { status: '000', total_count: 2, list: [dartItem('1', '20261114', '보고서'), { rcept_no: '2' }] };
    expect(() => parseDartList(body)).toThrow();
  });

  it('접수일자가 8자리 숫자가 아니면 throw한다', () => {
    const body = { status: '000', total_count: 1, list: [dartItem('1', '2026-11-14', '보고서')] };
    expect(() => parseDartList(body)).toThrow();
  });

  it('total_count가 숫자가 아니면 throw한다', () => {
    expect(() => parseDartList({ status: '000', total_count: '3', list: [] })).toThrow();
  });

  it('본문이 객체가 아니면 throw한다', () => {
    expect(() => parseDartList(null)).toThrow();
    expect(() => parseDartList('{}')).toThrow();
  });
});

describe('ownershipCoverageFrom', () => {
  it('지분공시 목록이 한 페이지에 다 들어오면 null (끝까지 확인됨)', () => {
    expect(ownershipCoverageFrom({ totalCount: 2, rows: [row('a', '20261114'), row('b', '20261110')] })).toBeNull();
  });

  it('한 페이지를 넘으면 받은 목록의 가장 오래된 접수일을 쓴다', () => {
    const page = { totalCount: 3415, rows: [row('a', '20261118'), row('b', '20260721')] };
    expect(ownershipCoverageFrom(page)).toBe('20260721');
  });

  it('목록이 비었는데 총건수만 크면 null로 둔다 (확인할 날짜가 없음)', () => {
    expect(ownershipCoverageFrom({ totalCount: 5, rows: [] })).toBeNull();
  });
});

describe('excludeOwnershipDisclosures', () => {
  const all = [
    row('o1', '20261118'),
    row('n1', '20261116'),
    row('n2', '20261113'),
    row('o2', '20261110'),
    row('n3', '20261108'),
  ];

  it('지분공시 rcept_no는 빼고 순서는 그대로 둔다', () => {
    const kept = excludeOwnershipDisclosures(all, new Set(['o1', 'o2']), null);
    expect(kept.map((r) => r.rceptNo)).toEqual(['n1', 'n2', 'n3']);
  });

  it('지분공시 목록이 잘린 날짜 이하 행을 만나면 그 뒤는 보지 않는다', () => {
    const kept = excludeOwnershipDisclosures(all, new Set(['o1']), '20261110');
    expect(kept.map((r) => r.rceptNo)).toEqual(['n1', 'n2']);
  });

  it('잘린 날짜와 같은 날 행도 신뢰하지 않는다 (같은 날이 페이지 경계에 걸쳤을 수 있음)', () => {
    const kept = excludeOwnershipDisclosures(all, new Set(), '20261110');
    expect(kept.map((r) => r.rceptNo)).toEqual(['o1', 'n1', 'n2']);
  });

  it('지분공시 집합이 비어 있으면 전부 남긴다', () => {
    expect(excludeOwnershipDisclosures(all, new Set(), null)).toHaveLength(all.length);
  });
});

describe('takeRecent', () => {
  it('앞에서 5개를 자른다', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row(`r${i}`, '20261101'));
    expect(takeRecent(rows, DISCLOSURE_COUNT).map((r) => r.rceptNo)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
  });

  it('행이 5개보다 적으면 있는 만큼만 돌려준다', () => {
    expect(takeRecent([row('a', '20261101')], DISCLOSURE_COUNT)).toHaveLength(1);
  });
});

describe('dartViewerUrl', () => {
  it('DART 원문 뷰어 주소를 만든다', () => {
    expect(dartViewerUrl('20261114000001')).toBe(
      'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20261114000001',
    );
  });
});

describe('dartDateRange', () => {
  it('한국 시간 오늘을 끝으로 365일 전부터 조회한다', () => {
    // 2026-11-21 00:30 KST = 2026-11-20 15:30 UTC
    const now = new Date('2026-11-20T15:30:00Z');
    expect(dartDateRange(now)).toEqual({ bgnDe: '20251121', endDe: '20261121' });
  });

  it('한국 시간 날짜가 바뀌는 시각을 기준으로 한다', () => {
    // 2026-11-20 23:30 KST = 2026-11-20 14:30 UTC
    const now = new Date('2026-11-20T14:30:00Z');
    expect(dartDateRange(now).endDe).toBe('20261120');
  });
});
