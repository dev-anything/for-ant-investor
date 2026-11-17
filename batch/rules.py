"""필터 20개(F-03)·"눈여겨볼 변화" 문장 8개(F-05) 판정 — 순수 함수 (DB·네트워크 없음).

입력: 한 회사의 연도별 재무(company_summary.fs_div 기준 행), 금융회사 여부, 연도별 배당.
출력: matched_filters (걸린 필터 ID 목록), insights (걸린 문장, 우선순위 순).

- Y1~Y3 = 저장 연도(years)의 뒤 3개. 6번 문장의 N만 저장된 전체 연도(최대 4개)를 거슬러 센다.
- 지표 null 규칙은 v_company_years 뷰와 같다: 금융회사면 지표 없음, 자본 ≤ 0이면 부채비율 없음,
  매출 ≤ 0이면 영업이익률 없음, 전년 매출 ≤ 0이면 매출 증가율 없음.
- 값이 하나라도 없으면 그 필터·문장은 걸리지 않는다 (판정 불가 = None).
- 경계값(20%·100% 등)은 float 오차가 없도록 Fraction으로 비교한다.
- 숫자 기준을 바꾸면 RULE_VERSION도 바꾸고 `python3 -m batch.recompute`로 전체를 다시 계산한다.
"""

from __future__ import annotations

from fractions import Fraction

# ---------------------------------------------------------------- 기준값 (한곳에서 관리)
RULE_VERSION = "2026-11-17"

REVENUE_GROWTH_MIN = 20      # 필터 2: 매출 증가율 ≥ 20%
OP_MARGIN_MIN = 10           # 필터 10: 영업이익률 ≥ 10%
DEBT_RATIO_MAX_WIDE = 100    # 필터 13: 부채비율 ≤ 100% (65.6%가 걸리지만 계산상 의미가 있어 예외로 유지, 2026-11-17)
DEBT_RATIO_MAX_NARROW = 50   # 필터 14: 부채비율 ≤ 50%
DEBT_JUMP_RATIO = Fraction(5, 4)  # 문장 7: 올해 ≥ 전년 × 1.25
DEBT_JUMP_POINTS = 10             # 문장 7: 그리고 오른 폭 ≥ 10%p

# 리포트카드 눈금 (F-05) — 검증 통계용. 화면도 같은 값을 쓴다.
# 2026-11-17 수집 뒤 조정: 영업이익률 −20~30 → −50~40, 매출 증가율 −30~50 → −40~70 (범위 밖 10% 이하)
GAUGES = {"debt_ratio": (0, 300), "operating_margin": (-50, 40), "revenue_growth": (-40, 70)}
FLAT_SHARE = Fraction(3, 100)  # 두 번의 변화가 둘 다 눈금 폭의 3% 이내면 "비슷한 수준"

FILTER_IDS = tuple(range(1, 21))
FINANCIAL_BLOCKED = frozenset({1, 2, 3, 10, 11, 12, 13, 14, 15, 16})  # 금융회사는 계산 안 함
INSIGHT_PRIORITY = {5: 1, 6: 1, 3: 2, 8: 2, 1: 3, 2: 3, 4: 3, 7: 3}
FINANCIAL_INSIGHTS = frozenset({3, 4, 5, 6, 8})

# 같이 고르면 반드시 0건인 짝 (F-03 "부딪히는 필터") — 검증·화면·챗봇 공용
CONFLICTS = ((3, 1), (3, 2), (3, 12), (9, 4), (9, 6), (9, 8), (9, 10), (6, 8), (11, 12), (15, 16))


# ---------------------------------------------------------------- 지표
def debt_ratio(row: dict | None, financial: bool) -> Fraction | None:
    if financial or not row:
        return None
    liab, eq = row.get("total_liabilities"), row.get("total_equity")
    if liab is None or eq is None or eq <= 0:
        return None
    return Fraction(liab * 100, eq)


def operating_margin(row: dict | None, financial: bool) -> Fraction | None:
    if financial or not row:
        return None
    oi, rev = row.get("operating_income"), row.get("revenue")
    if oi is None or rev is None or rev <= 0:
        return None
    return Fraction(oi * 100, rev)


def revenue_growth(row: dict | None, prev: dict | None, financial: bool) -> Fraction | None:
    if financial or not row or not prev:
        return None
    cur, base = row.get("revenue"), prev.get("revenue")
    if cur is None or base is None or base <= 0:
        return None
    return Fraction((cur - base) * 100, base)


def _all(vals) -> bool:
    return all(v is not None for v in vals)


def rising(vals) -> bool | None:
    if not _all(vals) or len(vals) < 3:
        return None
    return vals[0] < vals[1] < vals[2]


def falling(vals) -> bool | None:
    if not _all(vals) or len(vals) < 3:
        return None
    return vals[0] > vals[1] > vals[2]


def _and(*conds) -> bool | None:
    if any(c is None for c in conds):
        return None
    return all(conds)


# ---------------------------------------------------------------- 판정
class Company:
    """한 회사의 판정 재료. by_year: {fiscal_year: financials 행}."""

    def __init__(self, years: list[int], by_year: dict[int, dict], financial: bool,
                 dividends: dict[int, dict] | None = None) -> None:
        self.years = sorted(years)
        self.by_year = by_year
        self.fin = financial
        self.div = dividends or {}
        self.y = self.years[-3:]  # Y1~Y3 (3개가 안 되면 있는 만큼)

    def col(self, name: str) -> list:
        return [(self.by_year.get(y) or {}).get(name) for y in self.y]

    def dr(self) -> list:
        return [debt_ratio(self.by_year.get(y), self.fin) for y in self.y]

    def opm(self) -> list:
        return [operating_margin(self.by_year.get(y), self.fin) for y in self.y]

    def growth(self) -> list:
        return [revenue_growth(self.by_year.get(y), self.by_year.get(y - 1), self.fin) for y in self.y]

    def last2(self, vals: list) -> tuple:
        return (vals[-2], vals[-1]) if len(vals) >= 2 else (None, None)

    # 필터: True = 걸림, False = 안 걸림, None = 계산할 수 없음
    def filters(self) -> dict[int, bool | None]:
        three = len(self.y) == 3
        rev, oi, ni = self.col("revenue"), self.col("operating_income"), self.col("net_income")
        assets, eq = self.col("total_assets"), self.col("total_equity")
        dr, opm, gr = self.dr(), self.opm(), self.growth()
        rev2, rev3 = self.last2(rev)
        oi2, oi3 = self.last2(oi)
        opm2, opm3 = self.last2(opm)
        dr3, gr3 = dr[-1] if dr else None, gr[-1] if gr else None
        cap3 = (self.by_year.get(self.y[-1]) or {}).get("capital_stock") if self.y else None
        eq3 = eq[-1] if eq else None

        out: dict[int, bool | None] = {
            1: rising(rev) if three else None,
            2: None if gr3 is None else gr3 >= REVENUE_GROWTH_MIN,
            3: falling(rev) if three else None,
            4: _and(rising(oi), None if oi3 is None else oi3 > 0) if three else None,
            5: _and(rising(ni), None if ni[-1] is None else ni[-1] > 0) if three else None,
            6: (all(v > 0 for v in oi) if _all(oi) else None) if three else None,
            7: (all(v > 0 for v in ni) if _all(ni) else None) if three else None,
            8: None if oi2 is None or oi3 is None else (oi2 < 0 and oi3 > 0),
            9: None if oi2 is None or oi3 is None else (oi2 < 0 and oi3 < 0),
            10: None if opm3 is None else opm3 >= OP_MARGIN_MIN,
            11: rising(opm) if three else None,
            12: None if None in (rev2, rev3, opm2, opm3) else (rev3 > rev2 and opm3 < opm2),
            13: None if dr3 is None else dr3 <= DEBT_RATIO_MAX_WIDE,
            14: None if dr3 is None else dr3 <= DEBT_RATIO_MAX_NARROW,
            15: falling(dr) if three else None,
            16: rising(dr) if three else None,
            17: rising(assets) if three else None,
            18: rising(eq) if three else None,
            # F-03: 자본총계(Y3) < 자본금, 자본금이 0(또는 없음)이면 판단 제외
            19: None if eq3 is None or not cap3 else eq3 < cap3,
            20: self._dividend_3y() if three else None,
        }
        if self.fin:
            for i in FINANCIAL_BLOCKED:
                out[i] = None
        return out

    def _dividend_3y(self) -> bool | None:
        rows = [self.div.get(y) for y in self.y]
        if any(r is None or r.get("dps_status") == "check" for r in rows):
            return None  # 한 해라도 배당 행이 없거나 숫자가 아니면 판정하지 않음 (안 걸림)
        return all(r["dps_status"] == "paid" and (r.get("dps") or 0) > 0 for r in rows)

    def insights(self) -> list[dict]:
        if len(self.y) < 2:
            return []
        y3 = self.y[-1]
        rev2, rev3 = self.last2(self.col("revenue"))
        oi2, oi3 = self.last2(self.col("operating_income"))
        ni3 = self.col("net_income")[-1]
        opm2, opm3 = self.last2(self.opm())
        dr2, dr3 = self.last2(self.dr())
        found: list[dict] = []
        if None not in (rev2, rev3, opm2, opm3) and rev3 > rev2 and opm3 < opm2:
            found.append({"id": 1})
        if None not in (rev2, rev3, oi2, oi3) and rev3 < rev2 and oi3 > oi2:
            found.append({"id": 2})
        if oi3 is not None and ni3 is not None and oi3 > 0 and ni3 < 0:
            found.append({"id": 3})
        if oi2 is not None and oi3 is not None and oi2 < 0 and oi3 > 0:
            found.append({"id": 4, "year": y3})
        if oi2 is not None and oi3 is not None and oi2 > 0 and oi3 < 0:
            found.append({"id": 5, "year": y3})
        n = 0
        for y in reversed(self.years):  # 저장된 전체 연도를 최근부터 거슬러 셈
            v = (self.by_year.get(y) or {}).get("operating_income")
            if v is None or v >= 0:
                break
            n += 1
        if n >= 2:
            found.append({"id": 6, "n": n})
        if (dr2 is not None and dr3 is not None
                and dr3 >= dr2 * DEBT_JUMP_RATIO and dr3 - dr2 >= DEBT_JUMP_POINTS):
            found.append({"id": 7, "prev": round(float(dr2), 1), "curr": round(float(dr3), 1)})
        if oi3 is not None and ni3 is not None and oi3 < 0 and ni3 > 0:
            found.append({"id": 8})
        if self.fin:
            found = [f for f in found if f["id"] in FINANCIAL_INSIGHTS]
        return sorted(found, key=lambda f: (INSIGHT_PRIORITY[f["id"]], f["id"]))


def judge(years: list[int], by_year: dict[int, dict], financial: bool,
          dividends: dict[int, dict] | None = None) -> tuple[list[int], list[dict], dict[int, bool | None]]:
    c = Company(years, by_year, financial, dividends)
    f = c.filters()
    return [i for i in FILTER_IDS if f[i]], c.insights(), f


# ---------------------------------------------------------------- 검증 통계용 (F-05 눈금)
def gauge_values(years: list[int], by_year: dict[int, dict], financial: bool) -> dict[str, list]:
    c = Company(years, by_year, financial)
    return {"debt_ratio": c.dr(), "operating_margin": c.opm(), "revenue_growth": c.growth()}


def is_flat(vals: list, gauge: str) -> bool | None:
    if len(vals) < 3 or not _all(vals):
        return None
    lo, hi = GAUGES[gauge]
    tol = (hi - lo) * FLAT_SHARE
    return abs(vals[1] - vals[0]) <= tol and abs(vals[2] - vals[1]) <= tol
