// 상단 메뉴 현재 위치 판정 (FS 7장 AppHeader, 순수 함수)

/**
 * 현재 경로가 메뉴 링크 경로에 해당하는지 판정한다.
 * `/`는 정확히 일치할 때만 켜지고, 나머지는 접두어 일치 (예: `/screener/xxx`도 `/screener`에 켜짐).
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
