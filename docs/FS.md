# FS — 재무 레이더 기능 명세 (구현 단위)

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-11-17 |
| 갱신일 | 2026-11-28 — 8-3 스크리너 근거 값 열 묶기 (사용자 결정). 2026-11-28 — 5-4·9-7 업종 회사 목록 열 추가 (사용자 결정). 2026-11-28 — 9-8 PC 투어 ③→④ 위로 이동 허용 (사용자 결정). 2026-11-28 — F-18 종목 기사 `sort=sim` 확정. 2026-11-28 — **`DESIGN-V2.md` 페이지 세부 수정 반영** (사용자 토론 확정). 5-9 업종별 시가총액 상위 회사 DB 함수 추가(적용 전 사용자 확인), 6-3 `gaugeDots`, 7장 `Tooltip` 위치 계산·`Gauge` 3개년 점, 8-2 `MetricRow` 3줄, 8-3 필터 버튼 너비, 9-1 종목 화면 순서(실적 → 리포트카드, 실적 전체 폭), 9-3 PER·PBR 행 모양, 9-6 종목 기사 검색 조건 비교, 9-7 업종 카드, 9-8 투어 흐름, 9-9 외부 전송 안내 삭제, 11장 19단계. 2026-11-27 — **`DESIGN.md` 3차로 교체** (사용자 확정: 모던 핀테크풍, 포인트 색 보라 `#6D28D9`, 흰 카드, lucide 아이콘, 종목 화면 PC 두 단). 3장 스타일·7장 공통 컴포넌트·8-2 막대 색·9-1 PC 배치·9-13 투어 스타일 반영. 2026-11-27 — 화면 디자인 기준을 `DESIGN.md`로 정함 (포인트 색 갈색 한 가지, 라이트 모드만, 빗금 음수 막대 등). 3장 스타일·7장 공통 컴포넌트·8-2 막대 색·음수·9-13 투어 스타일 반영. 2026-11-26 — F-11 로그인을 이메일 + 비밀번호로 변경 (3·6-12·7·9-10·9-11·9-12·10·11·12장). 2026-11-26 — F-05 지표 3개 화면 순서 변경 (매출 증가율 → 영업이익률 → 부채비율, 8-2). 2026-11-23 — R11 사용자 결정 (종목 화면 기사 검색어 `{종목명} {종목코드}`, 짧은 종목명 안내·기사 칸 위 안내 폐지, 재무 없음 문구 마침표). 2026-11-20 — F-17 최근 공시·F-18 경제 기사 추가 (9-1 목록 + 정해진 구현 내용 9-1-1, 1·2·3장·10장 반영); 2026-11-20 — 2차·확장 구현 결정 7개 + 기본안 반영 (1·4·7장, 9-1·9-2, 10장): 업종 목록 링크 방식, F-16 투어 범위, F-10 한도 보호, F-11 트리거, F-12 자동 등록, F-13 수신 거부·배치; 2026-11-20 — **2차·확장 상세 명세 작성** (9장을 8장 깊이로: 2·3·4·5·6·7·10·11·12장에 2차·확장 항목 추가. DB 함수 5-3~5-8, 순수 모듈 6-8~6-14, 화면 9-1~9-13) |
| 짝 문서 | `docs/PRD.md` — **무엇을** 만드나 (기능 규칙·문구·수용 기준). 이 문서는 **어떻게** 만드나 (구조·화면 구성·컴포넌트·API·DB 함수·상태) |
| 읽는 법 | 개발 에이전트는 **PRD + FS 두 문서만** 읽는다. 규칙·문구는 여기에 다시 적지 않고 `PRD 4장 F-05`처럼 절 번호로 가리킨다. 두 문서가 어긋나면 **규칙·문구는 PRD, 구현 방식은 FS**가 기준이다 |
| 범위 | **MVP(F-01·F-02·F-05·F-03·F-07)는 8장, 2차(F-08·F-09·F-14·F-17·F-18·F-15·F-16·F-10)·확장(F-11·F-12·F-13)은 9장**에 같은 깊이로 적는다. 외부 API 응답처럼 **아직 확인하지 않은 것**은 "확인 뒤 정함"으로 남기고 PRD 11장 번호를 단다 |

## 목차

1. 구현 원칙
2. 프로젝트 구조
3. 환경·설정
4. 데이터 접근 (서버 컴포넌트 / API Route / DB 함수)
5. DB 함수 (마이그레이션 추가)
6. 공통 모듈 (순수 함수·상수·문구)
7. 공통 컴포넌트
8. 화면 명세 (MVP)
9. 화면 명세 (2차·확장)
10. 테스트
11. 개발 순서와 완료 조건
12. FS 기본안 중 사용자 확인 필요

---

## 1. 구현 원칙

| 원칙 | 내용 |
| --- | --- |
| 데이터 흐름 | 웹앱은 **Supabase만** 읽는다. 공공 API(KRX·시세·DART)는 부르지 않는다 (배치 담당). **예외 (2차):** F-17 DART 공시검색 `list.json`, F-18 네이버 뉴스 검색(HUB)은 서버에서 직접 부르고 Next.js 캐시에만 둔다. DB에 저장하지 않는다 (PRD 5-8) |
| 첫 화면 | 페이지의 첫 데이터는 **서버 컴포넌트에서 직접 조회**한다 |
| 브라우저에서 바뀌는 것 | 검색 자동완성, 스크리너 결과 변경, 챗봇만 **API Route**. (2차) 업종 목록·지표 비교 목록의 정렬·페이지는 URL 쿼리 링크 + 서버 다시 그리기 (`/news`와 같음, API Route 없음). (확장) 로그인 사용자 정보·추적·설정·알림 읽음·탈퇴·수신 거부도 API Route (9-10) |
| 공개 화면과 로그인 | (확장) 공개 화면(`/`, 종목, 스크리너, 업종, `/news`)은 **쿠키를 읽지 않는다** → 캐시(`revalidate`)가 그대로 유지된다. 로그인에 따라 바뀌는 부분(상단 로그인 메뉴, "추적하기" 버튼)은 클라이언트 컴포넌트가 화면이 뜬 뒤 API Route로 따로 묻는다. 쿠키를 읽는 서버 화면은 `/mypage`·`/reset-password`·`/auth/callback`뿐 |
| 복잡한 조회 | 순위·정렬·페이지가 얽힌 조회는 **DB 함수(RPC)** 로 DB에서 처리 (5장) |
| 판정 위치 | 필터·문장·금융회사·자본잠식 판정은 **배치가 저장한 값**을 읽는다. 웹앱은 다시 판정하지 않는다. 웹앱이 계산하는 것은 화면 표시용(화살표·눈금 위치·숫자 포맷)뿐 |
| 문구 | 사용자에게 보이는 문구는 **`lib/copy.ts` 한 파일**에 모은다. 컴포넌트에 문구를 직접 쓰지 않는다 |
| 스타일 | **Tailwind만.** 화면 디자인 기준은 `DESIGN.md` (2026-11-27 3차): 모던 핀테크풍, 포인트 색 보라 `#6D28D9` 한 가지 + 흰색·`zinc` 계열, 연회색 바탕 위 흰 카드(모서리 16px), 라이트 모드만, 글꼴 Pretendard. 신호등 색과 파랑 계열 강조는 쓰지 않는다 (PRD 1-5). 아이콘은 `lucide-react` (설치는 코드 작업 때 사용자 확인) |
| 키 | 서버용 키는 `server-only` 모듈 안에서만 쓴다. `NEXT_PUBLIC_`에 비밀 키 금지 (PRD 7-3) |
| 금지 표현 | 코드의 변수명·주석·테스트 이름에도 평가 표현을 쓰지 않는다 (PRD 1-5). 예: `isGood`, `danger`, `riskLevel` 금지 → `isAboveLine`, `capitalImpairment` |

---

## 2. 프로젝트 구조

웹앱은 프로젝트 루트 아래 **`web/`** (배치와 분리, Vercel Root Directory = `web`).

```
for-ant-investor/
├─ web/
│  ├─ app/
│  │  ├─ layout.tsx                 # 공통 머리(AppHeader)·푸터(SiteFooter)
│  │  ├─ page.tsx                   # / 검색 (F-01)
│  │  ├─ not-found.tsx
│  │  ├─ stocks/[code]/page.tsx     # 종목 화면 (F-02·F-05, 2차에 F-08·F-09·F-14·F-16·F-17·F-18, 확장 F-12)
│  │  ├─ screener/page.tsx          # 스크리너 (F-07, 2차에 F-10)
│  │  ├─ news/page.tsx              # (2차) 경제 기사 목록 (F-18, 상단 메뉴에 없음)
│  │  ├─ industries/page.tsx                    # (2차) 업종 목록 (F-15)
│  │  ├─ industries/[division]/page.tsx         # (2차) 업종 회사 목록 (F-15)
│  │  ├─ industries/[division]/compare/page.tsx # (2차) 지표 비교 목록 (F-08)
│  │  ├─ mypage/page.tsx            # (확장) 마이페이지 (F-12·F-13, 쿠키 읽음)
│  │  ├─ unsubscribe/page.tsx       # (확장) 수신 거부 확인 화면 (F-13)
│  │  ├─ reset-password/page.tsx    # (확장) 새 비밀번호 설정 (F-11, 쿠키 읽음)
│  │  ├─ auth/callback/route.ts     # (확장) 인증 메일 링크 도착 → 세션 생성 → watch 처리 → next (F-11·F-12)
│  │  └─ api/
│  │     ├─ search/route.ts         # GET 연관검색어 (F-01)
│  │     ├─ screener/route.ts       # GET 스크리너 결과 (F-07)
│  │     ├─ chat/route.ts           # (2차) POST 문장 → 필터 (F-10)
│  │     ├─ me/route.ts             # (확장) GET 로그인 여부·읽지 않은 알림 수
│  │     ├─ watchlist/route.ts      # (확장) GET·POST·DELETE 추적 (F-12)
│  │     ├─ settings/route.ts       # (확장) PATCH 메일 수신 (F-12)
│  │     ├─ account/delete/route.ts # (확장) POST 탈퇴 (F-11)
│  │     ├─ notifications/[id]/read/route.ts # (확장) PATCH 읽음 (F-13)
│  │     └─ unsubscribe/route.ts    # (확장) POST 수신 거부 (F-13)
│  ├─ proxy.ts                      # (확장) 로그인 세션 갱신. 로그인 관련 경로만 matcher (9-10). Next.js 16 이전이면 middleware.ts
│  ├─ components/                   # 7장, 기능별 컴포넌트는 9장
│  ├─ lib/
│  │  ├─ supabase/server.ts         # 서버용 클라이언트 (server-only)
│  │  ├─ supabase/session.ts        # (확장) 로그인 세션 서버 클라이언트 (@supabase/ssr, 쿠키, server-only)
│  │  ├─ supabase/browser.ts        # (확장) 브라우저 클라이언트 (publishable 키, 로그인·가입·비밀번호·로그아웃만)
│  │  ├─ supabase/types.ts          # DB 타입 (생성 파일)
│  │  ├─ data/                      # 서버 조회 함수 (stock.ts, screener.ts, search.ts, 2차 industry.ts·disclosures.ts·news.ts·chat.ts, 확장 mypage.ts)
│  │  ├─ news-text.ts               # (2차) 기사 제목 정리·도메인·기사 검색어 (F-18)
│  │  ├─ disclosure.ts              # (2차) 공시 거르기·원문 링크 (F-17)
│  │  ├─ industry.ts                # (2차) 업종 가운데 값 비교 (F-08·F-09)
│  │  ├─ dividend.ts                # (2차) 배당 표 칸 만들기 (F-14)
│  │  ├─ chat.ts                    # (2차) 챗봇 입력 정규화·AI 출력 검사·규칙 적용 (F-10)
│  │  ├─ tour.ts                    # (2차) 투어 단계 만들기 (F-16)
│  │  ├─ auth.ts                    # (확장) next·watch 검사 (F-11·F-12)
│  │  ├─ copy.ts                    # 화면 문구 전부
│  │  ├─ filters.ts                 # 필터 20개 상수·충돌 규칙 (F-03)
│  │  ├─ insights.ts                # insights → 문장
│  │  ├─ trend.ts                   # 방향 화살표 판정
│  │  ├─ gauge.ts                   # 눈금 범위·위치 계산
│  │  ├─ format.ts                  # 금액·%·배·날짜 포맷
│  │  └─ params.ts                  # URL 쿼리 파싱·검증 (스크리너, 2차 업종 목록)
│  ├─ tests/                        # Vitest (10장)
│  ├─ next.config.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ supabase/migrations/             # DB 함수 마이그레이션 추가 (5장)
├─ batch/ … (기존, 확장에 notify.py·notify_mail.py 추가 — 9-13)
```

- 2차에 추가하는 라이브러리: `driver.js`(F-16). 확장: `@supabase/ssr`(F-11). 그 밖(OpenRouter·DART·네이버)은 SDK 없이 `fetch`로 부른다.

- 버전: Next.js(App Router)·React·Tailwind·Recharts·Vitest는 **구현 시점 최신 안정판**을 쓰고 `package.json`에 정확한 버전으로 고정한다. Node는 LTS.
- `.gitignore`에 `web/node_modules/`, `web/.next/`, `web/.vercel/`, `web/.env*`를 추가한다.

---

## 3. 환경·설정

### 3-1. 환경변수

| 변수 | 위치 | 쓰는 곳 |
| --- | --- | --- |
| `SUPABASE_URL` | 루트 `.env` / Vercel | `lib/supabase/server.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | 루트 `.env` / Vercel | `lib/supabase/server.ts` (서버만) |
| `DART_OPENAPI_KEY` (2차) | 루트 `.env`(있음) / Vercel | `lib/data/disclosures.ts` (F-17, 서버만) |
| `NAVER_API_HUB_KEY_ID`, `NAVER_API_HUB_KEY` (2차) | 루트 `.env` / Vercel | `lib/data/news.ts` (F-18, 서버만) |
| `OPENROUTER_API_KEY` (2차) | 루트 `.env` / Vercel | `lib/data/chat.ts` (F-10, 서버만) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (확장, 이름 기본안) | 루트 `.env` / Vercel | `lib/supabase/session.ts`·`browser.ts`·`proxy.ts` (로그인 세션 + 사용자 테이블 RLS만) |
| `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`, `SITE_URL` (확장, 이름 기본안) | GitHub Secrets | `batch/notify_mail.py` (F-13 메일. `SITE_URL`은 수신 거부 링크용 배포 주소) |

- MVP는 위 두 개만 쓴다. 2차·확장 변수는 **그 기능 코드 작업 때** `.env.example`에 이름만 추가한다.
- 2차·확장 키가 없으면 그 기능만 꺼진다 (F-17·F-18 칸 실패 문구, F-10 규칙 6 문구). 앱 전체가 죽지 않게 모듈 안에서 검사한다.
- `NEXT_PUBLIC_` 두 개는 공개돼도 되는 값이다 (RLS가 막음). 서버용 키·Gmail 비밀번호에는 절대 붙이지 않는다.
- Supabase SMTP(Gmail)는 Supabase 대시보드에 사용자가 직접 넣는다 (코드·`.env`에 없음).
- **로컬:** 키는 루트 `.env`에 있다. `web/next.config.ts`에서 `@next/env`의 `loadEnvConfig(path.resolve(__dirname, '..'))`로 루트 `.env`를 불러온다. **`.env` 파일을 열거나 출력하지 않는다.** `web/.env.local`을 따로 만들지 않는다.
- **배포:** Vercel 프로젝트 환경변수에 같은 이름으로 넣는다 (사용자가 직접).

### 3-2. Supabase 서버 클라이언트

```ts
// lib/supabase/server.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function db() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- 환경변수가 없으면 오류 메시지에 **변수 이름만** 적는다 (값 금지).
- `types.ts`는 Supabase 타입 생성으로 만든다 (5장 마이그레이션 적용 뒤 다시 생성).
- `bigint` 금액은 JSON 숫자로 온다. 최대 수백조 원이라 `Number` 안전 범위(약 9천조) 안이다.

### 3-3. 캐시

- 데이터는 하루 1번(시세·목록), 한 달 1번(재무) 바뀐다.
- 종목 화면·스크리너 첫 화면: `export const revalidate = 3600` (1시간).
- API Route 응답: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- (2차) 업종 화면(`/industries…`): `revalidate = 3600`. 첫 화면 `/`: 기사 칸 때문에 `revalidate = 1800`. `/news`: `1800`.
- (2차) 외부 API 호출 캐시: F-17 공시 **1시간**, F-18 일반 기사 **30분**·종목 기사 **1시간**, F-10 AI 결과 **1일**. 캐시 외에 저장하지 않는다.
- **외부 호출 캐시는 성공 결과만 남긴다.** DART는 한도 초과도 HTTP 200 + `status`로 오고, 실패 응답이 1시간 캐시되면 그동안 실패 문구가 계속 보인다. 그래서 `fetch`의 `next.revalidate`에 맡기지 않고 **함수 단위 캐시**(`unstable_cache` 또는 구현 시점의 `'use cache'` + `cacheLife`)를 쓴다:
  - 안쪽 함수: 호출 → 성공(DART `000`·`013`, HUB 200, AI 출력 모양 맞음)이면 값 반환, 그 밖이면 **throw** (throw한 결과는 캐시되지 않음).
  - 바깥 함수: 안쪽을 부르고 throw를 잡아 `{ status: 'error' }`로 바꾼다 (페이지를 죽이지 않음). 로그에는 상태 코드·DART `status`만.
  - 캐시 키: 공시 `corp_code`, 종목 기사 종목명, 일반 기사 페이지 번호, AI 정규화 문장.
- (확장) `/mypage`·`/reset-password`·`/auth/callback`·확장 API Route는 캐시하지 않는다 (`dynamic`, 응답 `Cache-Control: private, no-store`).

---

## 4. 데이터 접근

| 화면·동작 | 방식 | 쓰는 것 |
| --- | --- | --- |
| 검색 연관검색어 | API Route `GET /api/search` → RPC `search_stocks` | 5-1 |
| 종목 화면 첫 로드 | 서버 컴포넌트 → supabase-js 조회 3개 | 4-1 |
| 스크리너 첫 로드 | 서버 컴포넌트 → RPC `screener_search` | 5-2 |
| 스크리너 필터·정렬·페이지·개수 변경 | API Route `GET /api/screener` → RPC `screener_search` | 5-2 |
| (2차) 종목 화면 주가 수준·배당·업종 가운데 값 | 서버 컴포넌트 → `getStockPage`에 조회 3개 추가 | 4-1 |
| (2차) 업종 목록·업종 회사 목록·지표 비교 목록 (정렬·페이지 포함) | 서버 컴포넌트 → RPC `industry_tree`·`industry_companies`·`industry_metrics`. 정렬·페이지는 URL 쿼리(`?sort=&dir=&page=&size=`) 링크로 서버가 다시 그림. API Route 없음 | 5-3~5-5, 9-2, 9-7 |
| (2차) 챗봇 | API Route `POST /api/chat` → RPC `chat_usage_take` → OpenRouter (`fetch` 직접) | 5-6, 9-9 |
| (2차) 종목 화면 공시·기사 칸, 첫 화면 기사, `/news` | 서버 컴포넌트(`Suspense`) → 외부 API (DART `list.json`, 네이버 HUB) + 함수 단위 캐시. API Route 없음 | 9-5, 9-6 |
| (확장) 로그인 여부·추적 상태 (공개 화면 위) | 클라이언트 컴포넌트 → `GET /api/me`, `GET /api/watchlist?code=` (세션 클라이언트) | 9-10, 9-12 |
| (확장) 사용자 테이블 (`watchlist`·`user_settings`·`notifications`) | 로그인 세션 클라이언트 (`@supabase/ssr`, publishable 키 + RLS). 공개 데이터는 계속 서버용 키 클라이언트 | 9-10~9-13 |
| (확장) 탈퇴·수신 거부 | API Route → 서버용 키 (`auth.admin.deleteUser`, `user_settings` 토큰 갱신) | 9-11, 9-13 |

### 4-1. 종목 화면 조회 (`lib/data/stock.ts`)

`getStockPage(shortCode)` — 서버에서 아래를 차례로 (2·3은 병렬):

1. `v_search_targets` `eq('short_code', code)` `.maybeSingle()` → 없으면 `notFound()`.
2. `company_summary` `eq('corp_code', corp_code)` `.maybeSingle()` → 없으면 "재무 없음" (corp_code가 null이어도 같음).
3. `v_company_years` `eq('corp_code', corp_code)` `order('fiscal_year')` → 저장된 연도 전부 (최대 4개, 화면은 `is_display_year`만).

반환 타입:

```ts
type StockPage = {
  stock: { srtnCd; shortCode; name; market; isForeign; divisionCode; divisionName; accMt };
  status: 'ok' | 'no_financials' | 'foreign';
  summary?: { fsDiv; years: number[]; latestYear; isFinancial; capitalImpairment; insights: Insight[] };
  years?: YearRow[];        // 오래된 → 최근, displayYears = is_display_year 인 것
};
```

- `isForeign`이면 `status='foreign'` (2·3 조회 안 함).
- 조회 오류는 throw → `app/stocks/[code]/error.tsx`가 오류 화면 (7장 `ErrorState`).

**(2차) 추가 조회** — `status='ok'`일 때만, 1번 결과로 2·3과 **함께 병렬**:

4. `v_valuation` `eq('srtn_cd', srtn_cd)` `.maybeSingle()` → F-09. 없으면 `valuation: null` ("주가 정보가 없어.").
5. `v_industry_medians` `eq('division_code', division_code)` `.maybeSingle()` → F-08·F-09. `division_name`이 null이면 조회하지 않고 `industry: null` ("업종 정보가 없어.").
6. `dividends` `eq('corp_code', corp_code)` `order('fiscal_year')` → F-14. 화면 연도(2번 `years`의 뒤 3개)를 기다리지 않도록 연도 조건 없이 받고 (회사당 몇 행뿐), 서버에서 화면 연도만 고른다.

```ts
type StockPage = {
  // … MVP 그대로 +
  valuation?: { basDt: string; marketCap: number; per: number | null; pbr: number | null; latestYear: number } | null;
  industry?: {                       // null = 업종 정보 없음
    divisionCode: string; divisionName: string;
    medians: Record<'debt_ratio' | 'operating_margin' | 'revenue_growth' | 'per' | 'pbr',
                    { value: number | null; n: number }>;
  } | null;
  dividends?: DividendRow[];         // 화면 연도만, 오래된 → 최근. [] = 행 없음
};
```

- `v_industry_medians` 속도는 F-08 착수 때 한 번 잰다 (5-4 뷰 주석). 종목 화면 첫 표시 2초(PRD 8장)를 넘기게 하면 materialized view로 바꾸고 배치 끝에 새로 고치는 마이그레이션을 따로 만든다 (**적용 전 사용자 확인**).
- `no_financials`·`foreign`은 4~6을 조회하지 않는다 (PRD 3-7: 머리 + 안내만).
- 공시·기사 칸(F-17·F-18)은 `getStockPage`에 넣지 않는다. 각 칸이 `Suspense` 안에서 따로 부른다 (9-5·9-6).

### 4-2. API Route 공통

- 입력은 `lib/params.ts`에서 검증한다. 잘못된 값은 **400** `{ "error": "bad_request" }`.
- DB 오류는 **500** `{ "error": "server_error" }`. 서버 로그에는 PostgREST 오류 코드·메시지만 남기고 키·URL 쿼리 원문은 남기지 않는다.
- 응답 JSON 키는 camelCase로 바꿔 내려준다.
- (확장) 로그인이 필요한 Route는 세션이 없으면 **401** `{ "error": "unauthorized" }`. 남의 행·없는 행은 **404** `{ "error": "not_found" }` (RLS로 0행이 되므로 구분하지 않는다). 응답 헤더 `Cache-Control: private, no-store`.
- (확장) 상태를 바꾸는 Route(POST·PATCH·DELETE)는 `Origin` 헤더가 사이트 주소와 같은지 확인하고 다르면 **403** (쿠키 세션 CSRF 방지). `/api/unsubscribe`도 같다.

---

## 5. DB 함수 (마이그레이션 추가)

- 파일: `supabase/migrations/{YYYYMMDDHHMMSS}_web_functions.sql`. **DB 변경이라 적용 전에 사용자 확인**을 받는다.
- 공통: `language sql` 또는 `plpgsql`, `stable`, `security invoker`, `set search_path = public, extensions`. `execute`는 `anon`, `authenticated`, `service_role`에 준다 (공개 데이터만 읽음).
- 적용 뒤 Supabase 보안 점검(advisors)을 다시 보고 타입을 재생성한다.

### 5-1. `search_stocks(p_q text, p_limit int default 10)`

PRD 4장 F-01 검색 규칙을 DB에서 처리한다.

| 반환 열 | 설명 |
| --- | --- |
| `srtn_cd`, `short_code`, `itms_nm`, `mrkt_ctg`, `is_foreign` | `v_search_targets` |
| `match_rank` | 0 완전 일치 / 1 앞부분 일치 / 2 중간 포함 |

처리:

1. `q = trim(p_q)`. 빈 문자열이거나 50자 초과면 0행.
2. `nq = lower(regexp_replace(q, '\s', '', 'g'))`. LIKE 특수문자(`%`, `_`, `\`)는 이스케이프.
3. **숫자로만**(`^[0-9]+$`): `short_code like nq || '%'` → `short_code = nq`이면 0, 아니면 1.
4. **그 밖:** `search_name`으로 찾는다 — `= nq` 0, `like nq||'%'` 1, `like '%'||nq||'%'` 2. 그리고 영문자가 섞인 종목코드(`0220W0`)를 위해 `upper(q) = short_code`이면 0으로 함께 넣는다.
5. 정렬: `match_rank`, `itms_nm` (가나다순). 상한 `least(p_limit, 10)`.

- 2,600행이라 중간 포함도 빠르다 (`search_name` trgm GIN 인덱스 있음).
- 정렬 기준 이름순은 DB 기본 정렬(collation)을 따른다. 한글 음절은 유니코드 순서 = 가나다순이다. 구현 때 `삼성전자`·`NAVER`·`LG전자`가 섞인 결과로 순서를 한 번 확인한다.

### 5-2. `screener_search(p_filters smallint[], p_sort text, p_dir text, p_page int, p_size int)`

PRD 4장 F-07 결과 목록을 DB에서 만든다.

**입력 검증 (함수 안에서도 한 번 더):** `p_filters` 길이 1~3, 값 1~20, 중복 없음. `p_sort`는 아래 정렬 키 중 하나. `p_dir` `asc`/`desc`. `p_size` 10·20·50. `p_page` ≥ 1. 어기면 `raise exception`.

**대상:** `v_search_targets t` join `company_summary cs` on `corp_code`, `not t.is_foreign`, `cs.matched_filters @> p_filters`.

| 반환 열 | 설명 |
| --- | --- |
| `total_count` | 전체 결과 수 (`count(*) over ()`) |
| `srtn_cd`, `short_code`, `itms_nm`, `mrkt_ctg`, `acc_mt` | 종목 |
| `is_financial` | |
| `mrkt_tot_amt`, `bas_dt` | `v_valuation` (없으면 null) |
| `years` | jsonb 배열, 화면 연도(Y1~Y3) 오래된 → 최근: `{fiscal_year, revenue, operating_income, net_income, total_assets, total_equity, capital_stock, debt_ratio, operating_margin, revenue_growth}` |
| `dividends` | jsonb 배열, 같은 연도: `{fiscal_year, dps_status, dps}` |

**정렬 키 (`p_sort`)** — 3개년 열은 **최근 연도(Y3) 값**으로 정렬한다.

| 키 | 정렬 값 |
| --- | --- |
| `name` (기본) | `itms_nm` |
| `market_cap` | `mrkt_tot_amt` |
| `revenue`, `operating_income`, `net_income`, `total_assets`, `total_equity`, `capital_stock`, `debt_ratio`, `operating_margin`, `revenue_growth` | `v_company_years` `is_latest` 행의 그 열 |
| `dps` | `dividends`의 최신 연도 `dps` |

- **null은 방향과 상관없이 맨 뒤** (`nulls last`). 같은 값끼리는 `itms_nm asc`.
- 페이지: `offset (p_page-1)*p_size limit p_size`. 결과가 0행이면 `total_count`도 없으므로 앱은 0건으로 본다. 페이지가 범위를 넘으면 앱이 마지막 페이지로 다시 요청한다.

### 5-3. (2차) `industry_tree()` — F-15 업종 목록

- 파일: `{ts}_industry_functions.sql` (5-3~5-5를 한 파일로). 공통 규칙은 5장 머리와 같다 (`anon`·`authenticated`·`service_role` 실행).
- 대상: `v_search_targets` 중 `not is_foreign` and `division_name is not null` (PRD F-15: 외국회사·분류표에 없는 업종 코드 제외, 금융회사 포함).

| 반환 열 | 설명 |
| --- | --- |
| `section_code`, `section_name`, `section_order` | 대분류 (`ksic_classes` `level='section'`의 `sort_order`). 이름은 포털 표기 그대로 (화면에서 `cleanSectionName`) |
| `division_code`, `division_name`, `division_order` | 중분류 |
| `company_count` | 그 중분류 회사 수 |

- `group by` 중분류 → 회사 0개 업종은 자연히 빠진다. 정렬 `section_order, division_order`.
- 대분류 회사 수는 앱이 중분류 수를 더해서 만든다.

### 5-4. (2차) `industry_companies(p_division text, p_sort text, p_dir text, p_page int, p_size int)` — F-15 회사 목록

- 대상: 5-3과 같은 회사 중 `division_code = p_division`.
- 검증: `p_division` `^[0-9]{2}$`, `p_sort` `name`/`market_cap`/`per`/`pbr`/`revenue`/`operating_income`, `p_dir`·`p_page`·`p_size`는 5-2와 같다. 어기면 `raise exception`.
- 마이그레이션: `supabase/migrations/20261128010000_industry_companies_columns.sql` (2026-11-28, 적용 완료·사용자 승인). 반환 열이 바뀌어 `drop function` 뒤 다시 만든다.

| 반환 열 | 설명 |
| --- | --- |
| `total_count` | `count(*) over ()` |
| `srtn_cd`, `short_code`, `itms_nm`, `mrkt_ctg`, `acc_mt` | 종목 |
| `mrkt_tot_amt`, `bas_dt` | `v_valuation` left join (없으면 null) |
| `clpr`, `per`, `pbr` | `v_valuation` left join (`clpr bigint`, `per`·`pbr numeric`, 없으면 null) |
| `fiscal_year`, `revenue`, `operating_income` | `v_company_years` `is_latest` 행 left join (`fiscal_year smallint`, `revenue`·`operating_income bigint`, 없으면 null) |
| `is_financial` | `company_summary` left join (없으면 null) |

- 정렬: `name` → `itms_nm`, `market_cap` → `mrkt_tot_amt`, `per` → `v_valuation.per`, `pbr` → `v_valuation.pbr`, `revenue` → `v_company_years.revenue`, `operating_income` → `v_company_years.operating_income`. **null은 방향과 상관없이 맨 뒤**, 같은 값은 `itms_nm asc, srtn_cd asc`. 페이지는 5-2와 같다.

### 5-5. (2차) `industry_metrics(p_division text, p_sort text, p_dir text, p_page int, p_size int)` — F-08 지표 비교 목록

- 대상·검증: 5-4와 같다. `p_sort`는 `name`/`debt_ratio`/`operating_margin`/`revenue_growth`.
- 재무가 없는 회사도 목록에 넣는다 (제목의 회사 수 N이 F-15 목록과 같아야 함). 지표 칸은 null.

| 반환 열 | 설명 |
| --- | --- |
| `total_count` | |
| `srtn_cd`, `short_code`, `itms_nm`, `mrkt_ctg`, `acc_mt`, `is_financial` | 종목 (`is_financial`은 `company_summary`, 없으면 null) |
| `fiscal_year`, `debt_ratio`, `operating_margin`, `revenue_growth` | `v_company_years` `is_latest` 행 left join |

- 정렬: null은 맨 뒤 (PRD F-08 기본안), 같은 값은 `itms_nm asc`.

### 5-6. (2차) 챗봇 하루 호출 수 — 테이블 `chat_usage_daily` + `chat_usage_take(p_limit int)`

- 파일: `{ts}_chat_usage.sql`. **적용 전 사용자 확인** (PRD 5-7).

```sql
create table public.chat_usage_daily (
  day   date primary key,          -- UTC 날짜 (OpenRouter 한도 초기화 시각은 구현 때 확인, 다르면 맞춤)
  calls int  not null default 0
);
alter table public.chat_usage_daily enable row level security;   -- 정책 없음 → 서버용 키만
revoke all on public.chat_usage_daily from anon, authenticated;
```

- `chat_usage_take(p_limit int) returns boolean` (`plpgsql`, `security invoker`, `set search_path = ''`): 오늘 행을 `insert … on conflict (day) do update set calls = calls + 1 where chat_usage_daily.calls < p_limit returning calls`로 **한 문장에서** 늘린다. 행이 돌아오면 `true`(호출 허용), 안 돌아오면 `false`(상한). 동시에 여러 요청이 와도 상한을 넘지 않는다.
- `execute`는 **`service_role`만** (`revoke execute … from public, anon, authenticated`). 5장 공통 규칙의 예외.
- 오래된 행은 지우지 않는다 (하루 1행).

### 5-7. (확장) 회원 가입 트리거 — `user_settings` 자동 생성

- 파일: `{ts}_auth_user_settings.sql`. **적용 전 사용자 확인** (PRD F-11).
- `public.handle_new_user()` `returns trigger`, `language plpgsql`, **`security definer`**, `set search_path = ''`: `insert into public.user_settings (user_id) values (new.id) on conflict do nothing`. `unsubscribe_token`은 테이블 기본값(`gen_random_uuid()`)이 만든다.
- `create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()`.
- 함수 `execute`는 `public`·`anon`·`authenticated`에서 뺀다 (트리거로만 실행).
- 이미 있는 사용자 보정: 같은 파일 끝에서 `insert into public.user_settings (user_id) select id from auth.users on conflict do nothing`.

### 5-8. (확장) `notification_recipients()` — F-13 메일 배치용

- 파일: `{ts}_notification_recipients.sql`. **적용 전 사용자 확인.**
- 배치가 사용자 이메일을 알아야 하는데 이메일은 `auth.users`에만 있다. Auth 관리자 API를 배치에서 부르는 대신 DB 함수 하나로 읽는다.
- `security definer`, `set search_path = ''`, `stable`. `execute`는 **`service_role`만**.

| 반환 열 | 설명 |
| --- | --- |
| `user_id`, `email` | `auth.users` |
| `unsubscribe_token` | `user_settings` |

- 조건: `user_settings.email_opt_in` and `emailed_at is null`인 알림이 1개 이상 있는 사용자.

---


### 5-9. (2차) `industry_top_companies(p_limit int default 3)` — F-15 업종 카드 회사 이름 (2026-11-28)

- 파일: `{ts}_industry_top_companies.sql`. 공통 규칙은 5장 머리와 같다 (`anon`·`authenticated`·`service_role` 실행). **적용 전 사용자 확인.**
- 대상: `industry_tree()`(5-3)와 같은 범위 (`v_search_targets` 중 `not is_foreign` and `division_name is not null`) **and** `v_valuation.mrkt_tot_amt is not null`.
- 중분류마다 `row_number() over (partition by division_code order by mrkt_tot_amt desc, itms_nm asc)` ≤ `p_limit`. `p_limit`은 1~5로 자른다.

| 반환 열 | 설명 |
| --- | --- |
| `division_code` | 중분류 |
| `rank` | 1부터 |
| `short_code`, `itms_nm` | 종목코드(표시용 `A` 없음)·종목명 원본 그대로 |

- `industry_tree()` 반환 모양을 바꾸지 않으려고 따로 둔다 (`create or replace`로 반환 열을 바꾸면 drop이 필요함). 화면은 두 RPC를 병렬로 불러 `division_code`로 합친다 (9-7).
## 6. 공통 모듈 (순수 함수·상수·문구)

모두 **순수 함수**로 만들고 Vitest로 테스트한다 (10장). DB·React에 기대지 않는다.

### 6-1. `lib/format.ts`

| 함수 | 규칙 | 예 |
| --- | --- | --- |
| `formatAmount(won)` | PRD 3-8: 절댓값 1조 이상 `{x.x}조 원`, 미만 `{n,nnn}억 원` (억 단위 반올림). 음수는 앞에 `-` | `258935494000000` → `258.9조 원`, `-65670000000` → `-657억 원` |
| `formatMarketCap(won)` | `{조}조 {억}억` (억은 쉼표, 0이면 생략), 1조 미만 `{억}억`, null `-` | `1165351200000000` → `1,165조 3,512억` |
| `formatPercent(v)` | 소수 1자리 + `%`, null → null | `87.345` → `87.3%` |
| `formatMultiple(v)` | 소수 1자리 + `배` | `25.53` → `25.5배` |
| `formatWon(n)` | 쉼표 + `원` | `1668` → `1,668원` |
| `formatGrowth(curr, prev)` | 전년 대비 증감률 소수 1자리, 전년 null·0이면 null | |
| `formatFsDiv(fsDiv)` | `CFS` → `연결재무제표`, `OFS` → `별도재무제표` | |
| `formatYearRange(years)` | `2023~2025` | |
| `formatAccMt(accMt)` | `'12'`이면 null, 그 밖 `{M}월 결산` (앞 0 제거) | `'03'` → `3월 결산` |
| `cleanSectionName(name)` | 대분류 이름 공백 정리 (화면용만) | `제 조 업` → `제조업` |

### 6-2. `lib/trend.ts` — 방향 화살표 (PRD 4장 F-05)

```ts
type Trend = { arrow: '↗' | '↘' | '↕' | '→'; label: TrendLabel } | null;
function getTrend(values: (number | null)[], gauge: GaugeKey): Trend
```

1. null을 뺀 값 `v` (순서 유지).
2. `v.length <= 1` → `null` (화살표 없음).
3. 폭 `tol = (max − min) × 0.03` (`gauge.ts`의 범위).
4. `v.length === 2`: `|v1−v0| <= tol` → `→ 비슷한 수준`, 아니면 `↗ 전년보다 증가` / `↘ 전년보다 감소`.
5. `v.length === 3`: 두 변화가 모두 `<= tol` → `→ 비슷한 수준` (먼저 판정). 아니면 `v0<v1<v2` `↗ 3년째 증가`, `v0>v1>v2` `↘ 3년째 감소`, 그 밖 `↕ 오르내림`.

- 3개 판정은 `batch/rules.py`의 `is_flat`과 같아야 한다 (경계 `<=`).

### 6-3. `lib/gauge.ts`

```ts
const GAUGES = {
  debt_ratio:       { min: 0,   max: 300, line: 100 },
  operating_margin: { min: -50, max: 40,  line: 0 },
  revenue_growth:   { min: -40, max: 70,  line: 0 },
  per:              { min: 0,   max: 50,  line: null },  // 2차 F-09
  pbr:              { min: 0,   max: 5,   line: 1 },     // 2차 F-09
};
function gaugePosition(value: number, key): { pct: number; clamped: 'low' | 'high' | null }
```

- `pct = (value − min) / (max − min) × 100`, 0~100으로 자르고 잘렸으면 `clamped`.
- 범위 숫자는 `batch/rules.py`의 `GAUGES`와 같아야 한다 (10장 상수 대조 테스트). `per`·`pbr`은 배치에 없으므로 대조 대상이 아니다 (웹앱만 씀).
- (2차) 업종 가운데 값 표시도 같은 `gaugePosition`으로 위치를 구한다 (범위 밖이면 끝에 붙이고 값은 글자로).
- (2026-11-28, `DESIGN-V2.md` 2-2) 3개년 점 눈금용 순수 함수를 더한다.

```ts
type GaugeDot = { year: number; value: number; pct: number; clamped: 'low' | 'high' | null; latest: boolean };
function gaugeDots(points: { year: number; value: number | null }[], key): GaugeDot[]  // null 연도는 뺀다, 마지막 점이 latest
function dotsOverlap(a: GaugeDot, b: GaugeDot, widthPx: number): boolean             // 4px 이내면 잇는 선 생략
```

- 테스트: 3개년 위치, `null` 연도 빼기(남은 점만), 점 1개, 범위 밖 `clamped`, 겹침 판정.

### 6-4. `lib/filters.ts` — F-03 상수

```ts
type FilterGroup = '매출' | '이익' | '이익률' | '빚' | '자산과 자본' | '배당';
type EvidenceKey = 'revenue' | 'revenue_growth_y3' | 'operating_income' | 'net_income'
  | 'operating_margin' | 'operating_margin_y3' | 'revenue_y2y3' | 'operating_margin_y2y3'
  | 'debt_ratio_y3' | 'debt_ratio' | 'total_assets' | 'total_equity'
  | 'total_equity_y3' | 'capital_stock_y3' | 'dps';
type FilterDef = {
  id: number; group: FilterGroup; label: string;     // 문구는 PRD 4장 F-03 표 그대로
  tooltip: string; calc: string;                      // {Y1}~{Y3} 자리표시자 포함
  evidence: EvidenceKey[]; sortKey: ScreenerSortKey;  // 근거 값 열, 그 열의 정렬 키
  financialBlocked: boolean;
};
export const FILTERS: FilterDef[];                    // 20개
export const CONFLICTS: [number, number][];           // 10쌍 (PRD 4장 F-03)
export const INCLUDES: [number, number][] = [[13, 14]]; // 13 ⊃ 14
export const FINANCIAL_BLOCKED = [1,2,3,10,11,12,13,14,15,16];
export const MAX_FILTERS = 3;
```

| 함수 | 동작 |
| --- | --- |
| `toggleFilter(selected, id)` | 이미 있으면 뺌. 없으면: 부딪히면 `{ error: 'conflict', with: 상대 id }`, 13·14 짝이면 짝을 빼고 넣음, 3개 찼으면 `{ error: 'max' }`, 아니면 넣음. 반환 `{ selected, error? }` |
| `blockedBy(selected, id)` | 이 버튼을 흐리게 할 이유 (부딪히는 상대 id 또는 null) |
| `fillYears(text, [y1,y2,y3])` | `{Y1}`~`{Y3}` 채우기 |
| `evidenceColumns(selected)` | 근거 값 열 목록 (겹치면 한 번, 고른 순서대로) — PRD 4장 F-03 "근거 값 열" 표 |
| `hasFinancialBlocked(selected)` | 금융회사 빠짐 안내를 띄울지 |

- `CONFLICTS`·`FINANCIAL_BLOCKED`는 `batch/rules.py`와 같아야 한다 (10장 대조 테스트).

### 6-5. `lib/insights.ts`

```ts
type Insight = { id: 1|2|3|4|5|6|7|8; year?: number; n?: number; prev?: number; curr?: number };
function insightText(i: Insight): string     // PRD 4장 F-05 문장 템플릿
function topInsights(list: Insight[], k = 3) // 앞에서 k개 (배치가 이미 우선순위 순으로 저장)
```

- 7번의 `prev`·`curr`은 저장된 소수 1자리 그대로 쓴다 (다시 반올림하지 않음).
- 모르는 id는 건너뛴다 (화면을 깨지 않게).

### 6-6. `lib/params.ts` — 스크리너 URL 상태

URL: `/screener?f=1,13&sort=name&dir=asc&page=1&size=10`

| 키 | 허용 값 | 기본 |
| --- | --- | --- |
| `f` | 쉼표로 이은 필터 ID 1~20, 최대 3개, 부딪히는 짝 없음 | 없음 |
| `sort` | 5-2 정렬 키 중 **지금 화면에 보이는 열**의 키 + `name`, `market_cap` | `name` |
| `dir` | `asc` / `desc` | `asc` |
| `page` | 1 이상 정수 | 1 |
| `size` | 10 / 20 / 50 | 10 |

- `parseScreenerParams(searchParams)`는 잘못된 값을 **기본값으로 바로잡는다** (오류를 내지 않음). 13·14가 같이 오면 14만, 부딪히는 짝이 오면 뒤의 것을 버린다.
- `toQuery(state)`는 기본값인 키는 생략한다.

**(2차) 업종 목록 URL** — `/industries/26?sort=market_cap&dir=desc&page=2&size=20`, `/industries/26/compare?sort=debt_ratio…`

| 함수 | 동작 |
| --- | --- |
| `parseListParams(searchParams, sorts)` | `sort`는 `sorts` 안의 값(기본 `name`), `dir`·`page`·`size`는 스크리너와 같은 규칙. 잘못된 값은 기본값으로 바로잡는다 |
| `toListQuery(state)` | 기본값 키 생략 |
| `INDUSTRY_COMPANY_SORTS` | `['name', 'market_cap']` (5-4) |
| `INDUSTRY_METRIC_SORTS` | `['name', 'debt_ratio', 'operating_margin', 'revenue_growth']` (5-5) |
| `isDivisionCode(s)` | `^[0-9]{2}$` |

- 열 제목 정렬 링크: 같은 열이면 `dir` 뒤집기, 다른 열이면 그 열 `asc`, `page=1` (스크리너와 같은 규칙).

### 6-7. `lib/copy.ts` — 문구

- 화면 문구를 키로 모은다. 값은 **PRD에 적힌 문구 그대로** 복사한다 (각 키 옆 주석에 PRD 절 번호).
- 예: `copy.search.noResult` (PRD F-01), `copy.chart.financialNotice` (PRD 3-6), `copy.reportCard.fullImpairment` (PRD F-05), `copy.screener.zero`, `copy.screener.max`, `copy.screener.conflict(label)`, `copy.screener.financialExcluded`, `copy.footer.source` (PRD 3-2) …
- 함수형 문구(자리표시자)는 함수로: `copy.screener.count(n) => \`조건에 맞는 회사 ${n}개\``.
- (2차·확장) 묶음: `copy.industry.*`(F-08·F-15), `copy.valuation.*`(F-09), `copy.dividend.*`(F-14), `copy.disclosure.*`(F-17), `copy.news.*`(F-18), `copy.tour.*`(F-16 알림 띠·단계 문구), `copy.chat.*`(F-10 규칙 문구·지원하지 않는 조건 4개·예시), `copy.auth.*`(F-11, 존댓말), `copy.watch.*`·`copy.mypage.*`(F-12), `copy.notification.*`·`copy.unsubscribe.*`(F-13). 키 옆 주석에 PRD 절 번호 또는 PRD 10장·FS 12장 번호.

### 6-8. (2차) `lib/industry.ts` — 업종 가운데 값 비교 (PRD 4장 F-08·F-09)

```ts
export const MIN_INDUSTRY_COUNT = 3;   // PRD F-08 (대체안 5)
type IndustryCompare =
  | { kind: 'no_industry' }                          // 업종 코드 없음
  | { kind: 'too_few' }                              // n < MIN_INDUSTRY_COUNT 또는 median null
  | { kind: 'ok'; median: number; n: number; relation: 'higher' | 'lower' | 'same' | null };
function compareToIndustry(value: number | null, median: number | null, n: number, hasIndustry: boolean): IndustryCompare
```

- `relation`은 **화면 표시 값(소수 1자리로 반올림한 값)끼리** 비교한다 (PRD F-08 기본안). `value`가 null이면 `relation: null` (가운데 값 표시만, 비교 줄 없음).
- F-08 리포트카드는 `relation`으로 비교 한 줄을 쓰고, **F-09는 `relation`을 쓰지 않는다** (PRD F-09 "글자 판정 쓰지 않음", 12장 동작 기본안 1번).

### 6-9. (2차) `lib/dividend.ts` — 배당 표 (PRD 4장 F-14)

```ts
type DividendCell = { text: string; tooltip: string | null };
type DividendTable =
  | { kind: 'no_data' }                // 행 0개 → "이 회사의 배당 정보가 없어."
  | { kind: 'all_none' }               // 화면 연도 3개 모두 행이 있고 모두 none → "최근 3년 동안 현금배당이 없었어."
  | { kind: 'table'; sourceYear: number; columns: { year: number; dps: DividendCell; yield: DividendCell }[] };
function buildDividendTable(rows: DividendRow[], displayYears: number[]): DividendTable
```

| `dps_status` / `yield_status` | 주당 배당금 칸 | 배당수익률 칸 |
| --- | --- | --- |
| `paid` / `value` | `formatWon(dps)` | `formatPercent(dividend_yield)` |
| `paid` / `not_disclosed` | `formatWon(dps)` | "공시 없음" + 툴팁 (직접 계산하지 않음) |
| `none` / 무엇이든 | "없음" | "없음" |
| `check` / 무엇이든 | "확인 필요" (PRD 10장 14번) | `value`면 값, 그 밖 "확인 필요" |

- 배치 규칙(`batch/dart_collect.py`): `yield_status='none'`은 `dps_status`가 `none`·`check`일 때만 생긴다 (`paid`면 `value` 또는 `not_disclosed`).

- 열은 **행이 있는 화면 연도만** (PRD "일부 연도만 행이 있음"). `sourceYear` = 그 행들의 `source_bsns_year` 최댓값.

### 6-10. (2차) `lib/chat.ts` — 챗봇 규칙 (PRD 4장 F-10)

```ts
export const CHAT_DAILY_LIMIT = 40;        // PRD 10장 33번
export const CHAT_MAX_INPUT = 200;         // 입력 글자 상한 (12장 동작 기본안 3번)
export const UNSUPPORTED_KINDS = ['industry', 'dividend_yield', 'price', 'other'] as const;
export const CHAT_EXAMPLES: { text: string; filters: number[] }[];  // 3개, PRD F-10 예시 표 그대로

type ChatOutput = { filters: number[]; unsupported: UnsupportedKind[]; notCondition: boolean };
type ChatResult = {
  filters: number[];                        // 적용할 필터 (0~3개)
  conflict: [number, number] | null;        // 있으면 filters는 []
  truncated: number[] | null;               // 4개 이상이라 앞 3개만 골랐을 때 고른 3개
  unsupported: UnsupportedKind[];
  notCondition: boolean;
};
```

| 함수 | 동작 |
| --- | --- |
| `normalizeChatInput(text)` | 앞뒤 공백 제거, 연속 공백 하나로, 영문 소문자로. 캐시 키 |
| `parseChatOutput(raw: unknown)` | AI 응답 문자열 → JSON → 모양 검사. JSON이 아니거나 모양(`filters` 배열·`unsupported` 배열·`not_condition` boolean)이 틀리면 **null** (규칙 6). 모양이 맞으면 1~20 밖 ID·모르는 코드·중복만 **그 항목만 버림** (순서 유지) |
| `applyChatRules(out)` | ① 13·14가 같이 있으면 14만 (PRD 규칙 2) ② `CONFLICTS` 짝이 있으면 `filters=[]`, `conflict` (판정은 전체 목록으로) ③ 4개 이상이면 앞 3개, `truncated` ④ `notCondition`이면 `filters=[]` |

- 지원하지 않는 조건만 있고 필터가 0개면 문구만 (PRD 규칙 3). 화면 문구 고르기는 `ChatFilterInput`이 `ChatResult`로 한다.
- 금융회사 빠짐 안내는 스크리너의 `hasFinancialBlocked`가 그대로 처리한다.

### 6-11. (2차) `lib/tour.ts` — 투어 단계 (PRD 4장 F-16)

```ts
export const TOUR_SEEN_KEY = 'reading-tour-seen';   // localStorage 키 1개
type TourKey = 'sales' | 'profit' | 'debt' | 'valuation' | 'dividend';
export const TOUR_STEPS: { key: TourKey; title: string; text: string; financialText?: string }[]; // PRD 표 순서·문구
function buildTourSteps(present: TourKey[], isFinancial: boolean): { key; title; text; index; total }[]
```

- `present`(화면에 `data-tour` 영역이 있는 키)에 있는 단계만 남기고 번호를 다시 매긴다. `isFinancial`이면 `profit` 단계 문구를 `financialText`로.
- 금융회사는 `sales`·`debt` 영역이 화면에 없어서 자연히 3단계가 된다 (판별 기준에 기대지 않음, PRD F-16 공통 규칙).

### 6-12. (확장) `lib/auth.ts`

| 함수 | 규칙 |
| --- | --- |
| `safeNextPath(next)` | `/`로 시작하고 `//`·`/\`로 시작하지 않으며 `URL` 해석 결과 호스트가 바뀌지 않으면 그대로, 그 밖·빈 값은 `/` (PRD F-11) |
| `isWatchCodeFormat(code)` | `^[0-9A-Z]{6}$` (영문 섞인 코드 `0220W0` 포함). 검색 대상 여부는 DB로 따로 확인 |
| `buildLoginRedirect(origin, next, watch?)` | `{origin}/auth/callback?next={encode(next)}[&watch={code}]` — 항상 `?next=`를 붙인다 (9-11 메일 템플릿이 `&`로 이어 붙임) |
| `checkNewPassword(password, confirm)` | 8자(코드 포인트) 미만 `too_short`, 72바이트 초과 `too_long`, 두 값이 다르면 `mismatch`, 그 밖 `null` |
| `loginFailureKind(code)` | `invalid_credentials` → `invalid`, `email_not_confirmed` → `unconfirmed`, 그 밖 `failed` |
| `passwordUpdateFailureKind(code)` | `same_password` → `same`, `weak_password` → `weak`, 세션 없음·만료·재인증 필요 → `expired`, 그 밖 `failed` |
| `parseMailLinkType(type)` | `email`(가입 확인)·`recovery`(비밀번호 설정)만, 그 밖 `null` |

### 6-13. (2차) `lib/news-text.ts` — 기사 (PRD 4장 F-18)

| 함수 | 규칙 |
| --- | --- |
| `cleanNewsTitle(raw)` | 태그(`<b>`, `</b>` 등) 제거 → HTML 엔티티 디코딩(이름·숫자 엔티티). 그 밖의 글자는 바꾸지 않음 |
| `newsDomain(originallink, link)` | `originallink` 호스트에서 앞 `www.`만 뗌. 없거나 잘못된 주소면 `link` 호스트 |
| `newsHref(originallink, link)` | 원문 링크 (`originallink`, 없으면 `link`). `http:`·`https:`가 아니면 null (줄을 링크 없이) |
| `formatPubDate(pubDate)` | RFC 822 형식 → 한국 시간 `YYYY-MM-DD HH:mm` (형식은 PRD 11장 16번 실제 응답으로 확인) |
| `buildStockNewsQuery(name, shortCode)` | 종목 화면 기사 검색어 `{종목명} {종목코드}` (이름 앞뒤 공백 뗌, 예 `대상 001680`). 2026-11-23 사용자 결정 (PRD 4장 F-18). `getStockNews`는 `sort=sim`(2026-11-28 비교 결과, PRD 4장 F-18) |
| `parseNewsPage(searchParams)` | 1~`NEWS_MAX_PAGE` 정수, 잘못된 값은 1. `NEWS_PAGE_SIZE = 10`, `NEWS_MAX_PAGE = 100` (`start` ≤ 1000, PRD 10장 29번) |

### 6-14. (2차) `lib/disclosure.ts` — 공시 (PRD 4장 F-17)

| 함수 | 규칙 |
| --- | --- |
| `excludeOwnershipDisclosures(items)` | 지분공시 빼기 (기준은 PRD 11장 19번 확인 뒤 상수로). 순서 유지 |
| `takeRecent(items, 5)` | 앞 5개 |
| `dartViewerUrl(rceptNo)` | `https://dart.fss.or.kr/dsaf001/main.do?rcpNo={rceptNo}` |
| `dartCompanyListUrl(corpCode)` | "공시 더 보기" 링크 (형식은 PRD 11장 20번 확인 뒤) |
| `formatRceptDt('20261120')` (`lib/format.ts`) | `2026-11-20` |

---

## 7. 공통 컴포넌트

`DESIGN.md` 6장 기준 (툴팁은 흰 팝오버 카드, 주요 버튼 보라 채움, 보조 버튼 연회색 바탕, 필터 칩 알약 모양, 빈 상태는 큰 아이콘 + 문장, 오류·안내는 연회색 작은 박스, 아이콘 lucide-react). 접근성: 색만으로 구분하지 않고, 키보드로 조작되며, 툴팁은 마우스와 포커스 둘 다로 열린다 (PRD 8장). 포커스 표시는 보라 2px 링 (`DESIGN.md` 6-15).

| 컴포넌트 | 종류 | 역할 |
| --- | --- | --- |
| `AppHeader` | 서버 | 서비스 이름(→ `/`), 상단 메뉴 "종목 검색"(`/`)·"조건으로 찾기"(`/screener`)·(2차) "업종으로 둘러보기"(`/industries`, `/industries/…` 전부에서 `aria-current`). 오른쪽 (확장) `AuthMenu` 자리. `/news`(F-18)는 메뉴에 넣지 않는다. 쿠키를 읽지 않는다 (1장) |
| `AuthMenu` (확장) | 클라이언트 | 9-10. 화면이 뜬 뒤 `GET /api/me` → 로그인 전 "로그인"(→ `LoginDialog`), 로그인 후 "마이페이지 {읽지 않은 수}"·"로그아웃". 응답 전에는 자리만 (깜빡임 방지로 폭 고정) |
| `SiteFooter` | 서버 | 투자 책임 고지 한 줄 + 출처 두 줄 (PRD 3-2, 10장 1번) |
| `Tooltip` | 클라이언트 | 트리거(`button`, `aria-describedby`) + 말풍선. 마우스 올림·포커스·탭으로 열림, Esc·바깥 클릭으로 닫힘. 작은 화면에서도 화면 밖으로 안 나가게. **(2026-11-28, `DESIGN-V2.md` 2-4) 열 때 트리거 `getBoundingClientRect()`와 `window.innerWidth`·`innerHeight`로 자리를 정한다:** 오른쪽에 280px(+16px 여백)가 남으면 왼쪽 기준, 아니면 오른쪽 기준, 둘 다 모자라면 화면 기준 `fixed` 가운데(양옆 16px). 아래 공간이 모자라면 위로. 폭 `min(280px, 100vw − 32px)`. 페이지 가로 스크롤이 생기면 안 된다 |
| `Gauge` | 서버 | 가로 막대 + 점(이 회사) + 기준선(있으면, 툴팁) + (2차) 업종 가운데 값 표시. **(2026-11-28) 점을 `points: { year; value }[]`로 받아 `gaugeDots`로 점 여러 개를 그린다** (과거 10px `bar-past`, 최신 16px `brand`, 2px `muted` 선 + 최신 쪽 화살촉, 겹치면 선 생략, `DESIGN-V2.md` 2-2-1). PER·PBR은 점 1개. 업종 가운데 값 라벨은 `Gauge` 밖(`MetricRow` 3줄째)으로 옮긴다. `aria-label`은 PRD 10장 38번. `gaugePosition` 사용. 범위 밖이면 점을 끝에 두고 값을 글자로. `role="img"` + `aria-label`("부채비율 87.3%, 범위 0~300%") |
| `Gauge` 2차 추가 | 서버 | prop `median?: { value: number; n: number } \| null`. 막대 **아래쪽** 짧은 세로 눈금(▲ 모양) + 라벨 "같은 업종 가운데 값 {값}" + `Tooltip`(PRD F-08 가운데 값 툴팁, `{N}` = n). 점(이 회사)과 모양이 달라 색 없이 구분된다. `aria-label` 끝에 ", 같은 업종 가운데 값 {값}". 값 포맷은 지표에 맞게 (`%` / `배`) |
| `TrendArrow` | 서버 | 화살표 + 말 ("↘ 3년째 감소"). 한 가지 색. "비슷한 수준"이면 툴팁 |
| `DataTable` | 서버/클라이언트 | 열 정의 + 행. 열 제목 정렬 버튼(`aria-sort`). 넓으면 표 안에서만 가로 스크롤 |
| `PageSizeSelect` | 클라이언트 | 10/20/50 |
| `Pagination` | 클라이언트 | 페이지 번호 (이전·다음 + 앞뒤 몇 개). (2차) 링크 모드: `href`로 URL 쿼리만 바꿔 서버가 다시 그림 (`/news`, 업종 목록). `DataTable` 정렬 버튼·`PageSizeSelect`도 같은 링크 모드를 지원 |
| `SortHeaderLink` (2차) | 서버 | 링크 모드 `DataTable`의 열 제목. `toListQuery`로 다음 정렬 주소를 만든 `<a>` + `aria-sort` |
| `Notice` | 서버 | 안내 상자. `variant: 'box' \| 'line'` (완전 자본잠식 = box, 부분 = line). 색 없이 테두리·굵기로 구분 |
| `EmptyState` / `ErrorState` | 서버 | 빈 결과 / 오류 문구 (PRD 10장 20번 기본안) |
| `Skeleton` | 서버 | 로딩 자리 (`loading.tsx`에서 사용) |

---

## 8. 화면 명세 (MVP)

### 8-1. `/` 검색 (F-01)

**규칙·문구:** PRD 4장 F-01, PRD 3-5 첫 화면.

```
┌ AppHeader ────────────────────────────────────────┐
│ 재무 레이더     [종목 검색]  조건으로 찾기          │
└───────────────────────────────────────────────────┘
        ┌──────────────────────────────────┐
        │ 🔍 종목명이나 종목코드            │  ← SearchBox
        ├──────────────────────────────────┤
        │ **삼성**전자 (005930)             │  ← 연관검색어 (최대 10)
        │ **삼성**바이오로직스 (207940)     │
        │ (외국회사) … (000000) 지원하지 않음│
        └──────────────────────────────────┘
        어떤 회사를 찾을지 모르겠다면 → 조건으로 찾기
        (2차: 경제 기사 5개 + 기사 더 보기 → /news, F-18)
─ SiteFooter ─
```

**`SearchBox` (클라이언트)**

| 항목 | 명세 |
| --- | --- |
| 구조 | WAI-ARIA combobox: `input role=combobox aria-expanded aria-controls aria-activedescendant` + `ul role=listbox` + `li role=option` |
| 입력 | 1글자 이상, 마지막 입력 후 300ms 디바운스 → `GET /api/search?q=` |
| 요청 겹침 | 새 요청 때 이전 요청을 `AbortController`로 취소. 늦게 온 응답은 버림 |
| 표시 | `{종목명} ({short_code})`, 일치 부분 `<strong>` (정규화한 문자열 기준으로 원문 위치를 찾음. 찾지 못하면 굵게 없이) |
| 외국회사 | 줄 끝 "지원하지 않음", `aria-disabled`, 선택해도 이동 안 함 |
| 키보드 | ↑↓ 이동(순환), Enter 선택(→ `/stocks/{short_code}`), Esc 닫기 |
| 결과 없음 | "검색 결과가 없어" (한 줄, 선택 불가) |
| 오류 | 목록 닫고 아무것도 안 함 (콘솔 경고만) |
| 자동 포커스 | 첫 화면 진입 시 입력창 포커스 |

**`GET /api/search?q=`**

- 검증: `q` 1~50자 (앞뒤 공백 제거 후).
- 응답 `200`: `{ "items": [{ "shortCode": "005930", "name": "삼성전자", "market": "KOSPI", "isForeign": false }] }`
- 처리: `search_stocks(q, 10)`.

### 8-2. `/stocks/[code]` 종목 화면 (F-02 + F-05)

**규칙·문구:** PRD 3-5 종목 화면 구성, 3-6 금융회사, 3-7 데이터 없음, 4장 F-02·F-05.

```
삼성전자
005930 · KOSPI · 전자 부품, 컴퓨터, 영상, 음향 및 통신장비 제조업        ← StockHeader
─────────────────────────────────────────────
[리포트카드]                                                        ← ReportCard
 (자본잠식 안내)
 눈여겨볼 변화
  · 매출은 늘었는데 영업이익률은 줄었어
 빚이 얼마나 있나   부채비율 25.4%  ↘ 3년째 감소
  0% ─●────|──────── 300%   (27.9% → 26.4% → 25.4%)
 팔아서 얼마나 남기나 …
 매출이 얼마나 늘었나 …
─────────────────────────────────────────────
[실적]  기준: 연결재무제표 · 2023~2025 사업연도                     ← ResultsCharts
 ┌매출액┐ ┌영업이익┐ ┌순이익ⓘ┐
─────────────────────────────────────────────
(2차: 주가 수준 / 배당 / [최근 기사 | 최근 공시] 두 칸)
─ SiteFooter ─
```

**페이지 (`app/stocks/[code]/page.tsx`, 서버)**

- `code`는 `short_code` (대소문자 그대로 받되 대문자로 맞춤). `getStockPage(code)`.
- `generateMetadata`: 제목 `{종목명} ({code}) · 재무 레이더`.
- `status`별:

| status | 보여주는 것 |
| --- | --- |
| `ok` | StockHeader + ReportCard + ResultsCharts |
| `no_financials` | StockHeader + `EmptyState` "이 회사의 재무정보가 없어." (PRD 3-7) |
| `foreign` | StockHeader + `EmptyState` (문구는 12장 1번) |
| 없음 | `notFound()` → `not-found.tsx` (문구는 12장 2번) |

- `loading.tsx`: 머리·카드·그래프 자리 `Skeleton`.

**`StockHeader` (서버)**

- 회사 이름(`h1`) + 정보 줄: `short_code · 시장 · 중분류 이름 · {M}월 결산`. 업종 이름이 없으면 그 칸을 생략 (MVP는 글자만, 2차에 F-15 링크).
- 자리만 남겨 둘 것: F-16 알림 띠·"읽는 순서" 버튼 (2차), "추적하기" 버튼 (확장).

**`ReportCard` (서버)** — 구성 순서·규칙은 PRD 4장 F-05.

| 하위 | 데이터 | 명세 |
| --- | --- | --- |
| `CapitalNotice` | `summary.capitalImpairment` | `full` → `Notice box` (부채비율 눈금 자리를 대신함), `partial` → 부채비율 눈금 아래 `Notice line`, 그 밖 없음 |
| `InsightList` | `summary.insights` | `topInsights(…, 3)` → `insightText`. 0개면 영역(제목 포함) 렌더하지 않음 |
| `MetricRow` ×3 | `years` 중 `displayYears`의 `revenue_growth`·`operating_margin`·`debt_ratio` (화면 순서 매출 → 영업이익 → 빚) | **3줄 (2026-11-28, `DESIGN-V2.md` 2-2-2):** ① 제목(질문형) | Y3 값(20px/700) + `TrendArrow`(`getTrend`), 지표 이름은 `sr-only` ② `Gauge`(Y1~Y3 점) ③ 값 3개 줄 `2023 a → 2024 b → 2025 c` (null 칸은 "계산할 수 없어") | `업종 {값}` + `Tooltip`. 그 아래 업종 비교 문장·`too_few`·부분 자본잠식 |

- 금융회사(`isFinancial`): `MetricRow` 3개를 렌더하지 않는다. `CapitalNotice`·`InsightList`는 그대로.
- Y3 값이 null인 `MetricRow`: 눈금 대신 사유 문장. 영업이익률 → "매출액이 없어서 영업이익률을 계산할 수 없어." 부채비율 → 완전 자본잠식 상자가 그 자리를 대신함. 매출 증가율 → "계산할 수 없어".
- 기준선 툴팁·"비슷한 수준" 툴팁 문구는 PRD 4장 F-05.

**`ResultsCharts` (클라이언트, Recharts)** — 규칙은 PRD 4장 F-02.

| 항목 | 명세 |
| --- | --- |
| 입력 | `displayYears` 행 (오래된 → 최근), `fsDiv`, `isFinancial` |
| 구성 | 작은 `BarChart` 3개를 가로로 (좁은 화면은 세로로 쌓음). 금융회사는 영업이익·순이익 2개 + 위에 금융회사 안내 한 줄 |
| 기준 표시 | 그래프 묶음 위 `기준: {formatFsDiv} · {formatYearRange} 사업연도` |
| 축 | X 연도(`2023년`), Y 0 포함 (음수 있으면 0 아래까지), Y축 눈금 숫자는 숨기고 막대 위 값 라벨만 |
| 단위 | 그래프마다 그 항목 값들로 `formatAmount` |
| 막대 색 | 최신 연도 막대만 포인트 색 `#6D28D9`(보라), 과거 연도는 회색 `#D4D4D8` (`DESIGN.md` 6-4). 막대 애니메이션 없음 (`isAnimationActive={false}`, `DESIGN.md` 8장) |
| 음수 | 0 기준선 + 음수 막대에 **빗금 무늬**로 구분 (`DESIGN.md` 6-4). 빨강·색 경고 금지 |
| 툴팁 | 정확한 금액(원 단위 쉼표) + 전년 대비 증감률 (`formatGrowth`, 전년이 저장 연도 4개 중에 있으면 계산) |
| null 값 | 그 막대 자리에 "제공되지 않음" 글자 |
| 순이익 제목 | 옆 `Tooltip` "정식 이름은 당기순이익" |
| 접근성 | 그래프마다 같은 값을 담은 시각적으로 숨긴 표(`sr-only` table) |

### 8-3. `/screener` 스크리너 (F-07, F-03 상수 사용)

**규칙·문구:** PRD 4장 F-03·F-07.

```
조건으로 찾기
(2차: 챗봇 입력창 자리)
┌ FilterPanel ──────────────────────────────────────────┐
│ 매출   [매출이 2년 연속 늘어난 회사ⓘ] [ … ] [ … ]          │
│ 이익   [ … ] …                                          │
│ 이익률 …  빚 …  자산과 자본 …  배당 …                     │
│ (선택 안내 줄: "필터는 3개까지 고를 수 있어" 등)           │
└───────────────────────────────────────────────────────┘
조건에 맞는 회사 342개   금융회사는 이 조건을 계산할 수 없어서 빠졌어.ⓘ   [10개씩 ▾]
시가총액은 보통주 기준, 주가 2026-11-16 기준
종목명▲ | 종목코드 | 시장 | 시가총액 | 부채비율 2025년 | 매출 2023년 | 2024년 | 2025년
…
                    ‹ 1 2 3 … 35 ›
```

**페이지 (`app/screener/page.tsx`, 서버)**

1. `parseScreenerParams(searchParams)`.
2. 필터가 없으면 결과 조회 없이 `FilterPanel` + 안내 (PRD 10장 11번).
3. 있으면 `screener_search` 호출 → 첫 결과를 `ScreenerClient`에 초기값으로 넘긴다.

**`ScreenerClient` (클라이언트)** — 상태 `{ filters, sort, dir, page, size }`, 결과 `{ total, rows, basDt }`, `loading`.

| 동작 | 처리 |
| --- | --- |
| 필터 버튼 누름 | `toggleFilter`. `error='max'` → 안내 줄 "필터는 3개까지 고를 수 있어". `error='conflict'` → 안내 줄 `'{상대 문구}'와 함께 고를 수 없어`. 성공 → `page=1`, 지금 정렬 열이 사라졌으면 `sort=name` |
| 흐린 버튼 | `blockedBy`로 흐림 (`aria-disabled`, 여전히 포커스 가능). 올리거나 누르면 이유 안내 |
| 정렬 열 누름 | 같은 열이면 `dir` 뒤집기, 다른 열이면 그 열 `asc`. `page=1` |
| 개수 선택 | `size` 바꾸고 `page=1` |
| 페이지 | `page` 바꿈, 표 맨 위로 스크롤 |
| 조회 | 상태가 바뀔 때마다 `GET /api/screener?…` (이전 요청 취소). 조회 중엔 표를 흐리게, 개수 줄은 유지 |
| URL | 상태를 `toQuery`로 만들어 `window.history.replaceState`로 반영 (뒤로 가기 기록을 쌓지 않음). 종목 화면에서 뒤로 오면 이 URL로 서버가 같은 상태를 다시 그림 |
| 종목 누름 | 종목명 링크 → `/stocks/{short_code}` |

**`FilterPanel`**

- 묶음 6개 순서대로, 묶음마다 제목 + 버튼. 버튼은 `aria-pressed`. **버튼 너비 통일 (2026-11-28, `DESIGN-V2.md` 1-2):** 필터 하나가 한 줄(`flex` 세로), 버튼은 `w-full`·글자 왼쪽 맞춤·긴 글자는 줄바꿈(말줄임 없음), `Tooltip`은 버튼 오른쪽 고정 폭 자리. 버튼 옆 `Tooltip`: `{tooltip} 계산: {fillYears(calc, 기준 연도)}` (기준 연도는 PRD 10장 9번 — 서버에서 `company_summary.latest_year` 최빈값을 구해 넘김).
- 선택한 필터를 묶음 위에 칩으로 한 번 더 보여주고 ✕로 뺄 수 있게 한다.

**`ResultTable`** (`DataTable` 사용)

| 열 | 내용 | 정렬 키 |
| --- | --- | --- |
| 종목명 | 링크 + `formatAccMt` 표시 | `name` |
| 종목코드 | `short_code` | — |
| 시장 | `KOSPI`/`KOSDAQ` | — |
| 시가총액 | `formatMarketCap` | `market_cap` |
| 근거 값 열 | `evidenceGroups(filters, refYear)`(`lib/screener-view.ts`): 같은 지표 이름은 한 열로 묶고 연도 칸은 합집합. 칸은 `readEvidenceGroup`으로 연도 값을 ` → `로 잇고 금액·배당 단위는 마지막 값에만, 값마다 줄바꿈 안 함·화살표 뒤에서만 줄바꿈. 열 제목 `{지표} {첫 연도}~{끝 연도}년`. 회사 연도가 기준과 다르면 칸 끝에 실제 연도 범위를 작게 (2026-11-28 사용자 결정) | `FilterDef.sortKey` (최근 연도 칸이 있는 열만) |

- 금액 칸은 `formatAmount`, 비율은 `formatPercent`, 배당은 `formatWon` 또는 "없음". null은 `-`.
- 결과 수 줄: `copy.screener.count(total)`. 0이면 표 대신 "조건에 모두 맞는 회사가 없어. 필터를 하나 빼 봐."
- `hasFinancialBlocked(filters)`면 결과 수 옆 금융회사 안내 + 툴팁.
- 기준 표시: `시가총액은 보통주 기준, 주가 {bas_dt} 기준` (행의 `bas_dt` 중 하나).

**`GET /api/screener?f=&sort=&dir=&page=&size=`**

- 검증: `parseScreenerParams`와 같은 규칙이지만 **바로잡지 않고 400** (클라이언트가 이미 바른 값을 보냄). `f`는 1개 이상 필수.
- 응답 `200`: `{ "total": 342, "basDt": "2026-11-16", "rows": [{ "shortCode", "name", "market", "accMt", "isFinancial", "marketCap", "years": [...], "dividends": [...] }] }`
- 처리: `screener_search`. 결과 0행이면 `total: 0, rows: []`.

---

## 9. 화면 명세 (2차·확장)

규칙·문구는 PRD 4장 각 기능. 개발 순서는 PRD 2-1: **2차** F-08 → F-09 → F-14 → F-17 → F-18 → F-15 → F-16 → F-10, **확장** F-11 → F-12 → F-13 (11장).

### 9-1. 2차 공통 — 종목 화면 구성

**규칙:** PRD 3-5 종목 화면 구성 (탭 없음, 위에서 아래).

```
삼성전자                                              [추적하기](확장)
005930 · KOSPI · [전자 부품, … 제조업]ⓘ(→ F-15)                      ← StockHeader
┌ 어디부터 읽을지 모르겠다면 순서대로 짚어 줄게. [읽는 순서 보기] ✕ ┐  [읽는 순서] ← ReadingTour
─────────────────────────────────────────────
[실적] data-tour="sales" / "profit"  (PC 전체 폭, 그래프 3개 가로)    ← ResultsCharts
─────────────────────────────────────────────
[리포트카드] (업종 정보가 없어.)                                     ← ReportCard
 빚이 얼마나 있나                                  25.4%  ↓
  ├──○───●──▶◉───|──────────┤  0% … 300%
  2023 40.1% → 2024 31.0% → 2025 25.4%          업종 62.0%ⓘ
  같은 업종 가운데 값보다 낮아
 … (지표 3개)
 [같은 업종 회사 보기 →]
─────────────────────────────────────────────
[주가 수준] data-tour="valuation"                                    ← ValuationSection
─────────────────────────────────────────────
[배당 (보통주 기준)] data-tour="dividend"                            ← DividendCard
─────────────────────────────────────────────
[최근 기사]              │ [최근 공시]                               ← StockFeedSection
─ SiteFooter ─
```

| status | 보여주는 것 (8-2 표를 대체) |
| --- | --- |
| `ok` | StockHeader(+ReadingTour) + ResultsCharts + ReportCard + ValuationSection + DividendCard + StockFeedSection |
| `no_financials` | StockHeader + `EmptyState` "이 회사의 재무정보가 없어." + StockFeedSection (PRD 10장 26번). ReadingTour 없음 |
| `foreign` | StockHeader + `EmptyState` (12장 1번). StockFeedSection·ReadingTour 없음 |

- `data-tour` 속성 위치: `sales` = 매출액 그래프 하나, `profit` = 영업이익·순이익 그래프 둘을 감싼 요소 (`ResultsCharts` 안에서 두 그래프를 한 묶음으로 감싼다. 금융회사도 같음), `debt` = 부채비율 `MetricRow` **또는** 그 자리를 대신한 완전 자본잠식 상자, `valuation` = `ValuationSection` 전체, `dividend` = `DividendCard` 전체.
- `loading.tsx` 스켈레톤에 주가 수준·배당 자리를 더한다. 공시·기사 칸은 각자 `Suspense` 스켈레톤.
- **PC 배치 (2026-11-28, `DESIGN-V2.md` 2-1. 2026-11-27 배치를 바꿈):** 폭 1024px 이상에서 머리 → ResultsCharts(전체 폭, 그래프 3개 가로·640px 미만 세로) → 두 단[왼쪽(약 2/3) ReportCard | 오른쪽(약 1/3) ValuationSection → DividendCard] → StockFeedSection(전체 폭 두 칸). `ReportCard`가 `null`이면 두 단 대신 ValuationSection | DividendCard 같은 폭 두 칸. DOM 순서 = 화면 순서로 두고 CSS `order`를 쓰지 않아서 1024px 미만 한 단 순서·스크린리더 순서·투어 순서가 같게 한다.

### 9-2. F-08 업종 비교

**규칙·문구:** PRD 4장 F-08.

**리포트카드 변경 (`ReportCard`, 서버)**

| 하위 | 명세 |
| --- | --- |
| 업종 없음 줄 | `industry === null`이면 지표 3개 위에 한 번 "업종 정보가 없어." (지표마다 반복하지 않음) |
| `MetricRow` | `compareToIndustry(Y3 값, median.value, median.n, industry !== null)` → `ok`면 `Gauge median` + 값 줄 아래 비교 한 줄 "같은 업종 가운데 값보다 높아 / 낮아 / 같아" (`relation`이 null이면 줄 없음). `too_few`면 눈금 아래 "같은 업종 회사가 적어서 비교 값을 표시하지 않아." |
| 버튼 | 지표 3개 아래 링크 "같은 업종 회사 보기" → `/industries/{division_code}/compare`. `industry !== null`일 때만 (금융회사도 표시: 업종은 있으므로) |

- 금융회사는 `MetricRow`가 없으므로 가운데 값도 없다 (PRD F-08 수용 기준).
- Y3 값이 null인 `MetricRow`(사유 문장이 눈금을 대신함)에는 가운데 값도 그리지 않는다.

**`/industries/[division]/compare` (서버, `revalidate = 3600`)**

```
의약품 제조업 회사 42개
종목명▲ | 종목코드 | 시장 | 부채비율 2025년 | 영업이익률 2025년 | 매출 증가율 2025년
…
[10개씩 ▾]                      ‹ 1 2 3 4 5 ›
```

1. `isDivisionCode(division)` 아니면 `notFound()`.
2. `parseListParams(searchParams, INDUSTRY_METRIC_SORTS)`.
3. 병렬: `ksic_classes` `eq('code', division).eq('level','division')`(이름) + RPC `industry_metrics(…)`.
4. 이름이 없거나 결과 0행이면서 `page=1`이면 `notFound()` (12장 5번 문구). 0행인데 `page>1`이면 마지막 페이지로 `redirect` (`total_count`는 1페이지를 다시 조회해 구한다).
5. 제목 `{division_name} 회사 {total}개` (PRD F-08). `generateMetadata`: `{division_name} 지표 비교 · 재무 레이더`.

| 열 | 내용 | 정렬 키 |
| --- | --- | --- |
| 종목명 | 링크 `/stocks/{short_code}` + `formatAccMt` | `name` |
| 종목코드 · 시장 | | — |
| 부채비율 · 영업이익률 · 매출 증가율 | `formatPercent`, null `-`. 열 제목 `{기준 연도}년` (이 목록 `fiscal_year` 최빈값), 회사 연도가 다르면 칸에 그 연도를 작게 | `debt_ratio` 등 |

- `DataTable`(링크 모드) + `SortHeaderLink` + `PageSizeSelect`·`Pagination` 링크 모드. 링크는 `toListQuery`.
- 금융회사 행은 지표가 `-`로 나온다 (따로 안내하지 않음).

### 9-3. F-09 주가 수준

**규칙·문구:** PRD 4장 F-09.

**`ValuationSection` (서버)** — `data-tour="valuation"`. 입력 `valuation`, `industry`. **행 모양 (2026-11-28, `DESIGN-V2.md` 2-2-3):** `MetricRow`와 같은 3줄 — ① 제목 + `Tooltip` | 값 ② `Gauge`(점 1개) ③ 기준일·보통주 안내 | `업종 {값}` + `Tooltip`. 오른쪽 단이 좁아 범위 숫자와 기준선 값이 겹치면 기준선 값을 막대 위로 올린다.

```
주가 수준                                 주가 2026-11-16 기준 · 순이익·자본 2025년 기준
보통주 시가총액 기준
주가가 버는 돈의 몇 배인가 (PER)ⓘ   25.5배
  0배 ─────●──▲─────────── 50배      ▲ 같은 업종 가운데 값 18.2배ⓘ
주가가 회사 자기 돈(자본)의 몇 배인가 (PBR)ⓘ   2.6배
  0배 ──|──▲──●──────────── 5배   (| = 1배 선ⓘ)
```

| 경우 | 표시 |
| --- | --- |
| `valuation === null` | 영역 제목 + "주가 정보가 없어." (PRD 10장 13번) |
| `per === null` | PER 줄에 눈금 대신 "순이익이 적자여서 PER을 계산하지 않아." |
| `pbr === null` | PBR 줄에 눈금 대신 "자본총계가 0 이하라서 PBR을 계산하지 않아." |
| 업종 | `compareToIndustry`로 가운데 값 표시·`too_few` 문구·업종 없음 문구 (F-08과 같은 문구). **비교 한 줄("높아/낮아")은 넣지 않는다** (12장 동작 기본안 1번) |

- 값 `formatMultiple`, 눈금 `Gauge` `per`(기준선 없음)·`pbr`(기준선 1, PRD "PBR 1배 선 툴팁").
- 금융회사도 똑같이 표시한다.

### 9-4. F-14 배당

**규칙·문구:** PRD 4장 F-14.

**`DividendCard` (서버)** — `data-tour="dividend"`. 입력 `dividends`, 화면 연도. `buildDividendTable` 결과로:

| `kind` | 표시 |
| --- | --- |
| `table` | 제목 "배당 (보통주 기준)" + 오른쪽 "{sourceYear}년 사업보고서 기준" + 표(열 = 연도, 행 = 주당 배당금 / 배당수익률) + 고정 설명 두 줄 |
| `all_none` | 제목 + "최근 3년 동안 현금배당이 없었어." |
| `no_data` | 제목 + "이 회사의 배당 정보가 없어." |

- 표는 `<table>` + `<th scope>`. 행 이름 옆 `Tooltip` (주당 배당금·배당수익률), "공시 없음" 칸 `Tooltip`, 고정 설명 속 "배당 기준일" 글자 `Tooltip`.
- 카드는 `status='ok'`면 항상 그린다 (PRD F-14).

### 9-5. F-17 최근 공시

**규칙·문구:** PRD 4장 F-17, 외부 API PRD 5-8, 문구 기본안 PRD 10장 22·26·27·32번.

**`lib/data/disclosures.ts` (server-only)**

```ts
type DisclosureItem = { title: string; filer: string; date: string; href: string };
type DisclosureResult = { status: 'ok'; items: DisclosureItem[] } | { status: 'error' };
function getRecentDisclosures(corpCode: string | null): Promise<DisclosureResult>
```

1. `corpCode`가 null → `{ status: 'ok', items: [] }` (0건 문구, PRD 10장 26번).
2. `DART_OPENAPI_KEY` 없으면 → `error` (로그에 변수 이름만).
3. 캐시 안쪽 함수(3-3, 키 `corp_code`, 3600초): `GET https://opendart.fss.or.kr/api/list.json?crtfc_key&corp_code&sort=date&sort_mth=desc&page_count={N}`, `AbortSignal.timeout(5000)`. `status` `000` → `list` 반환, `013` → 빈 배열 반환, 그 밖 → throw.
4. `excludeOwnershipDisclosures` → `takeRecent(5)` → `{ title: report_nm, filer: flr_nm, date: formatRceptDt(rcept_dt), href: dartViewerUrl(rcept_no) }`.

- `page_count`와 지분공시 거르는 방법(요청 파라미터로 거를지, 응답에서 거를지)은 PRD 11장 19번 확인 뒤 정한다. 응답에서 거르는 경우 5개가 남을 만큼 받는다 (최대 100).
- 응답 JSON은 `unknown`으로 받아 필드가 문자열인지 검사한다. 모양이 틀린 줄은 버리지 않고 **전체를 error**로 본다 (일부만 보이면 "최신 5개"가 틀려짐).
- 요청 URL은 로그에 남기지 않는다 (`crtfc_key`).

**`DisclosureList` (서버, `Suspense` 안)**

```
최근 공시
· 분기보고서 (2026.09) · 삼성전자 · 2026-11-14   ↗(새 탭)
· …
공시 더 보기 →
```

- 줄: `{title} · {filer} · {date}` 전체가 `<a href target="_blank" rel="noopener noreferrer">`. 공시 제목은 받은 그대로 (금지 표현 검사 안 함).
- `error` → "지금은 공시를 불러올 수 없어." / 0건 → "최근 공시가 없어." (PRD 10장 22·27번).
- "공시 더 보기 →" → `dartCompanyListUrl(corpCode)` 새 탭 (PRD 11장 20번 확인 전에는 링크를 숨김).

### 9-6. F-18 경제 기사

**규칙·문구:** PRD 4장 F-18, 외부 API PRD 5-8, 문구 기본안 PRD 10장 21~25·28~32번.

**`lib/data/news.ts` (server-only)**

```ts
type NewsItem = { title: string; domain: string; time: string; href: string | null };
type NewsResult = { status: 'ok'; items: NewsItem[]; total: number | null } | { status: 'error' };
function searchNews(p: { query: string; display: number; start: number; sort: 'date' | 'sim' }): Promise<NewsResult>
function getHomeNews(): Promise<NewsResult>            // HOME_NEWS_QUERY, display 5, start 1, date — 1800초
function getNewsPage(page: number): Promise<NewsResult> // display 10, start (page−1)×10+1 — 1800초
function getStockNews(name: string, shortCode: string): Promise<NewsResult> // query = `{name} {shortCode}` (buildStockNewsQuery), display 5, sort sim — 3600초. 2026-11-28 4가지 조합 비교 결과 B안 확정 (PRD 4장 F-18)
```

- `GET https://naverapihub.apigw.ntruss.com/search/v1/news?query&display&start&sort`, 헤더 `X-NCP-APIGW-API-KEY-ID`·`X-NCP-APIGW-API-KEY`, 5초 제한. 키가 없으면 부르지 않고 `error`.
- 캐시 안쪽 함수(3-3): HTTP 200 + `items` 배열이면 반환, 그 밖 throw. 받은 **순서·개수 그대로** `cleanNewsTitle`·`newsDomain`·`formatPubDate`·`newsHref`로 바꾸기만 한다. 빼거나 정렬하지 않는다 (네이버 약관).
- `HOME_NEWS_QUERY`는 상수 하나 (PRD 10장 28번 — 초안 `경제 정책`·`기업 실적` 중 표본 검증으로 고름, PRD 11장 17번). 여러 검색어 결과를 합치지 않는다.
- `total`은 응답에 있으면 쓴다 (HUB 응답 모양은 PRD 11장 16번 확인). 없으면 null.
- **이 모듈은 `/api/chat`·`lib/data/chat.ts`에서 import하지 않는다** (PRD F-10·F-18, 10장 `chat-isolation.test.ts`).
- 받은 데이터를 DB·파일·로그에 쓰지 않는다. 로그에는 HTTP 상태 코드만.

**컴포넌트 (모두 서버)**

| 컴포넌트 | 역할 |
| --- | --- |
| `NewsList` | `<ul>` 기사 줄 (세 곳 공통). 줄: `{title} · {domain} · {time}`, `href`가 있으면 줄 전체 `<a target="_blank" rel="noopener noreferrer">`. 제목은 **텍스트 노드로만** (`dangerouslySetInnerHTML` 금지). 줄 사이에 다른 요소를 넣지 않는다. 썸네일·요약 없음 |
| `NaverAttribution` | 네이버 로고(BI 가이드 파일, `public/`에 둠 — 사용 조건은 PRD 11장 15번) + 네이버 링크. 기사 영역마다 하나 |
| `NewsBlock` | 칸 제목 + `NaverAttribution` (안내 문구는 2026-11-23 폐지) + 결과(`NewsList` / 실패 "지금은 기사를 불러올 수 없어." / 0건 "찾은 기사가 없어.") |
| `HomeNews` | `/` 바로가기 줄 아래. `NewsBlock`(제목 "경제 기사", `getHomeNews`) + `기사 더 보기 →`(`/news`) |
| `StockNews` | `StockFeedSection` 왼쪽. props `{ name, shortCode }`. 모든 종목이 `NewsBlock`(제목 "최근 기사", `getStockNews(name, shortCode)`)을 쓴다. `ShortNameNotice`는 2026-11-23 삭제 |
| `StockFeedSection` | props `{ name, shortCode, corpCode }`. 배당 카드 아래 `grid` PC 2열(왼쪽 기사·오른쪽 공시), 좁은 화면 1열(기사 위). 칸마다 `<Suspense fallback={<Skeleton/>}>` |

**`/news` (서버, `revalidate = 1800`)**

```
경제 기사
(네이버 로고·링크)
· 제목 · 도메인 · 2026-11-20 09:12
… 10개
‹ 1 2 3 … ›
```

- `parseNewsPage(searchParams)` → `getNewsPage(page)` → `NewsBlock` + `Pagination`(링크 모드 `?page=`). 마지막 페이지 = `min(NEWS_MAX_PAGE, ceil(total/10))`, `total`이 null이면 "다음"만 (결과가 10개 미만이면 숨김).
- 상단 메뉴에 넣지 않는다. `generateMetadata` 제목 `경제 기사 · 재무 레이더`.

**출처 푸터:** 네이버 추가 문구는 사용자 확인 뒤 `copy.footer.source`만 바꾼다 (PRD 10장 25번).

**종목 기사 검색 조건 비교 (2026-11-28, PRD 4장 F-18 "검색 조건 다시 정하기", `DESIGN-V2.md` 2-5)**

- 스크립트 `scripts/news_query_check.py` (표준 라이브러리, 키는 변수 이름으로만, 출력·저장에서 키 값 없음). 표본 10종목 × 조합 A~D × 5개를 받아 `api_check_results/`(git 제외)에 원본을 두고, 조합마다 "제목에 종목명 포함 비율"·가장 오래된 `pubDate`를 출력한다.
- 고른 조합으로 `buildStockNewsQuery`(따옴표 조합이면 `"{name}"`)와 `getStockNews`의 `sort`를 바꾸고 `news-text.test.ts`를 고친다. 결과를 걸러 내는 코드는 넣지 않는다 (PRD 5-8).

### 9-7. F-15 업종으로 둘러보기

**규칙·문구:** PRD 4장 F-15.

**진입 3곳:** `AppHeader` 3번째 메뉴, `/` 바로가기 2번째 줄 "회사 이름을 모르겠다면? 업종으로 둘러보기 →", `StockHeader` 정보 줄의 업종 이름 (`division_name`이 있을 때만 `<Link href="/industries/{division_code}">` + `Tooltip` "같은 업종 회사를 둘러볼 수 있어.").

**`lib/data/industry.ts` (server-only):** `getIndustryTree()`(RPC 5-3 → 대분류로 묶고 대분류 회사 수 합산), `getIndustryCompanies(division, params)`(5-4), `getIndustryMetrics(division, params)`(5-5), `getDivisionName(division)`.

**`/industries` (서버, `revalidate = 3600`)**

```
업종으로 둘러보기
업종을 누르면 그 업종에 속한 회사를 볼 수 있어. 업종은 한국표준산업분류(제11차) 기준이야.
▸ 제조업 (회사 1,203개)            ← <details><summary>
    식료품 제조업 (회사 41개)       ← <a href="/industries/10">
▸ 정보통신업 (회사 …)
```

- 대분류마다 `<details>` (JS 없음, 키보드로 열림). 처음엔 모두 닫힘 (12장 동작 기본안 2번). 대분류 이름은 `cleanSectionName`, 중분류 이름은 그대로.
- ~~회사 수 표기 `(회사 {n}개)`~~ → **회색 배지 `{n}개`** (2026-11-28, PRD 10장 35번, `DESIGN-V2.md` 3-2). 숫자 쉼표. 중분류 카드 오른쪽 위·대분류 제목 오른쪽. 공통 부품 `CountBadge`(서버)로 둔다.
- **카드 회사 이름 3개 (2026-11-28, PRD 4장 F-15, `DESIGN-V2.md` 3-1):** `getIndustryTree()`가 RPC 5-3과 5-9(`p_limit` 3)를 병렬로 불러 중분류마다 `topCompanies: string[]`(종목명)를 붙인다. 카드 아래쪽에 ` · `로 잇는다 (링크 아님). 0개면 줄 없음. 5-9 실패 시 회사 줄만 빼고 카드는 그린다 (로그만 남김).

**`/industries/[division]` (서버, `revalidate = 3600`)**

```
의약품 제조업 · 이 업종 회사 42개                      지표로 견줘 보기 →
시가총액은 보통주 기준, 주가 2026-11-16 기준
종목명▲ | 종목코드 | 시장 | 시가총액 | 주가 | PER | PBR | 매출액 | 영업이익
```

1. `isDivisionCode` 아니면 `notFound()`. 2. `parseListParams(…, INDUSTRY_COMPANY_SORTS)`. 3. 이름 + RPC 5-4 병렬. 4. 없는 업종·0개 → `notFound()`, 페이지 넘침 → 마지막 페이지로 `redirect` (9-2와 같음).

| 열 | 내용 | 정렬 키 |
| --- | --- | --- |
| 종목명 | 링크 + `formatAccMt` | `name` |
| 종목코드 · 시장 | | — |
| 시가총액 | `formatMarketCap`, null `-` | `market_cap` |
| 주가 | `formatWon`(원), null `-` | — |
| PER · PBR | `formatRatio`, null `-` | `per` / `pbr` |
| 매출액 · 영업이익 | 최근 연도(`fiscal_year`) 값, `formatAmount` 또는 `-`. 금융회사 매출액 `-` | `revenue` / `operating_income` |

- 기준 표시 `시가총액은 보통주 기준, 주가 {bas_dt} 기준` (행의 `bas_dt` 중 하나, 모두 null이면 줄 생략).
- "지표로 견줘 보기 →" → `/industries/{division}/compare`.

### 9-8. F-16 읽는 순서

**규칙·문구:** PRD 4장 F-16.

**`ReadingTour` (클라이언트)** — `StockHeader` 정보 줄 아래, `status='ok'`에서만. props `isFinancial`.

| 항목 | 명세 |
| --- | --- |
| 알림 띠 | 마운트 뒤 `localStorage[TOUR_SEEN_KEY]`를 읽어 없을 때만 띠를 그린다 (서버 렌더 때는 띠 없음 → 화면이 밀리지 않게 띠는 정보 줄 아래 **흐름 안**에, 첫 그리기 뒤 나타남). 띠: 문구 + [읽는 순서 보기] + ✕ (`aria-label` "닫기") |
| 고정 버튼 | "읽는 순서" — 항상 보임 (띠와 별개) |
| 본 것으로 기록 | ✕, [읽는 순서 보기], "읽는 순서" 버튼 중 하나를 누르면 `TOUR_SEEN_KEY = '1'` 저장 후 띠 숨김. 읽기·쓰기 모두 `try/catch` — 실패하면 띠를 그 화면에서만 숨기고 계속 동작 (PRD F-16) |
| 시작 | `import('driver.js')`를 **누를 때** 불러온다 (번들 줄이기). `document.querySelectorAll('[data-tour]')`로 있는 키를 모아 `buildTourSteps(present, isFinancial)` → driver 단계 |
| driver 설정 | `showProgress`, 진행 문구 `{{current}}/{{total}}`, 버튼 "이전"/"다음", 마지막 "끝", `smoothScroll: true`, `allowKeyboardControl: true`. "건너뛰기"는 `onPopoverRender`에서 버튼을 추가해 `destroy()` (driver.js 기본 닫기 버튼 대신) |
| 작은 화면 | 폭 640px 미만이면 말풍선을 화면 아래쪽에 고정 (CSS로 `.driver-popover` 위치 덮어쓰기) |
| 스타일 | driver.js 기본 CSS를 불러오고 모양은 `DESIGN.md` 6-11 기준으로 덮는다 (툴팁과 같은 흰 팝오버, 다음 버튼 보라 채움, 이전 버튼 보조 버튼, 비추는 칸 모서리 16px) |

- 투어에 기사·공시 칸은 넣지 않는다 (`data-tour`를 달지 않음).
- (2026-11-28) 9-1 배치 변경으로 `sales` → `profit` → `debt` → `valuation` → `dividend`가 화면 위→아래·왼→오 순서가 된다. `data-tour` 위치·`TOUR_KEYS` 순서는 바꾸지 않는다.
- **2026-11-28 사용자 결정:** PC 두 단에서 ③부채 → ④PER·PBR은 위로 약 400px 올라간다. 왼쪽 단을 다 읽고 오른쪽 단으로 넘어가는 흐름으로 보고 배치는 그대로 둔다.

### 9-9. F-10 챗봇

**규칙·문구:** PRD 4장 F-10.

**`ChatFilterInput` (클라이언트)** — 스크리너 맨 위, `FilterPanel` 위. `ScreenerClient` 안에 두고 필터 상태를 함께 쓴다.

- 외부 AI 전송 안내 줄은 두지 않는다 (2026-11-28 사용자 지시, PRD 10장 15번 삭제). `copy.ts`의 해당 키도 지운다.

```
찾고 싶은 회사를 문장으로 적어 줘 [                              ] [찾기]
이렇게 적어 봐  [빚이 적고 매출이 늘어나는 회사] [적자에서 흑자로 돌아선 회사] [꾸준히 배당하는 회사]
(결과 문구 줄, aria-live="polite")
```

| 동작 | 처리 |
| --- | --- |
| 예시 누름 | AI 없이 `CHAT_EXAMPLES`의 필터로 **선택을 바꾼다** → "이 조건으로 찾았어: …" |
| 제출 | 앞뒤 공백 뺀 길이 1~`CHAT_MAX_INPUT` (입력창 `maxLength`). 조회 중엔 버튼 비활성. `POST /api/chat { text }` |
| `status: 'ok'` | `ChatResult`대로: `conflict` → 규칙 2 부딪힘 문구, 필터 그대로 / `notCondition` → 규칙 4 문구, 필터 그대로 / 필터 1개 이상 → **선택을 그 필터로 바꾸고**(앞 선택을 이어받지 않음, 규칙 5 · 12장 동작 기본안 4번) `page=1` → 스크리너 조회, "이 조건으로 찾았어: {문구}, {문구}", `truncated`면 규칙 2 "앞의 3개만" 문구 / `unsupported` 코드마다 고정 문구 줄 (규칙 3) |
| `status: 'unavailable'` 또는 네트워크 오류 | 입력창·예시를 이 화면에서 숨기고 규칙 6 문구. 필터 버튼은 그대로 |
| 400 | 일어나지 않게 막지만 오면 규칙 6과 같게 |

**`POST /api/chat`**

- 입력 `{ text: string }`. 검증: 문자열, trim 후 1~`CHAT_MAX_INPUT`자. 어기면 400.
- 처리:
  1. `key = normalizeChatInput(text)`.
  2. 캐시(3-3, 86400초, 키 `key`) 안쪽 함수 `askModel(key)`:
     1. `OPENROUTER_API_KEY` 없으면 throw.
     2. `chat_usage_take(CHAT_DAILY_LIMIT)` (서버용 키) → `false`면 throw (상한).
     3. OpenRouter chat completions 호출 (`fetch`, 5초 제한, 주소·`response_format` 지원 여부는 구현 때 공식 문서로 확인). `model`은 상수 `CHAT_MODEL` (PRD 10장 19번). 메시지: system = 역할 설명 + 필터 20개 `{id}: {label}` + 지원하지 않는 종류 코드 4개 + 출력 JSON 모양 `{"filters":[…],"unsupported":[…],"not_condition":false}` + "문장에 나온 순서대로", user = **사용자 문장만**.
     4. `parseChatOutput` → null이면 throw.
  3. throw → `200 { "status": "unavailable" }`. 성공 → `applyChatRules` → `200 { "status": "ok", "filters", "conflict", "truncated", "unsupported", "notCondition" }`.
- 같은 문장은 캐시에서 나오므로 AI도, 호출 수도 늘지 않는다. 실패는 캐시되지 않는다.
- 호출 수는 AI를 부르기 **전에** 센다 (실패해도 1회로 침 — 상한을 넘지 않는 쪽).
- 로그: 사용자 문장·AI 응답 원문은 남기지 않는다. 결과 종류(`ok`/`limit`/`error`/`timeout`)만.
- AI 요청에는 사용자 문장과 필터 목록 외에 아무것도 넣지 않는다 (기사 데이터 금지, PRD F-18).
- 응답 헤더 `Cache-Control: no-store`.

### 9-10. 확장 공통 — 로그인 세션

| 파일 | 내용 |
| --- | --- |
| `lib/supabase/session.ts` | `@supabase/ssr` `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies })`. `server-only`. Route Handler·`/mypage`·`/reset-password`에서만 |
| `lib/supabase/browser.ts` | `createBrowserClient(…)`. **인증 요청(`lib/auth-client.ts`: 로그인·가입·재발송·설정 메일·비밀번호 저장)과 로그아웃(`signOut`)에만** 쓴다. 사용자 테이블은 브라우저에서 직접 읽지 않고 API Route를 거친다 (PRD 7-4) |
| `proxy.ts` | 세션 쿠키 갱신 (`@supabase/ssr` 안내 방식). `matcher`: `/mypage`, `/reset-password`, `/auth/:path*`, `/api/me`, `/api/watchlist`, `/api/settings`, `/api/notifications/:path*`, `/api/account/:path*` — **공개 화면은 넣지 않는다** (캐시 유지) |

- 서버에서 사용자 확인은 `supabase.auth.getUser()` (쿠키만 믿는 `getSession` 쓰지 않음).

**`GET /api/me`** → 로그인 전 `{ "loggedIn": false }`, 로그인 `{ "loggedIn": true, "unreadCount": 3 }` (`notifications` `read_at is null` `count: 'exact', head: true`). 이메일은 내려주지 않는다 (화면에 쓰지 않음).

**`AuthMenu` (클라이언트)** — 7장. 로그아웃: `browser.auth.signOut()` → `/mypage`에 있으면 `/`로, 아니면 `router.refresh()` 없이 메뉴만 바꾼다 (공개 화면은 로그인과 무관).

### 9-11. F-11 로그인

**규칙·문구:** PRD 4장 F-11 (존댓말), 10장 17번.

**`LoginDialog` (클라이언트)** — HTML `<dialog>` (`showModal`, Esc로 닫힘, 가운데 정렬 `m-auto`). `AuthMenu`·`WatchButton`에서 연다. props `watch?: string`, `reason?: 'watch' | 'expired' | 'required'`. 화면 3개(`login`·`signup`·`reset`)를 상태로 바꾸고, 입력한 이메일은 화면을 바꿔도 남긴다. `reason` 문구는 `login`·`signup` 화면에만 보인다.

| 파일 | 내용 |
| --- | --- |
| `LoginForm` | 이메일 + 비밀번호 → `signInWithPassword`. 보내기 전 이메일 형식·빈 비밀번호만 검사 |
| `SignupForm` | 이메일 + 비밀번호 2번 + 개인정보 안내 → `checkNewPassword` → `signUp({ email, password, options: { emailRedirectTo: buildLoginRedirect(origin, 현재 경로, watch) } })` → `MailSentPanel` (재발송 `auth.resend({ type: 'signup' })`). `user_already_exists`도 보냄 화면. 세션이 바로 오면(메일 확인이 꺼진 설정) 로그인 성공 처리 |
| `PasswordMailForm` | 이메일 → `resetPasswordForEmail(email, { redirectTo: buildLoginRedirect(origin, '/reset-password') })` → `MailSentPanel` |
| `MailSentPanel` | 안내 두 줄 + [메일 다시 보내기] (60초 뒤 활성, 남은 초 표시) |
| `AuthFields` | 입력칸·제출 버튼·오류 줄 (`/reset-password`와 공용) |
| `lib/auth-client.ts` | 위 요청 함수. 던지지 않고 결과 값을 돌려주며 로그에는 오류 코드만 |

- **로그인 성공:** `watch`가 있으면 `POST /api/watchlist` → 409면 `?watch=limit` → `window.location.replace(현재 경로)` (상단 메뉴·추적 버튼이 상태를 다시 읽음).

**`/reset-password` (서버, `dynamic`, noindex)** — `getUser()` 없으면 `redirect('/?login=required')`. 있으면 `ResetPasswordForm`: 새 비밀번호 2번 → `checkNewPassword` → `updateUser({ password })` → 완료 문구 + 홈·마이페이지 링크.

**인증 메일 링크 — 다른 기기에서 열어도 되게 (PRD F-12)**

- 브라우저 PKCE(`?code=` 교환)는 링크를 **요청한 브라우저**에서만 열린다. 그래서 메일 링크는 `token_hash` 방식으로 만든다 (Supabase 대시보드 템플릿, `RedirectTo`에는 항상 `?next=`가 있음, 6-12).
  - Confirm signup: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
  - Reset Password: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`
  - Magic Link 템플릿은 더 쓰지 않는다.
- 메일 제목·본문은 PRD F-11 문구로 템플릿에 넣는다 (사용자가 대시보드에서).
- Supabase 설정 (사용자): Confirm email 켜기, 최소 비밀번호 길이 8, Site URL = 배포 주소, Redirect URLs = `{배포 주소}/auth/callback**`·`http://localhost:3000/auth/callback**`, 커스텀 SMTP = Gmail.

**`GET /auth/callback?next=&watch=&token_hash=&type=` (Route Handler)**

1. `next = safeNextPath(next)`, `type = parseMailLinkType(type)`.
2. `session.auth.verifyOtp({ token_hash, type })` → 실패·값 없음이면 `redirect({next}?login=expired)` (`next`가 `/reset-password`면 `/?login=expired`). `AuthMenu`가 쿼리를 창 상태로 옮겨 `LoginDialog reason='expired'`를 열고 쿼리를 지운다 (같은 값은 한 번만 반영).
3. `type`이 `recovery`면 `next`와 상관없이 `/reset-password`로.
4. `watch`가 있으면 9-12 "로그인 뒤 자동 등록".
5. `redirect(next)`.

**탈퇴 — `POST /api/account/delete`**

- 세션 사용자 확인(401) → 서버용 키 `auth.admin.deleteUser(user.id)` → `user_settings`·`watchlist`·`notifications` cascade 삭제 → 세션 쿠키 지움 → 204.
- `/mypage` 계정 칸: [탈퇴하기] → 확인 `<dialog>` "탈퇴하면 추적 종목과 알림 기록이 모두 지워집니다. 탈퇴할까요?" (PRD) + [탈퇴]·[취소] → 성공 시 `/`로.

### 9-12. F-12 추적·마이페이지

**규칙·문구:** PRD 4장 F-12.

**`WatchButton` (클라이언트)** — `StockHeader` 오른쪽. `status`가 `ok`·`no_financials`일 때 (외국회사 제외).

| 동작 | 처리 |
| --- | --- |
| 마운트 | `GET /api/watchlist?code=` → 401이면 "추적하기"(로그인 전), 200 `{ watching }` → "추적하기" / "추적 중" (`aria-pressed`) |
| 로그인 전 누름 | `LoginDialog reason='watch' watch={code}` |
| 추적하기 | `POST /api/watchlist { code }` → 201 "추적 중" / 409 `limit` → "추적 종목은 20개까지 등록할 수 있어." / 그 밖 12장 10번 |
| 추적 중 누름 | `DELETE /api/watchlist { code }` → 204 "추적하기" |
| `?watch=limit` 쿼리 | (로그인 뒤 자동 등록이 상한에 걸림) 상한 문구를 보이고 쿼리 제거 |

**`/api/watchlist`** (세션 클라이언트, 4-2 공통 규칙)

| 메서드 | 처리 |
| --- | --- |
| `GET ?code=` | `isWatchCodeFormat` 아니면 400. `v_search_targets`(서버용 키)로 `srtn_cd` 찾기 → `watchlist` `eq('srtn_cd')` → `{ watching }` |
| `POST { code }` | 형식 400, 검색 대상 아님·외국회사 404. `insert { user_id, srtn_cd, crno }` (`crno`는 `stocks`). 이미 있음(PK 충돌 `23505`) → 201로 같게. 트리거 상한(`P0001`) → 409 `{ "error": "limit" }` |
| `DELETE { code }` | `delete` `eq('srtn_cd')` → 204 (없어도 204) |

**로그인 뒤 자동 등록 (`/auth/callback` 4번, 가입 확인 링크. 로그인 창에서 바로 로그인한 경우는 9-11의 `POST /api/watchlist`)** — `isWatchCodeFormat(watch)` → 검색 대상·외국회사 아님 확인 → 위 POST와 같은 insert. 상한이면 `next`에 `?watch=limit`를 붙인다. 그 밖 실패는 조용히 넘어가고 `next`로 (로그인 자체는 성공).

**`/mypage` (서버, `dynamic`)**

- `getUser()` 없으면 `redirect('/?login=required')` (12장 동작 기본안 7번) (`AuthMenu`가 `LoginDialog reason='required'`).
- `lib/data/mypage.ts` `getMypage(userId)`: ① `watchlist`(세션) `order created_at desc` ② 서버용 키로 `stocks` `in(srtn_cd)` (`is_listed` 포함) ③ `company_summary`·`v_company_years`(`is_display_year`) `in(corp_code)` ④ `notifications`(세션) `order created_at desc` `limit 50` (12장 동작 기본안 5번) ⑤ `user_settings`(세션). ②~⑤ 병렬 (③은 ② 뒤).

```
마이페이지
추적 종목 (3/20)
┌ 삼성전자 (005930) · KOSPI ─────────────┐
│ ▁▃▅ 매출액 ▁▂▅ 영업이익 ▂▃▆ 순이익       │ ← MiniBars
│ 2025년 매출액 전년보다 16.2% 증가       │
│ 눈여겨볼 변화: 매출은 늘었는데 … 외 1건 │
└────────────────────────────────────────┘
알림 (읽지 않음 2)
 · [새 알림] 농심의 2026년 실적이 반영됐어. …
알림 설정   [✓] 알림 메일 받기
계정        [로그아웃] [탈퇴하기]
```

| 하위 | 명세 |
| --- | --- |
| `WatchCard` (서버) | 카드 전체 링크 → `/stocks/{short_code}`. 종목명(종목코드)·시장. `is_listed=false` → "목록에서 빠짐". `company_summary` 없음 → "재무 데이터 없음". 자본잠식 `full`/`partial` → 12장 11번 표시. `insights[0]` 문장 + 2개 이상이면 "외 {N}건" (`insightText`) |
| `MiniBars` (클라이언트, Recharts) | F-02와 같은 기준·단위의 작은 막대 3개 (금융회사는 영업이익·순이익 2개), 값 라벨 없음, `sr-only` 표. 아래 최신 연도 전년 대비 증감률 한 줄 (`formatGrowth`) |
| 추적 없음 | "아직 추적하는 종목이 없어. 종목 화면에서 '추적하기'를 눌러 봐." |
| `NotificationList` | 9-13 |
| `EmailOptInToggle` (클라이언트) | 체크박스 → `PATCH /api/settings { emailOptIn }` → 실패하면 되돌리고 12장 10번 문구 |
| 계정 | 로그아웃(`AuthMenu`와 같은 처리), 탈퇴(9-11) |

**`PATCH /api/settings`** — `{ emailOptIn: boolean }` 아니면 400. 세션 클라이언트 `update({ email_opt_in })` (열 권한이 `email_opt_in`만 허용) → 204.

### 9-13. F-13 알림

**규칙·문구:** PRD 4장 F-13, 10장 34번.

**웹 (확장)**

| 항목 | 명세 |
| --- | --- |
| `NotificationList` (클라이언트, 초기값은 서버에서) | 최근 50개. 줄: 읽지 않음이면 "새 알림" 글자 + 굵게 (색만으로 구분하지 않음), `body`를 텍스트로(`white-space: pre-line`), 날짜 `YYYY-MM-DD`, 종목 링크. 0개 → 12장 12번 |
| 읽음 | 줄을 누르면 `PATCH /api/notifications/{id}/read` 후 종목 화면으로. 응답을 기다리지 않고 이동 (`keepalive: true`) |
| 개수 | `/api/me` `unreadCount` → `AuthMenu` "마이페이지 {n}" (0이면 숫자 없음) |

- `PATCH /api/notifications/[id]/read`: `id` 정수 아니면 400. 세션 클라이언트 `update({ read_at: now })` `eq('id')` `is('read_at', null)` → 204 (이미 읽음도 204). 0행이고 행이 없으면 404.

**수신 거부 `/unsubscribe?token=` (서버, `dynamic`, `robots: noindex`)**

- `token`이 UUID 형식이 아니면 "링크가 올바르지 않습니다." 형식이 맞으면 확인 문구 "알림 메일을 더 받지 않으시겠어요?" + [수신 거부] (클라이언트 버튼). **GET으로는 아무것도 바꾸지 않는다.**
- 버튼 → `POST /api/unsubscribe { token }` → 서버용 키 `user_settings` `update({ email_opt_in: false })` `eq('unsubscribe_token', token)` `select` → 1행 200 → "알림 메일 수신을 껐습니다." / 0행 404 → "링크가 올바르지 않습니다." / 400 같음.
- 로그인과 무관 (토큰만으로).

**배치 (확장, Python — `.claude/rules/python-batch.md`)**

| 파일 | 내용 |
| --- | --- |
| `batch/notify.py` (순수) | `results_body(name, year, rows, insights, is_financial)` (PRD F-13 표·예시 모양, 금융회사는 영업이익·순이익), `delisted_body(name)`, `audit_body(name, year, prev, curr)`, `audit_changed(prev_rows, curr_rows)` (한 연도 2행 중 하나라도 다르면, 빈 의견 제외, 감사인만 바뀐 것 제외 — 2행 초과 회사는 PRD 11장 3번 확인 뒤), `dedupe_key(kind, srtn_cd, part)`, `mail_subject(kinds, n)` (PRD 4가지), `mail_body(bodies, unsubscribe_url)` (본문 + 출처 + 투자 책임 고지 + 수신 거부 안내) |
| `batch/dart_collect.py` 끝 | `recompute` 뒤: 이번 실행에서 **최신 사업연도가 새로 생긴 회사** 중 추적 중인 회사 → 추적한 사용자마다 `new_results`, 같은 회사의 새 연도 감사의견이 `audit_changed`면 `audit_change`. 감사의견 알림은 새 실적과 별개 줄 |
| `batch/krx_list.py` 끝 | 이번 실행에서 `is_listed`가 `false`로 바뀐 종목(`gone`) 중 추적 중인 것 → `delisted` (`dedupe_key` 끝은 `delisted_bas_dt`). 5% 넘게 줄어 반영하지 않은 날은 만들지 않음 (이미 `gone` 처리 전에 끝남) |
| 넣기 | PostgREST `Prefer: resolution=ignore-duplicates` (`(user_id, dedupe_key)` unique → 같은 변화 두 번 안 넣음) |
| `batch/notify_mail.py` | `notification_recipients()`(5-8) → 사용자마다 `emailed_at is null` 알림을 `created_at` 순으로 모아 한 통 → Gmail SMTP(`smtp.gmail.com` SSL, 앱 비밀번호) → 성공한 사용자만 `emailed_at = now()`. 한 명 실패는 기록하고 다음 사람으로 (다음 날 다시 보냄). 하루 보낼 메일 수 상수 `MAIL_DAILY_MAX` (Gmail 한도 확인 뒤, PRD 11장 11번) |
| `daily.yml` | KRX 목록 → 시세 → `python3 -m batch.notify_mail` (마지막 단계). Secrets `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL` (등록은 사용자) |

- 메일 본문은 텍스트 메일(`text/plain; charset=utf-8`). 수신 거부 링크 `{SITE_URL}/unsubscribe?token={unsubscribe_token}`. `List-Unsubscribe` 헤더는 넣지 않는다 (PRD).
- 메일 주소·본문을 로그에 남기지 않는다 (보낸 수·실패 수만).
- 이메일 수신을 꺼 둔 사용자의 알림은 `emailed_at`을 채우지 않고 둔다 → 나중에 켜면 그동안 쌓인 알림이 한 번에 갈 수 있다. 그래서 `notify_mail.py`는 **최근 7일 안에 만든 알림만** 보내고, 그보다 오래된 미발송 알림은 `emailed_at`을 채워 건너뛴다 (12장 동작 기본안 6번).

---

## 10. 테스트

**범위:** 순수 함수 단위 테스트(Vitest) + PRD 수용 기준은 **수동 확인**. E2E는 하지 않는다.

| 파일 | 확인할 것 |
| --- | --- |
| `format.test.ts` | 조/억 경계(9,999억·1조), 음수, 반올림, null, `formatAccMt('12')` null, `cleanSectionName` |
| `trend.test.ts` | 5가지 화살표 + "비슷한 수준" 우선 + 경계값(정확히 3%) + null 섞임 + 값 1개 |
| `gauge.test.ts` | 범위 안·밖(clamp), 기준선 위치 |
| `filters.test.ts` | `toggleFilter`: 추가·해제·4번째·부딪힘 10쌍 양방향·13↔14 교체. `evidenceColumns` 중복 제거·순서. `fillYears` |
| `insights.test.ts` | 8개 문장 템플릿, 3개 자르기, 모르는 id 무시 |
| `params.test.ts` | 잘못된 `f`(0, 21, 문자, 4개, 부딪힘, 13+14)·`size`·`page`·`sort` 바로잡기, `toQuery` 왕복 |
| `news-text.test.ts` (2차) | `cleanNewsTitle`: `<b>` 제거, `&quot;`·`&amp;`·`&#39;` 디코딩, 태그가 아닌 `<` 글자 유지. `newsDomain`: `www.` 떼기, `originallink` 빈 값 → `link`. `formatPubDate` 한국 시간 변환. `buildStockNewsQuery`: `{종목명} {종목코드}` 조립, 이름 앞뒤 공백 뗌, 영문·숫자 코드 그대로. `parseNewsPage` 범위 |
| `chat.test.ts` (2차) | `normalizeChatInput`: 앞뒤 공백, 연속 공백, 대소문자 → 같은 캐시 키. `parseChatOutput`: JSON 아님·모양 틀림 → null, 21번·0번·모르는 코드·중복 → 그 항목만 버림(순서 유지). `applyChatRules`: 13+14 → 14, 부딪힘 → 빈 필터 + `conflict`, 4개 → 앞 3개 + `truncated`, `notCondition` → 빈 필터. `CHAT_EXAMPLES` 3개가 PRD 필터(13+1, 8, 20)와 같음 |
| `chat-isolation.test.ts` (2차) | `app/api/chat/route.ts`·`lib/data/chat.ts`를 텍스트로 읽어 `data/news`·`news-text` import가 **없는지** (PRD F-18 AI 활용 금지) |
| `industry.test.ts` (2차) | `compareToIndustry`: 업종 없음, n=2(too_few)·n=3(ok), median null, 소수 1자리 반올림 뒤 같음 → `same`, value null → `relation` null |
| `dividend.test.ts` (2차) | `buildDividendTable`: 행 0개 → `no_data`, 3년 모두 none → `all_none`, 2년만 행·모두 none → `table`, paid+not_disclosed, check, 부분 무배당, `sourceYear` 최댓값 |
| `tour.test.ts` (2차) | `buildTourSteps`: 5개 모두 → 1/5~5/5, 금융회사(`sales`·`debt` 없음) → 3단계 + `profit` 금융회사 문구, 중간 하나 빠짐 → 번호 다시 매김 |
| `params.test.ts` 추가 (2차) | `parseListParams`: 허용 밖 `sort` → `name`, `size`·`page` 바로잡기, `toListQuery` 왕복. `isDivisionCode` |
| `gauge.test.ts` 추가 (2차) | `per` 범위 밖(80배 → `high`), `pbr` 기준선 1 |
| `auth.test.ts` (확장) | `safeNextPath`: `/stocks/005930` 통과, `//evil.com`·`/\evil.com`·`https://…`·빈 값·`/`로 시작 안 함 → `/`. `isWatchCodeFormat`: `005930`·`0220W0` 통과, 5·7자리·소문자·기호 거부. `buildLoginRedirect` 항상 `?next=` 포함. `checkNewPassword`(7·8자, 72·73바이트, 불일치)·`loginFailureKind`·`passwordUpdateFailureKind`·`parseMailLinkType` (검색 대상 여부는 DB 조회라 수동 확인) |
| `batch/tests/test_notify.py` (확장, `python3 -m unittest`) | `results_body` 일반·금융회사, `audit_changed`(한 행만 다름·빈 의견·감사인만 바뀜), `mail_subject` 4가지, `dedupe_key` 모양 |
| `disclosure.test.ts` (2차) | 지분공시 빼기, 순서 유지, 5개 자르기, 5개 미만, `dartViewerUrl`, `formatRceptDt` |
| `rules-sync.test.ts` | `../batch/rules.py`를 텍스트로 읽어 `CONFLICTS`·`FINANCIAL_BLOCKED`·`GAUGES`·`FLAT_SHARE`(3/100)를 정규식으로 뽑아 TS 상수와 같은지 비교 (배치와 웹앱 기준이 어긋나는 것을 막음) |

- (2차) `industry_tree()` 회사 수 합 = `v_search_targets` 중 외국회사 아님·`division_name` 있음 수. `industry_companies('26', …)`·`industry_metrics('26', …)`의 `total_count`가 같음. `chat_usage_take(2)`를 세 번 부르면 `true, true, false` (확인 뒤 오늘 행 지움).
- (확장) 테스트 계정으로 가입 → `user_settings` 행 생김, 탈퇴 → 세 테이블 행 사라짐. 다른 계정 세션으로 남의 `watchlist`·`notifications`가 안 보임 (RLS).
- DB 함수는 마이그레이션 적용 뒤 SQL로 직접 확인한다: `search_stocks('삼성 전자')`, `search_stocks('0059')`, `search_stocks('0220w0')`, `screener_search('{1,13}', 'name', 'asc', 1, 10)`의 `total_count`가 `select count(*) … matched_filters @> '{1,13}'`(검색 대상·외국회사 제외)와 같은지.
- `npm run test`, `npm run lint`, `npm run build`(타입 검사 포함)가 통과해야 각 단계를 끝낸 것으로 본다.

---

## 11. 개발 순서와 완료 조건

각 단계가 끝나면 사용자에게 화면을 보여주고 확인을 받은 뒤 다음으로 간다. 단계마다 문서 작성 에이전트에게 진행 반영을 요청한다 (CLAUDE.md 작업 규칙).

| 단계 | 할 일 | 완료 조건 |
| --- | --- | --- |
| 0. 뼈대 | `web/` 생성(Next.js·TS·Tailwind·Vitest), 루트 `.env` 불러오기, `lib/supabase/server.ts`, 타입 생성, `layout.tsx`·`AppHeader`·`SiteFooter`, `copy.ts`·`format.ts`, `.gitignore` 추가 | 빈 첫 화면에 머리·푸터가 나오고, 서버에서 `v_search_targets` 1행 조회 성공. 테스트·빌드 통과. 키가 번들(`.next/static`)에 없음 (`grep`으로 확인) |
| 1. F-01 | 마이그레이션(5-1, **사용자 확인 후 적용**), `/api/search`, `SearchBox`, `/` | PRD F-01 수용 기준 |
| 2. F-02 | `getStockPage`, `/stocks/[code]`, `StockHeader`, `ResultsCharts`, 데이터 없음·외국회사·404 | PRD F-02 수용 기준 |
| 3. F-05 | `trend.ts`·`gauge.ts`·`insights.ts`, `Gauge`·`TrendArrow`·`Tooltip`·`Notice`, `ReportCard` | PRD F-05 수용 기준 |
| 4. F-03 | `filters.ts`(20개·충돌·근거 값 열), `rules-sync.test.ts` | PRD F-03 수용 기준 |
| 5. F-07 | 마이그레이션(5-2, **사용자 확인 후 적용**), `params.ts`, `/api/screener`, `/screener`, `FilterPanel`·`ResultTable`·`PageSizeSelect`·`Pagination` | PRD F-07 수용 기준 |
| 6. MVP 마무리 | 종목 화면·스크리너 표본 점검, PRD 9장 데이터 정확도 표본 대조(MVP 범위 항목), Vercel 배포(환경변수는 사용자가 등록) | 배포 주소에서 MVP 화면 동작, 일치율 기록 |
| **2차** | | |
| 7. F-08 | `v_industry_medians` 속도 측정(4-1), 마이그레이션 5-3~5-5(**사용자 확인 후 적용**, F-15와 같은 파일), `industry.ts`, `Gauge` 가운데 값, `ReportCard` 변경, `params.ts` 목록 함수, `/industries/[division]/compare`, `SortHeaderLink`·링크 모드 | PRD F-08 수용 기준 |
| 8. F-09 | `getStockPage` 4·5번, `gauge.ts` per·pbr, `ValuationSection` | PRD F-09 수용 기준 |
| 9. F-14 | `getStockPage` 6번, `dividend.ts`, `DividendCard` | PRD F-14 수용 기준 |
| 10. F-17 | PRD 11장 19·20번 확인, `disclosures.ts`·`disclosure.ts`, `DisclosureList`, `StockFeedSection`(공시 칸), Vercel에 `DART_OPENAPI_KEY` (사용자) | PRD F-17 수용 기준 |
| 11. F-18 | PRD 11장 15~18·21번 확인 (HUB 신청은 사용자), `news.ts`·`news-text.ts`, `NewsList`·`NewsBlock`·`NaverAttribution`·`HomeNews`·`StockNews`, `/news`, `.env.example`에 네이버 두 개 | PRD F-18 수용 기준 |
| 12. F-15 | `industry_tree` 등(7단계에 적용됨), `/industries`, `/industries/[division]`, `AppHeader` 3번째 메뉴, 첫 화면 바로가기, `StockHeader` 업종 링크 | PRD F-15 수용 기준 |
| 13. F-16 | `driver.js`, `tour.ts`, `ReadingTour`, `data-tour` 속성 | PRD F-16 수용 기준 (`localStorage`를 막은 브라우저에서도 동작) |
| 14. F-10 | 마이그레이션 5-6(**사용자 확인 후 적용**), `chat.ts`, `/api/chat`, `ChatFilterInput`, OpenRouter 모델 고르기(PRD 10장 19번), `chat-isolation.test.ts` | PRD F-10 수용 기준 |
| 15. 2차 마무리 | PRD 9장 표본 대조(배당 포함), 배포 | 배포 주소에서 2차 화면 동작 |
| **확장** | | |
| 16. F-11 | PRD 11장 11번(Gmail 한도) 확인, 마이그레이션 5-7(**사용자 확인 후 적용**), `@supabase/ssr`, `session.ts`·`browser.ts`·`proxy.ts`, `/api/me`, `AuthMenu`, `LoginDialog`, `/reset-password`, `/auth/callback`, 탈퇴. Supabase SMTP·Redirect URL·메일 템플릿 설정 (사용자와 함께) | PRD F-11 수용 기준(다른 기기에서 메일 링크 열기 포함), 공개 화면 응답이 여전히 캐시됨 |
| 17. F-12 | `/api/watchlist`·`/api/settings`, `WatchButton`, 로그인 뒤 자동 등록, `/mypage`, `WatchCard`·`MiniBars` | PRD F-12 (20개 상한 문구, 목록에서 빠짐 표시) |
| 18. F-13 | 마이그레이션 5-8(**사용자 확인 후 적용**), 알림 읽음·`NotificationList`, `/unsubscribe`·`/api/unsubscribe`, 배치 `notify.py`·`notify_mail.py`·`dart_collect`·`krx_list` 연결, `daily.yml` 단계, GitHub Secrets (사용자) | PRD F-13 (같은 변화 두 번 안 알림, 메일 한 통, GET으로는 수신 거부 안 됨) |
| **디자인 V2** | | |
| 19. 페이지 세부 수정 (2026-11-28) | `DESIGN-V2.md` 5장 순서: 스크리너 문구·버튼 너비 → `Tooltip` 위치 → 종목 화면 배치·투어 → `gaugeDots`·`Gauge`·`MetricRow`·`ValuationSection` → 업종 카드(마이그레이션 5-9 **사용자 확인 후 적용**) → 기사 검색 조건 비교·반영 | `DESIGN-V2.md` 5장 완료 조건 + PRD F-05·F-09·F-15·F-16·F-18 수용 기준 |

---

## 12. FS 기본안 중 사용자 확인 필요

PRD 10장 목록에 더해, 이 문서에서 새로 생긴 문구다. 기본안으로 만들고 화면을 볼 때 확정한다.

| # | 쓰이는 곳 | 기본안 |
| --- | --- | --- |
| 1 | 외국회사 종목 화면에 주소로 직접 들어왔을 때 | 이 종목은 외국회사라서 재무정보를 지원하지 않아. |
| 2 | 없는 종목 주소 (404) | 이 종목을 찾을 수 없어. 검색에서 다시 찾아 줘. |
| 3 | 검색창 안내 글 | 종목명이나 종목코드 |
| 4 | 스크리너 화면 제목 | 조건으로 찾기 (메뉴 이름과 같음) |
| 5 | (2차) 없는 업종 주소 (404) | 이 업종을 찾을 수 없어. 업종으로 둘러보기에서 다시 찾아 줘. |
| 6 | (2차) 챗봇 제출 버튼 | 찾기 |
| 7 | (확장) 인증 메일 발송 실패 (존댓말) | 메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요. |
| 8 | (확장) 이메일 형식 오류 (존댓말) | 이메일 주소를 확인해 주세요. |
| 9 | (확장) 로그인 없이 마이페이지 주소로 들어옴 (존댓말) | 로그인이 필요합니다. |
| 10 | (확장) 추적·메일 설정 변경 실패 | 지금은 바꿀 수 없어. 잠시 뒤 다시 해 줘. |
| 11 | (확장) 추적 카드의 자본잠식 표시 | 완전 자본잠식 / 부분 자본잠식 |
| 12 | (확장) 알림 0개 | 아직 알림이 없어. |
| 13 | (확장) 마이페이지 칸 이름·버튼 | 추적 종목 ({n}/20) · 알림 · 알림 설정 · 알림 메일 받기 · 계정 · 로그아웃 · 탈퇴하기, 읽지 않은 알림 표시 "새 알림" |

**동작 기본안** (2026-11-20 2차·확장 상세 작성 때 FS가 정함, 화면 볼 때 확인)

| # | 항목 | 기본안 |
| --- | --- | --- |
| 1 | F-09 업종 비교 한 줄 | F-08처럼 "가운데 값보다 높아/낮아"를 쓰지 **않는다** — 가운데 값 표시·툴팁만 (PRD F-09 "글자 판정 쓰지 않음"을 이렇게 해석) |
| 2 | F-15 업종 목록 첫 상태 | 대분류 모두 닫힘 |
| 3 | F-10 입력 글자 상한 | 200자 |
| 4 | F-10 결과 적용 | AI가 고른 필터로 **선택을 바꾼다** (이미 누른 필터에 더하지 않음, PRD 규칙 5와 같은 방향) |
| 5 | F-13 마이페이지 알림 개수 | 최근 50개 |
| 6 | F-13 메일 | 최근 7일 안에 만든 알림만 보냄 (메일을 나중에 켰을 때 옛 알림이 한꺼번에 가지 않게) |
| 7 | 로그인 없이 `/mypage` | `/`로 보내고 로그인 창을 엶 (9번 문구) |
