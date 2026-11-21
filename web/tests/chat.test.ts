// 조건 찾기 챗봇 규칙 (FS 6-10, PRD 4장 F-10, FS 10장)
import { describe, expect, it } from 'vitest';
import {
  CHAT_EXAMPLES,
  CHAT_MAX_INPUT,
  applyChatRules,
  buildSystemPrompt,
  normalizeChatInput,
  parseChatApiBody,
  parseChatOutput,
  parseChatRequest,
  validateChatInput,
  describeChatResult,
  type ChatResult,
} from '@/lib/chat';
import { copy } from '@/lib/copy';
import { FILTERS } from '@/lib/filters';

const emptyOutput = { filters: [], unsupported: [], notCondition: false };

describe('normalizeChatInput', () => {
  it('앞뒤 공백·연속 공백·대소문자만 다른 문장은 같은 키가 된다', () => {
    expect(normalizeChatInput('  빚이   적은 회사 ')).toBe('빚이 적은 회사');
    expect(normalizeChatInput('Debt  LOW')).toBe(normalizeChatInput(' debt low '));
  });
});

describe('validateChatInput', () => {
  it('공백만 있으면 null이다', () => {
    expect(validateChatInput('   ')).toBeNull();
  });
  it('200자는 통과하고 201자는 null이다', () => {
    expect(validateChatInput('가'.repeat(CHAT_MAX_INPUT))).not.toBeNull();
    expect(validateChatInput('가'.repeat(CHAT_MAX_INPUT + 1))).toBeNull();
  });
  it('문자열이 아니면 null이다', () => {
    expect(validateChatInput(123)).toBeNull();
  });
  it('요청 본문에 text가 없으면 null이다', () => {
    expect(parseChatRequest({})).toBeNull();
    expect(parseChatRequest({ text: ' 빚 ' })).toBe('빚');
  });
});

describe('parseChatOutput', () => {
  it('JSON이 아니면 null이다', () => {
    expect(parseChatOutput('그냥 글')).toBeNull();
  });
  it('모양이 틀리면 null이다', () => {
    expect(parseChatOutput('{"filters":[1]}')).toBeNull();
    expect(parseChatOutput('{"filters":"1","unsupported":[],"not_condition":false}')).toBeNull();
    expect(parseChatOutput('{"filters":[],"unsupported":[],"not_condition":"no"}')).toBeNull();
  });
  it('21번·0번·모르는 코드·중복은 그 항목만 버리고 순서는 유지한다', () => {
    const out = parseChatOutput(
      '{"filters":[21,8,0,8,13,"x"],"unsupported":["price","bogus","price"],"not_condition":false}'
    );
    expect(out).toEqual({ filters: [8, 13], unsupported: ['price'], notCondition: false });
  });
});

describe('applyChatRules', () => {
  it('13과 14가 같이 오면 14만 남긴다', () => {
    const r = applyChatRules({ ...emptyOutput, filters: [13, 14] });
    expect(r.filters).toEqual([14]);
    expect(r.conflict).toBeNull();
  });
  it('부딪히는 짝이 있으면 필터를 비우고 conflict를 준다', () => {
    const r = applyChatRules({ ...emptyOutput, filters: [3, 1] });
    expect(r.filters).toEqual([]);
    expect(r.conflict).toEqual([3, 1]);
  });
  it('4개 이상이면 앞의 3개만 적용하고 truncated를 준다', () => {
    const r = applyChatRules({ ...emptyOutput, filters: [1, 4, 5, 7] });
    expect(r.filters).toEqual([1, 4, 5]);
    expect(r.truncated).toEqual([1, 4, 5]);
  });
  it('조건이 아닌 말이면 필터를 비운다', () => {
    const r = applyChatRules({ ...emptyOutput, filters: [1], notCondition: true });
    expect(r.filters).toEqual([]);
    expect(r.notCondition).toBe(true);
  });
  it('지원하지 않는 조건은 필터와 따로 남긴다', () => {
    const r = applyChatRules({ ...emptyOutput, filters: [20], unsupported: ['industry'] });
    expect(r.filters).toEqual([20]);
    expect(r.unsupported).toEqual(['industry']);
  });
});

describe('CHAT_EXAMPLES와 시스템 프롬프트', () => {
  it('예시 3개가 PRD 필터(13+1, 8, 20)와 같다', () => {
    expect(CHAT_EXAMPLES.map((e) => e.filters)).toEqual([[13, 1], [8], [20]]);
  });
  it('시스템 프롬프트는 필터 20개만 담고 기사 데이터를 담지 않는다', () => {
    const prompt = buildSystemPrompt();
    expect(FILTERS.every((f) => prompt.includes(`${f.id}: ${f.label}`))).toBe(true);
    expect(prompt).not.toMatch(/news|기사/);
  });
});

describe('parseChatApiBody', () => {
  it('unavailable과 ok 모양을 받아들이고 나머지는 null이다', () => {
    expect(parseChatApiBody({ status: 'unavailable' })).toEqual({ status: 'unavailable' });
    expect(parseChatApiBody({ status: 'ok', filters: [8], conflict: null, truncated: null, unsupported: [], notCondition: false }))
      .toMatchObject({ status: 'ok', filters: [8] });
    expect(parseChatApiBody({ status: 'ok', filters: [99], conflict: null, truncated: null, unsupported: [], notCondition: false })).toBeNull();
    expect(parseChatApiBody({ status: 'weird' })).toBeNull();
  });
});

describe('describeChatResult', () => {
  const base = { filters: [] as number[], conflict: null, truncated: null, unsupported: [] as ChatResult['unsupported'], notCondition: false };
  it('고른 필터가 있으면 "이 조건으로 찾았어" 문구와 적용할 필터를 준다', () => {
    const d = describeChatResult({ ...base, filters: [8] });
    expect(d.applyFilters).toEqual([8]);
    expect(d.messages[0]).toMatch(/^이 조건으로 찾았어: /);
  });
  it('부딪힘이면 필터를 적용하지 않는다', () => {
    const d = describeChatResult({ ...base, conflict: [3, 1] });
    expect(d.applyFilters).toBeNull();
    expect(d.messages).toHaveLength(1);
  });
  it('조건이 아닌 말이면 규칙 4 문구만 준다', () => {
    const d = describeChatResult({ ...base, notCondition: true });
    expect(d.applyFilters).toBeNull();
    expect(d.messages).toEqual([copy.chat.notCondition]);
  });
  it('지원하지 않는 조건만 있으면 종류별 문구만 주고 필터는 적용하지 않는다', () => {
    const d = describeChatResult({ ...base, unsupported: ['industry'] });
    expect(d.applyFilters).toBeNull();
    expect(d.messages).toEqual([copy.chat.unsupported.industry]);
  });
  it('4개 이상이면 앞의 3개 문구가 함께 나온다', () => {
    const d = describeChatResult({ ...base, filters: [1, 4, 5], truncated: [1, 4, 5] });
    expect(d.messages.some((m) => m.startsWith('필터는 3개까지라'))).toBe(true);
  });
});
