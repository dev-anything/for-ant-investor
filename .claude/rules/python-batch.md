---
paths:
  - "batch/**/*.py"
  - "scripts/**/*.py"
---

# Python 배치 코드 스타일 (batch/, scripts/)

기존 `batch/` 코드의 관례를 그대로 규칙으로 삼는다. 새로 쓰는 코드도 같은 방식이다.

- **표준 라이브러리만** 쓴다 (외부 패키지 없음).
- **이름**: 영어. 함수·변수는 snake_case(`debt_ratio`, `data_go_call`), 상수는 UPPER_SNAKE_CASE(`RULE_VERSION`), 클래스는 PascalCase(`Supabase`, `Dart`).
- **타입 힌트**: 함수 인자와 반환값에 단다. 파일 맨 위에 `from __future__ import annotations`를 쓰고 `dict | None`처럼 새 문법을 쓴다.
- **파일 머리**: 모듈 docstring(한국어)에 입력·출력·규칙(null 처리 방침 등)을 쓴다.
- **구역 구분**: `# ------ 기준값`, `# ------ 지표`처럼 구역 주석으로 나눈다.
- **기준값**은 파일 위쪽에 이름 붙은 상수로 한곳에 모으고, 값마다 근거를 한 줄 적는다. 코드 중간에 숫자를 그대로 쓰지 않는다.
- **분리**: 순수 판정(`rules.py` 같은 DB·네트워크 없는 함수)과 입출력(`common.py`, `recompute.py` 등)을 나눈다.
- **주석**: 한국어로 "무엇"이 아니라 "왜"를 쓴다. 근거가 있는 규칙은 PRD·FS 절 번호를 남긴다.
- **길이**: 함수 40줄 안팎, 파일 300줄 안팎을 목표로 한다. 기존 `dart_collect.py`(548줄)는 이번에 고치지 않고, 새로 만들거나 크게 바꿀 때만 쪼갠다.
- `scripts/`는 확인용이라 이름·주석 규칙만 같이 적용한다.
- 키·요청 URL의 `serviceKey`·`crtfc_key`는 출력·로그에 남기지 않는다 (`common.mask` 사용).
