"""KRX 상장종목 목록 → stocks (매일, GitHub Actions 예정).

실행: python3 -m batch.krx_list
- 최신 기준일(basDt) 목록을 받아 원본 그대로 저장한다 (코넥스·스팩·외국회사도 저장, 거르는 건 뷰).
- 목록에서 빠진 종목은 지우지 않고 is_listed=false, delisted_bas_dt=기준일.
- 상장 종목 수가 하루 사이 5% 넘게 줄면 반영하지 않고 batch_runs에 skipped로 남긴다.
"""

from __future__ import annotations

import json
import urllib.parse
from datetime import date

from batch.common import Supabase, http, load_env, log, now_iso

KRX_URL = "https://apis.data.go.kr/1160100/GetKrxListedInfoService_V2/getItemInfo_V2"
DROP_LIMIT = 0.05


def krx_call(key: str, params: dict) -> dict:
    query = urllib.parse.urlencode({"serviceKey": key, "pageNo": "1", "resultType": "json", **params})
    status, raw = http("GET", f"{KRX_URL}?{query}", secrets=(key,))
    text = raw.decode("utf-8", "replace")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:  # 인증 오류 등은 XML로 온다
        raise RuntimeError(f"KRX 응답이 JSON이 아님 (HTTP {status}): {text[:200].replace(key, '***')}")
    header = data["response"]["header"]
    if header.get("resultCode") != "00":
        raise RuntimeError(f"KRX resultCode {header.get('resultCode')}: {header.get('resultMsg')}")
    return data["response"]["body"]


def items_of(body: dict) -> list[dict]:
    items = (body.get("items") or {}).get("item") or []
    return [items] if isinstance(items, dict) else items


def fetch_latest(key: str) -> tuple[str, list[dict]]:
    first = items_of(krx_call(key, {"numOfRows": "1"}))
    if not first:
        raise RuntimeError("KRX 최신 기준일을 찾지 못함")
    bas_dt = first[0]["basDt"]
    items, page = [], 1
    while True:
        body = krx_call(key, {"basDt": bas_dt, "numOfRows": "5000", "pageNo": str(page)})
        got = items_of(body)
        items.extend(got)
        if not got or len(items) >= int(body.get("totalCount") or 0):
            break
        page += 1
    return bas_dt, items


def main() -> int:
    key = load_env("DATA_GO_KR_SERVICE_KEY")
    db = Supabase()
    bas_dt_raw, items = fetch_latest(key)
    bas_dt = date(int(bas_dt_raw[:4]), int(bas_dt_raw[4:6]), int(bas_dt_raw[6:])).isoformat()
    run_id = db.start_run("krx_list", bas_dt)
    log(f"KRX 기준일 {bas_dt}, 받은 종목 {len(items)}개")

    existing = {r["srtn_cd"]: r for r in db.select("stocks", {"select": "srtn_cd,is_listed"})}
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
    # TODO(F-13): 빠진 종목을 추적 중인 사용자에게 "목록에서 빠짐" 알림

    stats.update(new=len(new_rows), updated=len(old_rows), delisted=len(gone))
    log(f"신규 {len(new_rows)}, 갱신 {len(old_rows)}, 목록에서 빠짐 {len(gone)}")
    db.finish_run(run_id, "ok", stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
