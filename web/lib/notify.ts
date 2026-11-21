// 알림·수신 거부 순수 함수 (PRD 4장 F-13, FS 9-13). DB·React에 기대지 않는다.

// 마이페이지 알림 칸에 보여 주는 최근 개수 (FS 12장 동작 기본안 5번)
export const NOTIFICATION_LIST_LIMIT = 50;

// 수신 거부 토큰은 DB의 uuid 열이다. 형식이 아니면 DB에 물어보지 않고 막는다
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 알림 id는 bigserial이라 1부터 시작한다. 0이나 음수, 소수, 문자가 섞이면 형식 오류
const NOTIFICATION_ID_PATTERN = /^[1-9][0-9]*$/;

// 한국 시간 보정 (UTC+9). 알림 날짜는 사용자가 보는 날짜로 보여 준다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 수신 거부 토큰 형식(uuid)인지 본다. 없거나 형식이 다르면 false. */
export function isUnsubscribeTokenFormat(token: string | null): token is string {
  return token !== null && UUID_PATTERN.test(token);
}

/** `{ token }` 요청 본문에서 토큰 문자열을 꺼낸다. 모양이 틀리면 null (호출하는 쪽이 400). */
export function readUnsubscribeBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('token' in body)) return null;
  return typeof body.token === 'string' ? body.token : null;
}

/** URL 경로의 알림 id를 정수로 바꾼다. 양의 정수 문자열이 아니면 null (호출하는 쪽이 400). */
export function parseNotificationId(raw: string): number | null {
  if (!NOTIFICATION_ID_PATTERN.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/** 알림 시각을 한국 시간 `YYYY-MM-DD`로 바꾼다 (PRD F-13 날짜 표기). 읽을 수 없는 값이면 빈 문자열. */
export function formatNotifyDate(createdAt: string): string {
  const ms = Date.parse(createdAt);
  if (Number.isNaN(ms)) return '';
  const kst = new Date(ms + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}`;
}
