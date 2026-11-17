"""주식시세 → stock_prices (매일, GitHub Actions 예정). 최신 1일치만 보관 (DATABASE 8장 3번).

실행: python3 -m batch.stock_price          (--force: 이미 받은 기준일이어도 다시 저장)
- numOfRows=1로 최신 basDt를 구하고, 그 날짜 전 종목(우선주·코넥스 포함)을 받는다.
- srtnCd는 원본 그대로 (A 없음). 종가·상장주식수·시가총액만 정수 열, 나머지 필드는 raw.
- 받은 행을 upsert한 뒤 그날이 아닌 행을 지워 통째로 교체한다.
  받은 수가 totalCount보다 적거나 0이면 지우지 않고 failed로 남긴다.
"""

from __future__ import annotations

import argparse
from datetime import date

from batch.common import Supabase, data_go_latest, load_env, log

PRICE_URL = "https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2"
INT_COLS = {"clpr": "clpr", "lstgStCnt": "lstg_st_cnt", "mrktTotAmt": "mrkt_tot_amt"}
TEXT_COLS = {"srtnCd": "srtn_cd", "isinCd": "isin_cd", "itmsNm": "itms_nm", "mrktCtg": "mrkt_ctg"}


def to_int(v) -> int | None:
    try:
        return int(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def to_row(item: dict, bas_dt: str) -> dict:
    row = {col: item.get(f) for f, col in TEXT_COLS.items()}
    row.update({col: to_int(item.get(f)) for f, col in INT_COLS.items()})
    row["bas_dt"] = bas_dt
    row["raw"] = {k: v for k, v in item.items() if k not in INT_COLS and k not in TEXT_COLS}
    return row


def main() -> int:
    ap = argparse.ArgumentParser(description="주식시세 배치")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    key = load_env("DATA_GO_KR_SERVICE_KEY")
    db = Supabase()

    bas_raw, items, total = data_go_latest(PRICE_URL, key)
    bas_dt = date(int(bas_raw[:4]), int(bas_raw[4:6]), int(bas_raw[6:])).isoformat()
    prev = db._req("GET", "stock_prices",
                   params={"select": "bas_dt", "order": "bas_dt.desc", "limit": "1"})
    run_id = db.start_run("stock_price", bas_dt)
    stats = {"received": len(items), "total_count": total}
    log(f"시세 기준일 {bas_dt}, 받은 {len(items)} / totalCount {total}")

    if prev and prev[0]["bas_dt"] == bas_dt and not a.force:
        note = "이미 저장한 기준일이라 건너뜀"
        log(note)
        db.finish_run(run_id, "skipped", stats, note)
        return 0
    if not items or len(items) < total:
        note = f"받은 행이 모자라 반영하지 않음 ({len(items)} / {total})"
        log(note)
        db.finish_run(run_id, "failed", stats, note)
        return 1

    rows = {}
    for it in items:  # 같은 종목코드가 두 번 오면 뒤의 것
        rows[it["srtnCd"]] = to_row(it, bas_dt)
    stats["dup_codes"] = len(items) - len(rows)
    stats["no_market_cap"] = sum(1 for r in rows.values() if not r["mrkt_tot_amt"])
    db.upsert("stock_prices", list(rows.values()), "srtn_cd")
    old = db.select("stock_prices", {"select": "srtn_cd", "bas_dt": f"neq.{bas_dt}"})
    db.delete("stock_prices", {"bas_dt": f"neq.{bas_dt}"})
    stats.update(saved=len(rows), removed=len(old))
    log(f"저장 {len(rows)}, 지운 이전 행 {len(old)}, 시가총액 없음 {stats['no_market_cap']}")
    db.finish_run(run_id, "ok", stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
