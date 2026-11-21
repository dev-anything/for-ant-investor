"""F-13 알림 생성 입출력 (DB 읽기·알림 넣기). 판정·문구는 batch/notify.py, 메일은 batch/notify_mail.py.

호출 위치 (FS 9-13):
- dart_collect.py: 수집 시작 전 snapshot_before → 재계산 뒤 after_collect (new_results·audit_change)
- krx_list.py: 빠진 종목 확인 뒤 delisted_alerts (delisted)
- 넣기는 PostgREST `on_conflict=user_id,dedupe_key` + `ignore-duplicates`라 같은 변화는 두 번 들어가지 않는다 (PRD 4장 F-13).
- 추적 종목이 없으면 아무 것도 읽고 쓰지 않는다. 알림 실패는 호출자가 로그만 남기고 수집 결과는 그대로 둔다.
"""

from __future__ import annotations

from collections import defaultdict

from batch.common import Supabase, log
from batch.notify import (audit_body, audit_changed, changed_opinion, delisted_body, dedupe_key,
                          new_year_arrived, results_body)

IN_CHUNK = 100  # URL 길이 제한을 피하려고 `in.(...)` 목록을 나눈다
INSERT_CHUNK = 500


# ---------------------------------------------------------------- 순수 함수 (DB 없음)
def alert_row(user_id: str, srtn_cd: str, kind: str, fiscal_year: int | None, body: str,
              part: int | str) -> dict:
    """notifications 한 행. part는 사업연도(new_results·audit_change) 또는 delisted_bas_dt(delisted)."""
    return {
        "user_id": user_id,
        "srtn_cd": srtn_cd,
        "kind": kind,
        "fiscal_year": fiscal_year,
        "body": body,
        "dedupe_key": dedupe_key(kind, srtn_cd, part),
    }


def audit_alert_year(before_years: set[int], now_years: set[int]) -> int | None:
    """감사의견 비교를 할 최신 연도. 첫 수집(이전 자료 없음)·새 연도 없음·전년 의견 없음이면 None.

    첫 수집 때 3개년이 한꺼번에 들어오므로 과거 연도 변화는 알리지 않는다 (최신 연도만 본다).
    """
    if not before_years or not now_years:
        return None
    latest = max(now_years)
    if latest in before_years or latest - 1 not in now_years:
        return None
    return latest


def _chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


# ---------------------------------------------------------------- 입출력
def tracked_stocks(db: Supabase) -> dict[str, dict]:
    """추적 중인 종목 → {srtn_cd, name, corp_code, users}. 아무도 추적하지 않으면 빈 dict."""
    rows = db.select("watchlist", {"select": "user_id,srtn_cd"})
    if not rows:
        return {}
    users: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        users[r["srtn_cd"]].append(r["user_id"])
    stocks: dict[str, dict] = {}
    for chunk in _chunks(list(users), IN_CHUNK):
        for s in db.select("stocks", {"srtn_cd": f"in.({','.join(chunk)})",
                                      "select": "srtn_cd,itms_nm,corp_code"}):
            stocks[s["srtn_cd"]] = s
    return {code: {"srtn_cd": code, "name": stocks[code]["itms_nm"],
                   "corp_code": stocks[code]["corp_code"], "users": users[code]}
            for code in users if code in stocks}


def _latest_years(db: Supabase, corps: list[str]) -> dict[str, int]:
    latest: dict[str, int] = {}
    for chunk in _chunks(corps, IN_CHUNK):
        for r in db.select("financials", {"corp_code": f"in.({','.join(chunk)})",
                                          "select": "corp_code,fiscal_year"}):
            latest[r["corp_code"]] = max(latest.get(r["corp_code"], 0), r["fiscal_year"])
    return latest


def _audit_years(db: Supabase, corps: list[str]) -> dict[str, set[int]]:
    years: dict[str, set[int]] = defaultdict(set)
    for chunk in _chunks(corps, IN_CHUNK):
        for r in db.select("audit_opinions", {"corp_code": f"in.({','.join(chunk)})",
                                              "select": "corp_code,fiscal_year"}):
            years[r["corp_code"]].add(r["fiscal_year"])
    return years


def snapshot_before(db: Supabase) -> dict[str, dict]:
    """수집 시작 전 추적 회사의 최신 사업연도·감사의견 연도. 이 뒤에 새로 생긴 것만 알린다."""
    corps = sorted({t["corp_code"] for t in tracked_stocks(db).values() if t["corp_code"]})
    if not corps:
        return {}
    latest, audits = _latest_years(db, corps), _audit_years(db, corps)
    return {c: {"latest": latest.get(c), "audit_years": audits.get(c, set())} for c in corps}


def _results_body_for(db: Supabase, corp: str, name: str, year: int) -> str | None:
    summary = db.select("company_summary", {"corp_code": f"eq.{corp}",
                                            "select": "fs_div,is_financial,insights"})
    if not summary:
        log(f"  알림 건너뜀 (요약 없음): {name} {year}년")
        return None
    s = summary[0]
    rows = db.select("financials", {
        "corp_code": f"eq.{corp}", "fs_div": f"eq.{s['fs_div']}",
        "fiscal_year": f"in.({year - 1},{year})",
        "select": "fiscal_year,revenue,operating_income,net_income",
    })
    return results_body(name, year, rows, s["insights"] or [], s["is_financial"])


def _audit_rows(db: Supabase, corp: str, year: int) -> list[dict]:
    return db.select("audit_opinions", {"corp_code": f"eq.{corp}", "fiscal_year": f"eq.{year}",
                                        "select": "row_no,adt_opinion"})


def _insert_ignore(db: Supabase, rows: list[dict]) -> int:
    """같은 (user_id, dedupe_key)는 건너뛴다. 실제로 새로 들어간 수는 세지 않고, 보내려고 한 행 수를 돌려준다."""
    for i in range(0, len(rows), INSERT_CHUNK):
        db._req("POST", "notifications", params={"on_conflict": "user_id,dedupe_key"},
                data=rows[i:i + INSERT_CHUNK],
                prefer="resolution=ignore-duplicates,return=minimal")
    return len(rows)


def after_collect(db: Supabase, snap: dict[str, dict]) -> int:
    """수집·재계산이 끝난 뒤 추적 회사의 new_results·audit_change를 만든다. 만든 행 수를 돌려준다."""
    tracked = {t["corp_code"]: t for t in tracked_stocks(db).values() if t["corp_code"] in snap}
    if not tracked:
        return 0
    latest_now = _latest_years(db, list(tracked))
    audits_now = _audit_years(db, list(tracked))
    rows: list[dict] = []
    for corp, t in tracked.items():
        before = snap[corp]
        try:
            alerts: list[tuple[str, int | None, str]] = []
            year = latest_now.get(corp)
            if new_year_arrived(before["latest"], year):
                alerts.append(("new_results", year, _results_body_for(db, corp, t["name"], year)))
            audit_year = audit_alert_year(before["audit_years"], audits_now.get(corp, set()))
            if audit_year is not None:
                prev_rows, curr_rows = _audit_rows(db, corp, audit_year - 1), _audit_rows(db, corp, audit_year)
                if audit_changed(prev_rows, curr_rows) is True:
                    before_op, after_op = changed_opinion(prev_rows, curr_rows)
                    alerts.append(("audit_change", audit_year,
                                   audit_body(t["name"], audit_year, before_op, after_op)))
            for kind, fy, body in alerts:
                if body is None:
                    continue
                rows += [alert_row(uid, t["srtn_cd"], kind, fy, body, fy) for uid in t["users"]]
        except (RuntimeError, ValueError, KeyError, TypeError) as e:
            log(f"  알림 판정 실패 ({t['srtn_cd']}): {type(e).__name__}")
    return _insert_ignore(db, rows)


def delisted_alerts(db: Supabase, gone: list[tuple[str, str]], bas_dt: str) -> int:
    """이번에 목록에서 빠진 종목 중 추적 중인 것에 delisted 알림. gone은 (srtn_cd, 종목명) 목록."""
    if not gone:
        return 0
    names = dict(gone)
    watchers: dict[str, list[str]] = defaultdict(list)
    for chunk in _chunks(list(names), IN_CHUNK):
        for r in db.select("watchlist", {"srtn_cd": f"in.({','.join(chunk)})",
                                         "select": "user_id,srtn_cd"}):
            watchers[r["srtn_cd"]].append(r["user_id"])
    rows = [alert_row(uid, code, "delisted", None, delisted_body(names[code]), bas_dt)
            for code, users in watchers.items() for uid in users]
    return _insert_ignore(db, rows)
