"""Supabase 연결 확인 (표준 라이브러리만 사용).

실행: python3 scripts/supabase_check.py
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 환경변수 → 프로젝트 루트 .env 순서로 찾는다.
- 키 값은 어디에도 출력하지 않는다. 키 종류(형식)와 응답 상태만 보여 준다.
"""

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMEOUT = 30


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
    return ""


def key_kind(key: str) -> str:
    """키 값을 드러내지 않고 종류만 판별한다."""
    if key.startswith("sb_secret_"):
        return "secret (서버용, 정상)"
    if key.startswith("sb_publishable_"):
        return "publishable (브라우저용 공개 키 — 서버용 키가 아님!)"
    parts = key.split(".")
    if len(parts) == 3:  # 예전 JWT 형식
        try:
            payload = parts[1] + "=" * (-len(parts[1]) % 4)
            role = json.loads(base64.urlsafe_b64decode(payload)).get("role")
        except Exception:
            role = None
        if role == "service_role":
            return "service_role JWT (서버용, 정상)"
        return f"JWT role={role} (서버용 service_role이 아님!)"
    return "알 수 없는 형식"


def get(url: str, key: str) -> tuple[int | None, str]:
    req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            return res.status, res.read(300).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read(300).decode("utf-8", errors="replace")
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def main() -> int:
    url = load_env("SUPABASE_URL").rstrip("/")
    key = load_env("SUPABASE_SERVICE_ROLE_KEY")
    ok = True

    print(f"SUPABASE_URL: {url or '(없음)'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'있음' if key else '(없음)'}"
          + (f", 종류 = {key_kind(key)}" if key else ""))
    if not url or not key:
        return 1

    # 1) REST API (PostgREST) — 키가 맞으면 200
    status, body = get(f"{url}/rest/v1/", key)
    print(f"[REST  /rest/v1/]              HTTP {status}")
    if status != 200:
        ok = False
        print(f"  응답 앞부분: {body[:200]}")

    # 2) Auth 관리자 API — 서버용(관리자) 키여야만 200
    status, body = get(f"{url}/auth/v1/admin/users?per_page=1", key)
    print(f"[Auth  /auth/v1/admin/users]   HTTP {status}  (200이면 관리자 권한 확인)")
    if status != 200:
        ok = False
        print(f"  응답 앞부분: {body[:200]}")

    print("결과:", "정상" if ok else "확인 필요")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
