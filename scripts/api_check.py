"""공공 API 3종 연결 확인 스크립트.

실행: 프로젝트 루트에서  python scripts/api_check.py
결과: api_check_results/ 폴더에 호출별 응답 JSON과 요약(summary.txt)을 저장한다.
인증키는 화면과 파일 어디에도 남기지 않는다.
외부 패키지 없이 Python 표준 라이브러리만 사용한다.
"""

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "api_check_results"
BASE = "https://apis.data.go.kr/1160100/service"

KRX_URL = "https://apis.data.go.kr/1160100/GetKrxListedInfoService_V2/getItemInfo_V2"
CORP_URL = f"{BASE}/GetCorpBasicInfoService_V2/getCorpOutline_V2"
FIN_URL = f"{BASE}/GetFinaStatInfoService_V2/getSummFinaStat_V2"

SAMSUNG_CRNO = "1301110006246"

TIMEOUT = 60   # 초. 서버가 느릴 때가 있어 넉넉히 둔다
RETRIES = 3


def build_checks(bas_dt: str) -> list:
    """(저장 파일 이름, 설명, URL, 추가 파라미터). KRX는 최신 기준일자만 조회한다."""
    return [
        ("01_krx_name", f"KRX - 종목명 '삼성전자' 포함, 기준일자 {bas_dt}", KRX_URL,
         {"likeItmsNm": "삼성전자", "basDt": bas_dt, "numOfRows": "50"}),
        ("02_krx_code", f"KRX - 종목코드 '005930' 포함, 기준일자 {bas_dt}", KRX_URL,
         {"likeSrtnCd": "005930", "basDt": bas_dt, "numOfRows": "10"}),
        ("03_krx_all", f"KRX - 기준일자 {bas_dt} 전체 종목 (최대 5000건)", KRX_URL,
         {"basDt": bas_dt, "numOfRows": "5000"}),
        ("04_corp_outline", "기업기본정보 - 삼성전자 crno", CORP_URL,
         {"crno": SAMSUNG_CRNO, "numOfRows": "30"}),
        ("05_fin_all_years", "기업 재무정보 요약재무제표 - 삼성전자 전체 연도", FIN_URL,
         {"crno": SAMSUNG_CRNO, "numOfRows": "100"}),
    ]


def load_key() -> str:
    """환경변수 → 프로젝트 루트 .env 순서로 키를 찾는다."""
    key = os.getenv("DATA_GO_KR_SERVICE_KEY")
    if key:
        return key.strip()
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line.startswith("DATA_GO_KR_SERVICE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("DATA_GO_KR_SERVICE_KEY를 찾지 못했습니다. .env 파일을 확인하세요.")


def call(url: str, key: str, params: dict) -> tuple[int | None, str]:
    query = {"serviceKey": key, "pageNo": "1", "resultType": "json", **params}
    full = f"{url}?{urllib.parse.urlencode(query)}"
    last = ""
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(full, timeout=TIMEOUT) as res:
                return res.status, res.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8", errors="replace")
        except Exception as e:  # 시간 초과 등은 다시 시도한다
            last = f"{type(e).__name__}: {e} (시도 {attempt}/{RETRIES})"
            print("  ...", last)
            time.sleep(3)
    return None, last


def latest_bas_dt(key: str) -> str:
    """KRX 목록의 가장 최근 기준일자. 결과는 최신 날짜부터 온다."""
    status, text = call(KRX_URL, key, {"numOfRows": "1"})
    try:
        item = json.loads(text)["response"]["body"]["items"]["item"]
        item = item[0] if isinstance(item, list) else item
        return item["basDt"]
    except Exception:
        raise SystemExit(f"최신 기준일자를 가져오지 못했습니다: HTTP {status}, {text[:200]}")


def summarize(name: str, desc: str, params: dict, status, text: str, key: str) -> list[str]:
    text = text.replace(key, "***")  # 혹시 응답에 키가 섞여 와도 지운다
    lines = [f"[{name}] {desc}", f"  요청 파라미터: {params}", f"  HTTP 상태: {status}"]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        lines.append("  JSON 아님 (인증 오류 등은 XML로 옴). 앞부분:")
        lines.append("  " + text[:300].replace("\n", " "))
        return lines

    header = data.get("response", {}).get("header", {})
    body = data.get("response", {}).get("body", {})
    lines.append(f"  resultCode: {header.get('resultCode')} / {header.get('resultMsg')}")
    lines.append(f"  totalCount: {body.get('totalCount')}")

    items = (body.get("items") or {}).get("item") or []
    if isinstance(items, dict):
        items = [items]
    if items:
        lines.append(f"  받은 건수: {len(items)}")
        lines.append(f"  필드: {', '.join(items[0].keys())}")
        lines.append(f"  첫 건: {json.dumps(items[0], ensure_ascii=False)}")
        for field in ("mrktCtg", "bizYear", "fnclDcdNm", "basDt"):
            counts = {}
            for i in items:
                if field in i:
                    counts[str(i[field])] = counts.get(str(i[field]), 0) + 1
            if counts:
                lines.append(f"  {field} 값별 건수: {dict(sorted(counts.items()))}")
        if "srtnCd" in items[0]:
            no_crno = [i["itmsNm"] for i in items if i.get("crno", "").strip("0") == ""]
            lines.append(f"  법인등록번호 없음(0000000000000): {len(no_crno)}건 {no_crno[:10]}")
            spac = [i["itmsNm"] for i in items if "스팩" in i.get("itmsNm", "")]
            lines.append(f"  이름에 '스팩' 포함: {len(spac)}건")
            pref = [i["itmsNm"] for i in items if i.get("itmsNm", "").endswith(("우", "우B", "우C"))]
            lines.append(f"  이름이 '우'로 끝남(우선주 추정): {len(pref)}건 {pref[:10]}")
            if len(items) <= 50:
                lines.append("  목록: " + ", ".join(f"{i['itmsNm']}({i['srtnCd']})" for i in items))
    return lines


def main() -> None:
    key = load_key()
    OUT_DIR.mkdir(exist_ok=True)
    bas_dt = latest_bas_dt(key)
    print(f"KRX 최신 기준일자: {bas_dt}\n")
    report = [f"KRX 최신 기준일자: {bas_dt}", ""]
    for old in OUT_DIR.glob("*.json"):
        old.unlink()  # 이전 실행 결과가 섞이지 않게 지운다
    for name, desc, url, params in build_checks(bas_dt):
        status, text = call(url, key, params)
        (OUT_DIR / f"{name}.json").write_text(text.replace(key, "***"), encoding="utf-8")
        lines = summarize(name, desc, params, status, text, key)
        report.extend(lines + [""])
        print("\n".join(lines) + "\n")
    (OUT_DIR / "summary.txt").write_text("\n".join(report), encoding="utf-8")
    print(f"결과 저장: {OUT_DIR}")


if __name__ == "__main__":
    main()
