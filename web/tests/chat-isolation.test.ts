// 기사 데이터를 챗봇 쪽에 넣지 않는다 (PRD 4장 F-18·F-10, 네이버 약관 "AI 입력·학습·활용 금지", FS 10장)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// 챗봇이 쓰는 파일 모두 (AI 요청을 만드는 곳)
const CHAT_FILES = ['../app/api/chat/route.ts', '../lib/data/chat.ts', '../lib/chat.ts', '../components/ChatFilterInput.tsx'];

// 기사 쪽 모듈 이름 (import·require 경로에 들어가면 안 된다)
const NEWS_MODULES = ['data/news', 'news-text', 'components/NewsList', 'components/NewsBlock', 'components/HomeNews', 'components/StockNews'];

describe('챗봇 파일은 기사 데이터를 가져오지 않는다', () => {
  for (const file of CHAT_FILES) {
    it(`${file}에 기사 모듈 import가 없다`, () => {
      const source = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
      for (const moduleName of NEWS_MODULES) {
        expect(source.includes(moduleName), `${moduleName} 참조`).toBe(false);
      }
    });
  }
});
