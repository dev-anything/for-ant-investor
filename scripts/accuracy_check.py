"""6단계 데이터 정확도 대조 (PRD 9장): 표본 20종목의 화면 값과 DART 원본을 비교한다.

입력: 아래 SAMPLE 고정 목록. 값 A는 DB 뷰 `v_company_years`(화면이 읽는 값, 읽기만 함),
      값 B는 DART `fnlttSinglAcnt.json` 사업보고서(11011)를 새로 불러서 계산한 값.
출력: api_check_results/accuracy_<날짜>.md (종목·항목·연도별 표와 일치율). 콘솔에는 요약만 낸다.

규칙 (batch/dart_collect.py를 따른다):
- 계정 이름·연도 위치·중복 처리는 batch.dart_collect의 ACCOUNT_COLS·PERIODS를 그대로 쓴다.
  같은 계정이 여러 번 오면 첫 값을 쓰고, 값이 다르면 불일치 메모로 남긴다.
- 보고서는 최신(표시 연도 끝)과 그 전년 두 개를 부르고, 최신 보고서 값을 우선한다. 4개년까지만 쓴다.
- 연결(CFS)이 하나라도 있으면 연결, 없으면 별도(OFS) (CLAUDE.md DART 절).
- 비교 대상 연도 = 뷰의 표시 연도(Y1~Y3). 금액은 원 단위가 정확히 같아야 한다.
- 비율(부채비율·영업이익률·매출 증가율)은 원 금액으로 계산해 소수 1자리(ROUND_HALF_UP)로 맞춘 뒤 비교한다.
  화면 표시 규칙(PRD 3장 반올림)과 같다. null↔null은 일치.
- 금융회사는 PRD F-02대로 영업이익·순이익만 표시하므로 그 두 항목만 비교한다 (비율·매출은 표시 대상이 아님).
- 금융회사 판별(매출액 계정 없음 또는 업종 64~66, 64992 제외)도 DART 쪽에서 다시 판정해 DB와 맞는지 본다.
- 키·요청 URL은 출력하지 않는다 (Dart 클래스가 응답 오류 메시지에서도 키를 가린다).
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, getcontext
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from batch.common import Dart, Supabase  # noqa: E402
from batch.dart_collect import (  # noqa: E402
    ACCOUNT_COLS, DIV_PERIODS, PERIODS, REPRT, SE_DPS, SE_YIELD, to_int, to_num,
)

# ---------------------------------------------------------------- 표본 (고정 20종목)
# 시장·업종·금융회사·적자·자본잠식·별도재무제표·12월 결산 아님이 섞이도록 골랐다 (PRD 9장).
SAMPLE = [
    ("005930", "삼성전자 · KOSPI 제조 · 대형 기준"),
    ("105560", "KB금융 · 금융회사(지주) · 연결"),
    ("011810", "STX · KOSPI 건설 · 적자 · 완전 자본잠식"),
    ("008600", "윌비스 · KOSPI 건설 · 적자 · 부분 자본잠식"),
    ("034220", "LG디스플레이 · KOSPI 제조 · 적자"),
    ("000540", "흥국화재 · KOSPI 금융(보험) · 별도재무제표"),
    ("016360", "삼성증권 · KOSPI 금융(증권) · 연결"),
    ("066900", "디에이피 · KOSDAQ 제조 · 적자 · 완전 자본잠식"),
    ("245620", "EDGC · KOSDAQ 서비스 · 적자 · 완전 자본잠식"),
    ("040350", "크레오에스지 · KOSDAQ 제조 · 적자 · 부분 자본잠식"),
    ("002210", "동성제약 · KOSPI 제약 · 별도재무제표 · 부분 자본잠식"),
    ("214390", "경보제약 · KOSPI 제약 · 별도재무제표 · 흑자"),
    ("021320", "KCC건설 · KOSDAQ 건설 · 별도재무제표"),
    ("018500", "동원모빌리티 · KOSPI · 12월 결산 아님(3월)"),
    ("050860", "아세아텍 · KOSDAQ · 12월 결산 아님(6월) · 별도재무제표"),
    ("042520", "한스바이오메드 · KOSDAQ · 12월 결산 아님(9월) · 적자"),
    ("020180", "대신정보통신 · KOSDAQ · 12월 결산 아님(3월) · 별도재무제표 · 적자"),
    ("025880", "케이씨피드 · KOSDAQ 식품 · 흑자 기준"),
    ("017650", "대림제지 · KOSDAQ 제지 · 흑자 기준"),
    ("009810", "MDS스피어 · KOSPI 제조 · 적자"),
]

# ---------------------------------------------------------------- 기준값
DECIMALS = 1                     # 화면 비율 소수 1자리 (PRD 3장 반올림)
FINANCIAL_CHECK_ITEMS = ("operating_income", "net_income")  # PRD F-02: 금융회사 표시 항목
ALL_ITEMS = ("revenue", "operating_income", "net_income", "debt_ratio", "operating_margin", "revenue_growth")
RATIO_ITEMS = ("debt_ratio", "operating_margin", "revenue_growth")
AMOUNT_ITEMS = ("revenue", "operating_income", "net_income")
ITEM_LABEL = {
    "revenue": "매출액", "operating_income": "영업이익", "net_income": "순이익",
    "debt_ratio": "부채비율", "operating_margin": "영업이익률", "revenue_growth": "매출 증가율",
}
FINANCIAL_CODE_RANGE = ("64", "65", "66")  # 금융 업종 코드 앞 두 자리 (CLAUDE.md, 2026-11-16)
FINANCIAL_EXCEPTION = "64992"              # 지주회사 예외 (금융 판별에서 제외)

getcontext().prec = 50


# ---------------------------------------------------------------- DB 값 (화면이 읽는 뷰)
def fetch_db(db: Supabase, corp: str) -> dict:
    """회사 한 곳의 요약 행과 표시 연도 행(v_company_years)을 읽는다 (읽기만)."""
    summ = db.select("company_summary", {"corp_code": f"eq.{corp}"})
    comp = db.select("companies", {"corp_code": f"eq.{corp}", "select": "corp_code,corp_name,induty_code,acc_mt"})
    stock = db.select("stocks", {"corp_code": f"eq.{corp}", "select": "short_code,itms_nm,mrkt_ctg"})
    if not summ:
        raise RuntimeError(f"company_summary 없음: {corp}")
    s = summ[0]
    rows = db.select("v_company_years", {"corp_code": f"eq.{corp}", "fs_div": f"eq.{s['fs_div']}",
                                         "is_display_year": "eq.true"})
    return {"summary": s, "company": comp[0] if comp else {}, "stock": stock[0] if stock else {},
            "years": {r["fiscal_year"]: r for r in rows}}


# ---------------------------------------------------------------- DART 값 (원본 재계산)
def parse_dart(body: dict, bsns_year: int) -> tuple[dict, bool]:
    """DART 응답 → ({(연도, fs_div): {금액 열: 값}}, 매출액 계정 있음). batch/dart_collect.parse_fs와 같은 규칙."""
    out: dict[tuple[int, str], dict] = {}
    seen: dict[tuple[str, str, int], int | None] = {}
    has_revenue = False
    for r in body.get("list", []):
        fs_div, name = r.get("fs_div"), (r.get("account_nm") or "").strip()
        if fs_div not in ("CFS", "OFS") or not name:
            continue
        if name == "매출액":
            has_revenue = True
        for field, back in PERIODS:
            year = bsns_year - back
            val = to_int(r.get(f"{field}_amount"))
            key = (fs_div, name, year)
            if key in seen:
                continue  # 중복 계정: 첫 값 사용 (다르면 아래 비교에서 드러난다)
            seen[key] = val
            col = ACCOUNT_COLS.get(name)
            if col:
                row = out.setdefault((year, fs_div), {})
                if row.get(col) is None:
                    row[col] = val
    return out, has_revenue


def fetch_dart(dart: Dart, corp: str, latest: int) -> tuple[dict, bool, str]:
    """최신·전년 사업보고서를 받아 합친다. 반환: (연도·fs별 값, 매출액 계정 있음, 사용한 fs_div)."""
    merged: dict[tuple[int, str], dict] = {}
    has_rev = False
    for year in (latest - 1, latest):  # 전년 먼저, 최신이 덮어쓴다
        body = dart.json("fnlttSinglAcnt.json", {"corp_code": corp, "bsns_year": str(year), "reprt_code": REPRT})
        if body.get("status") != "000":
            if year == latest:
                raise RuntimeError(f"DART status {body.get('status')} (bsns_year {year})")
            continue
        parsed, rev = parse_dart(body, year)
        if year == latest:
            has_rev = rev
        merged.update(parsed)
    years = sorted({y for y, _ in merged}, reverse=True)[:4]
    merged = {k: v for k, v in merged.items() if k[0] in years}
    fs = "CFS" if any(k[1] == "CFS" for k in merged) else "OFS"
    return merged, has_rev, fs


# ---------------------------------------------------------------- 계산 (PRD 정의)
def round_one(value: Fraction | None) -> Decimal | None:
    """비율을 화면과 같이 소수 1자리 HALF_UP으로 맞춘다."""
    if value is None:
        return None
    d = Decimal(value.numerator) / Decimal(value.denominator)
    return d.quantize(Decimal(1).scaleb(-DECIMALS), rounding=ROUND_HALF_UP)


def dart_ratios(cur: dict | None, prev: dict | None, financial: bool) -> dict[str, Fraction | None]:
    """부채비율·영업이익률·매출 증가율 (PRD 4장 정의, v_company_years와 같은 null 규칙)."""
    if financial or not cur:
        return {"debt_ratio": None, "operating_margin": None, "revenue_growth": None}
    liab, eq = cur.get("total_liabilities"), cur.get("total_equity")
    oi, rev = cur.get("operating_income"), cur.get("revenue")
    debt = Fraction(liab * 100, eq) if liab is not None and eq is not None and eq > 0 else None
    margin = Fraction(oi * 100, rev) if oi is not None and rev is not None and rev > 0 else None
    growth = None
    if prev and prev.get("revenue") is not None and rev is not None and prev["revenue"] > 0:
        growth = Fraction((rev - prev["revenue"]) * 100, prev["revenue"])
    return {"debt_ratio": debt, "operating_margin": margin, "revenue_growth": growth}


def is_financial_dart(has_revenue: bool, induty: str) -> bool:
    """금융회사 판별: 매출액 계정 없음 OR (업종 64~66, 64992 제외)."""
    by_industry = induty[:2] in FINANCIAL_CODE_RANGE and induty != FINANCIAL_EXCEPTION
    return (not has_revenue) or by_industry


# ---------------------------------------------------------------- 비교
def compare_stock(corp: str, db_data: dict, dart_rows: dict, has_rev: bool, dart_fs: str) -> tuple[list[dict], list[str]]:
    """한 종목의 항목별 비교 결과와 판별 메모를 만든다."""
    results: list[dict] = []
    notes: list[str] = []
    summ = db_data["summary"]
    financial_db = bool(summ["is_financial"])
    induty = db_data["company"].get("induty_code") or ""
    financial_dart = is_financial_dart(has_rev, induty)
    if financial_db != financial_dart:
        notes.append(f"금융회사 판별 불일치: DB={financial_db}, DART 재계산={financial_dart}")
    if summ["fs_div"] != dart_fs:
        notes.append(f"연결/별도 선택 불일치: DB={summ['fs_div']}, DART={dart_fs}")
    financial = financial_db  # 화면이 쓰는 판별로 항목을 고른다 (판별 불일치는 메모로 따로 본다)
    items = FINANCIAL_CHECK_ITEMS if financial else ALL_ITEMS

    for year in sorted(db_data["years"]):
        db_row = db_data["years"][year]
        cur = dart_rows.get((year, dart_fs))
        prev = dart_rows.get((year - 1, dart_fs))
        ratios = dart_ratios(cur, prev, financial)
        for item in items:
            if item in AMOUNT_ITEMS:  # 금액: 원 단위 정확히 같아야 한다
                a = db_row.get(item)
                b = cur.get(item) if cur else None
                a_s = "-" if a is None else f"{a:,}"
                b_s = "-" if b is None else f"{b:,}"
            else:  # 비율: 소수 1자리로 맞춘 뒤 비교한다
                a_raw = db_row.get(item)
                a = None if a_raw is None else round_one(Fraction(str(a_raw)))
                b = round_one(ratios[item])
                a_s = "-" if a is None else f"{a}"
                b_s = "-" if b is None else f"{b}"
            ok = a == b
            results.append({"corp": corp, "year": year, "item": item, "db": a_s, "dart": b_s, "ok": ok})
    return results, notes


# ---------------------------------------------------------------- 배당 대조 (PRD 9장: 주당 배당금·배당수익률)
DIV_ITEMS = ("dps", "yield")
DIV_LABEL = {"dps": "주당 배당금", "yield": "배당수익률"}
NO_DATA = "데이터 없음"  # 화면: "이 회사의 배당 정보가 없어" (PRD F-14 표)


def fetch_db_dividends(db: Supabase, corp: str) -> dict[int, dict]:
    """화면이 읽는 dividends 행을 연도별로 (읽기만 함)."""
    rows = db.select("dividends", {"corp_code": f"eq.{corp}"})
    return {r["fiscal_year"]: r for r in rows}


def dart_dividends(dart: Dart, corp: str, latest: int) -> tuple[dict[int, dict], list[str]]:
    """DART alotMatter 사업보고서(최신 연도 1회)를 연도별 기대 값으로 바꾼다.
    batch/dart_collect.fetch_dividend와 같은 규칙: 보통주 행만, 무배당은 '-' 또는 0, 수익률 없으면 공시 없음.
    반환: ({연도: {dps_status, dps, yield_status, dividend_yield}}, 메모). 013이면 빈 dict + 메모."""
    body = dart.json("alotMatter.json", {"corp_code": corp, "bsns_year": str(latest), "reprt_code": REPRT})
    st = body.get("status")
    if st == "013":
        return {}, [f"DART 배당 013 (bsns_year {latest}): 공시 없음으로 취급"]
    if st != "000":
        raise RuntimeError(f"DART 배당 status {st} (bsns_year {latest})")
    rows = body.get("list", [])
    notes: list[str] = []

    def pick(se: str) -> dict | None:
        found = [r for r in rows if (r.get("se") or "").strip() == se
                 and (r.get("stock_knd") or "").strip() == "보통주"]
        if len(found) > 1 and any(tuple(f.get(p) for p, _ in DIV_PERIODS)
                                  != tuple(found[0].get(p) for p, _ in DIV_PERIODS) for f in found[1:]):
            notes.append(f"배당 중복 행 값이 다름 ({se}): 첫 행 사용 (batch도 같은 규칙, data_issues 기록 대상)")
        return found[0] if found else None

    dps_row, yld_row = pick(SE_DPS), pick(SE_YIELD)
    out: dict[int, dict] = {}
    for field, back in DIV_PERIODS:
        fy = latest - back
        raw_dps = ((dps_row or {}).get(field) or "").strip()
        raw_yld = ((yld_row or {}).get(field) or "").strip()
        dps = to_num(raw_dps)
        dps_val = None
        if raw_dps in ("", "-") or dps == 0:
            dps_status = "none"
        elif dps is None:
            dps_status = "check"  # 숫자가 아님: 화면 "확인 필요"
        else:
            dps_status = "paid"
            dps_val = Decimal(raw_dps.replace(",", ""))  # 원 단위 비교용 (소수면 그대로 둔다)
        yld = to_num(raw_yld)
        if yld is not None:
            yield_status = "value"
        elif dps_status == "paid":
            yield_status = "not_disclosed"  # 배당은 했는데 수익률 공시 없음 (직접 계산하지 않는다)
        else:
            yield_status = "none"
        out[fy] = {"dps_status": dps_status, "dps": dps_val, "yield_status": yield_status,
                   "dividend_yield": Decimal(raw_yld.replace(",", "")) if yld is not None else None}
    return out, notes


def compare_dividends(corp: str, display_years: list[int], db_rows: dict[int, dict],
                      dart_rows: dict[int, dict], latest: int, notes: list[str]) -> list[dict]:
    """표시 연도(Y1~Y3)마다 주당 배당금·배당수익률 두 칸을 비교한다.
    금액: 원 단위 정확히 같음 (Decimal 비교). 배당수익률: 소수 1자리 HALF_UP 뒤 비교 (화면 규칙).
    상태(paid/none/check, value/not_disclosed/none)는 값과 같이 맞아야 한다. 공시·행 없음도 상태로 본다."""
    results: list[dict] = []
    db_src = {r.get("source_bsns_year") for r in db_rows.values()}
    if db_rows and db_src != {latest}:
        notes.append(f"DB 배당 출처 연도 {sorted(x for x in db_src if x)} ≠ DART 최신 연도 {latest}")
    for year in sorted(display_years):
        d_row = db_rows.get(year)
        t_row = dart_rows.get(year)
        # DB 값 (화면이 쓰는 값)
        db_dps = None if d_row is None else {"status": d_row["dps_status"], "value": d_row["dps"]}
        db_yld = None if d_row is None else {"status": d_row["yield_status"],
                                             "value": round_one(Fraction(str(d_row["dividend_yield"])))
                                             if d_row["dividend_yield"] is not None else None}
        # DART 원본 기대 값
        t_dps = None if t_row is None else {"status": t_row["dps_status"],
                                            "value": t_row["dps"]}
        t_yld = None if t_row is None else {"status": t_row["yield_status"],
                                            "value": round_one(Fraction(str(t_row["dividend_yield"])))
                                            if t_row["dividend_yield"] is not None else None}
        for item in DIV_ITEMS:
            a = db_dps if item == "dps" else db_yld
            b = t_dps if item == "dps" else t_yld
            a_s = NO_DATA if a is None else _fmt_div(item, a)
            b_s = NO_DATA if b is None else _fmt_div(item, b)
            ok = a == b or (a is None and b is None)
            results.append({"corp": corp, "year": year, "item": item, "db": a_s, "dart": b_s, "ok": ok})
    return results


def _fmt_div(item: str, cell: dict) -> str:
    """칸 표시 문자열: 상태 + 값 (금액은 천 단위 쉼표, 수익률은 소수 1자리)."""
    st, v = cell["status"], cell["value"]
    if v is None:
        return st
    if item == "dps":
        return f"{st} {Decimal(v):,.0f}"
    return f"{st} {v}"


def run_dividends() -> int:
    """배당 대조만 실행하고 api_check_results/accuracy_dividends_<날짜>.md를 쓴다 (키·URL 출력 없음)."""
    db = Supabase()
    dart = Dart()
    out_rows: list[dict] = []
    notes_all: dict[str, list[str]] = {}
    failures: dict[str, str] = {}
    names: dict[str, str] = {}

    for code, _tag in SAMPLE:
        stock = db.select("stocks", {"short_code": f"eq.{code}", "select": "corp_code,itms_nm"})
        if not stock:
            failures[code] = "stocks에 종목코드 없음"
            continue
        corp = stock[0]["corp_code"]
        names[code] = f"{stock[0]['itms_nm']} ({code})"
        try:
            summ = db.select("company_summary", {"corp_code": f"eq.{corp}"})[0]
            latest = summ["latest_year"]
            display_years = [latest - 2, latest - 1, latest]  # 화면 3개년 (PRD F-02). 4번째 해는 F-05 증가율용이라 비교 안 함
            db_rows = fetch_db_dividends(db, corp)
            dart_rows, notes = dart_dividends(dart, corp, latest)
            results = compare_dividends(corp, display_years, db_rows, dart_rows, latest, notes)
            for r in results:
                r["code"] = code
            out_rows.extend(results)
            notes_all[code] = notes
        except Exception as e:  # 한 종목 실패가 전체를 멈추지 않게 기록한다
            failures[code] = str(e)[:200]

    total = len(out_rows)
    matched = sum(1 for r in out_rows if r["ok"])
    rate = (Decimal(matched) * 100 / Decimal(total)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP) if total else Decimal(0)
    today = date.today().isoformat()
    path = ROOT / "api_check_results" / f"accuracy_dividends_{today}.md"
    path.parent.mkdir(exist_ok=True)

    lines = [f"# 배당 정확도 대조 ({today})", "",
             "- 표본: 20종목 (PRD 9장), 값 A = DB `dividends`(화면), 값 B = DART `alotMatter.json` 사업보고서(11011, 최신 연도 1회)",
             f"- 대조 칸 {total}칸 중 일치 {matched}칸",
             f"- **전체 일치율: {rate}%** (목표 95% 이상)", ""]
    stats: dict[str, list[int]] = {}
    for r in out_rows:
        s = stats.setdefault(r["item"], [0, 0])
        s[0] += 1
        s[1] += 1 if r["ok"] else 0
    lines += ["## 항목별", "", "| 항목 | 칸 | 일치 | 일치율 |", "| --- | --- | --- | --- |"]
    for item in DIV_ITEMS:
        if item in stats:
            n, m = stats[item]
            lines.append(f"| {DIV_LABEL[item]} | {n} | {m} | {Decimal(m) * 100 / Decimal(n):.1f}% |")
    lines += ["", "## 불일치 목록", ""]
    mism = [r for r in out_rows if not r["ok"]]
    if mism:
        lines += ["| 종목 | 연도 | 항목 | 화면(DB) | DART 원본 |", "| --- | --- | --- | --- | --- |"]
        for r in mism:
            lines.append(f"| {r['code']} | {r['year']} | {DIV_LABEL[r['item']]} | {r['db']} | {r['dart']} |")
    else:
        lines.append("없음.")
    lines += ["", "## 종목별 상세", ""]
    for code, _ in SAMPLE:
        if code in failures:
            lines += [f"### {code} (실패)", f"- {failures[code]}", ""]
            continue
        rows = [r for r in out_rows if r["code"] == code]
        if not rows:
            continue
        lines.append(f"### {names.get(code, code)}")
        for n in notes_all.get(code, []):
            lines.append(f"- 메모: {n}")
        years = sorted({r["year"] for r in rows})
        lines += ["", "| 항목 | " + " | ".join(str(y) for y in years) + " |", "|---" * (len(years) + 1) + "|"]
        for item in DIV_ITEMS:
            cells = []
            for y in years:
                r = next(x for x in rows if x["year"] == y and x["item"] == item)
                cells.append(f"{'일치' if r['ok'] else '**불일치**'} (화면 {r['db']} / DART {r['dart']})")
            lines.append(f"| {DIV_LABEL[item]} | " + " | ".join(cells) + " |")
        lines.append("")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"배당 대조: 표본 {len(SAMPLE)}종목, 대조 {total}칸, 일치 {matched}칸, 전체 일치율 {rate}%")
    print(f"불일치 {len(mism)}칸, 실패 종목 {len(failures)}개")
    for code, msg in failures.items():
        print(f"  실패 {code}: {msg}")
    print(f"결과 파일: {path}")
    return 0


def main() -> int:
    db = Supabase()
    dart = Dart()
    out_rows: list[dict] = []
    notes_all: dict[str, list[str]] = {}
    failures: dict[str, str] = {}
    names: dict[str, str] = {}

    for corp_or_code, tag in SAMPLE:
        stock = db.select("stocks", {"short_code": f"eq.{corp_or_code}", "select": "corp_code,itms_nm"})
        if not stock:
            failures[corp_or_code] = "stocks에 종목코드 없음"
            continue
        corp = stock[0]["corp_code"]
        names[corp_or_code] = f"{stock[0]['itms_nm']} ({corp_or_code})"
        try:
            db_data = fetch_db(db, corp)
            latest = db_data["summary"]["latest_year"]
            dart_rows, has_rev, dart_fs = fetch_dart(dart, corp, latest)
            results, notes = compare_stock(corp, db_data, dart_rows, has_rev, dart_fs)
            for r in results:
                r["code"] = corp_or_code
            out_rows.extend(results)
            notes_all[corp_or_code] = notes
        except Exception as e:  # 한 종목 실패가 전체를 멈추지 않게 기록한다
            failures[corp_or_code] = str(e)[:200]

    total = len(out_rows)
    matched = sum(1 for r in out_rows if r["ok"])
    rate = (Decimal(matched) * 100 / Decimal(total)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP) if total else Decimal(0)

    today = date.today().isoformat()
    path = ROOT / "api_check_results" / f"accuracy_{today}.md"
    path.parent.mkdir(exist_ok=True)
    lines = [f"# 데이터 정확도 대조 ({today})", "",
             f"- 표본: {len(SAMPLE)}종목 (PRD 9장), 대조 항목 {total}칸 중 일치 {matched}칸",
             f"- **전체 일치율: {rate}%** (목표 95% 이상)", ""]
    item_stats: dict[str, list[int]] = {}
    for r in out_rows:
        s = item_stats.setdefault(r["item"], [0, 0])
        s[0] += 1
        s[1] += 1 if r["ok"] else 0
    lines += ["## 항목별", "", "| 항목 | 칸 | 일치 | 일치율 |", "| --- | --- | --- | --- |"]
    for item in ALL_ITEMS:
        if item in item_stats:
            n, m = item_stats[item]
            lines.append(f"| {ITEM_LABEL[item]} | {n} | {m} | {Decimal(m) * 100 / Decimal(n):.1f}% |")
    lines += ["", "## 불일치 목록", ""]
    mism = [r for r in out_rows if not r["ok"]]
    if mism:
        lines += ["| 종목 | 연도 | 항목 | 화면(DB) | DART 원본 |", "| --- | --- | --- | --- | --- |"]
        for r in mism:
            lines.append(f"| {r['code']} | {r['year']} | {ITEM_LABEL[r['item']]} | {r['db']} | {r['dart']} |")
    else:
        lines.append("없음.")
    lines += ["", "## 종목별 상세", ""]
    for code, _ in SAMPLE:
        if code in failures:
            lines += [f"### {code} (실패)", f"- {failures[code]}", ""]
            continue
        rows = [r for r in out_rows if r["code"] == code]
        if not rows:
            continue
        lines.append(f"### {names.get(code, code)}")
        for n in notes_all.get(code, []):
            lines.append(f"- 판별 메모: {n}")
        years = sorted({r["year"] for r in rows})
        items = sorted({r["item"] for r in rows}, key=ALL_ITEMS.index)
        lines += ["", "| 항목 | " + " | ".join(f"{y}" for y in years) + " |", "|---" * (len(years) + 1) + "|"]
        for item in items:
            cells = []
            for y in years:
                r = next(x for x in rows if x["year"] == y and x["item"] == item)
                cells.append(f"{'일치' if r['ok'] else '**불일치**'} (화면 {r['db']} / DART {r['dart']})")
            lines.append(f"| {ITEM_LABEL[item]} | " + " | ".join(cells) + " |")
        lines.append("")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"표본 {len(SAMPLE)}종목, 대조 {total}칸, 일치 {matched}칸, 전체 일치율 {rate}%")
    print(f"불일치 {len(mism)}칸, 실패 종목 {len(failures)}개")
    for code, msg in failures.items():
        print(f"  실패 {code}: {msg}")
    print(f"결과 파일: {path}")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="데이터 정확도 대조 (PRD 9장)")
    ap.add_argument("--dividends", action="store_true", help="배당(주당 배당금·배당수익률)만 대조")
    args = ap.parse_args()
    raise SystemExit(run_dividends() if args.dividends else main())
