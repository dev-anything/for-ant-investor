"""DART 공시검색 list.json 응답 모양 확인 (F-17 사전 확인, DEV_PLAN 10a · PRD 11장 19·20번).

실행: python3 scripts/dart_list_check.py [종목코드 ...]
- 키는 batch/common.py의 load_env로만 읽는다 (값은 출력하지 않는다, 요청 URL은 crtfc_key=***).
- corpCode.xml(zip)로 종목코드 → corp_code를 찾고, 표본 회사의 최신순 공시 목록을 부른다.
- 두 가지 조회를 비교한다: (a) 공시유형 없이 전체, (b) pblntf_ty=D(지분공시)로 조회.
  지분공시가 (b)에만 나오고 (a)에서 같은 행으로 보이면 파라미터로 거를 수 있다는 근거가 된다.
- 응답 원본은 api_check_results/30_list_*.json 에 저장한다 (git 제외 폴더). 응답 본문에는 키가 들어가지 않는다.
"""

from __future__ import annotations

import io
import json
import sys
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from batch.common import http, load_env, log  # noqa: E402

BASE = "https://opendart.fss.or.kr/api"
OUT = ROOT / "api_check_results"
BGN_DE = "20250101"
END_DE = "20261121"
PAGE_COUNT = 100  # DART list.json 최대 100건 (CLAUDE.md 공시검색 절)
# 표본: 삼성전자(기준), 종목코드 영문 섞인 회사, 공시가 적은 회사 후보
DEFAULT_SAMPLES = {"005930": "삼성전자", "035720": "카카오", "0220W0": "한화머시너리앤서비스홀딩스"}


def dart_get(path: str, key: str, params: dict) -> tuple[int, bytes]:
    """DART GET. 로그에는 URL 대신 경로와 파라미터(키 가림)만 남긴다."""
    query = urllib.parse.urlencode({"crtfc_key": key, **params})
    shown = urllib.parse.urlencode({"crtfc_key": "***", **params})
    log(f"GET {BASE}/{path}?{shown}")
    return http("GET", f"{BASE}/{path}?{query}", secrets=(key,))


def find_corp_codes(key: str, stock_codes: set[str]) -> dict[str, str]:
    status, data = dart_get("corpCode.xml", key, {})
    if status != 200:
        raise SystemExit(f"corpCode.xml 실패 (HTTP {status})")
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        xml = zf.read(zf.namelist()[0])
    found: dict[str, str] = {}
    for item in ET.fromstring(xml).iter("list"):
        sc = (item.findtext("stock_code") or "").strip()
        if sc in stock_codes:
            found[sc] = (item.findtext("corp_code") or "").strip()
    return found


def list_disclosures(key: str, corp_code: str, tag: str, extra: dict) -> dict | None:
    # bgn_de·end_de를 빼면 기간이 좁게 잡혀 013이 오는지 확인하려고 기간을 넣는다 (2026-11-21 1차 호출 013)
    params = {"corp_code": corp_code, "bgn_de": BGN_DE, "end_de": END_DE, "sort": "date",
              "sort_mth": "desc", "page_count": PAGE_COUNT, **extra}
    status, data = dart_get("list.json", key, params)
    if status != 200:
        log(f"  HTTP {status} (저장 안 함)")
        return None
    body = json.loads(data.decode("utf-8"))
    name = f"30_list_{corp_code}_{tag}.json"
    (OUT / name).write_bytes(data)
    log(f"  status={body.get('status')} message={body.get('message')} "
        f"total_count={body.get('total_count')} 저장={name}")
    return body


def is_ownership(report_nm: str) -> bool:
    """지분공시(DART 공시유형 D)에 해당하는 보고서 이름인지. 응답에는 공시유형 필드가 없어서 이름으로 가른다.
    2026-11-21 확인: pblntf_ty=D 응답 100건과 같은 기간 전체 목록에서 이 규칙으로 고른 62건이 rcept_no까지 일치."""
    nm = report_nm.strip()
    return "임원ㆍ주요주주특정증권등" in nm or "대량보유상황보고서" in nm


def summarize(body: dict) -> None:
    items = body.get("list") or []
    if not items:
        return
    print(f"    필드: {sorted(items[0].keys())}")
    ownership = sum(is_ownership(i.get("report_nm", "")) for i in items)
    print(f"    이번 응답 {len(items)}건 중 지분공시(이름 규칙) {ownership}건")
    for i in items[:12]:
        print(f"    {i.get('rcept_dt')} rm={i.get('rm')!r} "
              f"flr={i.get('flr_nm')} | {i.get('report_nm')}")


def main() -> int:
    OUT.mkdir(exist_ok=True)
    key = load_env("DART_OPENAPI_KEY")
    samples = {c: DEFAULT_SAMPLES.get(c, c) for c in sys.argv[1:]} or DEFAULT_SAMPLES
    corp = find_corp_codes(key, set(samples))
    for code, name in samples.items():
        print(f"\n== {code} {name} corp_code={corp.get(code)!r}")
        if not corp.get(code):
            print("  corp_code 없음 (목록에 없는 종목)")
            continue
        body = list_disclosures(key, corp[code], "all", {})
        if body:
            summarize(body)
        if code == "005930":  # 지분공시 유형(D)으로만 받아 비교
            print("  -- pblntf_ty=D (지분공시) 조회")
            body_d = list_disclosures(key, corp[code], "D", {"pblntf_ty": "D"})
            if body_d:
                summarize(body_d)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
