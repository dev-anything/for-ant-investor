import Image from 'next/image';
import { copy } from '@/lib/copy';

// 네이버 검색결과 표시 (네이버 약관: 검색결과임을 BI 가이드 로고 + 링크로 표시, CLAUDE.md "데이터 라이선스").
// 로고 원본 435×86 → 높이 16px로 줄여 쓴다. 대체 글은 링크 글자와 같게 둔다.
const LOGO_SOURCE_WIDTH = 435;
const LOGO_SOURCE_HEIGHT = 86;
const LOGO_HEIGHT = 16;
const LOGO_WIDTH = Math.round((LOGO_SOURCE_WIDTH / LOGO_SOURCE_HEIGHT) * LOGO_HEIGHT);

export function NaverAttribution() {
  return (
    <p className="mt-2 flex items-center gap-1 text-xs text-ink-sub">
      <span>{copy.news.attributionText} ·</span>
      <a
        href="https://www.naver.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center hover:opacity-80"
      >
        <Image
          src="/NAVER_OPENAPI_LOGO.png"
          alt={copy.news.attributionLink}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
        />
      </a>
    </p>
  );
}
