"""F-13 추적 종목 알림의 문구·판정 — 순수 함수 (DB·네트워크 없음).

알림 생성·저장·메일 발송(입출력)은 이 모듈을 부르는 쪽(18c)에 둔다. 여기서는 본문·키·제목을 만들고 변화를 판정만 한다.

- 입력: 재무 행(`fiscal_year`·`revenue`·`operating_income`·`net_income`), company_summary.insights 목록,
  audit_opinions 행(`row_no`·`adt_opinion`). 금액은 원 단위 정수, 값 없음은 None.
- 출력: 알림 본문(반말, 웹 알림 본문), dedupe_key, 메일 제목·본문(메일 제목·수신 거부 안내는 존댓말).
- 감사의견: 연도당 행 번호(`row_no`)가 같은 행끼리 짝지어 의견만 비교한다. 빈 의견 행과 한쪽에만 있는 행은 비교하지 않는다.
  연도당 행이 AUDIT_MAX_ROWS(2)를 넘으면 판단 보류(None)다 (PRD 11장 3번, REQUIRE.md 2026-11-21).
- 첫 수집 회사는 알리지 않는다: 전년 자료가 없으면 "새로 생긴" 변화가 아니므로 `new_year_arrived`·`audit_changed`가 False다.
- 금액·비율 서식은 web/lib/format.ts(PRD 3-8)와 같은 규칙: 1조 이상 `x.x조 원`, 미만 `n,nnn억 원`, 비율 소수 1자리.
"""

from __future__ import annotations

from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal

from batch import rules

# ---------------------------------------------------------------- 기준값 (한곳에서 관리)
KINDS = ("new_results", "delisted", "audit_change")
AUDIT_MAX_ROWS = 2  # 연도당 감사의견 행 수. 이보다 많으면 판단 보류 (PRD 11장 3번 확인 전)
WON_IN_EOK = 100_000_000
WON_IN_JO = 1_000_000_000_000
EOK_IN_JO = 10_000  # 반올림으로 1만 억이 되면 1.0조로 표시 (format.ts와 같음)
ONE_DECIMAL = Decimal("0.1")

# 메일 맨 아래 문구. 출처 두 줄은 PRD 3-2 확정 문구 그대로 (존댓말 예외)
SOURCE_LINES = (
    "데이터 출처: 금융위원회·공공데이터포털(data.go.kr), 금융감독원 전자공시시스템(DART), "
    "국가데이터처 통계분류포털 한국표준산업분류(제11차, kssc.mods.go.kr)",
    "공시 내용의 정확성은 각 회사에 책임이 있으며, 이 서비스는 데이터를 가공해 보여줍니다.",
)
# 투자 책임 고지 (PRD 10장 1번 기본안, 사용자 확인 대기)
DISCLAIMER = "이 서비스는 투자 권유가 아닌 참고 정보이며, 투자 판단의 책임은 본인에게 있습니다."
UNSUBSCRIBE_LINE = "이 메일을 더 받지 않으려면 여기를 눌러 주세요."  # PRD 4장 F-13 (존댓말 예외)

# 문장 템플릿 (PRD 4장 F-05 "눈여겨볼 변화" 표). 3·4·5·6·8번만 금융회사에 쓴다.
_STATIC_SENTENCES = {
    1: "매출은 늘었는데 영업이익률은 줄었어",
    2: "매출은 줄었는데 영업이익은 늘었어",
    3: "영업이익은 흑자인데 순이익은 적자야",
    8: "영업이익은 적자인데 순이익은 흑자야",
}


# ---------------------------------------------------------------- 서식
def amount_text(won: int | None) -> str | None:
    """금액 → '3.5조 원' / '1,800억 원' / '-657억 원'. 값이 없으면 None."""
    if won is None:
        return None
    sign = "-" if won < 0 else ""
    absolute = abs(won)
    if absolute >= WON_IN_JO:
        jo = (Decimal(absolute) / WON_IN_JO).quantize(ONE_DECIMAL, rounding=ROUND_HALF_UP)
        return f"{sign}{jo}조 원"
    eok = int((Decimal(absolute) / WON_IN_EOK).quantize(Decimal(1), rounding=ROUND_HALF_UP))
    if eok >= EOK_IN_JO:  # 9,999.5억 이상은 1조로 표시
        return f"{sign}1.0조 원"
    if eok == 0:
        return "0억 원"
    return f"{sign}{eok:,}억 원"


def change_phrase(curr: int | None, prev: int | None) -> str | None:
    """전년 대비 괄호 문구 '(전년보다 12.2% 감소)'. 전년이 0 이하거나 값이 없으면 None (증가율 정의 불가)."""
    if curr is None or prev is None or prev <= 0:
        return None
    diff = curr - prev
    if diff == 0:
        return "(전년과 같아)"
    pct = (Decimal(abs(diff)) * 100 / Decimal(prev)).quantize(ONE_DECIMAL, rounding=ROUND_HALF_UP)
    direction = "증가" if diff > 0 else "감소"
    return f"(전년보다 {pct}% {direction})"


def insight_sentence(ins: dict) -> str | None:
    """insights 항목 하나 → 문장. 모르는 id나 필요한 값이 없으면 None."""
    iid = ins.get("id")
    if iid in _STATIC_SENTENCES:
        return _STATIC_SENTENCES[iid]
    if iid in (4, 5) and ins.get("year") is not None:
        verb = "흑자로 돌아섰어" if iid == 4 else "적자로 돌아섰어"
        return f"{ins['year']}년에 영업이익이 {verb}"
    if iid == 6 and ins.get("n") is not None:
        return f"영업적자가 {ins['n']}년째 이어지고 있어"
    if iid == 7 and ins.get("prev") is not None and ins.get("curr") is not None:
        return f"부채비율이 1년 사이 {ins['prev']}%에서 {ins['curr']}%로 올랐어"
    return None


# ---------------------------------------------------------------- 본문
def results_body(name: str, year: int, rows: Iterable[dict], insights: list[dict],
                 is_financial: bool) -> str:
    """new_results 본문 (PRD 4장 F-13 예시 모양).

    rows: 연도별 재무 행 (year와 year-1 행이 있으면 전년 대비 문구를 붙인다).
    금융회사는 영업이익·순이익만 쓰고 문장도 금융회사용 번호만 쓴다.
    """
    by_year = {r["fiscal_year"]: r for r in rows}
    cur = by_year.get(year)
    if cur is None:
        raise ValueError(f"{year}년 재무 행이 없어 실적 알림을 만들 수 없어 (종목 {name})")
    prev = by_year.get(year - 1, {})

    if is_financial:
        items = [("영업이익", "operating_income"), ("순이익", "net_income")]
    else:
        items = [("매출액", "revenue"), ("영업이익", "operating_income")]
    pieces = []
    for label, key in items:
        amount = amount_text(cur.get(key))
        if amount is None:
            continue
        phrase = change_phrase(cur.get(key), prev.get(key))
        pieces.append(f"{label} {amount}" + (f" {phrase}" if phrase else ""))

    lines = [f"{name}의 {year}년 실적이 반영됐어."]
    if pieces:
        lines.append(", ".join(pieces))
    allowed = [i for i in insights if not is_financial or i.get("id") in rules.FINANCIAL_INSIGHTS]
    sentence = next((s for s in (insight_sentence(i) for i in allowed) if s), None)
    if sentence:
        lines.append(f"눈여겨볼 변화: {sentence}")
    return "\n".join(lines)


def delisted_body(name: str) -> str:
    """delisted 본문. 이유는 말하지 않는다 (PRD 4장 F-13)."""
    return f"{name}이 KRX 상장종목 목록에서 빠졌어."


def audit_body(name: str, year: int, prev_opinion: str, curr_opinion: str) -> str:
    """audit_change 본문. 의견은 DART 표기 그대로 넣는다 (연결·별도 이름은 붙이지 않음)."""
    return f"{name}의 {year}년 감사의견이 '{prev_opinion}'에서 '{curr_opinion}'으로 바뀌었어."


# ---------------------------------------------------------------- 판정
def _opinion(row: dict) -> str | None:
    text = (row.get("adt_opinion") or "").strip()
    return text or None


def audit_pairs(prev_rows: list[dict], curr_rows: list[dict]) -> list[tuple[str, str]] | None:
    """row_no가 같은 행끼리 짝지은 (전년 의견, 올해 의견) 목록. 행이 AUDIT_MAX_ROWS를 넘으면 None (판단 보류).

    전년 자료가 없으면(첫 수집 회사) 빈 목록이다. 빈 의견 행은 짝에서 뺀다.
    """
    if len(prev_rows) > AUDIT_MAX_ROWS or len(curr_rows) > AUDIT_MAX_ROWS:
        return None
    prev_by_no = {r["row_no"]: _opinion(r) for r in prev_rows}
    pairs = []
    for r in curr_rows:
        before, after = prev_by_no.get(r["row_no"]), _opinion(r)
        if before and after:
            pairs.append((before, after))
    return pairs


def audit_changed(prev_rows: list[dict], curr_rows: list[dict]) -> bool | None:
    """한 연도 2행 중 하나라도 전년과 의견이 다르면 True. 보류(2행 초과)는 None."""
    pairs = audit_pairs(prev_rows, curr_rows)
    if pairs is None:
        return None
    return any(before != after for before, after in pairs)


def changed_opinion(prev_rows: list[dict], curr_rows: list[dict]) -> tuple[str, str] | None:
    """audit_body에 넣을 (전년 의견, 올해 의견) 첫 번째 쌍. 바뀐 것이 없거나 보류면 None."""
    pairs = audit_pairs(prev_rows, curr_rows) or []
    return next(((b, a) for b, a in pairs if b != a), None)


def new_year_arrived(prev_latest: int | None, curr_latest: int | None) -> bool:
    """최신 사업연도가 이번에 새로 생겼는지. 전년 자료가 없던 회사(첫 수집)는 False."""
    return prev_latest is not None and curr_latest is not None and curr_latest > prev_latest


# ---------------------------------------------------------------- 키·메일
def dedupe_key(kind: str, srtn_cd: str, part: int | str) -> str:
    """같은 변화를 두 번 넣지 않는 키. part는 사업연도(new_results·audit_change) 또는 delisted_bas_dt."""
    if kind not in KINDS:
        raise ValueError(f"알 수 없는 알림 종류: {kind}")
    if not srtn_cd:
        raise ValueError("종목코드가 비어 있어")
    return f"{kind}:{srtn_cd}:{part}"


def mail_subject(kinds: Iterable[str], n: int) -> str:
    """메일 제목 (존댓말, PRD 4장 F-13 4가지). kinds는 이번 메일에 든 알림 종류."""
    kind_set = set(kinds)
    if not kind_set or not kind_set <= set(KINDS):
        raise ValueError(f"메일 제목을 만들 수 없는 종류: {sorted(kind_set)}")
    if kind_set == {"new_results"}:
        return f"추적 종목 {n}개의 실적이 반영됐습니다"
    if kind_set == {"delisted"}:
        return f"추적 종목 {n}개가 상장종목 목록에서 빠졌습니다"
    if kind_set == {"audit_change"}:
        return f"추적 종목 {n}개의 감사의견이 바뀌었습니다"
    return f"추적 종목 {n}개에 새 소식이 있습니다"


def mail_body(bodies: list[str], unsubscribe_url: str) -> str:
    """메일 본문 (텍스트). 알림 본문들 → 출처 → 투자 책임 고지 → 수신 거부 안내 순서."""
    if not bodies:
        raise ValueError("메일 본문으로 넣을 알림이 없어")
    footer = [*SOURCE_LINES, DISCLAIMER, UNSUBSCRIBE_LINE, unsubscribe_url]
    return "\n\n".join(["\n\n".join(bodies), "\n".join(footer)])


# ---------------------------------------------------------------- 샘플 출력 (DB 접근 없음)
def _sample() -> str:
    rows = [
        {"fiscal_year": 2025, "revenue": 3_000_000_000_000, "operating_income": 205_000_000_000,
         "net_income": 150_000_000_000},
        {"fiscal_year": 2026, "revenue": 3_500_000_000_000, "operating_income": 180_000_000_000,
         "net_income": 120_000_000_000},
    ]
    results = results_body("샘플", 2026, rows, [{"id": 1}], False)
    return "\n\n".join([results, delisted_body("샘플"), audit_body("샘플", 2026, "적정의견", "한정의견"),
                        mail_body([results], "http://example.invalid/unsubscribe?token=sample")])


if __name__ == "__main__":
    # 확인용: 문구 모양만 출력한다. 이 모듈은 DB·메일 발송 코드가 없어 쓰기 위험이 없다.
    print(_sample())
