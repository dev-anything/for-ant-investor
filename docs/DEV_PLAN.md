# DEV_PLAN — 재무 레이더 웹앱 구현 계획 (Planner 작성, 2026-11-21)

기준 문서: `docs/PRD.md`(규칙·문구·수용 기준), `docs/FS.md`(구현 방식), `CLAUDE.md`, `.claude/rules/*.md`. 어긋나면 규칙·문구는 PRD, 구현 방식은 FS가 기준이다.
범위: MVP + 2차 + 확장 **전부**. PRD·FS에 없는 기능은 넣지 않는다.
역할: **Admin** = 단계 진행·마이그레이션 적용(사용자 확인 후)·타입 생성·서버 재시작·문서 반영 요청 / **Coder** = 코드·마이그레이션 SQL 파일 작성 / **Checker** = 검사 명령 실행 + 수용 기준 점검 / **사용자** = sudo·키·대시보드 설정.

## 체크리스트

- [x] 0a. `web/` 프로젝트 생성 (Next.js·TS·Tailwind·Vitest·ESLint, `.env` 로딩, `.gitignore`)
- [x] 0b. DB 타입 생성(Admin) + 서버 클라이언트 + `copy.ts`·`format.ts`(+테스트) + `AppHeader`·`SiteFooter`·`layout` + DB 1행 조회 확인
- [x] 0c. 로컬 실행 스크립트 (포트 16000, `0.0.0.0`) + 빌드·기동·키 번들 검사
- [ ] 0d. 방화벽 (LAN + Tailscale만 허용) — **사용자 sudo 필요**
- [x] 1a. F-01 마이그레이션 SQL `search_stocks` 작성 → **Admin이 사용자 확인 후 적용** → SQL 검증
- [x] 1b. F-01 `/api/search`·`SearchBox`·`/` 화면
- [x] 2a. F-02 `getStockPage`·`/stocks/[code]` 뼈대·`StockHeader`·데이터 없음·외국회사·404·로딩·오류
- [x] 2b. F-02 `ResultsCharts` (Recharts)
- [x] 3a. F-05 순수 모듈 `trend.ts`·`gauge.ts`·`insights.ts` + 테스트
- [x] 3b. F-05 `Tooltip`·`Gauge`·`TrendArrow`·`Notice`·`ReportCard`
- [x] 4. F-03 `filters.ts` + 테스트 + `rules-sync.test.ts`
- [x] 5a. F-07 마이그레이션 SQL `screener_search` 작성 → **Admin이 사용자 확인 후 적용** → SQL 검증
- [x] 5b. F-07 `params.ts`(+테스트)·`/api/screener`
- [x] 5c. F-07 `/screener` 화면 (`DataTable`·`PageSizeSelect`·`Pagination`·`FilterPanel`·`ResultTable`·`ScreenerClient`)
- [x] 6. MVP 마무리 (표본 점검, 20종목 일치율, 16000 재기동, LAN·Tailscale 접속 확인)
- [x] 7a. F-08 `v_industry_medians` 속도 측정 + 마이그레이션 SQL 5-3~5-5 → **Admin이 사용자 확인 후 적용**
- [x] 7b. F-08 `industry.ts`·`Gauge` 가운데 값·`ReportCard` 변경
- [x] 7c. F-08 링크 모드(`SortHeaderLink`·`DataTable`·`Pagination`·`PageSizeSelect`)·`params.ts` 목록 함수·`/industries/[division]/compare`
- [x] 8. F-09 `ValuationSection`
- [x] 9. F-14 `dividend.ts`·`DividendCard`
- [x] 10a. F-17 사전 확인 (DART `list.json` 실제 응답, PRD 11장 19·20번)
- [x] 10b. F-17 `disclosures.ts`·`disclosure.ts`·`DisclosureList`·`StockFeedSection`
- [x] 11a. F-18 `news-text.ts`(+테스트)·`news.ts` (키 없으면 꺼짐)
- [x] 11b. F-18 `NewsList`·`NewsBlock`·`NaverAttribution`·`HomeNews`·`StockNews`·`/news`
- [x] 12. F-15 `/industries`·`/industries/[division]`·메뉴·바로가기·업종 링크
- [x] 13. F-16 `driver.js`·`tour.ts`(+테스트)·`ReadingTour`·`data-tour`
- [ ] 14a. F-10 마이그레이션 SQL 5-6 → **[x] Admin이 사용자 확인 후 적용**
- [x] 14b. F-10 `chat.ts`(+테스트)·`/api/chat`·`chat-isolation.test.ts` (키 없으면 꺼짐)
- [x] 14c. F-10 `ChatFilterInput` + 스크리너 연결
- [x] 15. 2차 마무리 (표본 대조, 재기동, 접속 확인)
- [ ] 16a. F-11 마이그레이션 SQL 5-7 → **[x] Admin이 사용자 확인 후 적용** + Supabase 대시보드 설정 안내 (REQUIRE.md)
- [x] 16b. F-11 `@supabase/ssr`·`session.ts`·`browser.ts`·`proxy.ts`·`auth.ts`(+테스트)·`/api/me`·`/auth/callback`
- [x] 16c. F-11 `AuthMenu`·`LoginDialog`·탈퇴
- [x] 17a. F-12 `/api/watchlist`·`/api/settings`·`WatchButton`·로그인 뒤 자동 등록
- [x] 17b. F-12 `/mypage`·`WatchCard`·`MiniBars`·`EmailOptInToggle`
- [x] 18a. F-13 마이그레이션 SQL 5-8 → **[x] Admin이 사용자 확인 후 적용** + 알림 읽음 API·`NotificationList`·`/unsubscribe`·`/api/unsubscribe`
- [x] 18b. F-13 배치 `batch/notify.py` + `batch/tests/test_notify.py`
- [x] 18c. F-13 `batch/notify_mail.py` + `dart_collect.py`·`krx_list.py` 연결 + `daily.yml` 단계
- [ ] 19. 최종 점검 (전체 검사, 금지 표현·키 노출 grep, 16000 재기동, 접속 경로 확인, REQUIRE.md 정리)

---

## 사용자 조건과 FS의 차이 (전 단계 공통 전제)

| 항목 | FS | 이 계획 |
| --- | --- | --- |
| 배포 | Vercel (FS 11장 6·15단계) | **하지 않음.** 로컬 서버 포트 **16000**에서 `next build` + `next start -p 16000 -H 0.0.0.0`. "배포 주소 확인"은 "로컬 16000 실행 확인"으로 대체 |
| 접근 | 공개 URL | LAN(192.168.0.0/24)과 Tailscale(`tailscale0`, 100.64.0.0/10)에서만. 방화벽 단계 0d |
| Vercel 환경변수 | 사용자 등록 | 없음. 루트 `.env`가 `next.config.ts`의 `loadEnvConfig`로 읽힌다 (FS 3-1) |
| `Origin` 검사 (FS 4-2) | "사이트 주소와 같은지" | 접속 주소가 LAN IP·Tailscale IP·localhost로 여럿이다. 고정 주소와 비교하지 말고 **요청의 `Host` 헤더와 `Origin` 호스트가 같은지**로 검사한다 (16b에서 구현, `lib/auth.ts` 순수 함수 `isSameOrigin(originHeader, hostHeader)`로 두고 테스트) |
| `SITE_URL` (메일 수신 거부 링크) | 배포 주소 | 사용자가 정한 접속 주소 (기본안: Tailscale 주소 `http://100.124.240.114:16000`). **사용자 결정 필요** → REQUIRE.md |
| Supabase Redirect URLs | 배포 주소 + localhost:3000 | `http://100.124.240.114:16000/auth/callback**`, `http://192.168.0.6:16000/auth/callback**`, `http://localhost:16000/auth/callback**` (사용자가 대시보드에 입력) |

서버 현황 (Planner가 읽기 전용으로 확인): 호스트 `myserver`, `eth0` 192.168.0.6/24, `tailscale0` 100.124.240.114, Node v22.23.2·npm 10.9.8, `web/` 아직 없음, 포트 16000·3000 미사용. Tailscale 기기: `book3pro`(Windows, 접속 확인용으로 쓸 수 있음). `ufw status`는 sudo 비밀번호가 필요해 확인하지 못했다 (0d에서 사용자가 실행).

---

## 공통 규칙 (모든 Coder 작업 지시에 포함)

Admin은 Coder에게 단계 상세와 함께 아래를 **매번 그대로** 붙인다.

**C1. 코드 스타일 (`.claude/rules/typescript.md`)**
- 이름은 영어, 주석은 한국어("왜" 위주, PRD·FS 절 번호 남김). 파일: 컴포넌트 PascalCase.tsx, 그 외 kebab-case.ts. **단, FS 2장이 정한 파일명(`lib/format.ts`, `lib/copy.ts`, `lib/news-text.ts` 등)은 FS 그대로** 쓴다.
- import 경로는 **항상 `@/`** (`./`·`../` 금지). `any` 금지(모르는 값은 `unknown` 검사). 이름 있는 export (`export default`는 `page.tsx`·`layout.tsx`·`route.ts` 등 Next.js 요구 파일만). 빈 `catch {}` 금지.
- 값 없음은 `null` (`undefined`와 섞지 않음). 숫자 기준값은 이름 붙은 상수. 함수 40줄·파일 300줄 안팎.
- DB 컬럼 snake_case → `lib/data/`에서 camelCase로 **한 번만** 변환. 화면 코드는 snake_case를 보지 않는다.
- 계산·판정·포맷은 `lib/`의 순수 함수로, 컴포넌트는 그리기만. DB·외부 API 호출은 `lib/data/`.

**C2. 문구·표현 (PRD 1-5, 3-1)**
- 사용자에게 보이는 문구는 **전부 `lib/copy.ts`** (PRD·FS 12장 기본안 문구를 그대로 복사, 키 옆 주석에 PRD 절 번호). 컴포넌트에 직접 쓰지 않는다 (한 컴포넌트 전용 짧은 라벨만 예외).
- 화면 문구는 **반말("~했어", "~야")**. 예외(존댓말): 출처 푸터, 로그인·계정 화면, 알림 메일 제목·수신 거부 안내. 화면에서 "당기순이익" 대신 **"순이익"** (툴팁에 정식 이름).
- **금지:** 매수·매도 추천, "사라/팔라", "좋은 회사", 목표가, 신호등(초록·노랑·빨강), "안정성·수익성·성장성" 같은 평가 이름. 변수명·주석·테스트 이름에도 `isGood`·`danger`·`riskLevel` 등 평가 표현 금지 (`capitalImpairment`·`isAboveLine` 식으로). 빨강 금지(음수도 옅은 회색).
- 색: Tailwind `neutral` 계열 + 흰색·검정만. 색만으로 구분하지 않는다.

**C3. 보안**
- **`.env` 파일을 열거나 읽거나 출력하지 않는다.** 코드에서 변수 이름으로만 쓴다. 키·`serviceKey`·`crtfc_key` 값을 로그·출력·파일에 남기지 않는다. 요청 URL을 출력해야 하면 키 값을 `***`로 가린다.
- 서버용 키 모듈은 `import 'server-only'`. `NEXT_PUBLIC_`에 비밀 키 금지. 키가 없으면 오류 메시지에 **변수 이름만** 적는다.
- `.env.example`에는 이름만 (값 없이). 기능 단계에서 필요한 이름을 추가한다.

**C4. 범위**
- 지시한 단계의 파일만 만든다. PRD·FS에 없는 기능·옵션·페이지·라이브러리를 넣지 않는다. UI 라이브러리 없음 (Tailwind만). 문서(`docs/`·`CLAUDE.md`)는 고치지 않는다.
- 문구가 PRD·FS에 없으면 임의로 만들지 말고 **작업 보고에 "문구 미정"으로 적고** 가장 가까운 PRD 10장 기본안을 쓴다.

**C5. 공통 완료 검사 (작업 디렉터리 `/home/myserver/for-ant-investor/web`)**
```
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
네 가지가 모두 통과해야 단계 완료. 마이그레이션·배치 단계는 해당 검사(SQL 직접 확인, `python3 -m unittest`)를 따른다.

**공통 Checker 점검 (모든 웹 단계)**
1. C5 네 명령 통과를 직접 다시 실행해 확인.
2. 금지 표현 grep (`web/app web/components web/lib`): `grep -rnE "사라|팔라|매수|매도|추천|좋은 회사|목표가|신호등|안정성|수익성|성장성|저평가|고평가|우량|위험" web/app web/components web/lib` — 출력된 줄은 모두 허용 목록(푸터 투자 책임 고지 문구, PRD가 인용한 문구)과 대조. 허용 밖이면 불합격. 변수명: `grep -rnEi "isGood|isBad|danger|riskLevel|\bsafe\b|\bgood\b|\bbad\b" web/app web/components web/lib`.
3. `import ... from '\.\.?/` 상대 경로 import 없음: `grep -rnE "from '\.\.?/" web/app web/components web/lib web/tests`.
4. `any` 없음: `grep -rnE ":\s*any\b|as any|<any>" web/app web/components web/lib web/tests`.
5. 컴포넌트에 문구 직접 사용이 없는지 (한글 문자열 리터럴이 `lib/copy.ts`·`lib/filters.ts` 밖 `components/`·`app/`에 많이 보이면 표본 확인).
6. 키 번들 노출 (빌드 뒤): `grep -rlE "SUPABASE_SERVICE_ROLE_KEY|service_role|crtfc_key|serviceKey|NAVER_API_HUB|OPENROUTER|sb_secret_|eyJ[A-Za-z0-9_-]{20,}" web/.next/static` 결과 0개. (`.env` 값 자체를 읽어 비교하지 않는다.)
7. `git status`에 `.env`·`web/.env*`·`node_modules`·`.next`가 올라오지 않음.

---

## 단계별 상세

### 0a. `web/` 프로젝트 생성

- **목표:** 빈 Next.js 앱이 빌드·기동된다. FS 11장 0단계 앞부분.
- **참조:** FS 2장(구조·버전 정책), 3-1(`.env` 로딩), 10장(테스트 방침), `.claude/rules/typescript.md`.
- **만들 파일:**
  - `web/package.json`, `web/tsconfig.json`(strict, `paths: { "@/*": ["./*"] }`), `web/next.config.ts`, `web/postcss.config.mjs`, `web/app/globals.css`, `web/app/layout.tsx`(임시), `web/app/page.tsx`(임시), `web/eslint.config.mjs`, `web/vitest.config.ts`(alias `@` → 프로젝트 루트, `tests/**/*.test.ts`), `web/tests/.gitkeep`
  - 루트 `.gitignore`에 `web/node_modules/`, `web/.next/`, `web/.vercel/`, `web/.env*` 추가 (기존 항목은 유지)
- **방법:** `npx create-next-app@latest web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"` (대화형이면 옵션을 모두 지정). 의존성 `package.json`에 **정확한 버전으로 고정** (`^`·`~` 제거). 추가 설치: `vitest`, `@supabase/supabase-js`, `server-only`, `recharts`. (`driver.js`·`@supabase/ssr`은 13·16b에서.) `package.json` scripts: `lint`, `test`(= `vitest run`), `build`, `start`. **`cacheComponents`는 켜지 않는다** (FS 3-3은 `unstable_cache`를 허용).
- **`next.config.ts`:** `import { loadEnvConfig } from '@next/env'; loadEnvConfig(path.resolve(__dirname, '..'))` — 루트 `.env`를 불러온다. `.env` 파일 내용을 읽지 않는다. `web/.env.local`을 만들지 않는다.
- **주의점:** Next.js 16이면 `middleware.ts` 대신 `proxy.ts` (16b에서). `create-next-app`이 만든 샘플 로고·문구·CSS는 지운다 (무채색 단순 구성).
- **완료 조건:** C5 네 명령 통과 (`vitest`는 테스트 파일이 없으면 `--passWithNoTests`를 `test` 스크립트에 넣는다).
- **Checker 확인:** 공통 점검 + `package.json` 버전에 `^`·`~` 없음 + `.gitignore` 추가분 + `git status`에 `web/node_modules` 없음 + `tsconfig`에 `@/*` alias·`strict`.

### 0b. DB 타입·서버 클라이언트·공통 모듈·레이아웃

- **선행 (Admin):** Supabase MCP `generate_typescript_types`로 현재 DB 타입을 만들어 `web/lib/supabase/types.ts`에 저장 (파일 첫 줄에 "생성 파일, 직접 고치지 않음" 주석). 마이그레이션이 추가될 때마다 다시 생성.
- **목표:** 머리·푸터가 나오고 서버에서 `v_search_targets` 1행 조회에 성공. FS 11장 0단계.
- **참조:** FS 3-2, 6-1(`format.ts`), 6-7(`copy.ts`), 7장(`AppHeader`·`SiteFooter`), 10장 `format.test.ts`, PRD 3-2(출처 푸터 확정 문구)·3-8(숫자 표시)·10장 1번(투자 책임 고지).
- **만들 파일:** `web/lib/supabase/server.ts`, `web/lib/copy.ts`(푸터·공통 문구만 우선), `web/lib/format.ts`, `web/tests/format.test.ts`, `web/components/AppHeader.tsx`, `web/components/SiteFooter.tsx`, `web/app/layout.tsx`(`lang="ko"`, 머리·푸터), `web/app/page.tsx`(임시: 서버 컴포넌트에서 `db().from('v_search_targets').select('short_code,itms_nm').limit(1)` 결과를 한 줄 표시 — 1b에서 교체), `web/.env.example`은 **루트** `.env.example`에 변경 없음(MVP 변수 이미 있음).
- **주의점:**
  - `format.ts`는 FS 6-1 표의 함수 전부(`formatAmount`, `formatMarketCap`, `formatPercent`, `formatMultiple`, `formatWon`, `formatGrowth`, `formatFsDiv`, `formatYearRange`, `formatAccMt`, `cleanSectionName`) + `formatRceptDt`(10b용, 지금 같이 만들어도 됨). 경계: 9,999억↔1조, 음수 `-657억 원`, 반올림, null, `formatAccMt('12')` = null.
  - 푸터 출처 문구는 **PRD 3-2 확정 문구 그대로** (존댓말, 두 줄) + 투자 책임 고지 한 줄(PRD 10장 1번 기본안). 네이버 추가 문구는 **넣지 않는다** (사용자 확인 전, PRD 10장 25번).
  - `AppHeader` 메뉴는 이 단계에서 "종목 검색"(`/`)·"조건으로 찾기"(`/screener`) 2개. `aria-current`는 현재 경로 기준. 서버 컴포넌트, 쿠키를 읽지 않음.
  - 서버 클라이언트는 FS 3-2 그대로. 환경변수 없으면 변수 이름만 쓴 오류.
- **완료 조건:** C5 통과 + 기동 후 `curl -s http://127.0.0.1:16001/` (Admin이 `npm run start -- -p 16001 -H 127.0.0.1`으로 임시 기동, 끝나면 종료)에 머리·푸터 문구와 종목명 1개 포함.
- **Checker 확인:** 공통 점검(특히 6번 키 번들) + `format.test.ts` 케이스(경계값 9,999억·1조, 음수, null) 존재 + 푸터 문구가 PRD 3-2와 글자 단위로 같음(diff) + `server.ts`가 `server-only`를 import.

### 0c. 로컬 실행 스크립트 (포트 16000)

- **목표:** `npm run build` 후 포트 16000에서 `0.0.0.0`으로 기동하는 방법이 고정된다. (FS 11장의 "배포"를 대체하는 기반)
- **만들 파일:**
  - `web/package.json` scripts에 `"start:local": "next start -p 16000 -H 0.0.0.0"`
  - `scripts/run-web.sh` (실행 권한, bash): `build`·`start`·`stop`·`restart`·`status` 서브커맨드. `start`는 `cd web && nohup npm run start:local > ../web.log 2>&1 &`로 백그라운드 기동하고 PID를 `web/.run-web.pid`에 기록, `stop`은 그 PID 종료, `status`는 `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:16000/`. 로그에 환경변수를 `echo`하지 않는다.
  - `.gitignore`에 `web.log`, `web/.run-web.pid` 추가
  - (선택, 사용자가 원할 때만) `scripts/finradar-web.service.example` — systemd 사용자 서비스 예시 (`ExecStart`에 `start:local`, `Restart=on-failure`). 서버 재부팅 시 자동 기동이 필요하면 사용자가 직접 설치한다 → REQUIRE.md에 "자동 기동 원하면 알려 달라" 한 줄.
- **주의점:** `scripts/`는 기존 규칙상 Python이 많지만 이건 운영 보조 셸 스크립트다. 포트 번호 16000은 스크립트 위쪽 변수 하나로. 임시 검사 서버는 `16001`·`127.0.0.1`만 쓰고 끝나면 반드시 종료.
- **완료 조건:** `bash scripts/run-web.sh restart` → `status`가 200, `ss -ltn | grep 16000`에 `0.0.0.0:16000`, `curl -s http://192.168.0.6:16000/ | head` 와 `curl -s http://100.124.240.114:16000/ | head`가 서버 자신에서 HTML 응답. `grep -rlE` 키 번들 검사(공통 6번) 0건.
- **Checker 확인:** 위 완료 조건 + `scripts/run-web.sh stop` 뒤 포트가 닫힘 + `.gitignore` 추가분 + 스크립트에 키·`.env` 참조 없음.

### 0d. 방화벽 (LAN + Tailscale만) — 사용자 sudo 필요

- **목표:** 포트 16000을 LAN(192.168.0.0/24)과 Tailscale 인터페이스에서만 열고 나머지는 막는다.
- **Admin 작업 (읽기 전용 확인):** `ip -brief addr`, `tailscale status`, `ss -ltnp | grep 16000`, `sudo` 없이 되는 확인(`ufw`는 sudo 필요하므로 **사용자에게 아래 결과 붙여 달라고 요청**): `sudo ufw status verbose`, `sudo iptables -S INPUT | head`(ufw가 없을 때 대비). 현재 ufw가 **inactive면** 켜기 전에 SSH(22/tcp 또는 사용 중인 포트)를 먼저 허용해야 접속이 끊기지 않는다 — 사용자에게 경고.
- **사용자가 실행할 명령 안 (Admin이 REQUIRE.md에 기록, ufw 사용 시):**
  ```
  sudo ufw allow from 192.168.0.0/24 to any port 16000 proto tcp comment 'finradar LAN'
  sudo ufw allow in on tailscale0 to any port 16000 proto tcp comment 'finradar tailscale'
  sudo ufw status numbered      # 16000에 대한 "Anywhere" 허용 규칙이 없는지 확인
  ```
  기본 정책이 `deny (incoming)`이어야 한다 (`sudo ufw default deny incoming`). 공유기 포트포워딩은 하지 않는다 (사용자 확인).
- **주의점:** Docker가 열어 둔 포트(브리지 `docker0`·`br-*`)는 ufw 규칙을 우회할 수 있지만 16000은 Docker가 아니라서 해당 없음. 다만 Next.js는 `0.0.0.0` 하나로만 바인드되므로(주소를 여러 개 지정할 수 없음) 접근 제한은 **방화벽에만 의존**한다. 방화벽 적용 전에는 16000을 외부 경로에 노출하지 않도록 0c 이후 6단계 전까지는 `127.0.0.1`로 검사해도 된다.
- **완료 조건 (사용자·Admin 함께):** 서버에서 `ss -ltn | grep 16000` 확인 → Tailscale 기기(`book3pro`)에서 `http://100.124.240.114:16000/` 응답 → LAN 내 다른 기기(예: 휴대폰 Wi-Fi)에서 `http://192.168.0.6:16000/` 응답 → (가능하면) 모바일 데이터(LAN·Tailscale 아님)에서 접속 안 됨. 결과를 사용자가 알려 주면 Admin이 기록.
- **Checker 확인:** 사용자가 붙여 준 `ufw status` 출력에서 16000 규칙이 위 두 개뿐인지, `Anywhere` 허용이 없는지 읽고 판단 (명령 실행 불가 시 출력 문자열 점검). 실패 시 REQUIRE.md의 해당 항목을 "미완료"로 유지.

### 1a. F-01 마이그레이션 SQL `search_stocks`

- **목표:** FS 5-1 함수 SQL 파일. **적용은 사용자 확인 뒤 Admin이.**
- **참조:** FS 5장 머리·5-1, PRD 4장 F-01 규칙, `supabase/migrations/20261117000000_initial_schema.sql`(`v_search_targets` 정의·`search_name`·trgm 인덱스).
- **만들 파일:** `supabase/migrations/20261121000000_web_functions.sql` (이 파일에 5-1을 먼저 넣고, 5a에서 같은 파일에 5-2를 **추가하지 말고** 새 파일 `…_screener_search.sql`로 분리한다 — 적용 이력을 단계별로 남기기 위해. FS는 파일 하나를 말하지만 적용 단위를 나누는 것이 안전하다.)
- **주의점:** `stable`, `security invoker`, `set search_path = public, extensions`, `execute`를 `anon`·`authenticated`·`service_role`에 부여. LIKE 특수문자 이스케이프. 숫자만 입력 → 종목코드 접두, 그 밖 → `search_name`, 영문 섞인 코드(`0220w0` → `upper(q) = short_code`). 입력 50자 초과·빈 값 0행. 정렬 `match_rank, itms_nm`, 상한 `least(p_limit, 10)`.
- **완료 조건 (Admin, 사용자 확인 후 Supabase MCP `apply_migration` → `execute_sql`):** `search_stocks('삼성 전자')` 첫 행 삼성전자, `search_stocks('0059')`(005930 포함), `search_stocks('0220w0')` 1행, `search_stocks('%')`·`search_stocks('')` 0행 또는 안전 동작, 외국회사(`is_foreign`)가 결과에 포함되되 표시 플래그 있음. `get_advisors`(보안) 재확인 후 `types.ts` 재생성.
- **Checker 확인:** SQL 파일 헤더 설정(search_path·security invoker·grant) 점검, 위 SQL 확인 결과 기록, `types.ts`에 `search_stocks`가 반영됨.

### 1b. F-01 `/api/search`·`SearchBox`·`/` 화면

- **참조:** FS 8-1 전체, 4-2(API 공통), 6-7·`params`(검증 `q` 1~50자), PRD 4장 F-01 수용 기준, PRD 3-5 첫 화면, PRD 10장·FS 12장 3번(검색창 안내 글 "종목명이나 종목코드").
- **만들 파일:** `web/lib/data/search.ts`(RPC 호출 → camelCase `{ shortCode, name, market, isForeign }`), `web/app/api/search/route.ts`(`GET`, 400 `bad_request`/500 `server_error`, `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`), `web/components/SearchBox.tsx`(클라이언트), `web/app/page.tsx`(교체), `web/lib/copy.ts`(검색 문구 추가), `web/lib/highlight.ts`(일치 부분 `<strong>` 위치 계산 순수 함수 — FS가 이름을 정하지 않음, 필요하면 이 파일 + `web/tests/highlight.test.ts`).
- **주의점:**
  - WAI-ARIA combobox(`role=combobox aria-expanded aria-controls aria-activedescendant`, `ul role=listbox`, `li role=option`). 300ms 디바운스, `AbortController`로 이전 요청 취소·늦은 응답 버림, ↑↓ 순환·Enter·Esc, 첫 진입 자동 포커스.
  - 외국회사: 줄 끝 "지원하지 않음", `aria-disabled`, 선택해도 이동 안 함. 결과 없음 "검색 결과가 없어"(선택 불가). 오류는 목록만 닫고 콘솔 경고.
  - 선택 → `/stocks/{shortCode}`. `/` 아래 바로가기 줄 "어떤 회사를 찾을지 모르겠다면 → 조건으로 찾기"(PRD F-01·FS 8-1). (업종 바로가기 두 번째 줄은 12단계, 기사 칸은 11b에서 추가.)
  - 하이라이트는 `dangerouslySetInnerHTML` 없이 React 요소로.
- **완료 조건:** C5 통과 + 임시 서버(16001)에서 `curl 'http://127.0.0.1:16001/api/search?q=삼성'` 이 `items` 배열(최대 10), `q=` 빈 값 400, 51자 400, `q=0059`에 005930 포함, `q=0220w0` 1건.
- **Checker 확인 (PRD F-01 수용 기준 요점):** 이름 일부·공백 무시 검색, 종목코드 숫자 접두 검색, 최대 10개, 완전 일치 > 앞부분 > 포함 순서, 코넥스·스팩 제외(`v_search_targets` 사용), 외국회사 표시, 결과 없음 문구, 키보드 조작, 디바운스(코드에 300 상수), 취소 로직(`AbortController`) 존재. 브라우저 동작(포커스·키보드)은 사용자 수동 확인 항목으로 표시.

### 2a. F-02 `getStockPage`·`/stocks/[code]` 뼈대

- **참조:** FS 4-1(MVP 부분: 1·2·3번 조회·반환 타입), 8-2(페이지·`StockHeader`·상태 표), 3-3(`revalidate = 3600`), PRD 3-5·3-7(데이터 없음)·4장 F-02 수용 기준, FS 12장 1·2번 문구.
- **만들 파일:** `web/lib/data/stock.ts`(`getStockPage`, camelCase 변환, 조회 오류는 throw), `web/app/stocks/[code]/page.tsx`(`generateMetadata`: `{종목명} ({code}) · 재무 레이더`), `web/app/stocks/[code]/loading.tsx`, `web/app/stocks/[code]/error.tsx`(클라이언트), `web/app/not-found.tsx`, `web/components/StockHeader.tsx`, `web/components/EmptyState.tsx`, `web/components/ErrorState.tsx`, `web/components/Skeleton.tsx`, `web/lib/copy.ts`(추가).
- **주의점:** `code`는 대문자로 맞춤. `status` 3가지(`ok`·`no_financials`·`foreign`). `foreign`이면 2·3번 조회 안 함. 이 단계 `ok`일 때 본문은 "리포트카드·실적 그래프 자리" 임시 문구 없이 비워 두고(3b·2b에서 채움) 빌드가 깨지지 않게 한다. `StockHeader` 정보 줄: `short_code · 시장 · 중분류 이름 · {M}월 결산`(12월 결산이면 생략), 업종 없으면 칸 생략, 업종 이름은 글자만(링크는 12단계). "읽는 순서"·"추적하기" 자리는 만들지 않는다(해당 단계에서 추가).
- **완료 조건:** C5 + 임시 서버에서 `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:16001/stocks/005930` 200, `/stocks/999999` 404 + 404 문구, 재무 없는 종목·외국회사 종목코드(Admin이 SQL로 하나씩 찾아 Coder에게 알려 줌)에서 각 안내 문구.
- **Checker 확인 (PRD F-02·3-7):** 상태별 화면(ok/no_financials/foreign/404), 헤더 정보 줄 규칙, `revalidate = 3600`, 조회가 `v_search_targets`→`company_summary`·`v_company_years` 순, DB 오류 시 `error.tsx`.

### 2b. F-02 `ResultsCharts`

- **참조:** FS 8-2 `ResultsCharts` 표, PRD 4장 F-02 수용 기준, PRD 3-6(금융회사), 3-8, `format.ts`.
- **만들 파일:** `web/components/ResultsCharts.tsx`(클라이언트, Recharts `BarChart` 3개), `web/components/ResultsChart.tsx`(그래프 1개, 필요하면), `web/lib/chart-data.ts`(행 → 차트 데이터·전년 대비 계산 순수 함수 + `web/tests/chart-data.test.ts`), `web/app/stocks/[code]/page.tsx`(연결), `web/lib/copy.ts`(추가).
- **주의점:** 입력은 `displayYears` 행(오래된→최근), 기준 줄 `기준: {formatFsDiv} · {formatYearRange} 사업연도`. Y축 0 포함·눈금 숫자 숨김·막대 위 값 라벨. 그래프마다 `formatAmount`로 단위. **음수 막대는 옅은 회색(빨강 금지)** + 0 기준선. 툴팁에 정확한 원 단위 금액 + 전년 대비 증감률(`formatGrowth`, 전년이 저장 연도 4개 안에 있을 때만). null → "제공되지 않음". 순이익 제목 옆 `Tooltip`("정식 이름은 당기순이익") — `Tooltip`은 3b에서 만드니 **이 단계에서 `Tooltip`도 함께 만든다**(FS 7장 `Tooltip`: `button` + `aria-describedby`, 마우스·포커스·탭, Esc·바깥 클릭 닫힘). 접근성: 그래프마다 `sr-only` 표. 금융회사는 영업이익·순이익 2개 + 금융회사 안내 한 줄(PRD 3-6, FS 8-2). 좁은 화면은 세로. **금융회사 판정은 `summary.isFinancial`를 읽을 뿐 다시 판정하지 않는다.**
- **완료 조건:** C5 + 임시 서버에서 삼성전자(005930)·금융회사 1곳·적자 회사 1곳(Admin이 SQL로 찾음) 페이지 HTML에 그래프 컨테이너·`sr-only` 표 값이 들어 있음(`curl | grep`).
- **Checker 확인 (PRD F-02):** 3개 그래프(금융은 2개)·연도 3개·기준 문구·순이익 툴팁·음수 표시·null 문구·`sr-only` 표 값이 DB 값과 일치(삼성전자 DB 값을 SQL로 조회해 대조). 시각 확인(막대 모양, 모바일 폭)은 사용자 수동 항목.

### 3a. F-05 순수 모듈

- **참조:** FS 6-2(`trend.ts`)·6-3(`gauge.ts`)·6-5(`insights.ts`), PRD 4장 F-05 전체(눈금 범위·화살표 규칙·문장 템플릿 8개·"비슷한 수준" 3%), 10장 테스트 표, `batch/rules.py`(`GAUGES`·`is_flat`·`FLAT_SHARE`와 같은 값).
- **만들 파일:** `web/lib/trend.ts`, `web/lib/gauge.ts`(`per`·`pbr` 범위도 지금 포함, FS 6-3), `web/lib/insights.ts`, `web/tests/trend.test.ts`, `web/tests/gauge.test.ts`, `web/tests/insights.test.ts`, `web/lib/copy.ts`(문장 템플릿은 PRD 문구 그대로).
- **주의점:** `getTrend`는 null을 뺀 뒤 판정, 2개/3개 규칙, 경계 `<=` (`tol = (max−min)×0.03`, 정확히 3%도 "비슷한 수준"). "비슷한 수준"이 증감 판정보다 먼저. 모르는 insight id는 건너뜀. 7번 문장의 `prev`·`curr`은 다시 반올림하지 않음.
- **완료 조건:** C5. 테스트에 경계값(범위 끝·정확히 3%·null 섞임·값 1개·clamp low/high) 포함.
- **Checker 확인:** `gauge.ts` 범위(부채비율 0~300 기준선 100, 영업이익률 −50~40, 매출 증가율 −40~70)와 `batch/rules.py`가 같음(눈으로 비교), 문장 8개가 PRD와 글자 단위로 같음, 테스트 이름이 한국어 "무엇을 넣으면 무엇이 나온다" 형태.

### 3b. F-05 컴포넌트·`ReportCard`

- **참조:** FS 7장(`Tooltip`·`Gauge`·`TrendArrow`·`Notice`), 8-2 `ReportCard` 표, PRD 4장 F-05(구성 순서·눈금 못 그리는 경우·자본잠식 안내·툴팁 문구), PRD 3-6.
- **만들 파일:** `web/components/Gauge.tsx`(서버), `web/components/TrendArrow.tsx`, `web/components/Notice.tsx`(`variant: 'box' | 'line'`), `web/components/ReportCard.tsx`, `web/components/MetricRow.tsx`, `web/components/InsightList.tsx`, `web/components/CapitalNotice.tsx`, `web/app/stocks/[code]/page.tsx`(연결), `web/lib/copy.ts`(추가). `Tooltip`은 2b에서 만들었으면 재사용.
- **주의점:**
  - `Gauge`: 가로 막대 + 점(이 회사) + 기준선(툴팁) + 범위 밖이면 끝에 점 + 값을 글자로, `role="img"` + `aria-label`("부채비율 87.3%, 범위 0~300%"). 신호등 색·빨강·초록 **금지**, 무채색 한 가지 + 모양·테두리로 구분. 눈금 위치·화살표 방향은 **저장 값을 읽어 표시용으로만 계산**(재판정 금지).
  - `MetricRow`: 질문형 제목 + 지표 이름 + Y3 값 + `TrendArrow` + `Gauge` + 값 3개 줄 `(a → b → c)`(null은 "계산할 수 없어"). 금융회사는 `MetricRow` 3개 안 그림(`CapitalNotice`·`InsightList`는 그대로).
  - `capitalImpairment`: `full` → `Notice box`가 부채비율 눈금 자리를 대신, `partial` → 부채비율 눈금 아래 `Notice line`. Y3가 null인 `MetricRow`는 눈금 대신 사유 문장(영업이익률 "매출액이 없어서 영업이익률을 계산할 수 없어." 등).
  - `InsightList`: `topInsights(…, 3)`, 0개면 제목 포함 렌더 안 함.
  - 평가 문구 금지(예: "양호", "위험"). 화살표만 `↗ ↘ ↕ →`.
- **완료 조건:** C5 + 임시 서버에서 삼성전자·금융회사·완전 자본잠식 회사·부분 자본잠식 회사·영업이익률 null 회사(Admin이 `company_summary`에서 SQL로 찾아 지시에 포함)의 HTML 확인.
- **Checker 확인 (PRD F-05):** 카드 구성 순서(자본잠식 안내 → 눈여겨볼 변화 → 지표 3개), 부채비율 눈금 기준선 100% 툴팁, "비슷한 수준" 툴팁, 값 줄 3개, 금융회사에 지표 없음, 완전 자본잠식 시 눈금 대신 상자, 문장이 DB `insights`와 일치, 색 지정에 `red|green|yellow|amber|emerald` 같은 Tailwind 색 이름이 없음(`grep -rnE "(red|green|yellow|amber|emerald|lime|rose)-" web/components web/app`).

### 4. F-03 `filters.ts`

- **참조:** FS 6-4, PRD 4장 F-03(20개 문구·툴팁·계산 설명·충돌 10쌍·포함 13⊃14·금융회사 제외 목록·근거 값 열 표), 10장 `filters.test.ts`·`rules-sync.test.ts`, `batch/rules.py`.
- **만들 파일:** `web/lib/filters.ts`, `web/tests/filters.test.ts`, `web/tests/rules-sync.test.ts`.
- **주의점:** 필터 문구·툴팁은 **PRD F-03 표 그대로** 복사(오타 금지). `{Y1}~{Y3}` 자리표시자. `toggleFilter` 반환 `{ selected, error? }`(`conflict`+`with` / `max`), 13·14 교체, 최대 3개. `evidenceColumns`는 겹치면 한 번·고른 순서. `rules-sync.test.ts`는 `../batch/rules.py`를 텍스트로 읽어 `CONFLICTS`·`FINANCIAL_BLOCKED`·`GAUGES`·`FLAT_SHARE`를 정규식으로 뽑아 TS 상수와 비교 (정규식은 `rules.py`의 실제 형태를 읽고 맞춘다 — Coder는 `batch/rules.py`를 읽어도 됨).
- **완료 조건:** C5. 테스트: 충돌 10쌍 양방향, 13↔14 교체, 4번째 거부, 근거 열 중복 제거·순서.
- **Checker 확인 (PRD F-03):** 필터 20개 문구·id가 PRD와 일치(PRD 표에서 문자열을 뽑아 `filters.ts`와 diff 비교), 그룹 6개 이름(매출·이익·이익률·빚·자산과 자본·배당), "안정성·수익성·성장성" 같은 평가 이름 없음, `rules-sync` 통과.

### 5a. F-07 마이그레이션 SQL `screener_search`

- **참조:** FS 5-2, PRD 4장 F-07, `company_summary.matched_filters`·`v_company_years`·`v_valuation`·`dividends` 정의(초기 스키마).
- **만들 파일:** `supabase/migrations/20261121010000_screener_search.sql`.
- **주의점:** 입력 검증(필터 1~3개·1~20·중복 없음, 정렬 키 목록, `asc/desc`, size 10/20/50, page ≥1)을 함수 안에서 `raise exception`. 대상: `v_search_targets` ⨝ `company_summary`, `not is_foreign`, `matched_filters @> p_filters`. 반환 열·정렬 키는 FS 표 그대로, **null은 방향과 상관없이 맨 뒤**, 동률 `itms_nm asc`, `years`(화면 연도 3개)·`dividends` jsonb. `security invoker`, `stable`, `search_path = public, extensions`, grant 3개 역할.
- **완료 조건 (Admin, 사용자 확인 후 적용):** `screener_search('{1,13}','name','asc',1,10)`의 `total_count`가 `select count(*) from v_search_targets t join company_summary cs on … where not t.is_foreign and cs.matched_filters @> '{1,13}'`와 같음. 잘못된 입력(필터 4개·21번·size 7) 예외. 정렬 `desc`일 때 null이 뒤. 응답 시간 측정(2초 이내). advisors 재확인, `types.ts` 재생성.
- **Checker 확인:** 위 SQL 결과 기록, 필터 20개 각각 `total_count`가 0이 아닌지(또는 0인 이유) 한 번 훑기.

### 5b. F-07 `params.ts`·`/api/screener`

- **참조:** FS 6-6(스크리너 URL 상태), 8-3(`GET /api/screener`), 4-2, PRD F-07, 10장 `params.test.ts`.
- **만들 파일:** `web/lib/params.ts`(`parseScreenerParams`·`toQuery`, 업종용 `parseListParams`·`toListQuery`는 7c에서 같은 파일에 추가), `web/tests/params.test.ts`, `web/lib/data/screener.ts`(RPC 호출·camelCase 변환, 타입 `ScreenerRow`), `web/app/api/screener/route.ts`.
- **주의점:** 페이지 파싱(`parseScreenerParams`)은 **잘못된 값을 기본값으로 바로잡고**, API는 **바로잡지 않고 400** (`f` 1개 이상 필수). `sort`는 화면에 보이는 열의 키 + `name`·`market_cap`. 13·14가 같이 오면 14만, 부딪히는 짝은 뒤의 것 버림. `toQuery`는 기본값 키 생략. 응답 `{ total, basDt, rows }`(FS 8-3 필드 그대로), 결과 0이면 `total: 0, rows: []`. 응답 헤더 `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- **완료 조건:** C5 + `curl` : `f=1,13` 200, `f=` 400, `f=1,2,3,4` 400, `f=0` 400, `size=7` 400, 부딪히는 짝(PRD 표의 한 쌍) 400, `sort=` 허용 밖 400.
- **Checker 확인:** `params.test.ts`에 잘못된 f(0·21·문자·4개·부딪힘·13+14)·size·page·sort 케이스와 `toQuery` 왕복 존재, API가 서버용 키를 `server-only` 모듈에서만 사용.

### 5c. F-07 `/screener` 화면

- **참조:** FS 8-3(페이지·`ScreenerClient`·`FilterPanel`·`ResultTable` 표), 7장(`DataTable`·`PageSizeSelect`·`Pagination`·`Notice`·`EmptyState`), PRD 4장 F-03·F-07 수용 기준, PRD 10장 9번(기준 연도)·11번(필터 없음 안내), FS 12장 4번(제목 "조건으로 찾기").
- **만들 파일:** `web/app/screener/page.tsx`(서버, `revalidate = 3600`), `web/components/ScreenerClient.tsx`, `web/components/FilterPanel.tsx`, `web/components/ResultTable.tsx`, `web/components/DataTable.tsx`, `web/components/PageSizeSelect.tsx`, `web/components/Pagination.tsx`, `web/lib/copy.ts`(추가: `copy.screener.count(n)`·`zero`·`max`·`conflict(label)`·`financialExcluded` 등 PRD 문구), `web/app/screener/loading.tsx`.
- **주의점:**
  - 필터가 없으면 결과 조회 없이 `FilterPanel` + 안내(PRD 10장 11번). 있으면 `screener_search` 첫 결과를 `ScreenerClient` 초기값으로.
  - 상태 `{ filters, sort, dir, page, size }`: 버튼 → `toggleFilter`, 오류 안내 줄("필터는 3개까지 고를 수 있어" / `'{상대 문구}'와 함께 고를 수 없어`), 정렬·개수·페이지 변경 시 `page=1`·정렬 열 사라지면 `sort=name`, **상태 변경마다 `/api/screener` 조회**(이전 요청 `AbortController` 취소, 조회 중 표 흐리게), URL은 `window.history.replaceState`로 반영(뒤로 가기 기록 쌓지 않음).
  - 흐린 버튼은 `aria-disabled`(포커스 가능), 버튼은 `aria-pressed`, 선택 칩 + ✕.
  - 결과 표 열: 종목명(링크+`formatAccMt`)·종목코드·시장·시가총액(`formatMarketCap`)·근거 값 열(`evidenceColumns`, 3개년 열은 연도 3칸, 회사 연도가 다르면 실제 연도를 작게), null은 `-`. 결과 0 → "조건에 모두 맞는 회사가 없어. 필터를 하나 빼 봐." `hasFinancialBlocked`면 금융회사 안내 + 툴팁. 기준 표시 `시가총액은 보통주 기준, 주가 {bas_dt} 기준`.
  - `AppHeader` "조건으로 찾기" 메뉴는 0b에서 이미 있음. 챗봇 입력창 자리는 비워 둠(14c).
  - `DataTable`은 열 정의 + 행, 정렬 버튼(`aria-sort`), 넓으면 표 안에서만 가로 스크롤. **링크 모드(7c)는 아직 만들지 않는다** — 단 7c에서 확장하기 쉽게 props 구조를 `mode: 'button' | 'link'`로 열어 두는 정도만.
- **완료 조건:** C5 + 임시 서버에서 `/screener`·`/screener?f=1,13`·`/screener?f=1,2`(부딪힘 → 바로잡힘)의 HTML 확인, `/api/screener` 호출 결과가 첫 화면 HTML 행 수와 일치.
- **Checker 확인 (PRD F-07·F-03 수용 기준):** 최대 3개·충돌 안내·13↔14 교체·결과 수 문구·0건 문구·금융회사 안내(해당 필터에서만)·정렬 열 규칙·페이지당 10/20/50·URL 상태 복원(`/screener?f=…` 새로고침 시 같은 화면). 클릭 동작은 사용자 수동 확인 항목으로 표시. `total_count`와 표시 개수가 SQL 값과 일치.

### 6. MVP 마무리

- **Admin 작업:** `scripts/run-web.sh build` → `restart`. 접속 경로 3곳(localhost·LAN IP·Tailscale IP) 응답 확인. `/`·`/stocks/005930`·`/screener?f=1,13` curl.
- **Checker 작업:** PRD 9장 데이터 정확도 표본 대조 (MVP 범위: 3개년 실적·부채비율·영업이익률·매출 증가율) — **표본 20종목**을 고르고(시장·업종·금융회사·적자·자본잠식 섞어) 화면(또는 DB)의 값과 DART 원본(`crtfc_key` 마스킹 호출)을 대조해 **일치율 ≥ 95%** 기록. 대조 스크립트가 필요하면 Coder가 `scripts/accuracy_check.py`(표준 라이브러리, `.claude/rules/python-batch.md`)를 만든다. PRD 9장 지표 정의를 읽고 정확한 기준을 쓴다.
- **전체 수용 기준 점검:** PRD F-01·F-02·F-05·F-03·F-07 수용 기준 목록을 항목별 통과/미통과로 표 작성. PRD 8장(비기능: 첫 표시 2초 등)은 `curl -w "%{time_total}"`로 측정.
- **사용자 수동 확인 요청 항목:** 검색 키보드 조작, 그래프 모양, 툴팁 열림·닫힘, 스크리너 필터 클릭, 모바일 폭 레이아웃.
- **Admin:** 문서 작성 에이전트에게 진행 반영 요청.

### 7a. F-08 `v_industry_medians` 속도 측정 + 마이그레이션 5-3~5-5

- **참조:** FS 4-1(`v_industry_medians` 속도 한 번 재기), 5-3·5-4·5-5, PRD F-08·F-15.
- **Admin 선행:** Supabase MCP `execute_sql`로 `explain analyze select * from v_industry_medians where division_code = '26'`(제조업 큰 업종) 시간 측정. **종목 화면 첫 표시 2초(PRD 8장)를 넘길 우려가 있으면** (측정값 약 500ms 초과 시 Coder에게 알림) materialized view + 배치 끝 새로 고침을 별도 마이그레이션으로 만든다 — **사용자 확인 필요**.
- **만들 파일:** `supabase/migrations/20261121020000_industry_functions.sql` (5-3 `industry_tree`, 5-4 `industry_companies`, 5-5 `industry_metrics` 한 파일).
- **주의점:** 검증(`p_division ^[0-9]{2}$`, 정렬 키 목록)은 `raise exception`. 5-5는 재무 없는 회사도 포함(지표 null), `is_financial` null 허용. null은 맨 뒤, 동률 `itms_nm asc`. grant 3개 역할.
- **완료 조건 (Admin, 사용자 확인 후 적용):** 10장 SQL 확인: `industry_tree()` 회사 수 합 = `select count(*) from v_search_targets where not is_foreign and division_name is not null`, `industry_companies('26',…)`·`industry_metrics('26',…)`의 `total_count` 같음. 외국회사·분류표에 없는 업종 코드 제외 확인. advisors·`types.ts` 재생성.
- **Checker 확인:** 위 결과 기록, 측정 시간 기록.

### 7b. F-08 `industry.ts`·`Gauge` 가운데 값·`ReportCard` 변경

- **참조:** FS 4-1(2차 추가 조회 4·5번 중 5번 `v_industry_medians`는 이 단계에서 추가, 4번 `v_valuation`·6번 `dividends`는 8·9단계), 6-8, 7장 `Gauge` 2차 추가, 9-1(종목 화면 구성)·9-2 "리포트카드 변경", PRD 4장 F-08 수용 기준·문구, 10장 `industry.test.ts`.
- **만들 파일:** `web/lib/industry.ts`(`MIN_INDUSTRY_COUNT = 3`, `compareToIndustry`), `web/tests/industry.test.ts`, `web/lib/data/stock.ts`(5번 조회 추가, `industry` 필드), `web/components/Gauge.tsx`(prop `median` 추가: 막대 아래 ▲ 눈금 + "같은 업종 가운데 값 {값}" + `Tooltip`, `aria-label` 끝에 가운데 값), `web/components/MetricRow.tsx`·`ReportCard.tsx`(비교 한 줄·"업종 정보가 없어." 한 번·`too_few` 문구), `web/components/ReportCard.tsx`(버튼 "같은 업종 회사 보기" → `/industries/{division_code}/compare`, `industry !== null`일 때만), `web/lib/copy.ts`(`copy.industry.*`).
- **주의점:** `relation`은 **표시 값(소수 1자리 반올림)끼리** 비교(높아/낮아/같아). `value` null → 가운데 값만 표시. 금융회사·Y3 null 지표 → 가운데 값도 그리지 않음. `status='ok'`일 때만 `industry` 조회, `division_name` null이면 조회 안 하고 `industry: null`. 점(이 회사)과 모양이 다른 ▲ 표시(색 없이 구분).
- **완료 조건:** C5 + 임시 서버에서 업종 회사 수 충분한 종목(삼성전자), 업종 회사 2개 이하 업종 종목(Admin이 SQL로 찾음), 업종 코드 없는 종목, 금융회사 4가지 HTML 확인. `industry.test.ts`: n=2 `too_few`, n=3 `ok`, median null, 반올림 뒤 같음 → `same`, value null → `relation: null`, 업종 없음.
- **Checker 확인 (PRD F-08):** 문구 3종(가운데 값 툴팁 `{N}`=n·`too_few`·업종 없음) PRD와 일치, 버튼 링크 주소, 가운데 값이 `v_industry_medians` 값과 일치(SQL 대조), 기준선과 가운데 값 표시가 겹쳐도 구분되는 마크업.

### 7c. F-08 링크 모드·`params.ts` 목록 함수·compare 화면

- **참조:** FS 6-6 (2차 업종 목록 URL), 7장(`SortHeaderLink`·링크 모드), 9-2 `/industries/[division]/compare`, 12장 5번 문구(없는 업종 404), PRD F-08·F-15.
- **만들 파일:** `web/lib/params.ts`(추가: `parseListParams`·`toListQuery`·`INDUSTRY_COMPANY_SORTS`·`INDUSTRY_METRIC_SORTS`·`isDivisionCode`), `web/tests/params.test.ts`(추가), `web/lib/data/industry.ts`(`getIndustryTree`·`getIndustryCompanies`·`getIndustryMetrics`·`getDivisionName` — 12단계에서도 사용하니 지금 4개 모두), `web/components/SortHeaderLink.tsx`, `web/components/DataTable.tsx`·`Pagination.tsx`·`PageSizeSelect.tsx`(링크 모드 추가), `web/app/industries/[division]/compare/page.tsx`(서버, `revalidate = 3600`).
- **주의점:** 정렬·페이지는 **URL 쿼리 링크 + 서버가 다시 그림** (API Route 없음). 열 제목 링크: 같은 열이면 `dir` 뒤집기, 다른 열이면 그 열 `asc`, `page=1`. `isDivisionCode` 아니면 `notFound()`. 이름이 없거나 0행이면서 `page=1` → `notFound()`, 0행인데 `page>1` → 마지막 페이지로 `redirect`(1페이지를 다시 조회해 `total_count`). 제목 `{division_name} 회사 {total}개`, `generateMetadata` `{division_name} 지표 비교 · 재무 레이더`. 열 제목 `{기준 연도}년`은 `fiscal_year` 최빈값, 회사 연도가 다르면 칸에 작게. 금융회사 행은 `-`.
- **완료 조건:** C5 + 임시 서버에서 `/industries/26/compare`·`?sort=debt_ratio&dir=desc&page=2&size=20`·`/industries/99/compare`(404)·`/industries/abc/compare`(404)·`?page=9999`(redirect) HTML/상태 확인.
- **Checker 확인 (PRD F-08):** 정렬 null 맨 뒤, 제목 회사 수 N이 F-15 목록(12단계)과 같아야 함(SQL `total_count`로 확인), `params.test.ts` 목록 케이스(허용 밖 sort → name, size·page 바로잡기, 왕복).

### 8. F-09 `ValuationSection`

- **참조:** FS 4-1(4번 `v_valuation`), 9-3, 6-3(`per`·`pbr` 범위), PRD F-09 수용 기준·문구·툴팁, PRD 10장 13번(주가 정보 없음), FS 12장 동작 기본안 1번(비교 한 줄 쓰지 않음), 10장 `gauge.test.ts` 추가분.
- **만들 파일:** `web/lib/data/stock.ts`(4번 조회, `valuation` 필드), `web/components/ValuationSection.tsx`, `web/app/stocks/[code]/page.tsx`(연결), `web/tests/gauge.test.ts`(추가: per 80배 → `high`, pbr 기준선 1), `web/lib/copy.ts`(`copy.valuation.*`).
- **주의점:** 제목 우측 `주가 {basDt} 기준 · 순이익·자본 {latestYear}년 기준`, "보통주 시가총액 기준". `valuation === null` → "주가 정보가 없어.". `per === null` → "순이익이 적자여서 PER을 계산하지 않아.", `pbr === null` → "자본총계가 0 이하라서 PBR을 계산하지 않아.". PER·PBR **글자 판정(싸다·비싸다) 금지**, 업종 가운데 값은 `Gauge median`으로 표시만. PER은 기준선 없음, PBR 기준선 1(툴팁). `data-tour="valuation"` 속성을 영역 전체에 단다(13단계 대비). 금융회사도 똑같이 표시.
- **완료 조건:** C5 + 삼성전자·적자 회사·자본총계 ≤ 0 회사·시세 없는 종목(Admin이 SQL로 찾음) 4가지 HTML 확인, PER·PBR 값이 `v_valuation`과 일치.
- **Checker 확인 (PRD F-09):** 수용 기준 항목, 금지: "저평가·고평가·싸다·비싸다" grep, `Gauge` aria-label에 배 단위.

### 9. F-14 `DividendCard`

- **참조:** FS 4-1(6번 `dividends`), 6-9(`dividend.ts`), 9-4, PRD F-14 수용 기준·문구·툴팁, PRD 10장 14번(확인 필요), 10장 `dividend.test.ts`.
- **만들 파일:** `web/lib/dividend.ts`, `web/tests/dividend.test.ts`, `web/lib/data/stock.ts`(6번 조회 추가, 서버에서 화면 연도만 고름), `web/components/DividendCard.tsx`, `web/app/stocks/[code]/page.tsx`(연결), `web/lib/copy.ts`(`copy.dividend.*`).
- **주의점:** 표는 `dps_status`/`yield_status` 조합 표(FS 6-9) 그대로 — `paid/value`, `paid/not_disclosed`("공시 없음"+툴팁, 직접 계산하지 않음), `none`("없음"), `check`("확인 필요"). 열은 **행이 있는 화면 연도만**, `sourceYear` = `source_bsns_year` 최댓값. kind 3가지(`table`·`all_none`·`no_data`). 제목 "배당 (보통주 기준)" + "{sourceYear}년 사업보고서 기준". `<table>` + `<th scope>`. 카드는 `status='ok'`면 항상 그린다. `data-tour="dividend"`. "배당 권유" 같은 표현 금지.
- **완료 조건:** C5 + 배당 있는 회사·무배당 회사·행 없는 회사·`not_disclosed` 회사(Admin SQL로 선정)의 HTML 확인. `dividend.test.ts` 케이스(행 0 → no_data, 3년 모두 none → all_none, 2년만 행 → table, paid+not_disclosed, check, sourceYear 최댓값).
- **Checker 확인 (PRD F-14):** 값이 `dividends` 테이블과 일치(SQL 대조), 고정 설명 문구 PRD와 같음.

### 10a. F-17 사전 확인 (DART `list.json`)

- **목표:** PRD 11장 19·20번(지분공시 거르는 방법·"공시 더 보기" 링크 형식)을 실제 응답으로 확인한다. FS 9-5는 이 확인 뒤 `excludeOwnershipDisclosures` 기준을 정한다.
- **담당:** Coder가 `scripts/dart_list_check.py`(표준 라이브러리, `batch.common.load_env`·`mask` 재사용, `python-batch.md` 스타일)를 만들고 Admin이 실행. 결과(키 가린 응답 샘플)를 `api_check_results/`(git 제외)에 저장.
- **확인할 것:** (1) 삼성전자 `corp_code=00126380`·중소 코스닥 1곳·공시 거의 없는 회사의 `list.json` 응답 필드(`report_nm`·`rcept_no`·`flr_nm`·`rcept_dt`·`rm`·`pblntf_ty` 등), `status` 000/013 (2) 지분공시(임원·주요주주 소유보고, 대량보유 등)를 `pblntf_ty`(공시 유형) 요청 파라미터로 거를 수 있는지, 아니면 `report_nm` 문자열(예: "임원ㆍ주요주주특정증권등소유상황보고서")로 응답에서 거르는지 (3) `page_count` 최대 100, 최신 5개를 채우려면 몇 개 받아야 하는지(표본 10종목) (4) `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=` 원문 링크가 열리는지, 회사 공시 목록 링크 형식(`dsab007/…` 등)은 DART 사이트 확인 후 안 되면 "공시 더 보기" 링크를 숨김(FS 9-5 기본)
- **출력:** Admin이 결론을 Coder 지시에 포함(10b의 `disclosure.ts` 상수). 문서 반영은 문서 작성 에이전트에 요청(PRD 11장 19·20번 해소).
- **완료 조건:** 스크립트가 키 값을 출력하지 않음(`grep -c "crtfc_key=" api_check_results/*`에서 값이 `***`), 결론 3줄이 Admin 메모에 기록됨.
- **Checker 확인:** 저장된 응답에 키 문자열이 평문으로 없는지 `grep`, `.gitignore`에 `api_check_results/`.

### 10b. F-17 `disclosures.ts`·`DisclosureList`·`StockFeedSection`

- **참조:** FS 3-3(성공만 캐시하는 함수 단위 캐시), 6-14, 9-5, 10장 `disclosure.test.ts`, PRD F-17 수용 기준, PRD 5-8, PRD 10장 22·26·27·32번(문구), 9-1(`StockFeedSection` 위치).
- **만들 파일:** `web/lib/disclosure.ts`(10a 결론을 상수로), `web/tests/disclosure.test.ts`, `web/lib/data/disclosures.ts`(server-only, `unstable_cache`로 안쪽 함수 캐시: 성공 `000`·`013`만 값 반환, 그 밖 throw → 바깥에서 `{ status: 'error' }`), `web/components/DisclosureList.tsx`, `web/components/StockFeedSection.tsx`(PC 2열: 왼쪽 기사 자리·오른쪽 공시, 좁은 화면 1열(기사 위), 칸마다 `<Suspense fallback={<Skeleton/>}>`), `web/app/stocks/[code]/page.tsx`(연결, `no_financials`에서도 표시, `foreign`·`ReadingTour`는 제외), `web/lib/copy.ts`(`copy.disclosure.*`), 루트 `.env.example`에 `DART_OPENAPI_KEY` 이미 있음 확인.
- **주의점:** `corpCode` null → `ok` + 빈 목록(0건 문구). `DART_OPENAPI_KEY` 없으면 `error`(로그에 변수 이름만). 5초 타임아웃(`AbortSignal.timeout(5000)`). 응답은 `unknown`으로 받아 필드가 문자열인지 검사, **모양이 틀린 줄이 있으면 전체를 error**. 줄 `{title} · {filer} · {date}` 전체 링크 `target="_blank" rel="noopener noreferrer"`, 공시 제목은 받은 그대로. 요청 URL·키를 로그에 남기지 않음(상태 코드·DART `status`만). 기사 칸 자리는 11b까지 **비워 두는 `StockNews` 자리표시** 없이 열 하나만 그려도 되지만 레이아웃이 2열로 유지돼야 한다(11b에서 왼쪽 채움). "공시 더 보기 →"는 10a 결론에 따라 링크 또는 숨김.
- **완료 조건:** C5 + 삼성전자·공시 적은 회사·`corp_code` 없는 종목에서 공시 칸 HTML 확인(실제 DART 호출 포함, 키가 있어야 함), 키 환경변수를 비워 기동했을 때 칸에 실패 문구만 나오고 페이지는 200.
- **Checker 확인 (PRD F-17):** 지분공시가 목록에 없음, 5개, 최신순, 링크가 DART 원문, 실패 문구·0건 문구, 캐시가 실패를 저장하지 않는 구조(안쪽 throw / 바깥 catch), 요청 URL 로그 없음(`grep -rn "console\." web/lib/data`로 점검), `.next/static`에 `crtfc_key` 없음.

### 11a. F-18 `news-text.ts`·`news.ts` (키 없으면 꺼짐)

- **참조:** FS 6-13, 9-6, 3-3, 10장 `news-text.test.ts`, PRD F-18 수용 기준, PRD 5-1·5-8, 10장 21~25·28~32번, PRD 11장 15~18·21번 (확인 못 한 것은 "확인 뒤 정함").
- **만들 파일:** `web/lib/news-text.ts`(`cleanNewsTitle`·`newsDomain`·`newsHref`·`formatPubDate`·`isShortName`·`parseNewsPage`·`naverNewsSearchUrl`, `NEWS_PAGE_SIZE = 10`·`NEWS_MAX_PAGE = 100`), `web/tests/news-text.test.ts`, `web/lib/data/news.ts`(server-only: `searchNews`·`getHomeNews`·`getNewsPage`·`getStockNews`, 함수 단위 캐시 30분/1시간), `web/lib/copy.ts`(`copy.news.*`), 루트 `.env.example`에 `NAVER_API_HUB_KEY_ID=`·`NAVER_API_HUB_KEY=` 이름만 추가.
- **주의점:**
  - **네이버 약관 (코드로 지켜야 함):** 받은 **순서·개수 그대로** 변환만(빼기·정렬·내용 수정·결과 사이 삽입 금지), 저장 금지(DB·파일·로그 없음, 로그는 HTTP 상태 코드만), 광고·수익화 없음, **AI 입력 금지** → 이 모듈을 `lib/chat.ts`·`lib/data/chat.ts`·`app/api/chat`에서 import하지 않는다(14b에서 테스트로 보장).
  - 키 두 개(`NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`) 없으면 호출하지 않고 `{ status: 'error' }` (앱은 정상). **키가 없어서 실제 응답을 확인할 수 없다 → FS의 응답 필드(`title`·`originallink`·`link`·`description`·`pubDate`·`total`)로 방어적으로 구현**하고 필드가 문자열이 아니면 error로 본다. `HOME_NEWS_QUERY`는 상수 1개(초안 `경제 정책`, PRD 11장 17번 검증 전 임시) — 주석에 "표본 검증 전 초안" 명시.
  - `cleanNewsTitle`: 태그 제거 → 엔티티 디코딩(이름·숫자), 태그 아닌 `<` 글자 유지. `formatPubDate`는 한국 시간 `YYYY-MM-DD HH:mm`. `isShortName`: 한글 2글자 이하, 영문·숫자만 3글자 이하 (상수로).
  - 엔드포인트·헤더는 FS 9-6 그대로(`https://naverapihub.apigw.ntruss.com/search/v1/news`, `X-NCP-APIGW-API-KEY-ID`·`X-NCP-APIGW-API-KEY`), 5초 타임아웃.
- **완료 조건:** C5. `news-text.test.ts`: `<b>` 제거, `&quot;`·`&amp;`·`&#39;` 디코딩, `<` 유지, `www.` 떼기, `originallink` 빈 값 → `link`, 한국 시간 변환(UTC 경계), `isShortName` 경계(한글 2·3, 영문 3·4, 혼합), `parseNewsPage` 범위. 키 미설정으로 `getHomeNews()`가 error 반환(임시 스크립트 말고 단위 테스트에서 환경변수 없이 호출하지 않는다 — 이 함수는 server-only라 테스트 대상 아님. 11b 임시 서버 확인으로 대체).
- **Checker 확인 (PRD F-18):** 위 약관 항목을 코드에서 확인(정렬·필터 호출 없음 `grep -n "sort(\|filter(\|slice(" web/lib/data/news.ts`로 변환 외 조작이 없는지, 저장·로그 없음), 키 이름이 `.env.example`에 있고 값 없음.

### 11b. F-18 화면 (`NewsList`·`NewsBlock`·`NaverAttribution`·`HomeNews`·`StockNews`·`/news`)

- **참조:** FS 9-6 컴포넌트 표·`/news`, 9-1(`StockFeedSection`), PRD F-18 수용 기준·문구, PRD 10장 21~25·28~32번, 3-3 라이선스 표시.
- **만들 파일:** `web/components/NewsList.tsx`, `NewsBlock.tsx`, `NaverAttribution.tsx`, `HomeNews.tsx`, `StockNews.tsx`, `ShortNameNotice.tsx`, `web/app/news/page.tsx`(서버, `revalidate = 1800`, `generateMetadata` `경제 기사 · 재무 레이더`), `web/app/page.tsx`(바로가기 줄 아래 `HomeNews` 추가, `revalidate = 1800`), `web/components/StockFeedSection.tsx`(왼쪽에 `StockNews`), `web/public/naver-logo.*`(**BI 가이드 로고 파일은 사용자가 제공해야 함** → REQUIRE.md. 로고가 없으면 `NaverAttribution`은 "네이버 검색" **텍스트 + 네이버 링크**만 표시하고 이미지 태그는 파일이 있을 때만), `web/lib/copy.ts`.
- **주의점:** 제목은 **텍스트 노드로만**(`dangerouslySetInnerHTML` 금지), 줄 `{title} · {domain} · {time}` 전체가 `<a target="_blank" rel="noopener noreferrer">`(`href` 없으면 링크 없이), 줄 사이에 다른 요소 삽입 금지, 썸네일·요약 없음. `NewsBlock`: 칸 제목 + 안내 "언론사 기사를 네이버 검색으로 그대로 보여주는 거야. 이 서비스의 의견이 아니야." + `NaverAttribution` + 결과/실패 "지금은 기사를 불러올 수 없어."/0건 "찾은 기사가 없어.". 짧은 종목명은 `ShortNameNotice`만. `/news`: 10개씩, `Pagination` 링크 모드(`?page=`), 마지막 페이지 `min(NEWS_MAX_PAGE, ceil(total/10))`, `total` null이면 "다음"만(10개 미만이면 숨김). **상단 메뉴에 넣지 않는다.** 출처 푸터 네이버 문구는 **추가하지 않음**(사용자 확인 전).
- **완료 조건:** C5 + 키 없이 기동: `/`·`/news`·삼성전자·짧은 이름 종목(Admin이 SQL로 선정)에서 기사 칸 실패 문구만 나오고 페이지 200. 키가 생기면(사용자 REQUIRE) 실제 응답으로 PRD 11장 15~18·21번 확인 후 11a 상수 조정 — **이 확인은 키 도착 뒤의 후속 작업**으로 REQUIRE.md에 남김.
- **Checker 확인 (PRD F-18):** 가공 금지 항목 점검, 안내 문구 정확, `/news` 메뉴 미포함(`AppHeader` grep), 짧은 종목명 안내, `rel="noopener noreferrer"`, 칸마다 `Suspense`, 한 칸 실패가 다른 칸·페이지에 영향 없음(키 없는 상태에서 `/stocks/005930`이 200이고 공시 칸은 정상).

### 12. F-15 업종으로 둘러보기

- **참조:** FS 9-7, 5-3·5-4(7a에서 적용), 7장 `AppHeader` 3번째 메뉴, PRD F-15 수용 기준·문구, FS 12장 5번.
- **만들 파일:** `web/app/industries/page.tsx`(서버, `revalidate = 3600`, `<details>` 대분류 처음엔 모두 닫힘), `web/app/industries/[division]/page.tsx`(회사 목록, 링크 모드, `revalidate = 3600`), `web/components/AppHeader.tsx`(3번째 메뉴 "업종으로 둘러보기", `/industries…` 전부에서 `aria-current`), `web/app/page.tsx`(바로가기 2번째 줄 "회사 이름을 모르겠다면? 업종으로 둘러보기 →"), `web/components/StockHeader.tsx`(업종 이름 `<Link href="/industries/{division_code}">` + `Tooltip`), `web/lib/copy.ts`(`copy.industry.*`).
- **주의점:** 대분류 이름은 `cleanSectionName`(화면용만 공백 정리), 중분류 이름은 그대로(**분류 이름 줄이기·바꾸기 금지**, 라이선스 변경 금지). `(회사 {n}개)` 쉼표. 회사 목록: 종목명(링크)·종목코드·시장·시가총액, `시가총액은 보통주 기준, 주가 {bas_dt} 기준`(모두 null이면 줄 생략), "지표로 견줘 보기 →"는 compare로. 없는 업종·0개 → `notFound()`(문구 FS 12장 5번), 페이지 넘침 → 마지막 페이지 redirect. 대분류 회사 수 = 중분류 합산(앱에서).
- **완료 조건:** C5 + `/industries`·`/industries/26`·`?sort=market_cap&dir=desc&page=2&size=20`·`/industries/99`(404) 확인, `/industries` 전체 회사 수 합 = SQL 값, 종목 화면 업종 링크가 `/industries/{코드}`.
- **Checker 확인 (PRD F-15):** 외국회사·분류표 밖 코드 제외, 금융회사 포함, 대분류→중분류 구조, 3진입점(메뉴·바로가기·종목 화면), 회사 수가 compare 제목 수와 같음.

### 13. F-16 읽는 순서

- **참조:** FS 6-11, 9-8, 9-1(`data-tour` 위치), PRD F-16 수용 기준·문구, 10장 `tour.test.ts`.
- **만들 파일:** `web/lib/tour.ts`, `web/tests/tour.test.ts`, `web/components/ReadingTour.tsx`(클라이언트), `web/components/ResultsCharts.tsx`(`data-tour="sales"`는 매출액 그래프, `data-tour="profit"`은 영업이익·순이익 그래프 둘을 감싼 요소), `web/components/MetricRow.tsx`/`ReportCard.tsx`(`data-tour="debt"`는 부채비율 `MetricRow` 또는 완전 자본잠식 상자), `web/components/StockHeader.tsx`(`ReadingTour` 연결, `status='ok'`만), `web/app/globals.css`(driver.js 기본 CSS를 불러오고 무채색으로 덮기, 640px 미만 말풍선 하단 고정), `web/lib/copy.ts`(`copy.tour.*`), 의존성 `driver.js`(정확한 버전 고정).
- **주의점:** 알림 띠는 마운트 뒤 `localStorage[TOUR_SEEN_KEY]`를 읽어 없을 때만 그림(서버 렌더 때는 없음, 정보 줄 아래 흐름 안), ✕·[읽는 순서 보기]·"읽는 순서" 버튼 중 하나를 누르면 `'1'` 저장 후 띠 숨김. 읽기·쓰기 모두 `try/catch`(실패하면 그 화면에서만 숨기고 동작 계속, **빈 catch 금지 — 상태를 바꾼다**). `import('driver.js')`는 **누를 때** 동적 로드. `document.querySelectorAll('[data-tour]')`로 있는 키를 모아 `buildTourSteps`. driver 설정: `showProgress`, 진행 `{{current}}/{{total}}`, 버튼 "이전"/"다음"/"끝", "건너뛰기"는 `onPopoverRender`에서 추가. **기사·공시 칸에는 `data-tour`를 달지 않는다.** 금융회사는 `sales`·`debt`가 화면에 없어 자연히 3단계(판별 기준에 기대지 않음).
- **완료 조건:** C5 + `tour.test.ts`(5개 모두 1/5~5/5, 금융회사 3단계 + `profit` 금융회사 문구, 중간 하나 빠짐 → 번호 다시 매김) + HTML에 `data-tour` 5종이 일반 회사에 있고 금융회사에 3종.
- **Checker 확인 (PRD F-16):** `localStorage` 접근이 모두 `try/catch`, 띠가 서버 렌더에 없음, 투어 키 1개(`reading-tour-seen`), 번들 크기 영향(driver.js가 첫 로드 청크에 포함되지 않았는지 `npm run build` 출력의 페이지별 크기 확인). 실제 투어 동작·모바일 말풍선은 사용자 수동 항목.

### 14a. F-10 마이그레이션 5-6

- **참조:** FS 5-6, PRD 5-7, PRD 10장 33번.
- **만들 파일:** `supabase/migrations/20261121030000_chat_usage.sql` (`chat_usage_daily` + `chat_usage_take(p_limit int) returns boolean`: RLS 켜고 정책 없음, `anon`·`authenticated` 권한 회수, 한 문장 upsert로 상한 안 넘음, `execute`는 **`service_role`만**).
- **완료 조건 (Admin, 사용자 확인 후 적용):** `select chat_usage_take(2)` 세 번 → `true, true, false`, 확인 뒤 오늘 행 삭제(`delete from chat_usage_daily where day = current_date`). 익명 키로는 호출 불가(advisors 재확인). `types.ts` 재생성.
- **Checker 확인:** grant 문, `search_path = ''`, 위 결과 기록.

### 14b. F-10 `chat.ts`·`/api/chat`

- **참조:** FS 6-10, 9-9(`POST /api/chat`), 10장 `chat.test.ts`·`chat-isolation.test.ts`, PRD F-10 전체(규칙 1~6·지원하지 않는 조건 4개·예시 3개·문구), PRD 10장 19·33번.
- **만들 파일:** `web/lib/chat.ts`(`CHAT_DAILY_LIMIT = 40`·`CHAT_MAX_INPUT = 200`·`UNSUPPORTED_KINDS`·`CHAT_EXAMPLES`·`normalizeChatInput`·`parseChatOutput`·`applyChatRules`), `web/tests/chat.test.ts`, `web/tests/chat-isolation.test.ts`, `web/lib/data/chat.ts`(server-only: `askModel` 캐시 86400초·키는 정규화 문장), `web/app/api/chat/route.ts`, `web/lib/copy.ts`(`copy.chat.*`), 루트 `.env.example`에 `OPENROUTER_API_KEY=` 추가.
- **주의점:**
  - 처리 순서: 정규화 → 캐시 안쪽(키 없으면 throw → `chat_usage_take` false면 throw → OpenRouter 호출 5초 → `parseChatOutput` null이면 throw) → throw는 `200 { status: 'unavailable' }`, 성공은 `applyChatRules` 후 `200 { status:'ok', filters, conflict, truncated, unsupported, notCondition }`. **호출 수는 AI를 부르기 전에 센다.** 응답 `Cache-Control: no-store`.
  - **OpenRouter 주소·`response_format` 지원·무료 모델명(`CHAT_MODEL` 상수)은 추측하지 않는다.** 공식 문서(WebFetch)로 확인한 값을 쓰고, 확인 못 하면 상수에 후보와 "구현 전 확인 필요" 주석, **키가 없으면 어차피 꺼짐**. 확인은 Admin이 하고 Coder에게 값을 준다.
  - AI 요청에는 **사용자 문장과 필터 20개 목록·지원 종류 4개·출력 JSON 형식만**. 기사 데이터 금지. `lib/chat.ts`·`lib/data/chat.ts`·`app/api/chat/route.ts`에서 `data/news`·`news-text`를 import하지 않는다 (`chat-isolation.test.ts`가 텍스트로 검사).
  - 로그에 사용자 문장·AI 응답 원문 금지(결과 종류 `ok/limit/error/timeout`만). 입력 검증: 문자열·trim 후 1~200자, 어기면 400.
  - `parseChatOutput`: JSON 아님·모양 틀림 → null, 모양이 맞으면 1~20 밖·모르는 코드·중복만 그 항목만 버림(순서 유지). `applyChatRules`: 13+14 → 14만, `CONFLICTS` 짝 → `filters=[]`+`conflict`, 4개 이상 → 앞 3개+`truncated`, `notCondition` → `filters=[]`.
- **완료 조건:** C5 + `chat.test.ts`·`chat-isolation.test.ts` 통과 + 키 없이 `curl -X POST …/api/chat -d '{"text":"빚이 적은 회사"}'` → `{"status":"unavailable"}`(200), 빈 text 400, 201자 400. (키가 있으면 실제 호출 1~2회로 확인하되 문장·응답을 기록에 남기지 않음.)
- **Checker 확인 (PRD F-10):** `CHAT_EXAMPLES`가 PRD 3개(13+1, 8, 20)와 같음, 규칙 문구 PRD와 같음, import 격리(grep `news` in chat 파일), 키·사용자 문장 로그 없음(`grep -n "console\|logger" web/app/api/chat web/lib/data/chat.ts`).

### 14c. F-10 `ChatFilterInput`

- **참조:** FS 9-9 `ChatFilterInput` 표, FS 12장 6번("찾기"), 동작 기본안 3·4번, PRD F-10 문구·수용 기준.
- **만들 파일:** `web/components/ChatFilterInput.tsx`, `web/components/ScreenerClient.tsx`(수정: 맨 위에 삽입, 필터 상태 공유), `web/lib/copy.ts`.
- **주의점:** 입력창 `maxLength=200`, 외부 AI로 보낸다는 안내문("적은 문장은 조건을 찾으려고 외부 AI 서비스로 보내져.", PRD 문구 그대로), 예시 3개는 **AI 없이** `CHAT_EXAMPLES`로 선택을 바꿈, `ok`일 때 **선택을 AI가 고른 필터로 바꾸고**(앞 선택 이어받지 않음) `page=1`, "이 조건으로 찾았어: …", `conflict`·`notCondition`·`truncated`·`unsupported`별 고정 문구 줄, 결과 줄 `aria-live="polite"`, `unavailable`/네트워크 오류 → 입력창·예시를 이 화면에서 숨기고 규칙 6 문구(필터 버튼은 그대로). 조회 중 버튼 비활성.
- **완료 조건:** C5 + 키 없는 상태로 `/screener` HTML에 입력창·예시가 있고 예시 클릭 동작은 사용자 수동 확인. (키 없음 → 제출 시 규칙 6 문구가 보이는지 수동.)
- **Checker 확인 (PRD F-10):** 안내 문구·예시 문구 PRD와 일치, 챗봇이 필터 버튼과 같은 상태를 쓴다(별도 상태 없음), 오류 시 필터 사용 가능.

### 15. 2차 마무리

- **Admin:** `scripts/run-web.sh build` → `restart`, 접속 3경로 확인.
- **Checker:** PRD 9장 표본 대조에 **배당 포함**(20종목 중 배당 값 일치율), PRD F-08·F-09·F-14·F-17·F-18·F-15·F-16·F-10 수용 기준 표(통과/미통과/키 필요로 보류), PRD 8장 속도(종목 화면 첫 표시 2초 — `curl -w "%{time_total}"` 5회 평균), 키 없는 기능(F-18·F-10)이 꺼진 상태에서 나머지 정상.
- **사용자 수동 확인 요청 목록:** 투어 동작, 업종 목록 `<details>`, 기사·공시 칸 레이아웃, 모바일 폭.
- **Admin:** 문서 작성 에이전트에게 진행 반영 요청.

### 16a. F-11 마이그레이션 5-7 + Supabase 설정 안내

- **참조:** FS 5-7, 9-11, PRD F-11, PRD 5-6.
- **만들 파일:** `supabase/migrations/20261121040000_auth_user_settings.sql` (`handle_new_user()` `security definer` + 트리거 `on_auth_user_created` + 기존 사용자 보정, 함수 `execute`를 `public`·`anon`·`authenticated`에서 회수).
- **완료 조건 (Admin, 사용자 확인 후 적용):** 테스트 계정은 아직 못 만든다(16c 이후) → SQL로 `select tgname from pg_trigger where tgname='on_auth_user_created'`, advisors(함수 노출·`search_path`) 확인.
- **REQUIRE.md 기록 (사용자 작업):**
  1. Supabase 대시보드 → Authentication → URL Configuration: **Site URL**을 접속 주소(기본안 `http://100.124.240.114:16000`)로, **Redirect URLs**에 `http://100.124.240.114:16000/auth/callback**`·`http://192.168.0.6:16000/auth/callback**`·`http://localhost:16000/auth/callback**`.
  2. Authentication → Email Templates → Magic Link 템플릿의 링크를 `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`로 (FS 9-11, **다른 기기에서 열기 위한 token_hash 방식**). 메일 제목·본문은 PRD F-11 문구(존댓말).
  3. 커스텀 SMTP(Gmail): 과제용 Gmail 계정 앱 비밀번호. (설정 전에는 Supabase 기본 메일의 시간당 발송 한도가 낮아 개발 테스트만 가능.)
  4. `.env`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가 (publishable 키는 Admin이 MCP `get_publishable_keys`로 알려 줄 수 있음. **사용자가 `.env`에 넣는다** — Admin·Coder는 `.env`를 열지 않는다).
  5. `SITE_URL`·`GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD` (18c용, GitHub Secrets).
- **Checker 확인:** 위 SQL 결과, REQUIRE.md 항목 기록 여부.

### 16b. F-11 세션·proxy·callback

- **참조:** FS 9-10, 9-11(`/auth/callback`), 6-12(`auth.ts`), 4-2(CSRF·401·`private, no-store`), 10장 `auth.test.ts`, PRD F-11.
- **만들 파일:** 의존성 `@supabase/ssr`(고정 버전), `web/lib/auth.ts`(`safeNextPath`·`isWatchCodeFormat`·`buildLoginRedirect`·`isSameOrigin`), `web/tests/auth.test.ts`, `web/lib/supabase/session.ts`(server-only, `createServerClient(NEXT_PUBLIC_*, { cookies })`), `web/lib/supabase/browser.ts`, `web/proxy.ts`(Next.js 16이면 `proxy.ts`, 아니면 `middleware.ts`; **matcher: `/mypage`, `/auth/:path*`, `/api/me`, `/api/watchlist`, `/api/settings`, `/api/notifications/:path*`, `/api/account/:path*` 만** — 공개 화면 넣지 않음), `web/app/api/me/route.ts`, `web/app/auth/callback/route.ts`, `web/lib/api-guard.ts`(Route 공통: 401·`Origin`/`Host` 검사 403·`Cache-Control: private, no-store`), `.env.example`에 `NEXT_PUBLIC_SUPABASE_URL=`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` 추가.
- **주의점:**
  - 사용자 확인은 `supabase.auth.getUser()` (`getSession` 금지). `/api/me`: 로그인 전 `{ loggedIn:false }`, 후 `{ loggedIn:true, unreadCount }`(이메일 내려주지 않음).
  - `/auth/callback`: `safeNextPath(next)` → `verifyOtp({ token_hash, type:'email' })` 실패 시 `redirect(next?login=expired)` → `watch`가 있으면 자동 등록(17a) → `redirect(next)`. 17a 전까지 `watch` 처리는 **함수 자리만**(`autoWatch(...)`를 17a에서 채움).
  - `safeNextPath`: `/`로 시작·`//`·`/\` 거부·URL 해석 뒤 호스트 불변, 그 밖은 `/`. `isWatchCodeFormat`: `^[0-9A-Z]{6}$`. `buildLoginRedirect(origin, next, watch?)`: 항상 `?next=` 포함.
  - **`isSameOrigin`**: `Origin` 헤더의 호스트(포트 포함)가 `Host` 헤더와 같은지 (본 계획 상단 표 참조). `Origin`이 없으면 거부(상태 변경 요청 한정).
  - 공개 화면이 쿠키를 읽지 않아야 함(`/`·`/stocks`·`/screener` 소스에 `cookies()` 없음).
- **키 없음 처리:** `NEXT_PUBLIC_SUPABASE_*`가 없으면 `/api/me`는 `{ loggedIn:false }` 200 (앱이 죽지 않게, 변수 이름만 로그).
- **완료 조건:** C5 + `auth.test.ts`(`/stocks/005930` 통과, `//evil.com`·`/\evil.com`·`https://…`·빈 값·`/`로 시작 안 함 → `/`, `005930`·`0220W0` 통과·5·7자리·소문자·기호 거부, `buildLoginRedirect`가 `?next=` 포함, `isSameOrigin` 케이스) + 임시 서버 `curl /api/me` → `{"loggedIn":false}`, `curl -I /stocks/005930`의 헤더에 `Set-Cookie` 없음(공개 화면 캐시 유지) 확인.
- **Checker 확인 (PRD F-11):** 공개 화면 응답에 `Set-Cookie`·`cookies()` 사용 없음, `getSession` 사용 없음(`grep -rn getSession web`), matcher 목록이 FS와 일치, 서버용 키가 `session.ts`에서 쓰이지 않음(publishable 키만).

### 16c. F-11 `AuthMenu`·`LoginDialog`·탈퇴

- **참조:** FS 7장 `AuthMenu`, 9-10·9-11, FS 12장 7·8·9번, PRD F-11 문구(존댓말)·수용 기준, PRD 10장 17번(개인정보 안내).
- **만들 파일:** `web/components/AuthMenu.tsx`(클라이언트, 화면이 뜬 뒤 `GET /api/me`, 응답 전에는 폭 고정 자리, `?login=expired|required` 쿼리로 `LoginDialog` 열고 쿼리 제거, 로그아웃은 `browser.auth.signOut()` 뒤 `/mypage`면 `/`로), `web/components/LoginDialog.tsx`(HTML `<dialog>`, `showModal`, 상태 4개: 입력·보내는 중·보냄(재전송 60초 카운트다운)·실패), `web/app/api/account/delete/route.ts`(POST, 세션 확인 401, `auth.admin.deleteUser`, 쿠키 삭제, 204), `web/components/AppHeader.tsx`(오른쪽 `AuthMenu`), `web/lib/copy.ts`(`copy.auth.*` 존댓말).
- **주의점:** `signInWithOtp({ email, options: { emailRedirectTo: buildLoginRedirect(location.origin, 현재 경로, watch), shouldCreateUser: true } })`. 이메일 형식 오류는 보내기 전에 브라우저 검사(FS 12장 8번). 로그인·계정 화면은 **존댓말**. 탈퇴 확인 `<dialog>` "탈퇴하면 추적 종목과 알림 기록이 모두 지워집니다. 탈퇴할까요?"(PRD 문구 그대로). 공개 화면이 AuthMenu 때문에 쿠키를 읽으면 안 된다(클라이언트가 API로 물음).
- **완료 조건:** C5 + 임시 서버에서 `/` HTML에 `AuthMenu` 자리(서버 렌더는 로그인 전 상태 아님·폭 고정), `POST /api/account/delete` 로그인 없이 → 401, `Origin` 없이 POST → 403. **로그인 흐름 전체(메일 수신→링크→로그인, 다른 기기에서 링크 열기)는 REQUIRE.md의 Supabase 설정 완료 후 사용자 수동 확인.**
- **Checker 확인 (PRD F-11):** 존댓말, 개인정보 안내 문구, 만료 문구, 탈퇴 확인 문구, `<dialog>` 접근성(`aria-labelledby`), `Origin` 검사 적용 라우트 목록(`account/delete`).

### 17a. F-12 추적 API·`WatchButton`·자동 등록

- **참조:** FS 9-12 상반부(`WatchButton`·`/api/watchlist`·자동 등록·`/api/settings`), 4-2(401·404·403), PRD F-12 수용 기준, FS 12장 10번.
- **만들 파일:** `web/app/api/watchlist/route.ts`(GET `?code=`·POST·DELETE), `web/app/api/settings/route.ts`(PATCH `{ emailOptIn }`), `web/components/WatchButton.tsx`(클라이언트), `web/lib/data/watch.ts`(검색 대상 확인·`crno` 조회, 서버용 키는 공개 데이터 읽기에만), `web/app/auth/callback/route.ts`(자동 등록 채우기), `web/components/StockHeader.tsx`(오른쪽 `WatchButton`, `status`가 `ok`·`no_financials`일 때만), `web/lib/copy.ts`(`copy.watch.*`).
- **주의점:** 사용자 테이블은 **세션 클라이언트(publishable 키 + RLS)**, 공개 데이터는 서버용 키. POST: 형식 400, 검색 대상 아님·외국회사 404, PK 충돌(`23505`)은 201 같게, 트리거 상한(`P0001`) → 409 `{ "error": "limit" }`("추적 종목은 20개까지 등록할 수 있어."). DELETE 없어도 204. 상태 변경 라우트는 `isSameOrigin` 검사. 자동 등록 상한 걸리면 `next?watch=limit`, 그 밖 실패는 조용히 `next`로 (로그인 성공은 유지). `WatchButton`: 로그인 전 누르면 `LoginDialog reason='watch' watch={code}`, `aria-pressed`, `?watch=limit` 쿼리 처리 후 제거.
- **완료 조건:** C5 + 임시 서버 `curl`: 로그인 없이 `GET /api/watchlist?code=005930` 401, `POST` Origin 없이 403, 형식 틀린 코드 400(세션 없이도 400/401 우선순위는 FS 4-2대로: 401 먼저). **로그인 상태 동작(추적 추가·삭제·20개 상한)은 로그인 가능해진 뒤 사용자 수동 확인 + Admin이 SQL로 `watchlist` 행 확인.**
- **Checker 확인 (PRD F-12):** RLS로 남의 행 접근 불가(코드가 `user_id`를 클라이언트 입력으로 받지 않음), 응답 코드 규칙, 외국회사 추적 불가.

### 17b. F-12 `/mypage`

- **참조:** FS 9-12 하반부(`/mypage`·`getMypage`·`WatchCard`·`MiniBars`·`EmailOptInToggle`), PRD F-12·F-13(알림 영역은 18a에서 완성), FS 12장 9·11·12·13번, 동작 기본안 5·7번.
- **만들 파일:** `web/app/mypage/page.tsx`(서버, `dynamic = 'force-dynamic'`, `getUser()` 없으면 `redirect('/?login=required')`), `web/lib/data/mypage.ts`(`getMypage(userId)`), `web/components/WatchCard.tsx`, `web/components/MiniBars.tsx`(클라이언트, Recharts, 값 라벨 없음·`sr-only` 표), `web/components/EmailOptInToggle.tsx`, `web/components/AccountSection.tsx`(로그아웃·탈퇴), `web/lib/copy.ts`(`copy.mypage.*`).
- **주의점:** 조회 순서 ① `watchlist`(세션, `created_at desc`) ② 서버용 키로 `stocks in(srtn_cd)`(`is_listed` 포함) ③ `company_summary`·`v_company_years`(`is_display_year`) `in(corp_code)` ④ `notifications` 최근 50개(세션) ⑤ `user_settings`(세션). `WatchCard`: 전체 링크, `is_listed=false` → "목록에서 빠짐", 요약 없음 → "재무 데이터 없음", 자본잠식 `full`/`partial` → "완전 자본잠식"/"부분 자본잠식", `insights[0]` 문장 + 2개 이상이면 "외 {N}건". 칸 제목 "추적 종목 ({n}/20)"·"알림"·"알림 설정"·"알림 메일 받기"·"계정". `no-store`. 알림 목록 칸은 18a에서 `NotificationList`로 채우므로 **지금은 자리와 개수만**.
- **완료 조건:** C5 + 로그인 없이 `curl -I /mypage` → 307/302 `/?login=required` 확인. 로그인 후 표시(카드·알림 자리·설정)는 사용자 수동 확인.
- **Checker 확인 (PRD F-12):** 20개 상한 표시, 목록에서 빠짐 표시, 추적 없음 문구, 알림 메일 토글 실패 시 되돌림·FS 12장 10번 문구, 서버용 키 사용 범위(공개 데이터 `stocks`·`company_summary`·`v_company_years`에만).

### 18a. F-13 마이그레이션 5-8 + 알림 UI + 수신 거부

- **참조:** FS 5-8, 9-13 "웹" 표·수신 거부, PRD F-13, FS 12장 12번, PRD 10장 34번(수신 거부 문구).
- **만들 파일:** `supabase/migrations/20261121050000_notification_recipients.sql`, `web/components/NotificationList.tsx`(클라이언트, 초기값 서버), `web/app/api/notifications/[id]/read/route.ts`, `web/app/mypage/page.tsx`(알림 칸 연결), `web/components/AuthMenu.tsx`(`unreadCount`는 이미 있음 확인), `web/app/unsubscribe/page.tsx`(서버, `dynamic`, `robots: noindex`), `web/components/UnsubscribeButton.tsx`(클라이언트), `web/app/api/unsubscribe/route.ts`, `web/lib/copy.ts`(`copy.notification.*`·`copy.unsubscribe.*`).
- **주의점:** 알림 줄: 읽지 않음이면 **"새 알림" 글자 + 굵게**(색만으로 구분 금지), `body`는 텍스트(`white-space: pre-line`), 날짜 `YYYY-MM-DD`, 종목 링크. 줄 누르면 `PATCH …/read` 후 이동(응답 기다리지 않음 `keepalive: true`). 읽음 API: `id` 정수 아니면 400, `read_at is null`만 update, 이미 읽음도 204, 행이 없으면 404. **수신 거부: GET으로는 아무것도 바꾸지 않는다.** 토큰 UUID 형식 검사 → 확인 문구 "알림 메일을 더 받지 않으시겠어요?" + [수신 거부] → `POST /api/unsubscribe { token }`(서버용 키로 `user_settings.email_opt_in=false` `eq('unsubscribe_token')`, 1행 200 / 0행 404 / 형식 400). 수신 거부 화면·메일 문구는 **존댓말**. 로그인 불필요.
- **완료 조건 (SQL은 Admin이 사용자 확인 후 적용):** `notification_recipients()`가 `service_role`로만 실행됨(익명 키 호출 거부 확인), C5, 임시 서버 `curl /unsubscribe?token=abc` → "링크가 올바르지 않습니다.", 올바른 형식이지만 없는 토큰으로 POST → 404, GET 후 DB 변화 없음.
- **Checker 확인 (PRD F-13):** GET 무변경, 존댓말, `Origin` 검사(unsubscribe POST 포함), "새 알림" 표시, 알림 50개 상한, `robots` noindex 확인(HTML `meta`).

### 18b. F-13 배치 `batch/notify.py` + 단위 테스트

- **참조:** FS 9-13 "배치" 표, PRD F-13(알림 문구 표·예시 모양·메일 제목 4가지·dedupe), `.claude/rules/python-batch.md`, 10장 `test_notify.py`, `batch/rules.py`·`batch/recompute.py`(순수/IO 분리 스타일 참고).
- **만들 파일:** `batch/notify.py`(순수 함수만: `results_body`·`delisted_body`·`audit_body`·`audit_changed`·`dedupe_key`·`mail_subject`·`mail_body`), `batch/tests/__init__.py`, `batch/tests/test_notify.py`(`unittest`).
- **주의점:** 표준 라이브러리만, 타입 힌트·`from __future__ import annotations`, 모듈 docstring 한국어, 기준값 상수는 파일 위쪽. 금융회사 본문은 영업이익·순이익만. `audit_changed`: 한 연도 2행 중 하나라도 전년과 다르면 true, **빈 의견 제외, 감사인만 바뀐 것 제외**, 2행 초과 회사(116건) 처리는 PRD 11장 3번 확인 전이라 **현재는 2행 이내만 비교하고 초과는 호출자에게 `None`(판단 보류)을 돌려주는 분기** + 주석. 메일 본문에 출처 + 투자 책임 고지 + 수신 거부 안내(존댓말), 제목은 PRD 4가지 형식. 평가·추천 표현 금지.
- **완료 조건:** `python3 -m unittest discover -s batch/tests -t .` 통과. 케이스: `results_body` 일반·금융회사, `audit_changed`(한 행만 다름·빈 의견·감사인만 바뀜), `mail_subject` 4가지, `dedupe_key` 모양.
- **Checker 확인:** 위 명령 재실행, 순수 함수가 DB·네트워크를 쓰지 않음(`grep -n "import" batch/notify.py`), 본문 문구가 PRD 표와 같음.

### 18c. F-13 `notify_mail.py` + 배치 연결 + `daily.yml`

- **참조:** FS 9-13 표(배치 4행·`daily.yml`·메일 규칙), `batch/common.py`(`Supabase`·`load_env`·`log`·`mask`), `batch/dart_collect.py` 끝부분(`recompute` 호출 근처, 약 515~530행), `batch/krx_list.py`의 `# TODO(F-13)` 자리, `.github/workflows/daily.yml`.
- **만들·고칠 파일:**
  - `batch/notify_mail.py` 신규: `notification_recipients()` RPC → 사용자마다 `emailed_at is null` 알림을 `created_at` 순으로 한 통 → Gmail SMTP(`smtp.gmail.com` SSL, 앱 비밀번호) → 성공한 사용자만 `emailed_at = now()`. **최근 7일 안에 만든 알림만 보내고 오래된 미발송은 `emailed_at`을 채워 건너뜀.** 한 명 실패는 기록하고 다음 사람으로. 상수 `MAIL_DAILY_MAX`(Gmail 한도 확인 전 보수적 기본값 + 주석 "PRD 11장 11번 확인 전"). 텍스트 메일 `text/plain; charset=utf-8`, `List-Unsubscribe` 헤더 없음. 메일 주소·본문을 로그에 남기지 않음(보낸 수·실패 수만). 환경변수 `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL`, 없으면 **조용히 건너뛰고** 로그에 "설정 없음"만(배치 전체 실패로 만들지 않음).
  - `batch/dart_collect.py`: `recompute` 뒤에 이번 실행에서 **최신 사업연도가 새로 생긴 회사** 중 추적 중인 회사 → 추적한 사용자마다 `new_results` 알림, 같은 회사의 새 연도 감사의견이 `audit_changed`면 `audit_change`(새 실적과 별개 줄). 넣기는 PostgREST `Prefer: resolution=ignore-duplicates`(`(user_id, dedupe_key)` unique). **기존 548줄 파일은 쪼개지 말고 연결 함수 하나만 추가**(`notify.py` 순수 함수 재사용, IO는 `batch/notify_io.py` 신규로 분리 가능).
  - `batch/krx_list.py`: `TODO(F-13)` 자리에 `gone` 중 추적 중인 종목 → `delisted` 알림(`dedupe_key` 끝 `delisted_bas_dt`). 5% 넘게 줄어 반영하지 않은 날은 만들지 않음(이미 그 앞에서 return).
  - `.github/workflows/daily.yml`: 마지막 단계에 `python3 -m batch.notify_mail`(`if: always()` 여부는 시세 단계와 같게), env에 `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL` Secrets 추가. **Secrets 등록은 사용자** → REQUIRE.md.
- **주의점:** `.claude/rules/python-batch.md` 스타일(표준 라이브러리만, 한국어 docstring·"왜" 주석, 키·URL 마스킹 `common.mask`). 기존 동작을 깨지 않게 연결 코드는 try/예외를 개별 처리하되 **빈 catch 금지**(로그 남기고 계속). `dart_collect`는 실제 전체 수집을 다시 돌리지 않는다 — 연결 함수는 `python3 -m batch.dart_collect --mode monthly --only 005930 --dry-run` 같은 안전한 옵션이 있으면 그것으로, 없으면 단위 테스트·함수 단독 호출로 확인(실제 DART 호출 수 최소화).
- **완료 조건:** `python3 -m unittest discover -s batch/tests -t .` 통과, `python3 -m batch.notify_mail`을 Gmail 변수 없이 실행하면 정상 종료(설정 없음 로그), `python3 -c "import batch.krx_list, batch.dart_collect, batch.notify_mail"` 오류 없음, `daily.yml`이 YAML로 유효(`python3 -c "import yaml…"` 대신 `python3 -m json.tool`은 안 되므로 들여쓰기·키 점검), 테스트 사용자 + 추적 종목으로 알림 1건을 SQL로 넣고 `notify_mail`을 `--dry-run`(드라이런 옵션이 없으면 Coder가 추가: 메일을 보내지 않고 대상 수만 출력)으로 실행해 대상 1명이 잡힘.
- **Checker 확인 (PRD F-13):** 같은 변화 두 번 안 알림(`dedupe_key` + `ignore-duplicates`), 메일 한 통(여러 알림 묶음), 이메일 수신 끈 사용자 제외, 7일 규칙, 수신 거부 링크 형식 `{SITE_URL}/unsubscribe?token=…`, 로그에 메일 주소·본문 없음(`grep -n "print\|log(" batch/notify_mail.py`), `.github/workflows/daily.yml` Secrets 이름 3개.

### 19. 최종 점검

- **Admin:** `scripts/run-web.sh build` → `restart`. 접속 3경로(localhost·LAN·Tailscale) 응답, 방화벽 규칙(0d) 재확인(사용자 출력), 전체 화면 curl 스모크: `/`, `/stocks/005930`, `/stocks/999999`(404), `/screener?f=1,13`, `/news`, `/industries`, `/industries/26`, `/industries/26/compare`, `/mypage`(로그인 없이 redirect), `/unsubscribe?token=…`, `/api/search`·`/api/screener`·`/api/chat`·`/api/me`.
- **Checker (전체):** 공통 점검 전체 + PRD 수용 기준 전 기능 표 + 금지 표현 전수 grep(화면 문구 `lib/copy.ts`·`lib/filters.ts` 전체를 읽어 반말·평가 표현 확인) + 키 노출 grep(`web/.next/static`, 저장소 전체 `git grep -nE "eyJ[A-Za-z0-9_-]{20,}|sb_secret_|crtfc_key=[A-Za-z0-9]{10,}"`) + `git status`에 비밀 파일 없음 + `.env.example`에 모든 변수 이름(`NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`·`NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`·`OPENROUTER_API_KEY`·`GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL`) 값 없이 있음 + `npm run build` 출력의 라우트 표로 "공개 화면은 정적/ISR, `/mypage`·`/api/*`·`/auth/callback`은 동적" 확인.
- **REQUIRE.md 정리 (Admin):** 사용자 작업 목록 최종본 (아래 "REQUIRE.md 기록 항목" 참조).
- **Admin:** 문서 작성 에이전트에게 최종 상태 반영(CLAUDE.md "현재 상태"·"다음 할 일", PRD 11장 해소 항목) 요청.

---

## REQUIRE.md 기록 항목 (사용자 작업 목록)

| # | 시점 | 사용자 할 일 | 관련 단계 |
| --- | --- | --- | --- |
| R1 | 0d | 방화벽 규칙 적용(`sudo ufw …`)과 `ufw status` 출력 공유, LAN·Tailscale 접속 확인 | 0d |
| R2 | 0c | (선택) 서버 재부팅 시 자동 기동이 필요하면 systemd 서비스 설치 | 0c |
| R3 | 각 마이그레이션 | 마이그레이션 적용 **승인** (1a·5a·7a·14a·16a·18a, 필요하면 materialized view 마이그레이션) | 해당 단계 |
| R4 | 11b | 네이버 BI 가이드 로고 파일 제공 + NAVER API HUB 신청·키 발급 → `.env`의 `NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY` | 11a·11b |
| R5 | 11b 후속 | 키 도착 뒤 PRD 11장 15~18·21번 확인(응답 필드·`pubDate`·검색 연산자·검색어·짧은 종목명) → 11a 상수 조정 요청, 출처 푸터 네이버 문구 확정 여부 결정 | 11a·11b |
| R6 | 14b | OpenRouter 키 → `.env`의 `OPENROUTER_API_KEY`, 무료 모델·하루 한도 재확인 승인 | 14b |
| R7 | 16a | Supabase 대시보드: Site URL·Redirect URLs 3개·Magic Link 템플릿(token_hash 방식)·커스텀 SMTP(Gmail) | 16a |
| R8 | 16a | `.env`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가 | 16a·16b |
| R9 | 18c | Gmail 앱 비밀번호 준비, GitHub Secrets `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL` 등록, Gmail 하루 발송 한도 확인(PRD 11장 11번) | 18c |
| R10 | 16a·18c | `SITE_URL`(접속 주소) 결정 — 기본안 Tailscale 주소. LAN만 쓰는 기기에서 메일 링크가 안 열릴 수 있음 | 16a·18c |
| R11 | 각 단계 | PRD 10장·FS 12장 기본 문구 확인(화면 볼 때), 수동 확인 항목(클릭·키보드·모바일 폭) | 6·15·19 |

---

## 계획 중 PRD·FS와의 차이·충돌·의문점

1. **`Origin` 검사 방식:** FS 4-2는 "사이트 주소와 같은지"인데 접속 주소가 여러 개(LAN·Tailscale·localhost)라 고정 비교가 불가능 → `Host` 헤더 비교로 구현(16b). PRD·FS 문서 반영이 필요하면 문서 작성 에이전트 요청.
2. **마이그레이션 파일 분리:** FS 5장은 `{ts}_web_functions.sql` 하나를 말하지만 사용자 확인·적용 이력을 단계별로 남기려고 `search_stocks` / `screener_search` / 업종 3개 / 챗봇 / 가입 트리거 / 수신자 함수를 **파일 6개**로 나눴다 (FS 5-3~5-5는 FS 자체가 한 파일).
3. **`SITE_URL`·Supabase Redirect URL:** 로컬 서버(http)라 메일의 수신 거부 링크와 매직링크가 접속 주소에 의존한다. LAN만 있는 기기(Tailscale 미설치)에서 Tailscale 주소 링크는 열리지 않는다. 사용자 결정 필요(R10).
4. **네이버·OpenRouter 키 없음:** 응답 모양을 확인할 수 없어 F-18은 FS의 필드로 방어적 구현(11a), PRD 11장 15~18·21번과 `HOME_NEWS_QUERY`는 키 도착 뒤 후속 확인(R5). F-10도 `CHAT_MODEL`·주소를 공식 문서로 확인해야 함(14b).
5. **PRD 11장 3번(감사의견 2행 초과 116건):** 확인 전이라 `audit_changed`가 2행 초과 회사를 **판단 보류**로 두도록 계획(18b). 규칙이 정해지면 후속 수정.
6. **`rules-sync.test.ts` 정규식:** `batch/rules.py`의 실제 상수 표기에 맞춰야 함(Coder가 읽고 맞춤). 표기가 정규식으로 뽑기 어려우면 `rules.py` 쪽 상수 모양은 **고치지 말고** 테스트 쪽을 맞춘다.
7. **DB 타입 생성:** `types.ts`는 Supabase MCP로 Admin이 생성(Coder는 MCP 사용 불가 가정). 마이그레이션이 적용될 때마다 재생성이 필요하다.
8. **방화벽(0d):** sudo 비밀번호가 필요해 Planner가 `ufw status`를 확인하지 못했다. ufw가 꺼져 있는지·다른 방화벽(nftables/iptables)을 쓰는지 사용자 출력으로 확인 필요. Next.js는 주소 하나로만 바인드해 접근 제한을 방화벽에만 의존한다.
9. **UI 시각 검증 한계:** Checker는 curl·grep·SQL 대조 중심이라 클릭·키보드·툴팁·레이아웃은 사용자 수동 확인 항목으로 남는다(6·15·19단계에서 목록 제시).
10. **FS 8-1 `highlight` 함수:** FS가 파일명을 정하지 않은 하이라이트 순수 함수(`lib/highlight.ts`)를 1b에 추가했다 — FS에 없는 파일이지만 "계산은 `lib/` 순수 함수로" 원칙(C1)에 따른 분리이며 새 기능은 아니다.
