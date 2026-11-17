# DATABASE — 재무 레이더 테이블 구조 (초안)

> 2026-11-16 초안 (기능 설계 에이전트). **2026-11-17 Supabase에 생성 완료** (마이그레이션 `supabase/migrations/20261117000000_initial_schema.sql`). 테이블 15개·뷰 4개 모두 지금은 비어 있다. 구현하며 정한 세부는 10장.
> 근거: `docs/개발기능.md` F-01~F-16, 공통 사항 DART·주식시세정보·KRX 절. 기능 설계가 바뀌면 이 문서도 같이 고친다.

- 프로젝트: Supabase `for-ant-investor` (서울 `ap-northeast-2`, PostgreSQL 17)
- 쓰는 쪽: **Python 배치가 쓰고**(서버용 키), **Next.js API Route가 읽는다**. 로그인(F-11)은 Supabase Auth.
- 이름 규칙: 테이블·열은 영어 snake_case. **API 원본 필드는 API 이름을 그대로** 쓴다 (`srtn_cd`, `itms_nm`, `induty_code`, `acc_mt` …).

## 0. 설계 원칙

| 원칙 | 근거 |
| --- | --- |
| KRX 값(종목명·종목코드 등)은 **원본 그대로 저장**, 표시할 때만 가공 (`A` 떼기 등) | 공공누리 제4유형 변경금지 (CLAUDE.md 데이터 라이선스) |
| 한국표준산업분류 이름은 **포털 표기 그대로** 저장, 화면에서만 공백 정리 | 공공누리 제3유형 (개발기능.md DART 절) |
| 금액은 **원 단위 정수(`bigint`)**. 쉼표 문자열 → 숫자 변환만 함 | DART 금액이 쉼표 문자열 |
| 재무는 **4개년만** 저장 | F-04 (2026-11-14) |
| 겹치는 연도는 **최신 보고서 값만 저장**, 예전 보고서 값은 버리고 "값이 다른 연도"만 기록 | F-04 (2026-11-15) |
| KRX 목록에서 빠진 회사는 **지우지 않고 표시만** | F-04 (2026-11-16) |
| 필터·문장 판정은 **배치가 미리 계산해 저장**, 숫자 기준이 바뀌면 다시 계산 | 기준값이 초안이라 수집 뒤 바뀜 (F-03·F-05). 화면 쿼리를 단순하게 |
| 주가가 매일 바뀌는 값(PER·PBR·시가총액 정렬)은 **뷰로 계산** | 시세는 매일, 재무는 매월 갱신 |
| 시세는 **최신 1일치만** 보관 (이력 없음) | 쓰는 곳이 최신 기준일뿐. 이력은 1년에 약 70만 행이라 500MB 한도에 부담 |

## 1. 전체 그림

```
[공개 데이터 — 배치가 씀, 누구나 읽기]
 ksic_classes ─┐ (업종 이름표)
               │ division_code
 stocks ──corp_code──> companies ──┬──> financials ──> company_summary (필터·문장 판정)
   │ (KRX 종목)          (기업개황) ├──> dividend_rows ─> dividends
   │                                └──> audit_opinions
   └─short_code──> stock_prices (최신 시세, 우선주 포함)

[배치 운영 — 서버용 키만]
 batch_runs, dart_fetch_status, data_issues

[사용자 — Supabase Auth, 본인 것만]
 user_settings, watchlist, notifications
```

| # | 테이블 | 내용 | 쓰는 기능 | 예상 행 수 |
| --- | --- | --- | --- | --- |
| 1 | `ksic_classes` | 한국표준산업분류 11차 대분류 21 + 중분류 77 | F-08, F-15 | 98 |
| 2 | `stocks` | KRX 상장종목 (코넥스·스팩·외국회사 포함 원본) | F-01 외 전부 | 약 2,800 (빠진 회사 누적) |
| 3 | `companies` | DART 기업개황 (업종·결산월·법인등록번호) | F-02, F-08, F-15 | 약 2,570 |
| 4 | `financials` | 연도별 주요계정 (연결·별도) | F-02, F-03, F-05, F-09 | 약 2,570 × 4년 × 2 ≈ 2만 |
| 5 | `company_summary` | 회사별 계산 결과 (금융회사 여부, 자본잠식, 필터 20개, 문장 8개) | F-03, F-05, F-07, F-12 | 약 2,570 |
| 6 | `dividend_rows` | DART 배당 응답 행 **받은 그대로** (우선주·주식배당 포함) | F-14 (저장용) | 약 2,570 × 15 ≈ 3.9만 |
| 7 | `dividends` | 연도별 보통주 현금배당 (화면·필터용) | F-14, 필터 20 | 약 7,700 |
| 8 | `audit_opinions` | 연도별 감사인·감사의견 | F-13 | 약 7,700 |
| 9 | `stock_prices` | 최신 기준일 시세 (우선주 포함) | F-07, F-09, F-15 | 약 2,900 |
| 10 | `batch_runs` | 배치 실행 기록 (KRX 5% 안전장치 포함) | F-04 | 하루 1~2 |
| 11 | `dart_fetch_status` | 회사×API별 마지막 호출 결과 (`013` 재확인, 새 보고서 확인) | F-04 | 약 2,570 × 4 |
| 12 | `data_issues` | 수집 뒤 검증 목록 (값이 다른 중복·겹치는 연도 등) | F-04 검증 | 수백 |
| 13 | `user_settings` | 사용자별 메일 수신 설정 | F-12, F-13 | 사용자 수 |
| 14 | `watchlist` | 추적 종목 (1인 20개) | F-12 | 사용자 × 20 |
| 15 | `notifications` | 웹 알림 + 메일 발송 표시 | F-13 | 사용자 × 수십 |

전체 예상 크기: 인덱스 포함 수십 MB (무료 500MB 안).

## 2. 공개 데이터 테이블

### 2-1. `ksic_classes` — 업종 이름표 (한국표준산업분류 제11차)

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `code` | text PK | 대분류 `A`~`U`, 중분류 `01`~`99` |
| `level` | text | `section`(대분류) / `division`(중분류) |
| `name` | text | **포털 표기 그대로** (예: `제 조 업`) |
| `section_code` | text null | 중분류의 상위 대분류 코드 (대분류 행은 null) |
| `sort_order` | smallint | 분류 번호순 정렬 |

- 넣는 법: `docs/개발기능.md` "11차 대분류 21개 · 중분류 77개" 표로 한 번 넣는다 (배치 아님). 대분류 이름은 표의 공백 정리본이 아니라 **포털 원래 표기**로 넣는다 → 원래 표기는 `ref/분류내용해설/` 저장본에서 다시 확인.
- **적재 완료 (2026-11-17):** 마이그레이션 `seed_ksic_classes`, 대분류 21행 + 중분류 77행 = 98행. 대분류 이름은 `ref/분류내용해설/분류내용보기.html`의 포털 원래 표기 (`광 업`·`제 조 업`·`건 설 업` 3개만 위 표와 띄어쓰기가 다름). 중분류 이름은 `docs/개발기능.md` 표를 그대로 넣었다 (저장 HTML에는 A의 3개만 있었음). `sort_order`: 대분류 A=1 ~ U=21, 중분류는 번호 그대로 (01→1, 99→99).

### 2-2. `stocks` — KRX 상장종목 (원본 그대로)

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `srtn_cd` | text PK | 원본 `A005930` (영문자 섞인 코드 있음: `A0220W0`) |
| `short_code` | text, 생성 열 | `substr(srtn_cd, 2)` → `005930`. 검색·시세 연결용. unique |
| `isin_cd` | text | |
| `itms_nm` | text | 종목명 원본 |
| `mrkt_ctg` | text | `KOSPI` / `KOSDAQ` / `KONEX` |
| `crno` | text | 법인등록번호 원본 (외국회사 `0000000000000`) |
| `corp_nm` | text | 법인명 원본 |
| `corp_code` | text null | DART 고유번호 8자리 (`corpCode.xml`로 매칭, 못 찾으면 null) → `companies` |
| `is_foreign` | boolean, 생성 열 | `crno = '0000000000000'` |
| `is_spac` | boolean, 생성 열 | `itms_nm like '%스팩%'` |
| `first_bas_dt` | date | 목록에서 처음 본 기준일 |
| `last_bas_dt` | date | 목록에서 마지막으로 본 기준일 |
| `is_listed` | boolean | 최신 목록에 있으면 true. 빠지면 false ("목록에서 빠짐", 데이터는 보관) |
| `delisted_bas_dt` | date null | 빠진 것을 처음 확인한 기준일 (F-13 알림 기준) |
| `updated_at` | timestamptz | |

- **검색 대상** = `is_listed AND mrkt_ctg in ('KOSPI','KOSDAQ') AND NOT is_spac` (외국회사는 목록에 "지원하지 않음"으로 보이므로 포함). → 뷰 `v_search_targets`.
- **수집 대상** = 검색 대상 중 `NOT is_foreign` (약 2,570).
- 검색용 열 `search_name` (생성 열, `itms_nm`을 소문자로 바꾸고 공백을 뺀 값. 원본은 그대로) — 8장 결정 2.
- 인덱스: `short_code`(unique), `search_name` `pg_trgm` GIN.
- 매일 배치: 최신 `basDt` 목록과 비교해 신규 insert / 있으면 갱신 / 없으면 `is_listed=false`. **하루 사이 5% 넘게 줄면 반영하지 않고 `batch_runs`에만 기록.**

### 2-3. `companies` — DART 기업개황

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text PK | 8자리 |
| `corp_name` | text | |
| `stock_code` | text | |
| `jurir_no` | text | 법인등록번호 (KRX `crno`와 같음) |
| `induty_code` | text | 3~5자리 원본 (`264`, `64992`) |
| `division_code` | text, 생성 열 | `left(induty_code, 2)` → `ksic_classes.code` (FK 걸지 않음: 11차에 없는 코드가 올 수 있어 수집 뒤 검증) |
| `acc_mt` | text | 결산월 원본 (`12`, `03`) |
| `corp_cls` | text | `Y`/`K`/`N`/`E` |
| `raw` | jsonb | 응답 원본 19필드 (주소·홈페이지 등, 지금 쓰는 곳 없음) |
| `fetched_at` | timestamptz | |

- 갱신: 매월 5일 신규 상장만 + 매년 4월 전체.

### 2-4. `financials` — 연도별 주요계정

한 행 = 회사 × 사업연도 × 연결/별도.

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text | PK① → `companies` |
| `fiscal_year` | smallint | PK② 그 값의 사업연도 (당기·전기·전전기를 풀어서 저장) |
| `fs_div` | text | PK③ `CFS` / `OFS` |
| `revenue` | bigint null | 매출액 (금융회사는 null) |
| `operating_income` | bigint null | 영업이익 / 영업이익(손실) |
| `net_income` | bigint null | 당기순이익(손실) |
| `total_assets` | bigint null | 자산총계 |
| `total_liabilities` | bigint null | 부채총계 |
| `total_equity` | bigint null | 자본총계 |
| `capital_stock` | bigint null | 자본금 (0이면 자본잠식 판단 안 함) |
| `has_revenue_account` | boolean | 응답에 "매출액" 계정이 있었는지 (금융회사 판별 ①) |
| `other_accounts` | jsonb | 나머지 계정 `{계정명: 금액}` (유동자산·이익잉여금·총포괄손익, 금융회사의 이자수익 등) |
| `source_bsns_year` | smallint | 이 값을 가져온 사업보고서의 사업연도 |
| `source_rcept_no` | text | 접수번호 |
| `fetched_at` | timestamptz | |

- 같은 계정이 두 번 오면: 값이 같으면 하나, 다르면 **먼저 온 행** + `data_issues`(`dup_account`).
- 겹치는 연도: **최신 보고서 값으로 덮어쓰고**, 예전 값이 달랐으면 `data_issues`(`overlap_year`)에만 남김.
- 당기 금액이 빈 행 → 그 열은 null.
- 한 회사에 4개년 × (연결 + 별도)까지. 화면은 아래 `v_company_years`가 고른 한 기준만 씀.

### 2-5. `company_summary` — 회사별 계산 결과 (배치가 계산)

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text PK | |
| `fs_div` | text | 이 회사에 쓰는 기준 (연결 우선, 없으면 별도) |
| `years` | smallint[] | 쓰는 연도, 오래된 → 최근 (예: `{2022,2023,2024,2025}`). Y1~Y3 = 뒤 3개 |
| `latest_year` | smallint | Y3 |
| `is_financial` | boolean | 금융회사 판별: 매출액 계정 없음 OR (업종 앞 두 자리 64~66 AND 업종 코드 ≠ 64992) |
| `financial_reason` | text null | `no_revenue` / `industry` / `both` (수집 뒤 "두 기준이 어긋나는 회사" 검증용) |
| `capital_impairment` | text | `none` / `partial` / `full` / `unknown`(자본금 0) |
| `matched_filters` | smallint[] | 걸리는 필터 ID (1~20). 스크리너는 `matched_filters @> '{1,13}'` 로 찾음 |
| `insights` | jsonb | "눈여겨볼 변화" 문장. 우선순위 순 `[{id:5, year:2025}, {id:6, n:3}, {id:7, prev:120.5, curr:160.2}]` (화면은 앞 3개, F-12 카드는 앞 1개 + "외 N건") |
| `rule_version` | text | 계산에 쓴 기준값 묶음 이름 (예: `2026-11-15-draft`) |
| `computed_at` | timestamptz | |

- 금융회사는 계산할 수 없는 필터(1~3·10~16)가 `matched_filters`에 절대 안 들어가므로, AND 검색에서 자연히 빠진다 (F-03 "금융회사와 필터").
- 필터 20번은 `dividends`를 보고 같이 계산한다.
- 숫자 기준(20%·10%·100%·50%, 7번 1.25배·10%p, 눈금 3%)이 바뀌면 배치가 전체를 다시 계산한다 (재호출 없음).
- 인덱스: `matched_filters` GIN.

### 2-6. `dividend_rows` — 배당 응답 원본

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text | PK① |
| `rcept_no` | text | PK② 접수번호 |
| `row_no` | smallint | PK③ 응답 안 순서 (같은 `se`·`stock_knd`가 두 번 와도 구분) |
| `bsns_year` | smallint | 보고서 사업연도 |
| `se` | text | 구분 원본 (`주당 현금배당금(원)` …) |
| `stock_knd` | text | 주식 종류 **원본 그대로** (`보통주`, `우선주`, `-`) |
| `thstrm` / `frmtrm` / `lwfr` | text | 당기·전기·전전기 값 원본 (`1,668`, `-`) |
| `stlm_dt` | text | 결산기준일 |
| `fetched_at` | timestamptz | |

- 회사마다 **최신 사업보고서 1건만** 보관 (새 보고서가 오면 그 회사 행을 교체).
- 우선주·주식배당·배당성향 값은 여기에만 있다 (저장만, 화면에 안 씀).

### 2-7. `dividends` — 연도별 보통주 현금배당 (화면·필터용)

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text | PK① |
| `fiscal_year` | smallint | PK② |
| `dps_status` | text | `paid` / `none`(값이 `-` 또는 0) / `check`(숫자가 아닌 값) |
| `dps` | bigint null | 보통주 주당 현금배당금 (원) |
| `yield_status` | text | `value` / `not_disclosed`(배당금은 있는데 수익률 `-`) / `none` |
| `dividend_yield` | numeric(6,2) null | 보통주 현금배당수익률 (%) |
| `source_bsns_year` | smallint | 보고서 사업연도 ("{연도}년 사업보고서 기준" 표시) |
| `source_rcept_no` | text | |

- `dividend_rows`에서 만든다. 보통주 행이 둘 이상이면 F-04 중복 규칙 (+ `data_issues`).
- DART `013`이면 행이 없고 `dart_fetch_status`에 `013` → 화면 "이 회사의 배당 정보가 없어."

### 2-8. `audit_opinions` — 감사의견

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text | PK① |
| `fiscal_year` | smallint | PK② 응답의 기수 라벨로 계산한 사업연도 (당기 = 보고서 사업연도, 전기 −1, 전전기 −2) |
| `row_no` | smallint | PK③ 같은 연도 안 순서 (연도마다 2행씩 옴, 연결·별도 감사로 보임) |
| `period_label` | text | 응답 `bsns_year` **원본** (예: `제57기 \n(당기)`) |
| `adtor` | text | 감사인 |
| `adt_opinion` | text | 감사의견 **원본 그대로** (예: `적정의견`) |
| `emphs_matter` | text null | 강조사항 |
| `core_adt_matter` | text null | 핵심감사사항 |
| `adt_reprt_spcmnt_matter` | text null | 감사보고서 특기사항 (2019-12-08까지 쓰던 항목, 지금은 `-`) |
| `source_bsns_year` | smallint | 요청한 사업보고서 사업연도 |
| `source_rcept_no` | text | |
| `fetched_at` | timestamptz | |

- **실제 호출로 확인 (2026-11-16, `scripts/dart_audit_check.py`, 5종목 × 2개년):**
  - 사업보고서 1회에 **3개년(당기·전기·전전기)** 이 오고, **연도마다 2행**(총 6행). 두 행을 가르는 필드가 없다 (핵심감사사항 문장에 "(별도재무제표)"·"(연결재무제표)"가 적힌 회사가 있어 연결·별도 감사로 보임).
  - **응답의 `bsns_year`는 연도가 아니라 기수 라벨**이다 (`제57기 \n(당기)`, 줄바꿈 포함). 사업연도는 요청한 연도에서 당기·전기·전전기로 계산한다. `stlm_dt`는 행마다가 아니라 보고서 결산일이다.
  - `adt_opinion` 값은 표본 48행 모두 (8회 호출 × 6행) **`적정의견`** (자유 문장이 아니라 짧은 값). 다른 값(한정·부적정·의견거절)이 실제로 어떤 표기로 오는지는 아직 못 봤다.
  - 감사인 변경이 보인다 (삼성전자 제54기 안진 → 제55기부터 삼정).
  - 한화머시너리앤서비스홀딩스(`0220W0`)는 2025·2024 모두 `013`.
- 회사마다 **최신 사업보고서 1건의 3개년**만 보관 (새 보고서가 오면 교체).
- 알림 비교: 같은 보고서 안의 **당기 의견 묶음과 전기 의견 묶음**을 비교해 다르면 "감사의견 변경" (감사인만 바뀐 건 알리지 않음). 연도 안 2행 중 하나라도 전년과 다르면 알린다 (8장 6번).

### 2-9. `stock_prices` — 최신 시세

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `srtn_cd` | text PK | **`A` 없는** 원본 (`005930`). 우선주 포함 |
| `bas_dt` | date | 기준일 ("주가 {날짜} 기준") |
| `isin_cd` | text | |
| `itms_nm` | text | |
| `mrkt_ctg` | text | |
| `clpr` | bigint | 종가 |
| `lstg_st_cnt` | bigint | 상장주식수 |
| `mrkt_tot_amt` | bigint | 시가총액 (그 종목만 = 보통주) |
| `raw` | jsonb | 나머지 필드 (시가·고가·저가·거래량 등) |

- 매일 GitHub Actions가 그날 전 종목을 받아 **통째로 교체** (upsert 후 그날 없는 행 삭제).
- `stocks.short_code = stock_prices.srtn_cd` 로 연결 → 보통주 시가총액만 쓰게 됨 (우선주는 `stocks`에 없음).

## 3. 배치 운영 테이블 (서버용 키만, 화면에서 안 읽음)

### 3-1. `batch_runs`

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `id` | bigint identity PK | |
| `job` | text | `krx_list` / `stock_price` / `dart_monthly` / `dart_initial` / `recompute` |
| `bas_dt` | date null | KRX·시세 기준일 |
| `started_at` / `finished_at` | timestamptz | |
| `status` | text | `ok` / `skipped` / `failed` |
| `stats` | jsonb | 건수 (받은 수, 신규, 빠진 수, 호출 수, `013` 수 …) |
| `note` | text null | 예: "목록이 6.2% 줄어 반영하지 않음" |

### 3-2. `dart_fetch_status` — 회사 × API별 마지막 결과

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `corp_code` | text | PK① |
| `api` | text | PK② `company` / `fs` / `dividend` / `audit` |
| `last_bsns_year` | smallint null | 저장한 최신 사업보고서 사업연도 (매월 5일 "더 새 보고서 있나" 확인 기준) |
| `last_rcept_no` | text null | |
| `status` | text | `000` / `013` / `error` |
| `retry_count` | smallint | 같은 배치 안 재시도 횟수 |
| `checked_at` | timestamptz | |
| `message` | text null | 오류 메시지 (키는 넣지 않음) |

- `013`은 같은 배치 안에서 잠시 뒤 재호출 → 그래도 `013`이면 여기에 `013` 저장 → 다음 매월 5일 배치에서 다시 확인.

### 3-3. `data_issues` — 수집 뒤 검증 목록

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `id` | bigint identity PK | |
| `batch_run_id` | bigint → `batch_runs` | |
| `kind` | text | `dup_account`(값이 다른 중복 계정) / `overlap_year`(겹치는 연도 값 다름) / `dup_dividend` / `dividend_non_numeric` / `unknown_ksic`(11차에 없는 업종 코드) / `financial_mismatch`(금융회사 두 기준 불일치) / `capital_zero` |
| `corp_code` | text null | |
| `fiscal_year` | smallint null | |
| `detail` | jsonb | 계정명, 두 값, 보고서 번호 등 |
| `created_at` | timestamptz | |

## 4. 사용자 테이블 (F-11~F-13, 맨 마지막 확장 기능)

`auth.users`는 Supabase Auth가 관리한다 (이메일만 수집). 아래 세 테이블은 `user_id`에 `on delete cascade` → **탈퇴하면 함께 지워짐** (F-11 탈퇴 문구와 맞음).

### 4-1. `user_settings`

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `user_id` | uuid PK → `auth.users` | |
| `email_opt_in` | boolean default false | 알림 메일 수신 (마이페이지에서 켬) |
| `unsubscribe_token` | uuid default gen_random_uuid() | 메일의 수신 거부 링크용 (로그인 없이 끄기) |
| `created_at` | timestamptz | |

### 4-2. `watchlist`

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `user_id` | uuid → `auth.users` | PK① |
| `srtn_cd` | text → `stocks` | PK② 원본 코드 (빠진 종목도 남음) |
| `crno` | text | 등록 당시 법인등록번호 (F-12 초안 그대로) |
| `created_at` | timestamptz | 정렬: 최근 등록순 |

- 1인 20개 상한은 **insert 트리거**로 막음 ("추적 종목은 20개까지 등록할 수 있어.").
- 재무 없는 종목(외국회사, `013`)도 등록 가능.

### 4-3. `notifications`

| 열 | 타입 | 설명 |
| --- | --- | --- |
| `id` | bigint identity PK | |
| `user_id` | uuid → `auth.users` | |
| `srtn_cd` | text | |
| `kind` | text | `new_results` / `delisted` / `audit_change` |
| `fiscal_year` | smallint null | 실적·감사의견 연도 |
| `body` | text | 화면 본문 (반말 템플릿으로 배치가 만듦) |
| `dedupe_key` | text | `{kind}:{srtn_cd}:{연도 또는 delisted_bas_dt}` — (`user_id`, `dedupe_key`) unique → **같은 변화로 두 번 알리지 않음** |
| `created_at` | timestamptz | |
| `read_at` | timestamptz null | 읽음 표시 |
| `emailed_at` | timestamptz null | 메일 묶음 발송 시각 (하루치 묶음은 `email_opt_in` 사용자의 `emailed_at is null` 행을 모아 보냄) |

## 5. 뷰 (화면이 읽는 곳)

| 뷰 | 내용 | 쓰는 기능 |
| --- | --- | --- |
| `v_search_targets` | 검색 대상 종목 (`stocks` + 업종 이름 + 결산월) | F-01, F-15 |
| `v_company_years` | `company_summary.fs_div` 기준 연도별 값 + 부채비율·영업이익률·매출 증가율 계산 | F-02, F-05, F-07 근거 값 |
| `v_valuation` | 최신 시세 × 최신 연도 순이익·자본 → PER·PBR (순이익 ≤ 0 이면 PER null, 자본 ≤ 0 이면 PBR null), 시가총액 | F-09, F-07 정렬, F-15 |
| `v_industry_medians` | 중분류별 지표 가운데 값(`percentile_cont(0.5)`)과 값이 있는 회사 수 (부채비율·영업이익률·매출 증가율·PER·PBR) | F-08, F-09 |

- 회사 수 2,570개라 뷰로 바로 계산해도 충분히 빠를 것으로 본다. 느리면 materialized view로 바꾸고 배치가 새로 고침.
- 가운데 값의 최소 회사 수(3개, 대체안 5개)는 화면(API)에서 회사 수 열로 판단 → 기준이 바뀌어도 뷰는 그대로.

## 6. 보안 (RLS)

| 묶음 | RLS | 정책 |
| --- | --- | --- |
| 공개 데이터 (2장) + 뷰 | 켬 | `anon`·`authenticated` **읽기만** 허용. 쓰기는 서버용 키(배치)만 |
| 배치 운영 (3장) | 켬 | 정책 없음 → 서버용 키만 접근 |
| 사용자 (4장) | 켬 | `auth.uid() = user_id` 인 행만 읽기·쓰기. `notifications` 삽입은 배치(서버용 키)만, 사용자는 `read_at` 갱신만 |

- 뷰는 `security_invoker = true`로 만들어 밑 테이블 RLS를 그대로 따르게 한다.
- 서버용 키(`SUPABASE_SERVICE_ROLE_KEY`)는 배치·API Route에서만. 브라우저에는 publishable 키만 (로그인용).

## 7. 배치별 쓰는 테이블

| 배치 | 주기·위치 | 쓰는 테이블 |
| --- | --- | --- |
| KRX 목록 | 매일, GitHub Actions | `stocks`, `batch_runs`, (빠진 종목) `notifications` |
| 시세 | 매일, GitHub Actions | `stock_prices`, `batch_runs` |
| DART 처음 수집 | 1회, 개인 서버 | `companies`, `financials`, `dividend_rows`, `dividends`, `audit_opinions`, `company_summary`, `dart_fetch_status`, `data_issues`, `batch_runs` |
| DART 매월 5일 | 매월, 개인 서버 | 위와 같음 (새 보고서 있는 회사만) + `notifications`(새 실적·감사의견 변경) |
| 기준값 재계산 | 필요할 때, 개인 서버 | `company_summary` |

## 8. 결정 기록 (2026-11-16 사용자 확정)

| # | 질문 | 결정 | 채택하지 않은 안 |
| --- | --- | --- | --- |
| 1 | 재무 원본 행을 따로 저장할지 | **정리된 값만** `financials`에 저장 (F-04 "예전 보고서 값은 저장 안 함"과 같음). 중복 규칙이 수집 뒤 바뀌면 DART를 다시 불러 고침 (하루 한도 안) | 주요계정 응답 원본 행도 저장 (약 15만 행, 재호출 없이 규칙 변경 가능하지만 F-04 결정과 어긋남) |
| 2 | 종목명 검색 방식 | **A: `stocks`에 검색용 정규화 생성 열**(소문자 + 공백 제거)을 두고 DB에서 검색. 원본 `itms_nm`은 그대로 | B: API Route 메모리에 목록을 올려 검색 (Vercel 서버리스는 메모리가 자주 비워짐) |
| 3 | 시세 이력 | **A: 최신 1일치만** 보관. 이력이 필요한 기능이 생기면 그때 테이블 추가 | B: 매일 이력 저장 (1년 약 70만 행, 쓰는 곳 없음) |
| 4 | 필터 판정 위치 | **A: 배치가 미리 계산해 `company_summary.matched_filters`에 저장.** 기준값이 바뀌면 재계산 배치 | B: 매번 SQL 뷰로 계산 (필터 조건을 SQL·Python 두 곳에서 관리하게 됨) |
| 5 | 감사의견 테이블 확정 방법 | **A: 지금 실제 호출로 확인 후 확정** → 2-8에 반영 (3개년·연도마다 2행·`bsns_year`는 기수 라벨·값 `적정의견`) | B: F-13 구현 때 확인 |
| 6 | 같은 연도 2행의 의견이 다를 때 알림 | **A: 두 행 중 하나라도 전년 의견과 달라지면 "감사의견 변경" 알림.** 문구는 달라진 쪽 의견 그대로 (예: "'적정의견'에서 '한정의견'으로"). "연결/별도" 이름은 붙이지 않음 (구분 필드 없음) | B: 두 행이 다르면 알리지 않고 `data_issues`에만 기록 |

- 2번에 따라 `stocks`에 열 추가: `search_name` text, 생성 열 = `lower(regexp_replace(itms_nm, '\s', '', 'g'))`. 인덱스 `pg_trgm` GIN(`search_name`).

## 9. 남은 검토할 점

1. **감사의견 `적정의견` 외 값의 표기** (한정의견·부적정의견·의견거절 등). 수집 뒤 값 종류를 세어 확인 (`data_issues`에 처음 보는 값 기록).

## 10. 구현하며 정한 세부 (2026-11-17)

1. **FK:** `stocks.corp_code`와 `dart_fetch_status.corp_code`는 FK를 걸지 않는다 (KRX 매칭만 된 회사는 기업개황 행이 아직 없을 수 있고, 기업개황이 `013`이면 `companies` 행이 없다). `financials`·`company_summary`·`dividend_rows`·`dividends`·`audit_opinions`는 `companies`를 참조하며 `on delete cascade`.
2. **값 종류 제약(CHECK):** `ksic_classes.level`, `financials.fs_div`, `dividends.dps_status`·`yield_status`, `company_summary.capital_impairment`·`financial_reason`, `batch_runs.job`·`status`, `dart_fetch_status.api`·`status`, `notifications.kind`는 CHECK로 값을 제한한다. `data_issues.kind`는 종류가 늘 수 있어 제약을 걸지 않는다.
3. **사용자 열 권한:** `user_settings`는 사용자가 `email_opt_in`만 바꿀 수 있다 (`unsubscribe_token` 변경 불가). `notifications`는 사용자가 `read_at`만 바꿀 수 있고, 삽입·삭제는 서버용 키만 한다. `watchlist`는 본인 행의 읽기·추가·삭제만 한다.
4. **배치 운영 테이블:** `batch_runs`, `dart_fetch_status`, `data_issues`는 `anon`·`authenticated` 권한을 회수했다. Supabase 보안 점검의 "RLS 켰는데 정책 없음" INFO 3건은 의도한 것이다.
5. **뷰 세부:** `v_company_years`에 `is_display_year`(`years`의 뒤 3개 = Y1~Y3)와 `is_latest` 열을 둔다. 부채비율·영업이익률·매출 증가율은 금융회사이면 null, 자본 ≤ 0이면 부채비율 null, 매출 ≤ 0이면 영업이익률 null, 전년 매출 ≤ 0이면 증가율 null. 값은 반올림하지 않고 화면에서 반올림한다. `v_industry_medians`는 `v_search_targets`의 최신 연도 값으로 계산한다.
6. **확장:** `pg_trgm`은 `extensions` 스키마에 둔다.
7. **확인:** 표본 1건을 넣고 뷰 4개 결과를 본 뒤 되돌렸다 (`search_name` `삼성 전자`→`삼성전자`, 부채비율 25, 증가율 20, PER 100, PBR 5 정상). 지금 테이블은 전부 비어 있다.
