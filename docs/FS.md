# FS — 재무 레이더 기능 명세 (구현 단위)

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-11-17 |
| 갱신일 | 2026-11-20 — F-17 최근 공시·F-18 경제 기사 추가 (9-1 목록 + 정해진 구현 내용 9-1-1, 1·2·3장·10장 반영); 2026-11-20 — 2차·확장 구현 결정 7개 + 기본안 반영 (1·4·7장, 9-1·9-2, 10장): 업종 목록 링크 방식, F-16 투어 범위, F-10 한도 보호, F-11 트리거, F-12 자동 등록, F-13 수신 거부·배치 |
| 짝 문서 | `docs/PRD.md` — **무엇을** 만드나 (기능 규칙·문구·수용 기준). 이 문서는 **어떻게** 만드나 (구조·화면 구성·컴포넌트·API·DB 함수·상태) |
| 읽는 법 | 개발 에이전트는 **PRD + FS 두 문서만** 읽는다. 규칙·문구는 여기에 다시 적지 않고 `PRD 4장 F-05`처럼 절 번호로 가리킨다. 두 문서가 어긋나면 **규칙·문구는 PRD, 구현 방식은 FS**가 기준이다 |
| 범위 | **MVP(F-01·F-02·F-05·F-03·F-07)는 상세.** 2차·확장은 화면·API·DB 함수 **목록만** (9장). 착수할 때 이 문서에 상세를 채운다. 단, F-17·F-18은 정해진 구현 내용(데이터 접근 모듈·캐시·환경변수·컴포넌트·테스트할 순수 함수)을 9-1-1에 간단히 적어 둔다 |

## 목차

1. 구현 원칙
2. 프로젝트 구조
3. 환경·설정
4. 데이터 접근 (서버 컴포넌트 / API Route / DB 함수)
5. DB 함수 (마이그레이션 추가)
6. 공통 모듈 (순수 함수·상수·문구)
7. 공통 컴포넌트
8. 화면 명세 (MVP)
9. 2차·확장 목록
10. 테스트
11. 개발 순서와 완료 조건
12. FS 기본안 중 사용자 확인 필요

---

## 1. 구현 원칙

| 원칙 | 내용 |
| --- | --- |
| 데이터 흐름 | 웹앱은 **Supabase만** 읽는다. 공공 API(KRX·시세·DART)는 부르지 않는다 (배치 담당). **예외 (2차):** F-17 DART 공시검색 `list.json`, F-18 네이버 뉴스 검색(HUB)은 서버에서 직접 부르고 Next.js 캐시에만 둔다. DB에 저장하지 않는다 (PRD 5-8) |
| 첫 화면 | 페이지의 첫 데이터는 **서버 컴포넌트에서 직접 조회**한다 |
| 브라우저에서 바뀌는 것 | 검색 자동완성, 스크리너 결과 변경, 챗봇만 **API Route**. (2차) 업종 목록·지표 비교 목록의 정렬·페이지는 URL 쿼리 링크 + 서버 다시 그리기 (`/news`와 같음, API Route 없음) |
| 복잡한 조회 | 순위·정렬·페이지가 얽힌 조회는 **DB 함수(RPC)** 로 DB에서 처리 (5장) |
| 판정 위치 | 필터·문장·금융회사·자본잠식 판정은 **배치가 저장한 값**을 읽는다. 웹앱은 다시 판정하지 않는다. 웹앱이 계산하는 것은 화면 표시용(화살표·눈금 위치·숫자 포맷)뿐 |
| 문구 | 사용자에게 보이는 문구는 **`lib/copy.ts` 한 파일**에 모은다. 컴포넌트에 문구를 직접 쓰지 않는다 |
| 스타일 | **Tailwind만, 무채색**(`neutral` 계열 + 흰색·검정)으로 단순하게. 색·디자인은 마지막에 한 번에 입힌다. 지금은 레이아웃·간격·글자 크기 정도만 |
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
│  │  ├─ stocks/[code]/page.tsx     # 종목 화면 (F-02·F-05, 2차에 F-08·F-09·F-14·F-16)
│  │  ├─ screener/page.tsx          # 스크리너 (F-07, 2차에 F-10)
│  │  ├─ news/page.tsx              # (2차) 경제 기사 목록 (F-18, 상단 메뉴에 없음)
│  │  └─ api/
│  │     ├─ search/route.ts         # GET 연관검색어 (F-01)
│  │     └─ screener/route.ts       # GET 스크리너 결과 (F-07)
│  ├─ components/                   # 7장
│  ├─ lib/
│  │  ├─ supabase/server.ts         # 서버용 클라이언트 (server-only)
│  │  ├─ supabase/types.ts          # DB 타입 (생성 파일)
│  │  ├─ data/                      # 서버 조회 함수 (stock.ts, screener.ts, search.ts, 2차 disclosures.ts·news.ts)
│  │  ├─ news-text.ts               # (2차) 기사 제목 정리·도메인·짧은 종목명 판정 (F-18)
│  │  ├─ disclosure.ts              # (2차) 공시 거르기·원문 링크 (F-17)
│  │  ├─ copy.ts                    # 화면 문구 전부
│  │  ├─ filters.ts                 # 필터 20개 상수·충돌 규칙 (F-03)
│  │  ├─ insights.ts                # insights → 문장
│  │  ├─ trend.ts                   # 방향 화살표 판정
│  │  ├─ gauge.ts                   # 눈금 범위·위치 계산
│  │  ├─ format.ts                  # 금액·%·배·날짜 포맷
│  │  └─ params.ts                  # URL 쿼리 파싱·검증 (스크리너)
│  ├─ tests/                        # Vitest (10장)
│  ├─ next.config.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ supabase/migrations/             # DB 함수 마이그레이션 추가 (5장)
├─ batch/ … (기존)
```

- 버전: Next.js(App Router)·React·Tailwind·Recharts·Vitest는 **구현 시점 최신 안정판**을 쓰고 `package.json`에 정확한 버전으로 고정한다. Node는 LTS.
- `.gitignore`에 `web/node_modules/`, `web/.next/`, `web/.vercel/`, `web/.env*`를 추가한다.

---

## 3. 환경·설정

### 3-1. 환경변수

| 변수 | 위치 | 쓰는 곳 |
| --- | --- | --- |
| `SUPABASE_URL` | 루트 `.env` / Vercel | `lib/supabase/server.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | 루트 `.env` / Vercel | `lib/supabase/server.ts` (서버만) |

- MVP는 이 두 개만 쓴다. (2차 `OPENROUTER_API_KEY`·`DART_OPENAPI_KEY`(F-17)·`NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`(F-18), 확장 publishable 키는 9장)
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
- (2차) 외부 API 호출 캐시: F-17 공시 **1시간**, F-18 일반 기사 **30분**·종목 기사 **1시간** (9-1-1). 캐시 외에 저장하지 않는다.

---

## 4. 데이터 접근

| 화면·동작 | 방식 | 쓰는 것 |
| --- | --- | --- |
| 검색 연관검색어 | API Route `GET /api/search` → RPC `search_stocks` | 5-1 |
| 종목 화면 첫 로드 | 서버 컴포넌트 → supabase-js 조회 3개 | 4-1 |
| 스크리너 첫 로드 | 서버 컴포넌트 → RPC `screener_search` | 5-2 |
| 스크리너 필터·정렬·페이지·개수 변경 | API Route `GET /api/screener` → RPC `screener_search` | 5-2 |
| (2차) 업종 목록·업종 회사 목록·지표 비교 목록 (정렬·페이지 포함) | 서버 컴포넌트 → RPC `industry_tree`·`industry_companies`·`industry_metrics`. 정렬·페이지는 URL 쿼리(`?sort=&dir=&page=&size=`) 링크로 서버가 다시 그림. API Route 없음 | 9-1 |
| (2차) 챗봇 | API Route `POST /api/chat` → OpenRouter (`fetch` 직접) | 9-1 |
| (확장) 사용자 테이블 (`watchlist`·`user_settings`·`notifications`) | 로그인 세션 클라이언트 (`@supabase/ssr`, publishable 키 + RLS). 공개 데이터는 계속 서버용 키 클라이언트 | 9-2 |
| (2차) 종목 화면 공시·기사 칸, 첫 화면 기사, `/news` | 서버 컴포넌트(`Suspense`) → 외부 API (DART `list.json`, 네이버 HUB) + Next.js 캐시. API Route 없음 | 9-1-1 |

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

### 4-2. API Route 공통

- 입력은 `lib/params.ts`에서 검증한다. 잘못된 값은 **400** `{ "error": "bad_request" }`.
- DB 오류는 **500** `{ "error": "server_error" }`. 서버 로그에는 PostgREST 오류 코드·메시지만 남기고 키·URL 쿼리 원문은 남기지 않는다.
- 응답 JSON 키는 camelCase로 바꿔 내려준다.

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

---

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
  // 2차: per { min: 0, max: 50, line: null }, pbr { min: 0, max: 5, line: 1 }
};
function gaugePosition(value: number, key): { pct: number; clamped: 'low' | 'high' | null }
```

- `pct = (value − min) / (max − min) × 100`, 0~100으로 자르고 잘렸으면 `clamped`.
- 범위 숫자는 `batch/rules.py`의 `GAUGES`와 같아야 한다 (10장 상수 대조 테스트).

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

### 6-7. `lib/copy.ts` — 문구

- 화면 문구를 키로 모은다. 값은 **PRD에 적힌 문구 그대로** 복사한다 (각 키 옆 주석에 PRD 절 번호).
- 예: `copy.search.noResult` (PRD F-01), `copy.chart.financialNotice` (PRD 3-6), `copy.reportCard.fullImpairment` (PRD F-05), `copy.screener.zero`, `copy.screener.max`, `copy.screener.conflict(label)`, `copy.screener.financialExcluded`, `copy.footer.source` (PRD 3-2) …
- 함수형 문구(자리표시자)는 함수로: `copy.screener.count(n) => \`조건에 맞는 회사 ${n}개\``.

---

## 7. 공통 컴포넌트

무채색 (`neutral` 계열). 접근성: 색만으로 구분하지 않고, 키보드로 조작되며, 툴팁은 마우스와 포커스 둘 다로 열린다 (PRD 8장).

| 컴포넌트 | 종류 | 역할 |
| --- | --- | --- |
| `AppHeader` | 서버 | 서비스 이름(→ `/`), 상단 메뉴 "종목 검색"(`/`)·"조건으로 찾기"(`/screener`). 현재 메뉴 `aria-current`. (2차 "업종으로 둘러보기", 확장 로그인 자리). `/news`(F-18)는 메뉴에 넣지 않는다 |
| `SiteFooter` | 서버 | 투자 책임 고지 한 줄 + 출처 두 줄 (PRD 3-2, 10장 1번) |
| `Tooltip` | 클라이언트 | 트리거(`button`, `aria-describedby`) + 말풍선. 마우스 올림·포커스·탭으로 열림, Esc·바깥 클릭으로 닫힘. 작은 화면에서도 화면 밖으로 안 나가게 |
| `Gauge` | 서버 | 가로 막대 + 점(이 회사) + 기준선(있으면, 툴팁) + (2차) 업종 가운데 값 표시. `gaugePosition` 사용. 범위 밖이면 점을 끝에 두고 값을 글자로. `role="img"` + `aria-label`("부채비율 87.3%, 범위 0~300%") |
| `TrendArrow` | 서버 | 화살표 + 말 ("↘ 3년째 감소"). 한 가지 색. "비슷한 수준"이면 툴팁 |
| `DataTable` | 서버/클라이언트 | 열 정의 + 행. 열 제목 정렬 버튼(`aria-sort`). 넓으면 표 안에서만 가로 스크롤 |
| `PageSizeSelect` | 클라이언트 | 10/20/50 |
| `Pagination` | 클라이언트 | 페이지 번호 (이전·다음 + 앞뒤 몇 개). (2차) 링크 모드: `href`로 URL 쿼리만 바꿔 서버가 다시 그림 (`/news`, 업종 목록). `DataTable` 정렬 버튼·`PageSizeSelect`도 같은 링크 모드를 지원 |
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
| `no_financials` | StockHeader + `EmptyState` "이 회사의 재무정보가 없어" (PRD 3-7) |
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
| `MetricRow` ×3 | `years` 중 `displayYears`의 `debt_ratio`·`operating_margin`·`revenue_growth` | 제목(질문형) + 지표 이름 + Y3 값 + `TrendArrow`(`getTrend`) + `Gauge`(Y3) + 값 3개 줄 `(a → b → c)` (null 칸은 "계산할 수 없어") |

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
| 음수 | 0 기준선 + 막대 채움을 옅은 회색(양수는 짙은 회색)으로 구분. 빨강 금지 |
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

- 묶음 6개 순서대로, 묶음마다 제목 + 버튼. 버튼은 `aria-pressed`. 버튼 옆 `Tooltip`: `{tooltip} 계산: {fillYears(calc, 기준 연도)}` (기준 연도는 PRD 10장 9번 — 서버에서 `company_summary.latest_year` 최빈값을 구해 넘김).
- 선택한 필터를 묶음 위에 칩으로 한 번 더 보여주고 ✕로 뺄 수 있게 한다.

**`ResultTable`** (`DataTable` 사용)

| 열 | 내용 | 정렬 키 |
| --- | --- | --- |
| 종목명 | 링크 + `formatAccMt` 표시 | `name` |
| 종목코드 | `short_code` | — |
| 시장 | `KOSPI`/`KOSDAQ` | — |
| 시가총액 | `formatMarketCap` | `market_cap` |
| 근거 값 열 | `evidenceColumns(filters)` 순서대로. 3개년 열은 연도 3칸 (열 제목에 `{연도}년`, 회사 연도가 다르면 칸에 그 회사의 실제 연도를 작게) | `FilterDef.sortKey` |

- 금액 칸은 `formatAmount`, 비율은 `formatPercent`, 배당은 `formatWon` 또는 "없음". null은 `-`.
- 결과 수 줄: `copy.screener.count(total)`. 0이면 표 대신 "조건에 모두 맞는 회사가 없어. 필터를 하나 빼 봐."
- `hasFinancialBlocked(filters)`면 결과 수 옆 금융회사 안내 + 툴팁.
- 기준 표시: `시가총액은 보통주 기준, 주가 {bas_dt} 기준` (행의 `bas_dt` 중 하나).

**`GET /api/screener?f=&sort=&dir=&page=&size=`**

- 검증: `parseScreenerParams`와 같은 규칙이지만 **바로잡지 않고 400** (클라이언트가 이미 바른 값을 보냄). `f`는 1개 이상 필수.
- 응답 `200`: `{ "total": 342, "basDt": "2026-11-16", "rows": [{ "shortCode", "name", "market", "accMt", "isFinancial", "marketCap", "years": [...], "dividends": [...] }] }`
- 처리: `screener_search`. 결과 0행이면 `total: 0, rows: []`.

---

## 9. 2차·확장 목록

착수할 때 이 장에 8장과 같은 깊이로 상세를 채운다. 규칙·문구는 PRD 4장 각 기능.

### 9-1. 2차

| 기능 | 화면·컴포넌트 | API Route | DB 함수·조회 |
| --- | --- | --- | --- |
| F-08 업종 비교 | `Gauge`에 업종 가운데 값 표시 추가, "같은 업종 회사 보기" 버튼, `/industries/[division]/compare` (지표 3개 열 목록) | — (URL 쿼리 `?sort=&dir=&page=&size=` + 서버 다시 그리기. `DataTable`·`PageSizeSelect`·`Pagination` 링크 모드) | `v_industry_medians` 조회 (먼저 속도 측정, 느리면 materialized view + 배치 갱신, PRD 5-4), 서버 컴포넌트에서 RPC `industry_metrics(division, sort, dir, page, size)`. 정렬 값이 null인 회사는 오름·내림 모두 맨 뒤 |
| F-09 주가 수준 | `ValuationSection` (PER·PBR `Gauge` + 기준일 두 개) | — | `v_valuation`, `v_industry_medians` |
| F-14 배당 | `DividendCard` (표 + 고정 설명) | — | `dividends` (화면 연도) |
| F-17 최근 공시 | `StockFeedSection`(두 칸 틀) 오른쪽 `DisclosureList` (서버, `Suspense`) | — | 외부 DART `list.json` (`lib/data/disclosures.ts`, 캐시 1시간). DB 없음. 환경변수 `DART_OPENAPI_KEY`. 9-1-1 |
| F-18 경제 기사 | 첫 화면 `HomeNews`, `/news` 화면, `StockFeedSection` 왼쪽 `StockNews`, 공통 `NewsList`·`NaverAttribution`·`ShortNameNotice` (모두 서버, `Suspense`) | — | 외부 네이버 HUB (`lib/data/news.ts`, 캐시 30분/1시간). DB 없음. 환경변수 `NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`. 9-1-1 |
| F-15 업종 둘러보기 | 상단 메뉴 3번째, 첫 화면 바로가기, `/industries` (대분류 펼침 목록, HTML `<details>`로 JS 없이), `/industries/[division]` (회사 목록), 종목 화면 업종 이름 링크 | — (F-08과 같은 링크 방식) | 서버 컴포넌트에서 RPC `industry_tree()` (대분류·중분류·회사 수), RPC `industry_companies(division, sort, dir, page, size)` |
| F-16 읽는 순서 | `ReadingTour` (driver.js, 클라이언트), 알림 띠, "읽는 순서" 버튼. 단계 대상은 `data-tour="sales|profit|debt|valuation|dividend"` 속성으로 찾고 없으면 건너뜀. `localStorage` 키 1개 (try/catch). 기사·공시 칸(F-17·F-18)은 단계에 넣지 않는다 (2026-11-20) | — | 없음 |
| F-10 챗봇 | `ChatFilterInput` (스크리너 맨 위), 예시 3개는 AI 없이 바로 적용 | `POST /api/chat` `{ text }` → `{ filters, unsupported, conflict?, notCondition }` (서버에서 OpenRouter를 SDK 없이 `fetch`로 호출, 출력 검증, 시간 제한 5초). **한도 보호:** `normalizeChatInput`(앞뒤 공백·연속 공백·대소문자 정리) 결과를 키로 AI 결과 1일 캐시 → 같은 문장은 재호출 안 함. 하루 호출 수가 상한(`CHAT_DAILY_LIMIT = 40`, PRD 10장 33번)을 넘으면 AI를 부르지 않고 규칙 6 | 하루 호출 수 테이블 (서버용 키만, RLS 정책 없음, 마이그레이션 **적용 전 사용자 확인**, PRD 5-7). 환경변수 `OPENROUTER_API_KEY`. **`/api/chat`은 `lib/data/news.ts`를 쓰지 않는다** (기사 데이터를 AI에 넣지 않음, PRD F-10·F-18) |

- 표의 순서는 개발 순서와 같다: F-08 → F-09 → F-14 → **F-17 → F-18** → F-15 → F-16 → F-10 (PRD 2-1).

#### 9-1-1. F-17·F-18 정해진 구현 내용

규칙·문구는 PRD 4장 F-17·F-18, 외부 API 명세는 PRD 5-8, 문구 기본안은 PRD 10장 21~32번. 착수 때 8장 깊이로 채운다.

**데이터 접근 (`server-only`, 둘 다 throw하지 않고 결과 상태를 돌려준다)**

| 모듈 | 함수 | 동작 |
| --- | --- | --- |
| `lib/data/disclosures.ts` | `getRecentDisclosures(corpCode)` | `list.json` GET (`corp_code`, `sort=date`, `sort_mth=desc`, `page_count`는 지분공시를 거르고 5개가 남을 만큼 — PRD 11장 19번 확인 뒤 정함). `status` `000` → 거른 5개, `013` → 빈 목록, 그 밖·시간 초과 → `{ status: 'error' }` |
| `lib/data/news.ts` | `searchNews({ query, display, start, sort })` | HUB GET, 헤더 `X-NCP-APIGW-API-KEY-ID`·`X-NCP-APIGW-API-KEY`. 키가 없으면 호출하지 않고 `{ status: 'error' }` (로그에는 변수 이름만). **받은 순서·개수 그대로** 매핑만 한다 |
| 〃 | `getHomeNews()` / `getNewsPage(page)` / `getStockNews(name)` | 일반 기사 5개 / `/news` 한 페이지 (`start = (page−1)×10+1`, PRD 10장 29번) / 종목명 검색 `sort=date` 5개 |

- 캐시: `fetch`의 `next: { revalidate }` 또는 구현 시점 Next.js 캐시 방식으로 — 공시 3600초, 일반 기사 1800초, 종목 기사 3600초. 캐시 외에 DB·파일에 저장하지 않는다 (네이버 약관).
- 시간 제한: 요청마다 5초 (`AbortSignal.timeout`, 기본안). 넘으면 실패 문구.
- 로그: DART 요청 URL에는 `crtfc_key`가 들어가므로 **요청 URL 원문을 로그에 남기지 않는다.** 상태 코드·DART `status`만 남긴다.
- 브라우저에서 DART·네이버를 부르지 않는다. API Route도 만들지 않는다 (`/news` 페이지 넘김은 URL `?page=`로 서버가 다시 그림).

**컴포넌트 (모두 서버)**

| 컴포넌트 | 역할 |
| --- | --- |
| `StockFeedSection` | 종목 화면 배당 카드 아래 두 칸 틀. `grid` PC 2열(왼쪽 기사·오른쪽 공시), 좁은 화면 1열. 칸마다 `<Suspense fallback={<Skeleton/>}>` |
| `DisclosureList` | `getRecentDisclosures` → 줄 `{report_nm} · {flr_nm} · {YYYY-MM-DD}`, `<a target="_blank" rel="noopener noreferrer">` DART 원문, "공시 더 보기" 링크. 실패·0건 문구 |
| `NewsList` | 기사 줄 목록 (세 곳 공통). 제목은 `cleanNewsTitle` 결과를 **텍스트 노드로만** 렌더링 (`dangerouslySetInnerHTML` 금지). 줄 사이에 다른 요소를 넣지 않는다 |
| `NaverAttribution` | 네이버 로고(BI 가이드 파일) + 네이버 링크. 기사 영역마다 하나 |
| `HomeNews` / `StockNews` | 안내 문구 + `NaverAttribution` + `NewsList`. `StockNews`는 `isShortName(name)`이면 `ShortNameNotice`(안내 + 네이버 뉴스 검색 링크)만 |
| `app/news/page.tsx` | `parseNewsPage(searchParams)` → `getNewsPage` → `NewsList` + `Pagination`. `revalidate = 1800` |

- `SiteFooter` 출처 첫 줄의 네이버 추가는 사용자 확인 뒤 (PRD 3-2, 10장 25번). 문구는 `lib/copy.ts`에 (`copy.news.*`, `copy.disclosure.*`).
- 재무 데이터 없음 화면에도 `StockFeedSection`을 둔다 (PRD 10장 26번 기본안). 외국회사 화면에는 두지 않는다.

**순수 함수 (Vitest 대상)**

| 모듈 | 함수 | 규칙 |
| --- | --- | --- |
| `lib/news-text.ts` | `cleanNewsTitle(raw)` | 태그(`<b>`, `</b>` 등) 제거 → HTML 엔티티 디코딩(이름·숫자 엔티티). 그 밖의 글자는 바꾸지 않음 |
| 〃 | `newsDomain(originallink, link)` | `originallink` 호스트에서 앞 `www.`만 뗌. 없거나 잘못된 주소면 `link` 호스트 |
| 〃 | `formatPubDate(pubDate)` | RFC 822 형식 → 한국 시간 `YYYY-MM-DD HH:mm` (형식은 PRD 11장 16번 실제 응답으로 확인) |
| 〃 | `isShortName(name)` | 한글 2글자 이하, 또는 영문·숫자만 3글자 이하 → true (PRD 10장 24번, 기준 상수로) |
| 〃 | `parseNewsPage(searchParams)` | 1~100 정수(`start` ≤ 1000), 잘못된 값은 1 |
| `lib/disclosure.ts` | `excludeOwnershipDisclosures(items)` / `takeRecent(items, 5)` | 지분공시 빼기 (기준은 PRD 11장 19번 확인 뒤 상수로), 순서 유지 앞 5개 |
| 〃 | `dartViewerUrl(rceptNo)` | `https://dart.fss.or.kr/dsaf001/main.do?rcpNo={rceptNo}` |
| `lib/format.ts` | `formatRceptDt('20261120')` | `2026-11-20` |

### 9-2. 확장

| 기능 | 화면·컴포넌트 | API Route | DB·기타 |
| --- | --- | --- | --- |
| F-11 로그인 | `LoginDialog` (모달), 상단 로그인·마이페이지·로그아웃, `/auth/callback` (세션 생성 → `watch` 처리(F-12) → `next`로 이동). `next`는 `/`로 시작하는 사이트 안 상대 경로만 허용, `//`·외부 주소는 `/` (`safeNextPath`) | Supabase Auth (매직링크) | `@supabase/ssr` 쿠키 세션, publishable 키(`NEXT_PUBLIC_`), Supabase SMTP = Gmail, redirect URL 설정. `user_settings` 행은 `auth.users` insert 트리거가 생성(`unsubscribe_token` 무작위) — 마이그레이션 **적용 전 사용자 확인** |
| F-12 추적·마이페이지 | 종목 화면 `WatchButton`, `/mypage` (추적 카드·알림 목록·설정·계정). 로그인 전 "추적하기" → 매직링크 돌아갈 주소에 `?next=/stocks/{code}&watch={code}` → `/auth/callback`이 `watch`가 검색 대상 종목코드인지 검사 후 `watchlist`에 넣고 종목 화면으로 (20개 상한이면 넣지 않고 종목 화면에 상한 문구) | `POST/DELETE /api/watchlist`, `PATCH /api/settings`, `POST /api/account/delete` (서버용 키로 `auth.admin.deleteUser` → cascade) | `watchlist`·`user_settings` (로그인 세션 클라이언트 + RLS, 20개 트리거) |
| F-13 알림 | 마이페이지 알림 목록·읽지 않은 개수, 상단 메뉴 개수 표시, `/unsubscribe?token=` **확인 화면** + [수신 거부] 버튼 → 완료 문구 (GET으로는 끄지 않음, 문구 PRD 10장 34번, `List-Unsubscribe` 헤더 안 씀) | `PATCH /api/notifications/[id]/read`, `POST /api/unsubscribe` `{ token }` (서버용 키) | **배치 추가:** 알림 생성 — `new_results`·`audit_change`는 DART 월 배치(개인 서버), `delisted`는 KRX 일 배치(GitHub Actions). 메일 발송 — `daily.yml` 마지막 단계 `batch/notify_mail.py`가 `emailed_at is null` 알림을 사용자별 한 통으로 (Gmail SMTP, 계정·앱 비밀번호는 GitHub Secrets) |

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
| `news-text.test.ts` (2차) | `cleanNewsTitle`: `<b>` 제거, `&quot;`·`&amp;`·`&#39;` 디코딩, 태그가 아닌 `<` 글자 유지. `newsDomain`: `www.` 떼기, `originallink` 빈 값 → `link`. `formatPubDate` 한국 시간 변환. `isShortName` 경계 (한글 2·3글자, 영문 3·4글자, 영문+한글 섞임). `parseNewsPage` 범위 |
| `chat.test.ts` (2차) | `normalizeChatInput`: 앞뒤 공백, 연속 공백, 대소문자 → 같은 캐시 키 |
| `auth.test.ts` (확장) | `safeNextPath`: `/stocks/005930` 통과, `//evil.com`·`https://…`·빈 값·`/`로 시작 안 함 → `/`. `watch` 코드 형식 검사 (검색 대상 여부는 DB 조회라 수동 확인) |
| `disclosure.test.ts` (2차) | 지분공시 빼기, 순서 유지, 5개 자르기, 5개 미만, `dartViewerUrl`, `formatRceptDt` |
| `rules-sync.test.ts` | `../batch/rules.py`를 텍스트로 읽어 `CONFLICTS`·`FINANCIAL_BLOCKED`·`GAUGES`·`FLAT_SHARE`(3/100)를 정규식으로 뽑아 TS 상수와 같은지 비교 (배치와 웹앱 기준이 어긋나는 것을 막음) |

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

---

## 12. FS 기본안 중 사용자 확인 필요

PRD 10장 목록에 더해, 이 문서에서 새로 생긴 문구다. 기본안으로 만들고 화면을 볼 때 확정한다.

| # | 쓰이는 곳 | 기본안 |
| --- | --- | --- |
| 1 | 외국회사 종목 화면에 주소로 직접 들어왔을 때 | 이 종목은 외국회사라서 재무정보를 지원하지 않아. |
| 2 | 없는 종목 주소 (404) | 이 종목을 찾을 수 없어. 검색에서 다시 찾아 줘. |
| 3 | 검색창 안내 글 | 종목명이나 종목코드 |
| 4 | 스크리너 화면 제목 | 조건으로 찾기 (메뉴 이름과 같음) |
