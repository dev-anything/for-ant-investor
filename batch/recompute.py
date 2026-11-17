"""기준값 재계산 배치: company_summary의 matched_filters(필터 20개)·insights(문장 8개).

실행 (프로젝트 루트, 개인 서버):
  python3 -m batch.recompute                 # 전체 다시 계산 (DART 재호출 없음)
  python3 -m batch.recompute --only 005930   # 일부 종목만 (시험용)
  python3 -m batch.recompute --dry-run       # 저장하지 않고 통계만

- 판정 규칙은 batch/rules.py. 숫자 기준을 바꾸면 거기서 RULE_VERSION과 함께 바꾼다.
- DART 매월 수집(dart_collect)이 끝날 때 처리한 회사만 recompute(db, corps)로 다시 계산한다.
- batch_runs(job=recompute) stats에 필터별 걸린 수·계산 가능한 회사 수, 문장별 수,
  눈금 범위 밖 비율·"비슷한 수준" 비율을 남긴다 (수집 뒤 검증용, 기준값 조정은 사용자가 정함).
"""

from __future__ import annotations

import argparse
from collections import Counter

from batch import rules
from batch.common import Supabase, log, now_iso


def _in(col: str, values: list[str]) -> dict:
    return {col: f"in.({','.join(values)})"}


def load(db: Supabase, corps: list[str] | None):
    summaries, fins, divs = [], [], []
    chunks = [corps[i:i + 100] for i in range(0, len(corps), 100)] if corps else [None]
    for part in chunks:
        flt = _in("corp_code", part) if part else {}
        summaries += db.select("company_summary", {**flt, "order": "corp_code"})
        fins += db.select("financials", {
            **flt, "order": "corp_code,fiscal_year,fs_div",
            "select": "corp_code,fiscal_year,fs_div,revenue,operating_income,net_income,"
                      "total_assets,total_liabilities,total_equity,capital_stock"})
        divs += db.select("dividends", {**flt, "order": "corp_code,fiscal_year",
                                        "select": "corp_code,fiscal_year,dps_status,dps"})
    fin_by: dict[str, dict] = {}
    for r in fins:
        fin_by.setdefault((r["corp_code"], r["fs_div"]), {})[r["fiscal_year"]] = r
    div_by: dict[str, dict] = {}
    for r in divs:
        div_by.setdefault(r["corp_code"], {})[r["fiscal_year"]] = r
    return summaries, fin_by, div_by


def recompute(db: Supabase, corps: list[str] | None = None, dry_run: bool = False) -> dict:
    """corps(corp_code 목록)가 없으면 전체. 통계 dict를 돌려준다."""
    summaries, fin_by, div_by = load(db, corps)
    ts = now_iso()
    out_rows = []
    hit, can = Counter(), Counter()
    ins_cnt, ins_shown = Counter(), Counter()
    gauge_n, gauge_out, flat_n, flat_y = Counter(), Counter(), Counter(), Counter()
    f19_vs_impair = Counter()
    conflicts = Counter()

    for s in summaries:
        corp = s["corp_code"]
        by_year = fin_by.get((corp, s["fs_div"]), {})
        matched, insights, fl = rules.judge(s["years"], by_year, s["is_financial"], div_by.get(corp))
        out_rows.append({**s, "matched_filters": matched, "insights": insights,
                         "rule_version": rules.RULE_VERSION, "computed_at": ts})

        for i, v in fl.items():
            if v is not None:
                can[i] += 1
            if v:
                hit[i] += 1
        for k, ins in enumerate(insights):
            ins_cnt[ins["id"]] += 1
            if k < 3:
                ins_shown[ins["id"]] += 1
        ms = set(matched)
        for a, b in rules.CONFLICTS:
            if a in ms and b in ms:
                conflicts[f"{a}-{b}"] += 1
        if 14 in ms and 13 not in ms:
            conflicts["14-not-13"] += 1
        if s["is_financial"] and ms & rules.FINANCIAL_BLOCKED:
            conflicts["financial_blocked"] += 1
        # 필터 19(F-03 조건)와 capital_impairment 열이 갈리는 회사
        impaired = s["capital_impairment"] in ("partial", "full")
        if bool(fl[19]) != impaired:
            f19_vs_impair[f"filter19={fl[19]},impairment={s['capital_impairment']}"] += 1

        if not s["is_financial"]:
            for g, vals in rules.gauge_values(s["years"], by_year, False).items():
                last = vals[-1] if vals else None
                if last is not None:
                    lo, hi = rules.GAUGES[g]
                    gauge_n[g] += 1
                    gauge_out[g] += last < lo or last > hi
                flat = rules.is_flat(vals, g)
                if flat is not None:
                    flat_n[g] += 1
                    flat_y[g] += flat

    pct = lambda a, b: round(a * 100 / b, 1) if b else None
    stats = {
        "companies": len(summaries),
        "financial": sum(1 for s in summaries if s["is_financial"]),
        "rule_version": rules.RULE_VERSION,
        "filters": {str(i): {"matched": hit[i], "computable": can[i], "pct": pct(hit[i], can[i])}
                    for i in rules.FILTER_IDS},
        "insights": {str(i): {"matched": ins_cnt[i], "shown_top3": ins_shown[i],
                              "pct": pct(ins_cnt[i], len(summaries))}
                     for i in sorted(rules.INSIGHT_PRIORITY)},
        "insight_any": sum(1 for r in out_rows if r["insights"]),
        "insight_over3": sum(1 for r in out_rows if len(r["insights"]) > 3),
        "gauge_out_of_range_pct": {g: pct(gauge_out[g], gauge_n[g]) for g in rules.GAUGES},
        "gauge_flat_pct": {g: pct(flat_y[g], flat_n[g]) for g in rules.GAUGES},
        "filter19_vs_impairment": dict(f19_vs_impair),
        "check_violations": dict(conflicts),  # 0이어야 정상
    }
    if not dry_run:
        db.upsert("company_summary", out_rows, "corp_code")
    return stats


def report(stats: dict) -> None:
    log(f"회사 {stats['companies']}개 (금융회사 {stats['financial']}), 기준 {stats['rule_version']}")
    for i, f in stats["filters"].items():
        flag = "  ← 0개" if f["matched"] == 0 else "  ← 절반 이상" if (f["pct"] or 0) >= 50 else ""
        log(f"  필터 {i:>2}: {f['matched']:>5} / 계산 가능 {f['computable']:>5} ({f['pct']}%){flag}")
    for i, v in stats["insights"].items():
        log(f"  문장 {i}: {v['matched']:>5} ({v['pct']}%), 앞 3개 안 {v['shown_top3']}")
    log(f"  문장 있는 회사 {stats['insight_any']}, 3개 넘는 회사 {stats['insight_over3']}")
    log(f"  눈금 범위 밖 % {stats['gauge_out_of_range_pct']}")
    log(f"  비슷한 수준 % {stats['gauge_flat_pct']}")
    log(f"  필터19 vs 자본잠식 열 {stats['filter19_vs_impairment']}")
    log(f"  규칙 위반 (0이어야 함) {stats['check_violations'] or '없음'}")


def main() -> int:
    ap = argparse.ArgumentParser(description="필터·문장 재계산")
    ap.add_argument("--only", nargs="*", help="종목코드 (A 없이)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    db = Supabase()
    corps = None
    if a.only:
        rows = db.select("stocks", {**_in("short_code", a.only), "select": "corp_code"})
        corps = sorted({r["corp_code"] for r in rows if r.get("corp_code")})
    run_id = None if a.dry_run else db.start_run("recompute")
    try:
        stats = recompute(db, corps, a.dry_run)
    except Exception as e:
        if run_id:
            db.finish_run(run_id, "failed", {}, str(e)[:500])
        raise
    report(stats)
    if run_id:
        db.finish_run(run_id, "ok", stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
