---
paths:
  - "web/**/*.ts"
  - "web/**/*.tsx"
---

# TypeScript 코드 스타일 (web/)

폴더 구조는 `docs/FS.md` 3장이 기준이다. 이 파일은 코드 작성 스타일만 다룬다.

## 이름
- 변수·함수·파일·폴더 이름은 **영어**로 쓴다. 주석은 **한국어**, 화면 문구는 PRD 3-1 "용어·어투"를 따른다.
- 표기법:

| 대상 | 표기 | 예 |
| --- | --- | --- |
| 변수·함수 | camelCase | `debtRatio`, `getCompanySummary` |
| 컴포넌트·타입 | PascalCase | `StockSearchBox`, `CompanySummary` |
| 상수 | UPPER_SNAKE_CASE | `MAX_FILTER_COUNT` |
| 파일(컴포넌트) | PascalCase | `StockSearchBox.tsx` |
| 파일(그 외) | kebab-case | `format-amount.ts` |
| boolean | `is`·`has` 접두어 | `isFinancialCompany` |

- DB 컬럼은 snake_case다. **DB를 읽는 함수(`lib/data/`)가 결과를 camelCase로 한 번만 바꿔서** 돌려준다. 화면 코드는 snake_case를 보지 않는다. (이유: 변환 코드를 한곳에 모아 컬럼명이 바뀌어도 거기만 고치려고)

## 분할
- 함수는 한 가지 일만 하고 **40줄 안팎**, 파일은 **300줄 안팎**을 목표로 한다. 엄격한 제한이 아니라 "쪼갤지 검토하는 신호"다.
- 컴포넌트 파일은 컴포넌트 1개가 기본이다 (작은 보조 컴포넌트는 같은 파일 허용).
- 계산·판정·포맷 로직은 화면 코드에서 빼서 **순수 함수로 `lib/`에** 둔다. 컴포넌트는 받은 값을 그리고 상호작용만 맡는다.
- DB·외부 API 호출은 컴포넌트 안에 직접 쓰지 않고 `lib/data/`의 조회 함수로 분리한다.
- **화면 문구는 `lib/copy.ts`에 모은다** (FS 3장). 필터 문구·충돌 규칙은 `lib/filters.ts`. 한 컴포넌트에서만 쓰는 짧은 라벨은 그 파일에 둬도 된다.
- 숫자 기준값(눈금 범위, 최대 필터 3개, 연관검색어 10개 등)은 이름 붙인 상수로 뺀다. 코드 중간에 숫자를 그대로 쓰지 않는다.

## import·export
- 경로는 **항상 `@/`**(= `web/` 루트)로 쓴다. 같은 폴더여도 `./`·`../`를 쓰지 않는다.
- import 순서: 외부 라이브러리 → `@/` 내부 모듈 → 타입 import. 그룹 사이에 빈 줄을 둔다.
- **이름 있는 export**(`export function ...`)를 쓴다. `export default`는 Next.js가 요구하는 파일(`page.tsx`, `layout.tsx` 등)에만 쓴다.

## 타입
- `tsconfig`에서 `strict: true`.
- **`any` 금지.** 모르는 값(외부 API 응답 등)은 `unknown`으로 받아 검사한 뒤 쓴다.
- 타입 단언(`as`)은 최소로 쓰고, 쓸 때는 이유를 주석으로 남긴다.
- 값이 없을 수 있는 건 **`null`**로 표현하고 `undefined`와 섞지 않는다. ("데이터 없음"과 `0`을 구분해야 한다.)

## 에러 처리
- 필수 DB 조회 실패는 `throw` → `error.tsx`가 오류 화면을 보여준다.
- 외부 API 실패(DART 공시, 네이버 기사 등 부가 기능)는 던지지 않고 `{ status: 'error' }` 같은 **결과 객체**로 돌려준다. 한 칸이 실패해도 페이지 전체가 죽지 않게 한다.
- 에러를 `catch`로 삼키지 않는다. 처리하지 못하면 다시 던지고, 빈 `catch {}`는 금지.
- API Route는 잘못된 입력에 400 `{ "error": "bad_request" }`처럼 에러 코드를 JSON으로 돌려준다.
- 에러 로그에 키 값과 요청 URL의 `serviceKey`·`crtfc_key`를 남기지 않는다.

## 주석
- **"무엇"이 아니라 "왜"**를 쓴다. 코드를 읽으면 아는 내용은 반복하지 않는다.
- PRD·FS 근거가 있는 규칙(금융회사 판별, 자본잠식 조건, 눈금 범위 등)은 절 번호를 남긴다. 예: `// PRD 4장 F-05`
- `lib/`에서 export하는 함수는 한 줄 설명을 달고, 헷갈리는 단위(원·백만원, %·비율)는 단위를 쓴다.
- `as` 단언, `eslint-disable` 같은 예외는 이유를 반드시 쓴다.
- 지운 옛 코드를 주석 처리해서 남기지 않는다.
