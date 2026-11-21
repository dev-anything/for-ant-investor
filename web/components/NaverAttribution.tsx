import { copy } from '@/lib/copy';

// 네이버 검색결과 표시 (네이버 약관: 검색결과임을 표시, CLAUDE.md "데이터 라이선스").
// TODO(R4): BI 가이드 로고 파일(public/naver-logo.*)이 준비되면 로고 이미지를 이 자리에 넣는다. 지금은 글자만 쓴다.
export function NaverAttribution() {
  return (
    <p className="mt-2 text-xs text-neutral-700">
      {copy.news.attributionText} ·{' '}
      <a
        href="https://www.naver.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-neutral-900"
      >
        {copy.news.attributionLink}
      </a>
    </p>
  );
}
