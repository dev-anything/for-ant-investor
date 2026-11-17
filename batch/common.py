"""배치 공통: 환경변수, HTTP 재시도, Supabase REST, DART 호출 (표준 라이브러리만).

키는 어디에도 출력하지 않는다. 요청 URL을 보여 줄 때는 serviceKey·crtfc_key를 ***로 가린다.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMEOUT = 60
# 시간 초과·연결 오류 재시도: 3번 더, 5초 → 15초 → 30초 뒤 (2026-11-17 구현 때 정함)
RETRY_WAITS = (5, 15, 30)


def log(msg: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_env(name: str, required: bool = True) -> str:
    """환경변수 → 프로젝트 루트 .env 순서로 찾는다 (.env는 이 함수만 읽고 값은 출력하지 않는다)."""
    value = os.getenv(name)
    if value:
        return value.strip()
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    if required:
        raise SystemExit(f"{name}를 찾지 못했어. 환경변수나 .env를 확인해 줘.")
    return ""


def mask(text: str, *secrets: str) -> str:
    for s in secrets:
        if s:
            text = text.replace(s, "***")
    return text


def http(method: str, url: str, *, headers: dict | None = None, body: bytes | None = None,
         secrets: tuple[str, ...] = ()) -> tuple[int, bytes]:
    """HTTP 요청. 연결 오류·시간 초과·5xx는 RETRY_WAITS대로 다시 시도. 4xx는 그대로 돌려준다."""
    last = ""
    for attempt in range(len(RETRY_WAITS) + 1):
        req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as e:
            data = e.read()
            if e.code < 500:
                return e.code, data
            last = f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            last = type(e).__name__
        if attempt < len(RETRY_WAITS):
            wait = RETRY_WAITS[attempt]
            log(f"  재시도 {attempt + 1}/{len(RETRY_WAITS)} ({last}), {wait}초 뒤")
            time.sleep(wait)
    raise RuntimeError(mask(f"요청 실패 ({last}): {method} {url.split('?')[0]}", *secrets))


# ---------------------------------------------------------------- Supabase REST

class Supabase:
    """PostgREST를 서버용 키로 부른다 (RLS 우회). 배치에서만 쓴다."""

    PAGE = 1000  # PostgREST 기본 최대 행 수

    def __init__(self) -> None:
        self.url = load_env("SUPABASE_URL").rstrip("/") + "/rest/v1"
        self.key = load_env("SUPABASE_SERVICE_ROLE_KEY")

    def _req(self, method: str, path: str, *, params: dict | None = None, data=None,
             prefer: str | None = None, extra: dict | None = None):
        url = f"{self.url}/{path}"
        if params:
            url += "?" + urllib.parse.urlencode(params, safe="(),.*:")
        headers = {"apikey": self.key, "Authorization": f"Bearer {self.key}",
                   "Content-Type": "application/json"}
        if prefer:
            headers["Prefer"] = prefer
        headers.update(extra or {})
        body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else None
        status, raw = http(method, url, headers=headers, body=body, secrets=(self.key,))
        if status >= 300:
            raise RuntimeError(mask(f"Supabase {method} {path} → HTTP {status}: "
                                    f"{raw[:500].decode('utf-8', 'replace')}", self.key))
        return json.loads(raw) if raw else None

    def select(self, table: str, params: dict | None = None) -> list[dict]:
        """모든 행을 페이지로 나눠 가져온다."""
        rows, offset = [], 0
        while True:
            p = dict(params or {})
            p.setdefault("select", "*")
            p["limit"], p["offset"] = self.PAGE, offset
            page = self._req("GET", table, params=p)
            rows.extend(page)
            if len(page) < self.PAGE:
                return rows
            offset += self.PAGE

    def insert(self, table: str, rows: list[dict] | dict, *, returning: bool = False):
        if not rows:
            return []
        prefer = "return=representation" if returning else "return=minimal"
        return self._req("POST", table, data=rows, prefer=prefer)

    def upsert(self, table: str, rows: list[dict], on_conflict: str, chunk: int = 500) -> None:
        for i in range(0, len(rows), chunk):
            self._req("POST", table, params={"on_conflict": on_conflict}, data=rows[i:i + chunk],
                      prefer="resolution=merge-duplicates,return=minimal")

    def update(self, table: str, filters: dict, values: dict) -> None:
        self._req("PATCH", table, params=filters, data=values, prefer="return=minimal")

    def delete(self, table: str, filters: dict) -> None:
        self._req("DELETE", table, params=filters, prefer="return=minimal")

    # 배치 실행 기록
    def start_run(self, job: str, bas_dt: str | None = None) -> int:
        row = self.insert("batch_runs", {"job": job, "bas_dt": bas_dt}, returning=True)
        return row[0]["id"]

    def finish_run(self, run_id: int, status: str, stats: dict, note: str | None = None) -> None:
        self.update("batch_runs", {"id": f"eq.{run_id}"},
                    {"status": status, "stats": stats, "note": note, "finished_at": now_iso()})


# ---------------------------------------------------------------- DART

class DartStop(Exception):
    """계속 부르면 안 되는 오류 (한도 초과, 키 문제). 배치를 멈춘다."""


class Dart:
    BASE = "https://opendart.fss.or.kr/api"
    PER_MINUTE = 350  # 분당 약 350회 (2026-11-16 사용자 확정)
    # 배치를 멈춰야 하는 status: 010 미등록 키, 011 사용할 수 없는 키, 012 접근할 수 없는 IP,
    # 020 요청 제한 초과, 901 개인정보 보유기간 만료 키
    STOP = {"010", "011", "012", "020", "901"}

    def __init__(self) -> None:
        self.key = load_env("DART_OPENAPI_KEY")
        self.interval = 60 / self.PER_MINUTE
        self._last = 0.0
        self.calls = 0

    def _wait(self) -> None:
        gap = time.monotonic() - self._last
        if gap < self.interval:
            time.sleep(self.interval - gap)
        self._last = time.monotonic()

    def raw(self, path: str, params: dict) -> bytes:
        self._wait()
        self.calls += 1
        query = urllib.parse.urlencode({"crtfc_key": self.key, **params})
        status, data = http("GET", f"{self.BASE}/{path}?{query}", secrets=(self.key,))
        if status != 200:
            raise RuntimeError(f"DART {path} HTTP {status}")
        return data

    def json(self, path: str, params: dict) -> dict:
        body = json.loads(self.raw(path, params).decode("utf-8"))
        st = body.get("status")
        if st in self.STOP:
            raise DartStop(f"DART status {st}: {body.get('message')}")
        return body


def fatal(msg: str) -> None:
    log(msg)
    sys.exit(1)
