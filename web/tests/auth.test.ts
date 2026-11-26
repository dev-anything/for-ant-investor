// 로그인·요청 출처 순수 함수 테스트 (FS 6-12, 10장, DEV_PLAN 16b)
import { describe, expect, it } from 'vitest';
import {
  buildLoginRedirect,
  checkNewPassword,
  isEmailFormat,
  isSameOrigin,
  isWatchCodeFormat,
  loginFailureKind,
  parseMailLinkType,
  parseMeResponse,
  passwordUpdateFailureKind,
  readEmailOptInBody,
  readWatchCodeBody,
  safeNextPath,
} from '@/lib/auth';

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
  it('Origin 헤더가 없으면 통과한다 (브라우저 밖 요청, 공개 /api/chat 기본 동작)', () => {
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
  it('requireOrigin이면 Origin이 없을 때 거부한다 (상태 변경 요청, CSRF 방어)', () => {
    expect(isSameOrigin(null, 'localhost:16000', { requireOrigin: true })).toBe(false);
  });
  it('requireOrigin이어도 Origin이 같으면 통과한다', () => {
    expect(isSameOrigin('http://localhost:16000', 'localhost:16000', { requireOrigin: true })).toBe(true);
  });
  it('기본 동작과 엄격 모드는 Origin이 없을 때만 다르다 (공개 /api/chat 동작 고정)', () => {
    expect(isSameOrigin(null, 'localhost:16000')).toBe(true);
    expect(isSameOrigin(null, 'localhost:16000', { requireOrigin: false })).toBe(true);
    expect(isSameOrigin(null, 'localhost:16000', { requireOrigin: true })).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('내부 경로는 그대로 둔다', () => {
    expect(safeNextPath('/stocks/005930')).toBe('/stocks/005930');
    expect(safeNextPath('/stocks/005930?x=1')).toBe('/stocks/005930?x=1');
  });
  it('빈 값·null은 /가 된다', () => {
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath('')).toBe('/');
  });
  it('/로 시작하지 않으면 /가 된다', () => {
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath('stocks/005930')).toBe('/');
  });
  it('//로 시작하면 /가 된다', () => {
    expect(safeNextPath('//evil.com')).toBe('/');
  });
  it('/\\로 시작하면 /가 된다', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/');
  });
  it('탭·줄바꿈이 끼어 호스트가 바뀌는 입력은 /가 된다', () => {
    expect(safeNextPath('/\t/evil.com')).toBe('/');
    expect(safeNextPath('/\n/evil.com')).toBe('/');
  });
  it('백슬래시·제어 문자가 들어 있으면 /가 된다', () => {
    expect(safeNextPath('/stocks\\x')).toBe('/');
    expect(safeNextPath('/stocks/005930\u0000')).toBe('/');
  });
});

describe('isWatchCodeFormat', () => {
  it('6자리 숫자 코드는 통과한다', () => {
    expect(isWatchCodeFormat('005930')).toBe(true);
  });
  it('영문이 섞인 6자리 코드(0220W0)는 통과한다', () => {
    expect(isWatchCodeFormat('0220W0')).toBe(true);
  });
  it('5자리·7자리는 거부한다', () => {
    expect(isWatchCodeFormat('05930')).toBe(false);
    expect(isWatchCodeFormat('0059300')).toBe(false);
  });
  it('소문자·기호·빈 값·null은 거부한다', () => {
    expect(isWatchCodeFormat('0220w0')).toBe(false);
    expect(isWatchCodeFormat('00-930')).toBe(false);
    expect(isWatchCodeFormat('')).toBe(false);
    expect(isWatchCodeFormat(null)).toBe(false);
  });
});

describe('buildLoginRedirect', () => {
  it('next를 인코딩해 ?next=를 항상 붙인다', () => {
    expect(buildLoginRedirect('http://localhost:16000', '/stocks/005930')).toBe(
      'http://localhost:16000/auth/callback?next=%2Fstocks%2F005930',
    );
  });
  it('형식이 맞는 watch는 &watch=로 붙인다', () => {
    expect(buildLoginRedirect('http://localhost:16000', '/', '0220W0')).toBe(
      'http://localhost:16000/auth/callback?next=%2F&watch=0220W0',
    );
  });
  it('형식이 틀린 watch는 붙이지 않는다', () => {
    expect(buildLoginRedirect('http://localhost:16000', '/', '12')).toBe(
      'http://localhost:16000/auth/callback?next=%2F',
    );
  });
});

describe('isEmailFormat', () => {
  it('일반적인 주소는 통과한다', () => {
    expect(isEmailFormat('user@example.com')).toBe(true);
  });
  it('앞뒤 공백은 빼고 본다', () => {
    expect(isEmailFormat('  user@example.com ')).toBe(true);
  });
  it('빈 값과 공백만 있는 값은 거부한다', () => {
    expect(isEmailFormat('')).toBe(false);
    expect(isEmailFormat('   ')).toBe(false);
  });
  it('@가 없거나 여럿이면 거부한다', () => {
    expect(isEmailFormat('userexample.com')).toBe(false);
    expect(isEmailFormat('a@b@example.com')).toBe(false);
  });
  it('도메인에 점이 없으면 거부한다', () => {
    expect(isEmailFormat('user@example')).toBe(false);
  });
  it('가운데 공백이 있으면 거부한다', () => {
    expect(isEmailFormat('us er@example.com')).toBe(false);
  });
  it('254자를 넘으면 거부한다', () => {
    const local = 'a'.repeat(64);
    const domain = `${'b'.repeat(190)}.com`;
    expect(`${local}@${domain}`.length).toBeGreaterThan(254);
    expect(isEmailFormat(`${local}@${domain}`)).toBe(false);
  });
});

describe('parseMeResponse', () => {
  it('로그인 안 한 응답을 읽는다', () => {
    expect(parseMeResponse({ loggedIn: false })).toEqual({ loggedIn: false });
  });
  it('로그인한 응답은 안 읽은 알림 수를 읽는다', () => {
    expect(parseMeResponse({ loggedIn: true, unreadCount: 3 })).toEqual({ loggedIn: true, unreadCount: 3 });
    expect(parseMeResponse({ loggedIn: true, unreadCount: 0 })).toEqual({ loggedIn: true, unreadCount: 0 });
  });
  it('숫자가 아니거나 음수인 알림 수는 모양이 다른 것으로 본다', () => {
    expect(parseMeResponse({ loggedIn: true, unreadCount: '3' })).toBeNull();
    expect(parseMeResponse({ loggedIn: true, unreadCount: -1 })).toBeNull();
    expect(parseMeResponse({ loggedIn: true })).toBeNull();
  });
  it('loggedIn 값이 불리언이 아니면 null이다', () => {
    expect(parseMeResponse({ loggedIn: 'yes' })).toBeNull();
    expect(parseMeResponse({ error: 'server_error' })).toBeNull();
  });
  it('객체가 아니면 null이다', () => {
    expect(parseMeResponse(null)).toBeNull();
    expect(parseMeResponse('loggedIn')).toBeNull();
  });
});

describe('readWatchCodeBody', () => {
  it('정상 코드 `{ code: "005930" }`는 그 코드를 돌려준다', () => {
    expect(readWatchCodeBody({ code: '005930' })).toBe('005930');
  });

  it('영문이 섞인 코드 `0220W0`도 통과한다', () => {
    expect(readWatchCodeBody({ code: '0220W0' })).toBe('0220W0');
  });

  it('5자리·7자리·소문자·기호가 든 코드는 null이다', () => {
    expect(readWatchCodeBody({ code: '05930' })).toBeNull();
    expect(readWatchCodeBody({ code: '0059300' })).toBeNull();
    expect(readWatchCodeBody({ code: '0220w0' })).toBeNull();
    expect(readWatchCodeBody({ code: '005-30' })).toBeNull();
  });

  it('code 키가 없거나 문자열이 아니면 null이다', () => {
    expect(readWatchCodeBody({})).toBeNull();
    expect(readWatchCodeBody({ code: 5930 })).toBeNull();
    expect(readWatchCodeBody(null)).toBeNull();
    expect(readWatchCodeBody('005930')).toBeNull();
    expect(readWatchCodeBody(undefined)).toBeNull();
  });
});

describe('readEmailOptInBody', () => {
  it('true·false는 그대로 돌려준다', () => {
    expect(readEmailOptInBody({ emailOptIn: true })).toBe(true);
    expect(readEmailOptInBody({ emailOptIn: false })).toBe(false);
  });

  it('문자열 "true"나 0은 boolean이 아니므로 null이다', () => {
    expect(readEmailOptInBody({ emailOptIn: 'true' })).toBeNull();
    expect(readEmailOptInBody({ emailOptIn: 0 })).toBeNull();
  });

  it('키가 없거나 객체가 아니면 null이다', () => {
    expect(readEmailOptInBody({})).toBeNull();
    expect(readEmailOptInBody(null)).toBeNull();
    expect(readEmailOptInBody(true)).toBeNull();
  });
});

describe('checkNewPassword', () => {
  it('8자이고 두 값이 같으면 통과한다', () => {
    expect(checkNewPassword('abcd1234', 'abcd1234')).toBeNull();
  });
  it('7자는 짧다고 알린다', () => {
    expect(checkNewPassword('abcd123', 'abcd123')).toBe('too_short');
  });
  it('빈 값은 짧다고 알린다', () => {
    expect(checkNewPassword('', '')).toBe('too_short');
  });
  it('문자 조합 조건은 없다 (숫자만 8자 통과)', () => {
    expect(checkNewPassword('12345678', '12345678')).toBeNull();
  });
  it('72바이트는 통과하고 73바이트는 길다고 알린다', () => {
    expect(checkNewPassword('a'.repeat(72), 'a'.repeat(72))).toBeNull();
    expect(checkNewPassword('a'.repeat(73), 'a'.repeat(73))).toBe('too_long');
  });
  it('한글은 바이트 수로 상한을 본다 (25자 = 75바이트)', () => {
    expect(checkNewPassword('가'.repeat(25), '가'.repeat(25))).toBe('too_long');
  });
  it('두 값이 다르면 알린다', () => {
    expect(checkNewPassword('abcd1234', 'abcd1235')).toBe('mismatch');
  });
});

describe('loginFailureKind', () => {
  it('invalid_credentials는 invalid다', () => {
    expect(loginFailureKind('invalid_credentials')).toBe('invalid');
  });
  it('email_not_confirmed는 unconfirmed다', () => {
    expect(loginFailureKind('email_not_confirmed')).toBe('unconfirmed');
  });
  it('그 밖의 코드와 코드 없음은 failed다', () => {
    expect(loginFailureKind('over_request_rate_limit')).toBe('failed');
    expect(loginFailureKind(undefined)).toBe('failed');
  });
});

describe('passwordUpdateFailureKind', () => {
  it('같은 비밀번호·약한 비밀번호를 구분한다', () => {
    expect(passwordUpdateFailureKind('same_password')).toBe('same');
    expect(passwordUpdateFailureKind('weak_password')).toBe('weak');
  });
  it('세션이 없거나 재인증이 필요하면 expired다', () => {
    expect(passwordUpdateFailureKind('AuthSessionMissingError')).toBe('expired');
    expect(passwordUpdateFailureKind('reauthentication_needed')).toBe('expired');
  });
  it('모르는 코드는 failed다', () => {
    expect(passwordUpdateFailureKind('unexpected_failure')).toBe('failed');
  });
});

describe('parseMailLinkType', () => {
  it('email과 recovery만 받는다', () => {
    expect(parseMailLinkType('email')).toBe('email');
    expect(parseMailLinkType('recovery')).toBe('recovery');
  });
  it('그 밖의 종류와 null은 null이다', () => {
    expect(parseMailLinkType('invite')).toBeNull();
    expect(parseMailLinkType(null)).toBeNull();
  });
});
