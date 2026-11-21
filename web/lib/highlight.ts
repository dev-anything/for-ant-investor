// 검색어와 일치하는 부분 찾기 (PRD 4장 F-01 "일치 부분 굵게", FS 8-1). 순수 함수.
// HTML 문자열을 만들지 않고 조각 배열만 돌려준다. 화면은 조각을 React 요소로 그린다 (dangerouslySetInnerHTML 금지).

export interface HighlightPart {
  text: string;
  match: boolean; // true면 굵게 표시
}

interface NormalizedText {
  chars: string; // 소문자 + 공백 뺀 문자열 (검색 비교용, PRD 4장 F-01 검색 규칙)
  starts: number[]; // chars의 각 글자가 원문에서 시작하는 위치
  ends: number[]; // chars의 각 글자가 원문에서 끝나는 위치 (끝 포함 안 함)
}

// 원문 위치를 기억하면서 정규화한다. 대소문자·띄어쓰기를 무시하고도 원문에서 같은 부분을 찾기 위해서다
function normalizeWithMap(text: string): NormalizedText {
  let chars = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;
  // for...of는 문자(코드 포인트) 단위로 돈다. index는 원문의 UTF-16 위치다
  for (const ch of text) {
    const start = index;
    index += ch.length;
    if (/\s/.test(ch)) continue;
    const lowered = ch.toLowerCase();
    // 소문자 변환이 글자 수를 늘릴 수 있어 (예: İ) 변환 결과의 각 단위를 같은 원문 위치에 묶는다
    for (let i = 0; i < lowered.length; i++) {
      chars += lowered[i];
      starts.push(start);
      ends.push(index);
    }
  }
  return { chars, starts, ends };
}

/**
 * 원문을 일치 부분 기준으로 나눈다. 검색어가 없거나 일치하지 않으면 원문 한 조각 (굵게 없음).
 * 같은 글자가 여러 번 나오면 첫 번째만 굵게 한다 (연관검색어 한 줄에 한 번이면 충분).
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const needle = normalizeWithMap(query).chars;
  if (needle.length === 0 || text.length === 0) return [{ text, match: false }];

  const hay = normalizeWithMap(text);
  const at = hay.chars.indexOf(needle);
  if (at === -1) return [{ text, match: false }];

  const from = hay.starts[at];
  const to = hay.ends[at + needle.length - 1];
  const parts: HighlightPart[] = [
    { text: text.slice(0, from), match: false },
    { text: text.slice(from, to), match: true },
    { text: text.slice(to), match: false },
  ];
  return parts.filter((part) => part.text.length > 0);
}
