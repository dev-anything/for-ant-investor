"""DART 수집 배치 (F-04): 기업개황·주요계정·배당·감사의견 → Supabase.

실행 (프로젝트 루트, 개인 서버):
  python3 -m batch.dart_collect --mode initial            # 처음 수집 (약 12,900회, 약 37분)
  python3 -m batch.dart_collect --mode monthly            # 매월 5일: 새 사업보고서가 나온 회사만
  python3 -m batch.dart_collect --mode initial --only 005930 000660   # 일부 종목만 (시험용)
  python3 -m batch.dart_collect --mode initial --limit 20

규칙 (docs/개발기능.md F-04, docs/DATABASE.md):
- 대상: 검색 대상(v_search_targets) 중 외국회사 제외, corp_code가 있는 종목.
- 처음 수집: 최신 사업보고서(작년 → 없으면 재작년) 3개년 + 한 해 전 사업보고서 → 4개년.
  겹치는 연도는 최신 보고서 값만 저장, 값이 다르면 data_issues(overlap_year).
- 같은 계정이 두 번 오면 같으면 하나, 다르면 먼저 온 행 + data_issues(dup_account).
- 013은 같은 배치 끝에서 한 번 더 부르고, 그래도 013이면 "데이터 없음"(dart_fetch_status 013).
- initial은 이어 하기 가능: 이미 주요계정을 받은 회사(fs 000)는 건너뛴다 (--force로 다시).
- 분당 약 350회. 한도 초과(020)·키 오류면 바로 멈춘다.
- company_summary는 여기서 기본 판정(연결/별도, 연도, 금융회사, 자본잠식)을 채우고,
  배치 끝에 재무를 새로 저장한 회사만 batch.recompute로 필터·문장을 다시 계산한다
  (배당까지 받은 뒤라야 필터 20이 맞다).
"""

from __future__ import annotations

import argparse
import io
import re
import time
import xml.etree.ElementTree as ET
import zipfile
from datetime import date

from batch.common import Dart, DartStop, Supabase, log, now_iso
from batch.recompute import recompute

REPRT = "11011"  # 사업보고서
RULE_VERSION = "base-2026-11-17"  # 필터·문장 없이 기본 판정만
RETRY_013_WAIT = 60  # 013 재확인 전 대기 (초)

ACCOUNT_COLS = {
    "매출액": "revenue",
    "영업이익": "operating_income",
    "영업이익(손실)": "operating_income",
    "당기순이익": "net_income",
    "당기순이익(손실)": "net_income",
    "자산총계": "total_assets",
    "부채총계": "total_liabilities",
    "자본총계": "total_equity",
    "자본금": "capital_stock",
}
VALUE_COLS = sorted(set(ACCOUNT_COLS.values()))
PERIODS = (("thstrm", 0), ("frmtrm", 1), ("bfefrmtrm", 2))  # 주요계정: 당기·전기·전전기
DIV_PERIODS = (("thstrm", 0), ("frmtrm", 1), ("lwfr", 2))   # 배당
SE_DPS = "주당 현금배당금(원)"
SE_YIELD = "현금배당수익률(%)"


def to_int(v) -> int | None:
    """'1,234' → 1234, '(1,234)' → -1234, '-'·'' → None."""
    if v is None:
        return None
    s = str(v).strip().replace(",", "")
    neg = s.startswith("(") and s.endswith(")")
    s = s.strip("()")
    if s in ("", "-"):
        return None
    try:
        n = int(float(s)) if "." in s else int(s)
    except ValueError:
        return None
    return -n if neg else n


def to_num(v) -> float | None:
    s = (v or "").strip().replace(",", "")
    if s in ("", "-"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def period_number(label: str | None) -> int | None:
    """기수 라벨에서 기 번호: '제 59 기 (당) 기' → 59, '2023년\\n(제27기)' → 27."""
    s = re.sub(r"\s", "", label or "")
    m = re.search(r"제?(\d{1,3})(?:\([당전]+\))?기", s)
    return int(m.group(1)) if m else None


def audit_fiscal_year(label: str, bsns_year: int, top: int | None) -> int | None:
    """감사의견 응답의 bsns_year(기수 라벨)를 사업연도로 바꾼다. 형식이 회사마다 달라 차례로 본다.
    1) 당기·전기·전전기 표기  2) 연도 표기('2024년', '~'25.12.31')  3) 기 번호(가장 큰 번호 = 당기)."""
    s = re.sub(r"\s", "", label or "")
    if "전전" in s:
        return bsns_year - 2
    if "(전)" in s or "전기" in s:
        return bsns_year - 1
    if "(당)" in s or "당기" in s or "당반기" in s:
        return bsns_year
    ok = {bsns_year, bsns_year - 1, bsns_year - 2}
    m = re.search(r"~'?(\d{2})\.\d{2}\.\d{2}", s)
    if m and 2000 + int(m.group(1)) in ok:
        return 2000 + int(m.group(1))
    m = re.search(r"(20\d{2})(?:년|연도)", s)
    if m and int(m.group(1)) in ok:
        return int(m.group(1))
    n = period_number(label)
    if n is not None and top is not None and 0 <= top - n <= 2:
        return bsns_year - (top - n)
    return None


class Collector:
    def __init__(self, mode: str, force: bool) -> None:
        self.mode, self.force = mode, force
        self.db, self.dart = Supabase(), Dart()
        self.this_year = date.today().year
        self.issues: list[dict] = []
        self.stats = {"companies": 0, "new_reports": 0, "skipped": 0, "status_013": 0, "errors": 0}
        self.ksic = {r["code"] for r in self.db.select("ksic_classes", {"select": "code", "level": "eq.division"})}

    # ------------------------------------------------------------ 공통
    def issue(self, kind: str, corp: str | None, year: int | None = None, **detail) -> None:
        self.issues.append({"batch_run_id": self.run_id, "kind": kind, "corp_code": corp,
                            "fiscal_year": year, "detail": detail})

    def flush_issues(self) -> None:
        if self.issues:
            self.db.insert("data_issues", self.issues)
            self.issues = []

    def set_status(self, corp: str, api: str, status: str, year: int | None = None,
                   rcept: str | None = None, retry: int = 0, message: str | None = None) -> None:
        row = {"corp_code": corp, "api": api, "status": status, "retry_count": retry,
               "checked_at": now_iso(), "message": message}
        if status == "000":
            row.update(last_bsns_year=year, last_rcept_no=rcept)
        self.db.upsert("dart_fetch_status", [row], "corp_code,api")
        self.status.setdefault(corp, {})[api] = {**self.status.get(corp, {}).get(api, {}), **row}

    def call(self, path: str, corp: str, year: int | None = None) -> dict:
        params = {"corp_code": corp}
        if year is not None:
            params.update(bsns_year=str(year), reprt_code=REPRT)
        return self.dart.json(path, params)

    # ------------------------------------------------------------ 대상
    def sync_corp_codes(self) -> None:
        """corpCode.xml로 stocks.corp_code를 채운다 (바뀐 것만)."""
        with zipfile.ZipFile(io.BytesIO(self.dart.raw("corpCode.xml", {}))) as zf:
            root = ET.fromstring(zf.read(zf.namelist()[0]))
        by_stock = {}
        for item in root.iter("list"):
            sc = (item.findtext("stock_code") or "").strip()
            if sc:
                by_stock[sc] = item.findtext("corp_code").strip()
        stocks = self.db.select("stocks", {"select": "srtn_cd,short_code,corp_code", "is_listed": "is.true"})
        changed = 0
        for s in stocks:
            cc = by_stock.get(s["short_code"])
            if cc and cc != s["corp_code"]:
                self.db.update("stocks", {"srtn_cd": f"eq.{s['srtn_cd']}"}, {"corp_code": cc})
                changed += 1
        log(f"corpCode.xml {len(by_stock)}개 회사, stocks.corp_code 갱신 {changed}건")

    def targets(self, only: list[str] | None, limit: int | None) -> list[dict]:
        rows = self.db.select("v_search_targets",
                              {"select": "short_code,itms_nm,corp_code", "is_foreign": "is.false",
                               "order": "short_code"})
        missing = [r for r in rows if not r["corp_code"]]
        if missing:
            log(f"corp_code를 못 찾은 종목 {len(missing)}개 (수집 제외): "
                + ", ".join(f"{r['itms_nm']}({r['short_code']})" for r in missing[:10]))
        rows = [r for r in rows if r["corp_code"]]
        if only:
            rows = [r for r in rows if r["short_code"] in only]
        return rows[:limit] if limit else rows

    # ------------------------------------------------------------ 기업개황
    def fetch_company(self, corp: str) -> str:
        body = self.call("company.json", corp)
        st = body.get("status")
        if st != "000":
            self.set_status(corp, "company", "013" if st == "013" else "error",
                            message=None if st == "013" else f"{st} {body.get('message')}")
            return st
        raw = {k: v for k, v in body.items() if k not in ("status", "message")}
        self.db.upsert("companies", [{
            "corp_code": corp, "corp_name": body.get("corp_name"), "stock_code": body.get("stock_code"),
            "jurir_no": body.get("jurir_no"), "induty_code": body.get("induty_code"),
            "acc_mt": body.get("acc_mt"), "corp_cls": body.get("corp_cls"), "raw": raw,
            "fetched_at": now_iso()}], "corp_code")
        self.companies[corp] = {"induty_code": body.get("induty_code")}
        ind = body.get("induty_code") or ""
        if ind[:2] not in self.ksic:
            self.issue("unknown_ksic", corp, induty_code=ind)
        self.set_status(corp, "company", "000")
        return "000"

    # ------------------------------------------------------------ 주요계정
    def parse_fs(self, corp: str, body: dict, bsns_year: int) -> dict:
        """응답 → {(fiscal_year, fs_div): row}. 중복 계정 규칙 적용."""
        out: dict[tuple[int, str], dict] = {}
        seen: dict[tuple[str, str, int], int | None] = {}
        rcept = None
        for r in body.get("list", []):
            rcept = rcept or r.get("rcept_no")
            fs_div, name = r.get("fs_div"), (r.get("account_nm") or "").strip()
            if fs_div not in ("CFS", "OFS") or not name:
                continue
            for field, back in PERIODS:
                year = bsns_year - back
                val = to_int(r.get(f"{field}_amount"))
                row = out.setdefault((year, fs_div), {
                    "corp_code": corp, "fiscal_year": year, "fs_div": fs_div,
                    **{c: None for c in VALUE_COLS}, "has_revenue_account": False,
                    "other_accounts": {}, "source_bsns_year": bsns_year})
                if name == "매출액":
                    row["has_revenue_account"] = True
                key = (fs_div, name, year)
                if key in seen:
                    if seen[key] != val:
                        self.issue("dup_account", corp, year, fs_div=fs_div, account=name,
                                   first=seen[key], second=val, bsns_year=bsns_year)
                    continue
                seen[key] = val
                col = ACCOUNT_COLS.get(name)
                if col:
                    if row[col] is None:
                        row[col] = val
                else:
                    row["other_accounts"][name] = val
        for row in out.values():
            row["source_rcept_no"] = rcept
        # 당기 칸이 없는 연도(전전기가 비는 회사 등)는 값이 하나도 없으면 버린다
        return {k: v for k, v in out.items()
                if any(v[c] is not None for c in VALUE_COLS) or v["other_accounts"]}

    def fs_report(self, corp: str, year: int) -> tuple[str, dict]:
        body = self.call("fnlttSinglAcnt.json", corp, year)
        st = body.get("status")
        return st, (self.parse_fs(corp, body, year) if st == "000" else {})

    def merge_fs(self, corp: str, newer: dict, older: dict) -> dict:
        """최신 보고서 값을 쓰고, 예전 보고서는 최신에 없는 연도만. 겹치는 연도 값이 다르면 기록."""
        merged = dict(older)
        for k, row in newer.items():
            old = older.get(k)
            if old:
                diff = {c: [old[c], row[c]] for c in VALUE_COLS if old[c] != row[c]}
                if diff:
                    self.issue("overlap_year", corp, k[0], fs_div=k[1], diff=diff,
                               old_bsns_year=old["source_bsns_year"], new_bsns_year=row["source_bsns_year"])
            merged[k] = row
        years = sorted({y for y, _ in merged}, reverse=True)[:4]  # 4개년만
        return {k: v for k, v in merged.items() if k[0] in years}

    def save_fs(self, corp: str, rows: dict) -> None:
        ts = now_iso()
        payload = [{**r, "fetched_at": ts} for r in rows.values()]
        self.db.delete("financials", {"corp_code": f"eq.{corp}"})
        self.db.insert("financials", payload)
        self.save_summary(corp, rows)

    def save_summary(self, corp: str, rows: dict) -> None:
        fs_div = "CFS" if any(k[1] == "CFS" for k in rows) else "OFS"
        years = sorted(y for y, d in rows if d == fs_div)
        latest = rows[(years[-1], fs_div)]
        induty = (self.companies.get(corp) or {}).get("induty_code") or ""
        no_rev = not latest["has_revenue_account"]
        by_ind = induty[:2] in ("64", "65", "66") and induty != "64992"
        reason = "both" if no_rev and by_ind else "no_revenue" if no_rev else "industry" if by_ind else None
        if reason in ("no_revenue", "industry"):
            self.issue("financial_mismatch", corp, years[-1], reason=reason, induty_code=induty)
        eq, cap = latest["total_equity"], latest["capital_stock"]
        if eq is not None and eq <= 0:
            impair = "full"
        elif not cap:
            impair = "unknown"
            self.issue("capital_zero", corp, years[-1], capital_stock=cap)
        elif eq is not None and eq < cap:
            impair = "partial"
        else:
            impair = "none"
        self.db.upsert("company_summary", [{
            "corp_code": corp, "fs_div": fs_div, "years": years, "latest_year": years[-1],
            "is_financial": reason is not None, "financial_reason": reason,
            "capital_impairment": impair, "rule_version": RULE_VERSION, "computed_at": now_iso()}],
            "corp_code")

    # ------------------------------------------------------------ 배당
    def fetch_dividend(self, corp: str, year: int) -> str:
        body = self.call("alotMatter.json", corp, year)
        st = body.get("status")
        if st != "000":
            self.set_status(corp, "dividend", "013" if st == "013" else "error",
                            message=None if st == "013" else f"{st} {body.get('message')}")
            return st
        rows = body.get("list", [])
        rcept = rows[0].get("rcept_no") if rows else None
        ts = now_iso()
        self.db.delete("dividend_rows", {"corp_code": f"eq.{corp}"})
        self.db.insert("dividend_rows", [{
            "corp_code": corp, "rcept_no": r.get("rcept_no") or rcept, "row_no": i + 1,
            "bsns_year": year, "se": r.get("se"), "stock_knd": r.get("stock_knd"),
            "thstrm": r.get("thstrm"), "frmtrm": r.get("frmtrm"), "lwfr": r.get("lwfr"),
            "stlm_dt": r.get("stlm_dt"), "fetched_at": ts} for i, r in enumerate(rows)])

        def pick(se: str) -> dict | None:
            found = [r for r in rows if (r.get("se") or "").strip() == se
                     and (r.get("stock_knd") or "").strip() == "보통주"]
            if len(found) > 1 and any(tuple(f.get(p) for p, _ in DIV_PERIODS)
                                      != tuple(found[0].get(p) for p, _ in DIV_PERIODS) for f in found[1:]):
                self.issue("dup_dividend", corp, year, se=se,
                           rows=[{p: f.get(p) for p, _ in DIV_PERIODS} for f in found])
            return found[0] if found else None

        dps_row, yld_row = pick(SE_DPS), pick(SE_YIELD)
        out = []
        for field, back in DIV_PERIODS:
            fy = year - back
            raw_dps = ((dps_row or {}).get(field) or "").strip()
            raw_yld = ((yld_row or {}).get(field) or "").strip()
            dps = to_num(raw_dps)
            if raw_dps in ("", "-") or dps == 0:
                dps_status, dps = "none", None
            elif dps is None:
                dps_status = "check"
                self.issue("dividend_non_numeric", corp, fy, se=SE_DPS, value=raw_dps)
            else:
                dps_status = "paid"
            yld = to_num(raw_yld)
            if yld is not None:
                yield_status = "value"
            elif dps_status == "paid":
                yield_status = "not_disclosed"
            else:
                yield_status = "none"
            out.append({"corp_code": corp, "fiscal_year": fy, "dps_status": dps_status,
                        "dps": int(dps) if dps is not None else None, "yield_status": yield_status,
                        "dividend_yield": yld, "source_bsns_year": year, "source_rcept_no": rcept})
        self.db.delete("dividends", {"corp_code": f"eq.{corp}"})
        self.db.insert("dividends", out)
        self.set_status(corp, "dividend", "000", year, rcept)
        return "000"

    # ------------------------------------------------------------ 감사의견
    def fetch_audit(self, corp: str, year: int) -> str:
        body = self.call("accnutAdtorNmNdAdtOpinion.json", corp, year)
        st = body.get("status")
        if st != "000":
            self.set_status(corp, "audit", "013" if st == "013" else "error",
                            message=None if st == "013" else f"{st} {body.get('message')}")
            return st
        rows, counter, rcept = [], {}, None
        items = body.get("list", [])
        nums = [n for n in (period_number(r.get("bsns_year")) for r in items) if n is not None]
        top = max(nums) if nums else None
        for r in items:
            rcept = rcept or r.get("rcept_no")
            label = r.get("bsns_year") or ""
            fy = audit_fiscal_year(label, year, top)
            if fy is None:
                if (r.get("adtor") or "-").strip() != "-" or r.get("adt_opinion"):
                    self.issue("audit_label", corp, year, label=label)
                continue  # 라벨·감사인·의견이 모두 빈 행은 버린다
            counter[fy] = counter.get(fy, 0) + 1
            rows.append({"corp_code": corp, "fiscal_year": fy, "row_no": counter[fy],
                         "period_label": label, "adtor": r.get("adtor"), "adt_opinion": r.get("adt_opinion"),
                         "emphs_matter": r.get("emphs_matter"), "core_adt_matter": r.get("core_adt_matter"),
                         "adt_reprt_spcmnt_matter": r.get("adt_reprt_spcmnt_matter"),
                         "source_bsns_year": year, "source_rcept_no": r.get("rcept_no")})
            if (r.get("adt_opinion") or "").strip() not in ("적정의견", "-", ""):
                self.issue("audit_opinion_value", corp, fy, value=r.get("adt_opinion"))
        self.db.delete("audit_opinions", {"corp_code": f"eq.{corp}"})
        self.db.insert("audit_opinions", rows)
        self.set_status(corp, "audit", "000", year, rcept)
        return "000"

    # ------------------------------------------------------------ 회사 하나
    def process(self, corp: str, retry: int = 0) -> bool:
        """처리하고, 013이 있어서 나중에 다시 볼 필요가 있으면 True."""
        need_retry = False
        st = self.status.get(corp, {})
        need_company = (corp not in self.companies or self.force
                        or (self.mode == "monthly" and date.today().month == 4))
        if need_company:
            cst = self.fetch_company(corp)
            if cst == "013":
                need_retry = True
        if corp not in self.companies:
            return need_retry  # 기업개황이 없으면 FK 때문에 재무를 저장할 수 없다

        fs_st = st.get("fs", {})
        last = fs_st.get("last_bsns_year") if fs_st.get("status") == "000" else None
        if last and self.mode == "monthly" and not self.force:
            # 저장된 것보다 새 사업보고서가 있나 (013은 "아직 없음"이라 재확인하지 않음)
            year = last + 1
            if year > self.this_year:
                return need_retry
            fs_code, newer = self.fs_report(corp, year)
            if fs_code != "000":
                if fs_code != "013":
                    self.set_status(corp, "fs", "error", message=f"{fs_code}")
                return need_retry
            older = {(r["fiscal_year"], r["fs_div"]): r for r in
                     self.db.select("financials", {"corp_code": f"eq.{corp}"})}
            for r in older.values():
                r.pop("fetched_at", None)
            rows = self.merge_fs(corp, newer, older)
        else:
            latest, newer = None, {}
            for year in (self.this_year - 1, self.this_year - 2):
                fs_code, newer = self.fs_report(corp, year)
                if fs_code == "000":
                    latest = year
                    break
                if fs_code != "013":
                    self.set_status(corp, "fs", "error", message=fs_code)
                    return need_retry
            if latest is None:
                self.set_status(corp, "fs", "013", retry=retry)
                self.stats["status_013"] += 1
                return True
            _, older = self.fs_report(corp, latest - 1)
            rows = self.merge_fs(corp, newer, older)
            year = latest

        if not rows:
            self.set_status(corp, "fs", "error", message="계정 없음")
            return need_retry
        rcept = next(iter(newer.values()))["source_rcept_no"] if newer else None
        self.save_fs(corp, rows)
        self.saved.add(corp)
        self.set_status(corp, "fs", "000", year, rcept)
        self.stats["new_reports"] += 1
        if self.fetch_dividend(corp, year) == "013":
            need_retry = True
        if self.fetch_audit(corp, year) == "013":
            need_retry = True
        return need_retry

    # ------------------------------------------------------------ 실행
    def run(self, only: list[str] | None, limit: int | None) -> int:
        job = "dart_initial" if self.mode == "initial" else "dart_monthly"
        self.run_id = self.db.start_run(job)
        self.saved: set[str] = set()
        note, result = None, "ok"
        try:
            self.sync_corp_codes()
            targets = self.targets(only, limit)
            self.companies = {r["corp_code"]: r for r in
                              self.db.select("companies", {"select": "corp_code,induty_code"})}
            self.status = {}
            for r in self.db.select("dart_fetch_status"):
                self.status.setdefault(r["corp_code"], {})[r["api"]] = r
            log(f"대상 {len(targets)}개 회사, 모드 {self.mode}")

            if getattr(self, "audit_only", False):
                for n, t in enumerate(targets, 1):
                    fs = self.status.get(t["corp_code"], {}).get("fs", {})
                    if fs.get("status") == "000":
                        try:
                            self.fetch_audit(t["corp_code"], fs["last_bsns_year"])
                        except DartStop:
                            raise
                        except Exception as e:
                            self.stats["errors"] += 1
                            log(f"  오류 {t['itms_nm']}({t['short_code']}): {e}")
                        self.stats["companies"] += 1
                        self.flush_issues()
                return 0
            retry_list = []
            for n, t in enumerate(targets, 1):
                corp = t["corp_code"]
                fs = self.status.get(corp, {}).get("fs", {})
                if self.mode == "initial" and not self.force and fs.get("status") == "000":
                    self.stats["skipped"] += 1
                    continue
                try:
                    if self.process(corp):
                        retry_list.append(t)
                except DartStop:
                    raise
                except Exception as e:  # 한 회사 실패로 배치를 멈추지 않는다
                    self.stats["errors"] += 1
                    log(f"  오류 {t['itms_nm']}({t['short_code']}): {e}")
                    self.issue("collect_error", corp, error=str(e)[:500])
                self.stats["companies"] += 1
                self.flush_issues()
                if n % 50 == 0:
                    log(f"  {n}/{len(targets)} 처리, DART 호출 {self.dart.calls}회")

            if retry_list:
                log(f"013 재확인 {len(retry_list)}개 회사, {RETRY_013_WAIT}초 뒤")
                time.sleep(RETRY_013_WAIT)
                self.stats["status_013"] = 0
                for t in retry_list:
                    corp = t["corp_code"]
                    try:
                        st = self.status.get(corp, {})
                        if st.get("fs", {}).get("status") == "000":
                            # 재무는 받았고 배당·감사의견만 013 → 그것만 다시
                            year = st["fs"]["last_bsns_year"]
                            if st.get("dividend", {}).get("status") == "013":
                                self.fetch_dividend(corp, year)
                            if st.get("audit", {}).get("status") == "013":
                                self.fetch_audit(corp, year)
                        else:
                            self.process(corp, retry=1)
                    except DartStop:
                        raise
                    except Exception as e:
                        self.stats["errors"] += 1
                        log(f"  오류 {t['itms_nm']}({t['short_code']}): {e}")
                    self.flush_issues()

            if self.saved:
                log(f"필터·문장 재계산 {len(self.saved)}개 회사")
                rs = recompute(self.db, sorted(self.saved))
                self.stats["recomputed"] = rs["companies"]
        except DartStop as e:
            result, note = "failed", f"DART 중단: {e}"
            log(note)
        finally:
            self.flush_issues()
            self.stats["dart_calls"] = self.dart.calls
            self.db.finish_run(self.run_id, result, self.stats, note)
            log(f"끝: {self.stats}")
        return 0 if result == "ok" else 1


def main() -> int:
    ap = argparse.ArgumentParser(description="DART 수집 배치")
    ap.add_argument("--mode", choices=("initial", "monthly"), required=True)
    ap.add_argument("--only", nargs="*", help="종목코드 (A 없이), 예: 005930 0220W0")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--force", action="store_true", help="이미 받은 회사도 다시")
    ap.add_argument("--audit-only", action="store_true",
                    help="감사의견만 다시 받기 (저장된 최신 사업보고서 연도로)")
    a = ap.parse_args()
    c = Collector(a.mode, a.force)
    c.audit_only = a.audit_only
    return c.run(a.only, a.limit)


if __name__ == "__main__":
    raise SystemExit(main())
