# MODEL_TEST — 챗봇(F-10) 모델 시험 입력

OpenRouter 무료 모델을 웹(OpenRouter Chat 화면 등)에서 직접 시험할 때 쓰는 입력이다. 앱이 실제로 보내는 요청과 같게 맞췄다 (2026-11-22, `web/lib/chat.ts`의 `buildSystemPrompt()` 출력 그대로).

## 1. 요청 설정

| 항목 | 값 |
| --- | --- |
| 모델 | 시험할 모델 ID (무료는 `:free`로 끝남) |
| temperature | `0` |
| 메시지 | system 1개 + user 1개 (대화 이어 가지 않음 — 문장마다 새 대화) |
| 추론(reasoning) | 기본값으로 한 번, 끈 상태(`reasoning: {"enabled": false}`)로 한 번. 웹 화면이면 "Reasoning" 옵션 끄기 |
| 시간 제한 | 앱은 **5초** 안에 답이 와야 한다 (FS 9-9). 넘으면 앱에서는 "지금은 쓸 수 없어"로 끝남 |

## 2. System 메시지 (그대로 붙여 넣기)

```
너는 주식 재무 조건을 골라 주는 도우미다.
사용자 문장을 아래 필터 번호로 바꿔라. 문장에 나온 순서대로 적어라.
숫자, 의견, 설명은 만들지 마라. 답은 JSON 한 개로만 써라.

필터 목록:
1: 매출이 2년 연속 늘어난 회사
2: 매출이 1년 사이 20% 이상 늘어난 회사
3: 매출이 2년 연속 줄어든 회사
4: 영업이익이 2년 연속 늘어난 회사
5: 순이익이 2년 연속 늘어난 회사
6: 3년 내내 영업이익을 낸 회사
7: 3년 내내 순이익을 낸 회사
8: 영업이익이 흑자로 돌아선 회사
9: 영업적자가 2년 이상 이어진 회사
10: 영업이익률이 10% 이상인 회사
11: 영업이익률이 2년 연속 오른 회사
12: 매출은 늘었지만 영업이익률은 줄어든 회사
13: 부채비율이 100% 이하인 회사
14: 부채비율이 50% 이하인 회사
15: 부채비율이 2년 연속 내린 회사
16: 부채비율이 2년 연속 오른 회사
17: 자산이 2년 연속 늘어난 회사
18: 자본이 2년 연속 늘어난 회사
19: 자본잠식 상태인 회사
20: 3년 내내 현금배당한 회사

지원하지 않는 조건 종류 코드: industry, dividend_yield, price, other
(industry=업종, dividend_yield=배당수익률, price=주가·PER·PBR, other=그 밖)

출력 형식: {"filters":[필터 번호...],"unsupported":[종류 코드...],"not_condition":false}
조건이 아닌 질문(예: 사도 될지 묻는 말)이면 filters를 비우고 not_condition을 true로 써라.
```

## 3. User 메시지 5개와 기대 답

| # | 입력 (user) | 기대 답 | 보는 점 |
| --- | --- | --- | --- |
| 1 | `빚이 적고 이익이 늘어난 회사` | `{"filters":[13 또는 14, 4 또는 5],"unsupported":[],"not_condition":false}` | 두 조건을 문장 순서대로 (빚 → 이익) |
| 2 | `적자에서 흑자로 돌아선 회사` | `{"filters":[8],"unsupported":[],"not_condition":false}` | 필터 한 개 |
| 3 | `배당 수익률 높은 회사` | `{"filters":[],"unsupported":["dividend_yield"],"not_condition":false}` | 지원 안 하는 조건. **`not_condition`이 true면 틀림** (앱이 "조건이 아닌 말" 문구를 먼저 보여 줌) |
| 4 | `반도체 업종에서 매출이 늘어난 회사` | `{"filters":[1 또는 2],"unsupported":["industry"],"not_condition":false}` | 지원 조건 + 지원 안 하는 조건 섞임 |
| 5 | `오늘 날씨 어때` | `{"filters":[],"unsupported":[],"not_condition":true}` | 조건이 아닌 말 |

## 4. 합격 기준

- 답이 **JSON 한 개만** 온다. 앞뒤 설명 글이 붙거나 ```` ```json ```` 코드 블록으로 감싸면 앱 검사(`parseChatOutput`)에서 떨어질 수 있다.
- 키 이름이 정확히 `filters`·`unsupported`·`not_condition`이다.
- 필터 번호는 1~20, 종류 코드는 위 4개 안에서만 나온다.
- 5개 문장 모두 **5초 안**에 답한다.
- 같은 문장을 두 번 보내도 비슷한 답이 나온다.

## 5. 지금까지 결과 (2026-11-22, Admin이 API로 시험)

| 모델 | 결과 |
| --- | --- |
| `google/gemma-4-26b-a4b-it:free` | 429 (무료 공급처 일시 제한) — 여러 번 시도 모두 실패. 탈락 |
| `nvidia/nemotron-3.5-lightning:free` | 추론 켬: 6~68초 (5초 넘음). 추론 끔: 0.4~0.8초, 5개 모두 형식 통과. 3번에서 `not_condition: true`가 같이 와서 틀림 → **채택 (2026-11-22, 추론 끔)** |
| `inclusionai/ling-3.2-flash:free` | 429 (무료 공급처 일시 제한) — 두 번 시도 모두 실패 |

모델을 정하면 `web/lib/chat.ts`의 `CHAT_MODEL`만 바꾸면 된다. 추론을 꺼야 하는 모델이면 `web/lib/data/chat.ts` 요청 본문에 `reasoning: { enabled: false }`를 넣는다.
