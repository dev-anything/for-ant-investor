import { describe, expect, it } from 'vitest';
import {
  formatNotifyDate,
  isUnsubscribeTokenFormat,
  NOTIFICATION_LIST_LIMIT,
  parseNotificationId,
  readUnsubscribeBody,
} from '@/lib/notify';

describe('isUnsubscribeTokenFormat', () => {
  it('소문자 uuid는 형식이 맞다', () => {
    expect(isUnsubscribeTokenFormat('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
  });
  it('대문자 uuid도 형식이 맞다', () => {
    expect(isUnsubscribeTokenFormat('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(true);
  });
  it('null이나 빈 값은 형식이 틀리다', () => {
    expect(isUnsubscribeTokenFormat(null)).toBe(false);
    expect(isUnsubscribeTokenFormat('')).toBe(false);
  });
  it('짧은 문자열·하이픈 없는 값·앞뒤 공백은 형식이 틀리다', () => {
    expect(isUnsubscribeTokenFormat('abc')).toBe(false);
    expect(isUnsubscribeTokenFormat('3f2504e04f8941d39a0c0305e82c3301')).toBe(false);
    expect(isUnsubscribeTokenFormat(' 3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(false);
  });
  it('끝에 글자가 더 붙으면 형식이 틀리다', () => {
    expect(isUnsubscribeTokenFormat('3f2504e0-4f89-41d3-9a0c-0305e82c3301x')).toBe(false);
  });
});

describe('readUnsubscribeBody', () => {
  it('token 문자열을 꺼낸다', () => {
    expect(readUnsubscribeBody({ token: 'abc' })).toBe('abc');
  });
  it('token이 없거나 문자열이 아니면 null', () => {
    expect(readUnsubscribeBody({})).toBeNull();
    expect(readUnsubscribeBody({ token: 123 })).toBeNull();
    expect(readUnsubscribeBody(null)).toBeNull();
    expect(readUnsubscribeBody('token')).toBeNull();
    expect(readUnsubscribeBody(undefined)).toBeNull();
  });
});

describe('parseNotificationId', () => {
  it('양의 정수 문자열은 숫자가 된다', () => {
    expect(parseNotificationId('1')).toBe(1);
    expect(parseNotificationId('120')).toBe(120);
  });
  it('0·음수·소수·빈 값은 null이다', () => {
    expect(parseNotificationId('0')).toBeNull();
    expect(parseNotificationId('-1')).toBeNull();
    expect(parseNotificationId('1.5')).toBeNull();
    expect(parseNotificationId('')).toBeNull();
  });
  it('문자가 섞이면 null이다', () => {
    expect(parseNotificationId('abc')).toBeNull();
    expect(parseNotificationId('12a')).toBeNull();
    expect(parseNotificationId(' 12')).toBeNull();
  });
  it('안전한 정수 범위를 넘으면 null이다', () => {
    expect(parseNotificationId('99999999999999999999')).toBeNull();
  });
});

describe('formatNotifyDate', () => {
  it('UTC 자정 전이라도 한국 시간 날짜로 바꾼다', () => {
    // 2026-11-20 15:30 UTC = 2026-11-21 00:30 KST
    expect(formatNotifyDate('2026-11-20T15:30:00Z')).toBe('2026-11-21');
  });
  it('한 자리 월·일을 두 자리로 맞춘다', () => {
    expect(formatNotifyDate('2026-01-05T03:00:00Z')).toBe('2026-01-05');
  });
  it('읽을 수 없는 값은 빈 문자열이다', () => {
    expect(formatNotifyDate('not a date')).toBe('');
  });
});

describe('NOTIFICATION_LIST_LIMIT', () => {
  it('마이페이지 알림 칸은 최근 50개다', () => {
    expect(NOTIFICATION_LIST_LIMIT).toBe(50);
  });
});
