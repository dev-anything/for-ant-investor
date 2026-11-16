"""DART 감사의견 API(accnutAdtorNmNdAdtOpinion) 응답 모양 확인 (표준 라이브러리만 사용).

실행: python3 scripts/dart_audit_check.py
- DART_OPENAPI_KEY를 환경변수 → 프로젝트 루트 .env 순서로 찾는다. 키는 출력하지 않는다 (URL은 crtfc_key=***).
- corpCode.xml(zip)로 종목코드 → corp_code를 찾고, 표본 종목의 사업보고서 감사의견을 부른다.
- 응답 원본은 api_check_results/20_audit_*.json 에 저장한다 (git 제외 폴더).
"""

import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "api_check_results"
TIMEOUT = 60
BASE = "https://opendart.fss.or.kr/api"

# 표본: 일반 회사, 금융지주, 무배당 바이오, 종목코드에 영문자 섞인 회사(013 사례)
SAMPLES = {
    "005930": "삼성전자",
    "000660": "SK하이닉스",
    "105560": "KB금융",
    "207940": "삼성바이오로직스",
    "0220W0": "한화머시너리앤서비스홀딩스",
}
YEARS = ["2025", "2024"]


def load_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value.strip()
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(f"{name}를 찾지 못했어. .env를 확인해 줘.")


def fetch(path: str, key: str, params: dict) -> bytes:
    query = urllib.parse.urlencode({"crtfc_key": key, **params})
    shown = urllib.parse.urlencode({"crtfc_key": "***", **params})
    print(f"  GET {BASE}/{path}?{shown}")
    for attempt in range(1, 4):  # 시간 초과 등은 3번까지 다시 시도
        try:
            with urllib.request.urlopen(f"{BASE}/{path}?{query}", timeout=TIMEOUT) as res:
                return res.read()
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"    실패 ({type(e).__name__}, 시도 {attempt}/3)")
            if attempt == 3:
                raise
            time.sleep(5 * attempt)


def corp_codes(key: str, stock_codes: set[str]) -> dict[str, str]:
    data = fetch("corpCode.xml", key, {})
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        xml = zf.read(zf.namelist()[0])
    found = {}
    for item in ET.fromstring(xml).iter("list"):
        sc = (item.findtext("stock_code") or "").strip()
        if sc in stock_codes:
            found[sc] = item.findtext("corp_code").strip()
    return found


def main() -> int:
    global SAMPLES
    if len(sys.argv) > 1:  # 종목코드를 넘기면 그 종목만 (예: 207940 0220W0)
        SAMPLES = {k: v for k, v in SAMPLES.items() if k in sys.argv[1:]}
    key = load_env("DART_OPENAPI_KEY")
    OUT.mkdir(exist_ok=True)
    print("[1] corpCode.xml로 corp_code 찾기")
    codes = corp_codes(key, set(SAMPLES))
    for sc, name in SAMPLES.items():
        print(f"  {name} {sc} → {codes.get(sc, '(없음)')}")

    print("\n[2] 감사의견 (사업보고서 11011)")
    summary = []
    for sc, name in SAMPLES.items():
        cc = codes.get(sc)
        if not cc:
            continue
        for year in YEARS:
            time.sleep(0.5)
            raw = fetch("accnutAdtorNmNdAdtOpinion.json", key,
                        {"corp_code": cc, "bsns_year": year, "reprt_code": "11011"})
            body = json.loads(raw.decode("utf-8"))
            (OUT / f"20_audit_{sc}_{year}.json").write_text(
                json.dumps(body, ensure_ascii=False, indent=2), encoding="utf-8")
            rows = body.get("list", [])
            print(f"  {name} {year}: status {body.get('status')} {body.get('message')}, 행 {len(rows)}개")
            for r in rows:
                line = {k: r.get(k) for k in ("bsns_year", "adtor", "adt_opinion", "stlm_dt")}
                extra = {k: (r.get(k) or "")[:40] for k in ("emphs_matter", "core_adt_matter", "adt_reprt_spcmnt_matter") if k in r}
                print(f"    {line} {extra}")
                summary.append({"stock": sc, "req_year": year, **line})
            if rows:
                print(f"    필드: {sorted(rows[0].keys())}")

    opinions = sorted({s["adt_opinion"] for s in summary if s["adt_opinion"]})
    print("\n[3] adt_opinion 값 종류:", opinions)
    return 0


if __name__ == "__main__":
    sys.exit(main())
