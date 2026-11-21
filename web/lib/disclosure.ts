// 최근 공시 순수 함수 (FS 6-14, PRD 4장 F-17). DB·네트워크 없이 DART 응답 모양 검사와 거르기·링크만 맡는다.

// PRD 4장 F-17: 최신순 5개
export const DISCLOSURE_COUNT = 5;
// 2026-11-21 확인: `bgn_de`를 빼면 DART가 013(데이터 없음)을 준다. 기간은 1년으로 잡는다 (PRD 10장 27번과 함께 사용자 확인 대상)
export const DISCLOSURE_LOOKBACK_DAYS = 365;
// DART list.json 한 번에 받는 최대 건수 (CLAUDE.md 공시검색 절)
export const DART_PAGE_COUNT = 100;
// 2026-11-21 확인: `pblntf_ty=D`(DART 공시유형 D)가 지분공시(임원·주요주주 소유보고, 대량보유 보고 등)만 준다.
// 응답 행에는 공시유형 필드가 없어서, 지분공시 집합은 이 파라미터로 따로 받아 rcept_no로 뺀다.
export const OWNERSHIP_PBLNTF_TYPE = 'D';

// 로그에 남겨도 되는 오류 (FS 3-3). 메시지는 HTTP 상태 코드나 DART status뿐이라 키·요청 URL이 들어가지 않는다
export class DartStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DartStatusError';
  }
}

export type DisclosureRow = {
  rceptNo: string;
  reportNm: string;
  filer: string;
  // YYYYMMDD 원본 (표시는 formatRceptDt)
  rceptDt: string;
};

export type DartListPage = {
  totalCount: number;
  rows: DisclosureRow[];
};

// 2026-11-21 확인: 응답 필드 corp_cls·corp_code·corp_name·flr_nm·rcept_dt·rcept_no·report_nm·rm·stock_code
const DART_NO_DATA = '013';
const DART_OK = '000';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// 응답 값을 그대로 검사한다. 메시지에는 필드 이름만 쓴다 (값·키·URL을 남기지 않음)
function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new Error(`DART 응답 모양이 달라(${key})`);
  return value;
}

function parseRow(row: unknown): DisclosureRow {
  if (!isRecord(row)) throw new Error('DART 응답 모양이 달라(행)');
  const rceptDt = readString(row, 'rcept_dt').trim();
  if (!/^\d{8}$/.test(rceptDt)) throw new Error('DART 응답 모양이 달라(rcept_dt)');
  return {
    rceptNo: readString(row, 'rcept_no').trim(),
    // 제목 뒤 공백 패딩만 뗀다 (내용은 받은 그대로)
    reportNm: readString(row, 'report_nm').trim(),
    filer: readString(row, 'flr_nm').trim(),
    rceptDt,
  };
}

/**
 * DART list.json 응답을 검사한다. 모양이 하나라도 틀리면 throw (일부만 보이면 "최신 5개"가 틀어진다).
 * status `013`은 데이터 없음이라 빈 목록, `000`이 아니면 그 밖의 상태로 보고 throw한다.
 */
export function parseDartList(body: unknown): DartListPage {
  if (!isRecord(body)) throw new Error('DART 응답 모양이 달라(본문)');
  const status = body.status;
  if (status === DART_NO_DATA) return { totalCount: 0, rows: [] };
  if (status !== DART_OK) throw new DartStatusError(`DART 상태 ${String(status)}`);

  const totalCount = body.total_count;
  if (typeof totalCount !== 'number') throw new Error('DART 응답 모양이 달라(total_count)');
  if (!Array.isArray(body.list)) throw new Error('DART 응답 모양이 달라(list)');
  return { totalCount, rows: body.list.map(parseRow) };
}

/**
 * 지분공시를 빼는 기준 날짜(이 날짜 이하는 신뢰하지 않음)를 구한다.
 * 지분공시 목록을 한 페이지(100건)만 받았으면 그 페이지의 가장 오래된 날짜보다 옛날 행은 지분공시 여부를 알 수 없다.
 * 한 페이지에 다 들어왔으면 null (끝까지 확인됨).
 */
export function ownershipCoverageFrom(ownership: DartListPage): string | null {
  if (ownership.totalCount <= ownership.rows.length) return null;
  if (ownership.rows.length === 0) return null;
  return ownership.rows[ownership.rows.length - 1].rceptDt;
}

/**
 * 최신순 목록에서 지분공시(rcept_no 집합)를 뺀다. 순서는 유지한다.
 * `coverageFrom`이 있으면 그 날짜 이하 행을 만나는 순간 멈춘다 (그 뒤는 지분공시 여부를 모름).
 */
export function excludeOwnershipDisclosures(
  rows: DisclosureRow[],
  ownershipRceptNos: ReadonlySet<string>,
  coverageFrom: string | null,
): DisclosureRow[] {
  const kept: DisclosureRow[] = [];
  for (const row of rows) {
    if (coverageFrom !== null && row.rceptDt <= coverageFrom) break;
    if (ownershipRceptNos.has(row.rceptNo)) continue;
    kept.push(row);
  }
  return kept;
}

// 앞에서부터 n개 (이미 최신순이라고 가정한다)
export function takeRecent(rows: DisclosureRow[], n: number): DisclosureRow[] {
  return rows.slice(0, n);
}

// PRD 5-8: DART 원문 뷰어 (2026-11-20 확정 형식)
export function dartViewerUrl(rceptNo: string): string {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
}

/**
 * list.json 조회 기간 (`bgn_de`·`end_de`, YYYYMMDD). 한국 시간 기준 오늘 ~ 365일 전.
 * `now`를 받아 테스트에서 날짜를 고정한다.
 */
export function dartDateRange(now: Date): { bgnDe: string; endDe: string } {
  const toDartDate = (ms: number) => {
    // 한국 시간(UTC+9) 날짜를 UTC 함수로 읽으려고 9시간을 더한다
    const kst = new Date(ms + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10).replace(/-/g, '');
  };
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    bgnDe: toDartDate(now.getTime() - DISCLOSURE_LOOKBACK_DAYS * dayMs),
    endDe: toDartDate(now.getTime()),
  };
}
