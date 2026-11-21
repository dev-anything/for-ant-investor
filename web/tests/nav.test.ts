import { describe, expect, it } from 'vitest';
import { isActivePath } from '@/lib/nav';

describe('isActivePath', () => {
  it('`/`는 홈 경로에서만 켜진다', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/screener', '/')).toBe(false);
  });

  it('`/screener`는 하위 경로에서도 켜진다', () => {
    expect(isActivePath('/screener', '/screener')).toBe(true);
    expect(isActivePath('/screener/abc', '/screener')).toBe(true);
  });

  it('이름만 같은 접두어 경로는 켜지지 않는다', () => {
    expect(isActivePath('/screenerx', '/screener')).toBe(false);
  });

  it('404 등 다른 경로에서는 어떤 메뉴도 켜지지 않는다', () => {
    expect(isActivePath('/없는-페이지', '/')).toBe(false);
    expect(isActivePath('/없는-페이지', '/screener')).toBe(false);
  });
});
