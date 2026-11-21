"""KRX 상장종목 목록 → stocks (매일, GitHub Actions 예정).

실행: python3 -m batch.krx_list
- 최신 기준일(basDt) 목록을 받아 원본 그대로 저장한다 (코넥스·스팩·외국회사도 저장, 거르는 건 뷰).
- 목록에서 빠진 종목은 지우지 않고 is_listed=false, delisted_bas_dt=기준일.
- 상장 종목 수가 하루 사이 5% 넘게 줄면 반영하지 않고 batch_runs에 skipped로 남긴다.
"""

from __future__ import annotations

from datetime import date

from batch import notify_io
from batch.common import Supabase, data_go_latest, load_env, log, now_iso

KRX_URL = "https://apis.data.go.kr/1160100/GetKrxListedInfoService_V2/getItemInfo_V2"
DROP_LIMIT = 0.05


def main() -> int:
    key = load_env("DATA_GO_KR_SERVICE_KEY")
    db = Supabase()
    bas_dt_raw, items, _ = data_go_latest(KRX_URL, key)
    bas_dt = date(int(bas_dt_raw[:4]), int(bas_dt_raw[4:6]), int(bas_dt_raw[6:])).isoformat()
    run_id = db.start_run("krx_list", bas_dt)
    log(f"KRX 기준일 {bas_dt}, 받은 종목 {len(items)}개")

    existing = {r["srtn_cd"]: r for r in db.select("stocks", {"select": "srtn_cd,is_listed,itms_nm"})}
    prev_listed = sum(1 for r in existing.values() if r["is_listed"])
    now_codes = {i["srtnCd"] for i in items}
    stats = {"received": len(items), "prev_listed": prev_listed}

    if prev_listed and len(now_codes) < prev_listed * (1 - DROP_LIMIT):
        drop = 1 - len(now_codes) / prev_listed
        note = f"목록이 {drop:.1%} 줄어 반영하지 않음 ({prev_listed} → {len(now_codes)})"
        log(note)
        db.finish_run(run_id, "skipped", stats, note)
        return 0

    ts = now_iso()
    base = lambda i: {"srtn_cd": i["srtnCd"], "isin_cd": i.get("isinCd"), "itms_nm": i["itmsNm"],
                      "mrkt_ctg": i["mrktCtg"], "crno": i.get("crno"), "corp_nm": i.get("corpNm"),
                      "last_bas_dt": bas_dt, "is_listed": True, "delisted_bas_dt": None,
                      "updated_at": ts}
    new_rows = [{**base(i), "first_bas_dt": bas_dt} for i in items if i["srtnCd"] not in existing]
    old_rows = [base(i) for i in items if i["srtnCd"] in existing]
    db.upsert("stocks", new_rows, "srtn_cd")
    db.upsert("stocks", old_rows, "srtn_cd")

    gone = [c for c, r in existing.items() if r["is_listed"] and c not in now_codes]
    for i in range(0, len(gone), 100):
        part = gone[i:i + 100]
        db.update("stocks", {"srtn_cd": f"in.({','.join(part)})"},
                  {"is_listed": False, "delisted_bas_dt": bas_dt, "updated_at": ts})
    stats.update(new=len(new_rows), updated=len(old_rows), delisted=len(gone))
    try:  # F-13: 빠진 종목을 추적 중인 사용자에게 알림 (목록 반영은 끝났으니 알림 실패는 로그만)
        stats["notified"] = notify_io.delisted_alerts(
            db, [(c, existing[c]["itms_nm"]) for c in gone], bas_dt)
    except Exception as e:
        log(f"알림 생성 실패 (목록 반영은 완료): {type(e).__name__}")
    log(f"신규 {len(new_rows)}, 갱신 {len(old_rows)}, 목록에서 빠짐 {len(gone)}")
    db.finish_run(run_id, "ok", stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
