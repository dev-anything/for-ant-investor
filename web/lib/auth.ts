// 요청 출처 검사 (FS 4-2, DEV_PLAN 공통 전제). 접속 주소가 여럿(LAN·Tailscale·localhost)이라 고정 주소와 비교하지 않는다.

/**
 * Origin 헤더의 호스트(포트 포함)가 요청의 Host 헤더와 같은지 본다.
 * Origin이 없으면 브라우저 밖의 요청(예: curl)으로 보고 통과시킨다. 브라우저의 POST는 항상 Origin을 붙이므로
 * 다른 사이트에서 보내는 요청은 여기서 막힌다. Origin이 있는데 파싱되지 않거나 Host와 다르면 거부한다.
 */
export function isSameOrigin(originHeader: string | null, hostHeader: string | null): boolean {
  if (originHeader === null) return true;
  if (hostHeader === null) return false;
  try {
    return new URL(originHeader).host.toLowerCase() === hostHeader.toLowerCase();
  } catch {
    // Origin이 "null" 같은 값이면 출처를 알 수 없으니 거부한다
    return false;
  }
}
