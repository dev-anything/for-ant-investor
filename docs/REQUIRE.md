# REQUIRE — 웹앱 개발 중 생긴 필요 사항

웹앱 구현(2026-11-21~) 중 생긴 필요 사항, 먼저 처리한 결정, 사용자 작업을 적는다. 계획은 `docs/DEV_PLAN.md`.

## 사용자 작업 목록

| # | 상태 | 사용자 할 일 | 관련 단계 |
| --- | --- | --- | --- |
| R1 | **완료** | 방화벽 (2026-11-22: ufw 켬, 들어오는 연결 기본 거부 + LAN `192.168.0.0/24`·`tailscale0` 전체 허용 + `41641/udp`. 기존 443·15000·15001·15004·22 Anywhere 규칙은 그대로) | 0d |
| R2 | **완료** | systemd 서비스 `finradar-web` 설치 (2026-11-22, `/etc/systemd/system/finradar-web.service`, 재부팅 자동 기동·죽으면 5초 뒤 재시작). 이후 `run-web.sh start` 대신 `npm run build` → `sudo systemctl restart finradar-web`, 로그 `journalctl -u finradar-web` | 0c |
| R3 | **완료** | 마이그레이션 적용 승인 (1a·5a·7a·14a·16a·18a 모두 적용 완료 2026-11-21. 16a 트리거는 사용자 결정으로 오류 처리 추가 — 설정 행 생성이 실패해도 가입은 진행) | 해당 단계 |
| R4 | **완료** | NAVER API HUB 신청·키 발급 → `.env`의 `NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`, 네이버 BI 가이드 로고 파일 제공 | 11a·11b |
| R5 | **완료** | 2026-11-22 확인: HUB 응답 필드·`<b>`·`&quot;`·`pubDate`(`Sun, 22 Nov 2026 00:38:00 +0900`) 문서와 일치, 따옴표 연산자 효과 없음·`-제외어`는 동작하는 듯(지금 안 씀), 첫 화면 검색어 `경제 정책` 유지(며칠 더 지켜봄), 짧은 종목명 245개(9.5%, 기아·LG·SK 등 포함 — 실제로 다른 기사 섞임 확인), 푸터 네이버 문구 추가, BI 로고 `web/public/NAVER_OPENAPI_LOGO.png`(사용자가 가이드 이미지에서 잘라 넣음) 연결 | 11a·11b |
| R6 | **완료** | OpenRouter 키 확인(무료 등급) · `CHAT_MODEL` = `nvidia/nemotron-3.5-lightning:free`, 요청에 `reasoning: {enabled: false}` (2026-11-22 사용자 결정. Gemma·Ling은 무료 공급처 429로 탈락, 시험 입력·결과 `docs/MODEL_TEST.md`). 알려진 한계: "배당 수익률 높은 회사"에 `not_condition: true`가 같이 와서 지원 안 함 안내 대신 "조건이 아닌 말" 문구가 나옴 | 14b |
| R7 | **완료** | Supabase: Site URL·Redirect URLs·커스텀 SMTP(Gmail)·Magic Link·Confirm signup 템플릿(token_hash) 설정, 매직링크 로그인·가입 트리거 확인 (2026-11-22). 템플릿은 커스텀 SMTP를 켠 뒤에만 고칠 수 있음 | 16a |
| R8 | **완료** | `.env`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가 | 16a·16b |
| R9 | **완료** | GitHub Secrets `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL` 등록 (2026-11-22). Gmail SMTP 하루 약 500통 | 18c |
| R10 | **완료** | `SITE_URL` = `http://myserver.tail04eb49.ts.net:16000` (2026-11-22 사용자 결정, Tailscale MagicDNS 이름). Vercel로 옮기면 Supabase Site URL·Redirect URLs·Secret `SITE_URL` 세 곳만 바꾼다 | 16a·18c |
| R11 | 대기 | PRD 10장·FS 12장 기본 문구 확인 + 아래 "먼저 처리한 결정" 중 "사용자 확인 필요" 항목 결정, 아래 "브라우저 수동 확인" 목록 | 6·15·19 |

## 키를 넣은 뒤 켜지는 기능

| 기능 | 필요한 것 | 키가 없을 때 지금 동작 |
| --- | --- | --- |
| F-11 로그인·F-12 추적·마이페이지 | R7·R8 | 로그인 메뉴만 꺼짐 (`/api/me` → 로그인 안 함), 나머지 정상 |
| F-13 알림 메일 | R9·R10 (+ 로그인) | 메일 단계가 변수 이름만 남기고 정상 종료 |
| F-18 경제 기사 | R4·R5 | 기사 칸만 "지금은 기사를 불러올 수 없어." |
| F-10 챗봇 | R6 (완료) | 챗봇만 꺼짐 (규칙 6 문구) |

## 브라우저 수동 확인 (curl로 확인 못 한 것)

- 검색: 첫 진입 자동 포커스, ↑↓·Enter·Esc, 외국회사 줄 선택 시 이동 안 함
- 종목 화면: 실적 그래프 모양(0 기준선·적자 옅은 회색·금융회사 두 칸 배치), 막대 툴팁, 눈금 툴팁 열림·닫힘(마우스·탭·Esc), 읽는 순서 투어(첫 방문 띠, 다음·이전·건너뛰기, 금융회사 3단계, 640px 미만 말풍선)
- 스크리너: 4번째 필터 거부, 부딪힘 흐림·안내, 13↔14 교체, 정렬·페이지, 뒤로 가기 상태 유지, 챗봇 예시 클릭
- 업종: `/industries` 대분류 펼침(키보드 포함), 없는 업종 404 문구가 화면에 보이는지
- 기사·공시 칸 PC 두 열·좁은 화면 한 열 배치
- 로그인 뒤: 매직링크(다른 기기에서 열기 포함), 추적 추가·삭제·20개 상한, 로그인 뒤 자동 추적, 마이페이지 카드·알림·메일 토글·로그아웃·탈퇴, 수신 거부 링크
- 폭 360px에서 가로 스크롤 없음

## 먼저 처리한 결정 (묻지 않고 진행)

| 날짜 | 내용 | 이유 |
| --- | --- | --- |
| 2026-11-21 | Vercel 대신 로컬 `next start -p 16000 -H 0.0.0.0` | 사용자 지시 |
| 2026-11-21 | FS 4-2 `Origin` 검사를 고정 주소 비교 대신 `Origin` 호스트 = `Host` 헤더 비교로 구현 | 접속 주소가 LAN·Tailscale·localhost로 여럿 |
| 2026-11-21 | 마이그레이션을 기능 단계별 파일로 나눔 (FS 5장은 파일 하나) | 단계별 승인·적용 이력 |
| 2026-11-21 | 감사의견 2행 초과 회사는 F-13 `audit_changed`에서 판단 보류 | PRD 11장 3번 미정 |
| 2026-11-21 | ~~`/stocks/없는코드`가 HTTP 200~~ → 19단계에서 해결: 종목 화면에 빈 `generateStaticParams`를 넣어 1시간 ISR(`s-maxage=3600`, 두 번째 요청 HIT)이 적용되면서 없는 종목도 HTTP 404 | FS 3-3·8-2 |
| 2026-11-21 | F-05 방향 화살표: 한 번은 그대로·한 번은 3% 넘게 바뀐 경우(예: 10 → 20 → 20)는 화살표 없이 값만 표시 | PRD F-05 화살표 표에 해당 모양이 없음. 화면 확인 때 사용자 결정 필요 (R11) |
| 2026-11-21 | F-05 자본잠식 안내는 부채비율 눈금 자리(완전 = 상자, 부분 = 눈금 아래 한 줄)에 표시. 금융회사만 카드 맨 위 | PRD F-05 "눈금을 못 그리는 경우" 표·FS 8-2 `CapitalNotice` 행을 따름 (구성 목록의 "1. 자본잠식 안내"와 위치 해석 차이) |
| 2026-11-21 | F-05 카드 제목 "재무 리포트카드", 문장·안내 둘 다 없는 금융회사는 카드 전체 숨김 | 문구 미정(R11), PRD "문장 없으면 영역 숨김" 해석 |
| 2026-11-21 | F-03 필터별 정렬 키: 근거 열이 2개인 12번은 영업이익률, 19번은 자본총계 | PRD·FS에 필터별 매핑 없음. FS 5-2 정렬 키 12개 안에서 선택 |
| 2026-11-21 | F-08 `v_industry_medians`는 materialized view로 바꾸지 않음 | 가장 큰 중분류(26, 296사) 조회 21ms — FS 4-1 기준 500ms 이내 |
| 2026-11-21 | MVP 데이터 정확도: 표본 20종목 324칸 100% 일치 (`scripts/accuracy_check.py`, 결과 `api_check_results/accuracy_2026-11-21.md`) | PRD 9장. 계정 이름 매핑은 배치와 공유하므로 매핑 자체 검증은 아님 |
| 2026-11-21 | F-08 비교 한 줄 "같아" 경우를 "같은 업종 가운데 값과 같아"로 씀 | PRD "…보다 높아 / 낮아 / 같아"에서 "보다 같아"는 조사가 어색함. 화면 확인 때 확정 (R11) |
| 2026-11-21 | F-17 지분공시 거르기: 같은 기간 전체 목록과 `pblntf_ty=D`(지분공시) 목록을 받아 D의 `rcept_no`를 뺀다. 이름 규칙만으로는 공개매수·의결권 권유 등을 놓침 | PRD 11장 19번. DART 실제 응답 확인 (`scripts/dart_list_check.py`). `최대주주등소유주식변동신고서`는 DART 분류상 D가 아니라 목록에 남음 — 사용자 판단 필요 |
| 2026-11-21 | F-17 지분공시 목록이 100건을 넘으면, 그 100건의 가장 오래된 날짜 이하 공시는 거르기를 믿지 않고 목록에서 뺌 | 안전 규칙. 지분공시가 아주 많은 회사는 5개보다 적게 나올 수 있음 |
| 2026-11-21 | F-17 조회 기간은 최근 365일 (`bgn_de` 없으면 DART가 013을 돌려줌) | 기본안. 공시가 드문 회사는 5개보다 적을 수 있음 — 사용자 확인 필요 |
| 2026-11-21 | F-17 "공시 더 보기" 링크는 넣지 않음 | PRD 11장 20번 링크 형식 미확인, FS 9-5 기본안(숨김) |
| 2026-11-21 | F-10 `CHAT_MODEL`은 빈 값으로 둠 → 키가 있어도 모델을 정하기 전까지 챗봇은 꺼짐 (→ 2026-11-22 사용자 결정으로 `nvidia/nemotron-3.5-lightning:free` + 추론 끔 연결, R6) | OpenRouter 무료 모델 이름·한도 미확인 (R6, PRD 10장 19번). `web/lib/chat.ts` 상수 하나만 바꾸면 됨 |
| 2026-11-21 | F-10 `/api/chat`은 Origin 헤더가 없으면 통과 (있으면 Host와 같아야 함) | 브라우저 POST는 항상 Origin을 붙임. 막으려면 `isSameOrigin` 한 줄 |
| 2026-11-21 | 2차 배당 정확도: 표본 20종목 120칸 100% 일치 (`scripts/accuracy_check.py --dividends`, 결과 `api_check_results/accuracy_dividends_2026-11-21.md`). 2차 수용 기준 점검 PASS | PRD 9장. `check`·`not_disclosed`·013 경우는 표본에 없어 코드로만 확인 |
| 2026-11-21 | `/industries/[division]`·`/compare`는 쿼리를 읽어서 빌드상 동적(ƒ)으로 나옴 (`revalidate = 3600`은 설정) | 응답 0.2초대라 그대로 둠 |
| 2026-11-21 | F-13 감사의견 변화는 같은 `row_no`끼리 짝지어 의견만 비교 | PRD 11장 3번 미정. DB 확인: 전년과 같은 row_no 짝 8,846개 중 의견이 다른 101개가 모두 실제 의견 변화(적정→의견거절 67 등) — 행 순서 뒤섞임 흔적 없음 |
| 2026-11-21 | F-13 처음 수집된 회사(전년 자료 없음)는 알리지 않음 | 첫 적재 때 수천 건 알림 방지 |
| 2026-11-21 | F-13 알림 문구의 증감률은 소수 1자리 ("전년보다 16.7% 증가") | PRD 3-8 기본 규칙. PRD F-13 예시는 정수 — 사용자 확인 필요 |
| 2026-11-21 | Tailwind는 표준 `@tailwindcss/postcss` 방식, `next.config.ts`의 `loadEnvConfig`에 `forceReload` 인자 추가 | 빌드 워커가 루트 `.env`를 못 읽는 문제 |
| 2026-11-22 | **Tailscale IP 주소(`http://100.124.240.114:16000`)로 접속하면 로그인이 안 됨** — Supabase 앞단 Cloudflare가 `redirect_to`에 `100.x` IP가 든 요청을 403으로 막음(브라우저에는 CORS 오류로 보임). 이름 주소·LAN 주소는 정상 | 로그인은 이름 주소 `myserver.tail04eb49.ts.net`으로 접속. 코드 변경 없음 |
| 2026-11-22 | 출처 푸터 네이버 문구는 웹 화면에만 넣고 알림 메일 하단(`batch/notify.py`)은 기존 첫 줄 유지 | 메일에는 네이버 데이터가 없음 |
| 2026-11-22 | 첫 화면 기사 칸은 빌드 때 만든 페이지를 30분 캐시하므로, 빌드 시점에 기사 호출이 실패하면 최대 30분 실패 문구가 남음 | 키를 바꾼 뒤에는 다시 빌드하거나 30분 기다림 |

## 방화벽 (R1)

sudo 비밀번호가 필요해서 사용자가 실행한다. **ufw가 inactive면 켜기 전에 SSH 허용을 먼저** 넣어야 접속이 안 끊긴다.

```
sudo ufw status verbose
sudo ufw allow from 192.168.0.0/24 to any port 16000 proto tcp comment 'finradar LAN'
sudo ufw allow in on tailscale0 to any port 16000 proto tcp comment 'finradar tailscale'
sudo ufw default deny incoming     # 이미 deny면 생략
sudo ufw status numbered           # 16000에 Anywhere 허용 규칙이 없는지 확인
```

공유기 포트포워딩은 하지 않는다.
