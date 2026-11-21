# REQUIRE — 웹앱 개발 중 생긴 필요 사항

웹앱 구현(2026-11-21~) 중 생긴 필요 사항, 먼저 처리한 결정, 사용자 작업을 적는다. 계획은 `docs/DEV_PLAN.md`.

## 사용자 작업 목록

| # | 상태 | 사용자 할 일 | 관련 단계 |
| --- | --- | --- | --- |
| R1 | 대기 | 방화벽 규칙 적용(`sudo ufw …`, 아래 "방화벽" 절)과 `sudo ufw status verbose` 출력 공유, LAN·Tailscale 접속 확인 | 0d |
| R2 | 선택 | 서버 재부팅 때 자동 기동이 필요하면 systemd 서비스 설치 (원하면 알려 줘) | 0c |
| R3 | 단계마다 | 마이그레이션 적용 승인 (1a·5a·7a·14a·16a·18a) | 해당 단계 |
| R4 | 대기 | NAVER API HUB 신청·키 발급 → `.env`의 `NAVER_API_HUB_KEY_ID`·`NAVER_API_HUB_KEY`, 네이버 BI 가이드 로고 파일 제공 | 11a·11b |
| R5 | 대기 | 네이버 키 도착 뒤 PRD 11장 15~18·21번 확인, 출처 푸터 네이버 문구 확정 여부 결정 | 11a·11b |
| R6 | 대기 | OpenRouter 키 → `.env`의 `OPENROUTER_API_KEY`, 무료 모델·하루 한도 재확인 | 14b |
| R7 | 대기 | Supabase 대시보드: Site URL·Redirect URLs·Magic Link 템플릿(token_hash)·커스텀 SMTP(Gmail) | 16a |
| R8 | 대기 | `.env`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가 | 16a·16b |
| R9 | 대기 | Gmail 앱 비밀번호, GitHub Secrets `GMAIL_ADDRESS`·`GMAIL_APP_PASSWORD`·`SITE_URL` 등록, Gmail 하루 발송 한도 확인 | 18c |
| R10 | 대기 | `SITE_URL`(메일 링크 접속 주소) 결정 — 기본안 Tailscale 주소 `http://100.124.240.114:16000` | 16a·18c |
| R11 | 단계마다 | PRD 10장·FS 12장 기본 문구 확인, 수동 확인(클릭·키보드·모바일 폭) | 6·15·19 |

## 먼저 처리한 결정 (묻지 않고 진행)

| 날짜 | 내용 | 이유 |
| --- | --- | --- |
| 2026-11-21 | Vercel 대신 로컬 `next start -p 16000 -H 0.0.0.0` | 사용자 지시 |
| 2026-11-21 | FS 4-2 `Origin` 검사를 고정 주소 비교 대신 `Origin` 호스트 = `Host` 헤더 비교로 구현 | 접속 주소가 LAN·Tailscale·localhost로 여럿 |
| 2026-11-21 | 마이그레이션을 기능 단계별 파일로 나눔 (FS 5장은 파일 하나) | 단계별 승인·적용 이력 |
| 2026-11-21 | 감사의견 2행 초과 회사는 F-13 `audit_changed`에서 판단 보류 | PRD 11장 3번 미정 |
| 2026-11-21 | `/stocks/없는코드`는 404 화면 문구가 나오지만 HTTP 상태는 200 | FS 8-2가 `loading.tsx`(스켈레톤)와 `notFound()`를 둘 다 정함. Next.js 스트리밍 특성상 `loading.tsx`가 있으면 상태 코드를 404로 못 바꿈. FS대로 둘 다 유지 |
| 2026-11-21 | F-05 방향 화살표: 한 번은 그대로·한 번은 3% 넘게 바뀐 경우(예: 10 → 20 → 20)는 화살표 없이 값만 표시 | PRD F-05 화살표 표에 해당 모양이 없음. 화면 확인 때 사용자 결정 필요 (R11) |
| 2026-11-21 | Tailwind는 표준 `@tailwindcss/postcss` 방식, `next.config.ts`의 `loadEnvConfig`에 `forceReload` 인자 추가 | 빌드 워커가 루트 `.env`를 못 읽는 문제 |

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
