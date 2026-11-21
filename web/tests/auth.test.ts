// 요청 출처 검사 (FS 4-2, DEV_PLAN 공통 전제): Origin 호스트와 Host 헤더 비교
import { describe, expect, it } from 'vitest';
import { isSameOrigin } from '@/lib/auth';

describe('isSameOrigin', () => {
  it('Origin 호스트와 Host 헤더가 같으면 통과한다', () => {
    expect(isSameOrigin('http://100.124.240.114:16000', '100.124.240.114:16000')).toBe(true);
  });
  it('포트가 다르면 거부한다', () => {
    expect(isSameOrigin('http://192.168.0.6:3000', '192.168.0.6:16000')).toBe(false);
  });
  it('다른 사이트의 Origin은 거부한다', () => {
    expect(isSameOrigin('https://evil.example', 'localhost:16000')).toBe(false);
  });
  it('Origin 헤더가 없으면 통과한다 (브라우저 밖 요청)', () => {
    expect(isSameOrigin(null, 'localhost:16000')).toBe(true);
  });
  it('Origin이 "null" 같은 값이면 거부한다', () => {
    expect(isSameOrigin('null', 'localhost:16000')).toBe(false);
  });
  it('Host 헤더가 없는데 Origin이 있으면 거부한다', () => {
    expect(isSameOrigin('http://localhost:16000', null)).toBe(false);
  });
  it('호스트 대소문자는 무시한다', () => {
    expect(isSameOrigin('http://LocalHost:16000', 'localhost:16000')).toBe(true);
  });
});
