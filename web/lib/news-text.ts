// 경제 기사 순수 함수 (FS 6-13, PRD 4장 F-18). DB·네트워크 없이 네이버 응답 모양 검사와 표시용 변환만 맡는다.
// 네이버 약관: 받은 순서·개수 그대로 바꾸기만 한다. 빼거나 정렬하지 않는다 (CLAUDE.md "NAVER API HUB").
// 이 파일은 AI 입력용 모듈(chat)에서 import하지 않는다 (PRD F-10·F-18, FS 9-6).

// PRD 10장 29번: 한 페이지 10개
export const NEWS_PAGE_SIZE = 10;
// PRD 5-8: start 최대 1000 → 쪽 100까지
export const NEWS_MAX_PAGE = 100;

// 기사 한 줄. 표시 전 값이다 (제목은 텍스트로만 쓴다, dangerouslySetInnerHTML 금지)
export type NewsItem = {
  title: string;
  // 원문 도메인 (www. 뗌). 알 수 없으면 ''
  domain: string;
  // 한국 시간 `YYYY-MM-DD HH:mm`. 알 수 없으면 ''
  time: string;
  // 원문 링크 (http·https만). 안전하지 않으면 null (줄을 링크 없이 보인다)
  href: string | null;
};

export type NewsResult =
  | { status: 'ok'; items: NewsItem[]; total: number | null }
  | { status: 'error' };

// 네이버 응답 한 쪽 (검사 뒤 변환한 값)
export type NaverNewsPage = { items: NewsItem[]; total: number | null };

// 응답 모양이 틀렸을 때 던지는 오류. 메시지에는 필드 이름만 있고 값·키·URL은 없다 (로그에 그대로 남겨도 됨)
export class NewsShapeError extends Error {
  constructor(field: string) {
    super(`네이버 응답 모양이 달라(${field})`);
    this.name = 'NewsShapeError';
  }
}

// 이름 있는 엔티티 (네이버 제목에 나오는 것만). Map으로 둬서 `constructor` 같은 이름이 걸리지 않게 한다
const NAMED_ENTITIES = new Map<string, string>([
  ['quot', '"'],
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['apos', "'"],
  ['nbsp', ' '],
]);

// 태그 모양(`<` 뒤 영문자로 시작해 `>`로 끝남)만 지운다. 그 밖의 `<`는 글자로 남긴다
const TAG_PATTERN = /<\/?[A-Za-z][^<>]*>/g;
// 엔티티 한 번만 푼다 (`&amp;lt;`가 `<`가 되지 않도록 한 번의 치환으로 처리)
const ENTITY_PATTERN = /&(#\d+|#[xX][0-9a-fA-F]+|[A-Za-z]+);/g;

/**
 * 기사 제목 정리: `<b>` 같은 태그 제거 → HTML 엔티티 풀기. 그 밖의 글자는 바꾸지 않는다 (PRD 4장 F-18).
 * 결과는 텍스트다. HTML로 넣지 않는다.
 */
export function cleanNewsTitle(raw: string): string {
  const withoutTags = raw.replace(TAG_PATTERN, '');
  return withoutTags.replace(ENTITY_PATTERN, (whole, body: string) => decodeEntity(body, whole)).trim();
}

// 엔티티 본문(`quot`, `#39`, `#x27`)을 글자로 바꾼다. 모르는 엔티티는 원래 글로 둔다
function decodeEntity(body: string, whole: string): string {
  if (body.startsWith('#')) {
    const isHex = body[1] === 'x' || body[1] === 'X';
    const code = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return whole;
    return String.fromCodePoint(code);
  }
  return NAMED_ENTITIES.get(body) ?? whole;
}

// 주소의 호스트에서 앞 `www.`만 뗀다. 주소가 비었거나 잘못되면 null
function hostOf(url: string): string | null {
  if (url === '') return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === '' ? null : host;
  } catch {
    // 잘못된 주소는 출처를 모르는 것으로 본다 (호출하는 쪽이 다른 주소로 대신 본다)
    return null;
  }
}

/** 출처 도메인: `originallink`의 호스트 (앞 `www.` 뗌). 없거나 잘못되면 `link`의 호스트, 둘 다 없으면 '' (PRD 10장 30번) */
export function newsDomain(originallink: string, link: string): string {
  return hostOf(originallink) ?? hostOf(link) ?? '';
}

/** 원문 링크: `originallink`, 없으면 `link`. http·https가 아니거나 잘못되면 null (PRD 4장 F-18) */
export function newsHref(originallink: string, link: string): string | null {
  const candidate = originallink !== '' ? originallink : link;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return candidate;
  } catch {
    return null;
  }
}

// 한국 시간 = UTC + 9시간 (서머타임 없음)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 네이버 `pubDate`(RFC 822, 예: `Thu, 20 Nov 2026 09:12:00 +0900`)를 한국 시간 `YYYY-MM-DD HH:mm`으로 (PRD 10장 30번).
 * 읽을 수 없으면 ''.
 */
export function formatPubDate(pubDate: string): string {
  const ms = Date.parse(pubDate);
  if (Number.isNaN(ms)) return '';
  const kst = new Date(ms + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
}

/**
 * 종목 화면 기사 검색어 `{종목명} {종목코드}` (PRD 4장 F-18, 2026-11-23 사용자 결정).
 * 기사에 종목코드가 같이 적히는 경우가 많아 회사 기사가 더 많이 걸린다. 이름은 앞뒤 공백을 뗀다.
 */
export function buildStockNewsQuery(name: string, shortCode: string): string {
  return `${name.trim()} ${shortCode.trim()}`;
}

/**
 * `/news?page=` 값을 쪽 번호로 (PRD 10장 29번). 숫자가 아니거나 1~NEWS_MAX_PAGE 밖이면 1.
 * 같은 키가 여러 번 오면 첫 값만 쓴다.
 */
export function parseNewsPage(raw: string | string[] | undefined): number {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (text === undefined || !/^\d+$/.test(text)) return 1;
  const page = Number(text);
  return page >= 1 && page <= NEWS_MAX_PAGE ? page : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new NewsShapeError(key);
  return value;
}

// `originallink`는 없을 수 있다 (없으면 `link`를 쓴다). 값이 있는데 문자열이 아니면 모양이 틀린 것
function readOptionalString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new NewsShapeError(key);
  return value;
}

// 응답 한 줄을 검사하고 표시 값으로 바꾼다. `description`은 쓰지 않는다 (PRD 4장 F-18: 요약 없음)
function parseRow(raw: unknown): NewsItem {
  if (!isRecord(raw)) throw new NewsShapeError('item');
  const title = readString(raw, 'title');
  const link = readString(raw, 'link');
  const pubDate = readString(raw, 'pubDate');
  const originallink = readOptionalString(raw, 'originallink');
  return {
    title: cleanNewsTitle(title),
    domain: newsDomain(originallink, link),
    time: formatPubDate(pubDate),
    href: newsHref(originallink, link),
  };
}

/**
 * 네이버 뉴스 검색 응답 검사·변환 (FS 9-6). 받은 순서·개수 그대로 바꾼다.
 * 필수 필드(`items`, 각 줄의 `title`·`link`·`pubDate`)가 틀리면 전체를 던진다 (일부만 보이면 안 되니까).
 * `total`이 숫자가 아니면 null.
 */
export function parseNaverNewsResponse(json: unknown): NaverNewsPage {
  if (!isRecord(json)) throw new NewsShapeError('응답');
  const rawItems = json.items;
  if (!Array.isArray(rawItems)) throw new NewsShapeError('items');
  const items = rawItems.map(parseRow);
  const total = typeof json.total === 'number' && Number.isFinite(json.total) ? json.total : null;
  return { items, total };
}
