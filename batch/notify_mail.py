"""F-13 알림 메일 발송 배치 (매일 GitHub Actions 마지막 단계, FS 9-13·12장 6번).

실행: python3 -m batch.notify_mail [--dry-run]
- notification_recipients() (서버용 키 RPC)로 수신을 켠 사용자를 받고, 사용자마다 emailed_at이 비어 있는 알림을 모아 한 통 보낸다.
- 최근 7일 안에 만든 알림만 보낸다. 더 오래된 미발송 알림은 메일 없이 emailed_at만 채워 건너뛴다
  (수신을 나중에 켰을 때 옛 알림이 한꺼번에 가지 않게).
- 보낸 뒤 성공한 사용자의 알림만 emailed_at = now. 한 명 실패는 기록하고 다음 사람으로 (다음 날 다시 시도).
- GMAIL_ADDRESS·GMAIL_APP_PASSWORD·SITE_URL 중 없는 것이 있으면 이름만 로그에 남기고 아무것도 하지 않고 정상 종료한다.
- --dry-run: DB를 읽기만 해서 대상·묶음 수만 출력한다 (메일 발송·DB 쓰기 없음, 설정 없어도 됨).
- 메일 주소·본문은 로그에 남기지 않는다 (보낸 수·실패 수만). 실패 로그에는 예외 종류 이름만 남긴다.
"""

from __future__ import annotations

import argparse
import smtplib
import ssl
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from batch.common import Supabase, load_env, log, now_iso
from batch.notify import mail_body, mail_subject

# ---------------------------------------------------------------- 기준값 (한곳에서 관리)
MAIL_WINDOW = timedelta(days=7)  # FS 12장 동작 기본안 6번: 최근 7일 안에 만든 알림만 보낸다
MAIL_DAILY_MAX = 100  # 하루에 보낼 사용자 수 상한. Gmail 한도 확인 전 보수적 기본값 (PRD 11장 11번)
SMTP_HOST = "smtp.gmail.com"  # FS 9-13: Gmail SMTP, SSL 연결
SMTP_PORT = 465
SMTP_TIMEOUT = 60
CONFIG_NAMES = ("GMAIL_ADDRESS", "GMAIL_APP_PASSWORD", "SITE_URL")
RECIPIENT_RPC = "notification_recipients"  # FS 5-8: service_role 전용 함수
NOTIFY_FIELDS = "id,user_id,srtn_cd,kind,body,created_at"
IN_CHUNK = 100  # URL 길이 제한을 피하려고 `in.(...)` 목록을 나눈다


@dataclass
class MailPlan:
    """사용자 한 명의 발송 계획. send가 비어 있으면 메일 없이 expired_ids만 채운다."""

    user_id: str
    email: str
    token: str
    send: list[dict]
    expired_ids: list[int]


# ---------------------------------------------------------------- 순수 함수 (DB·네트워크 없음)
def parse_time(text: str) -> datetime:
    """PostgREST 시각 문자열 → 시간대 있는 datetime. 시간대가 없으면 UTC로 본다."""
    value = datetime.fromisoformat(text)
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def unsubscribe_url(site_url: str, token: str) -> str:
    """수신 거부 확인 화면 주소 (PRD 4장 F-13: {SITE_URL}/unsubscribe?token=...)."""
    return f"{site_url.rstrip('/')}/unsubscribe?token={token}"


def plan_mails(recipients: list[dict], notifications: list[dict], now: datetime,
               max_mails: int = MAIL_DAILY_MAX) -> list[MailPlan]:
    """사용자별로 묶는다. 7일을 넘긴 알림은 expired_ids로 빼고, 하루 상한을 넘긴 사용자는 이번에 빼 둔다(알림 그대로)."""
    by_user: dict[str, list[dict]] = defaultdict(list)
    for n in notifications:
        by_user[n["user_id"]].append(n)
    cutoff = now - MAIL_WINDOW
    plans: list[MailPlan] = []
    mails = 0
    for r in recipients:
        items = sorted(by_user.get(r["user_id"], []), key=lambda n: (parse_time(n["created_at"]), n["id"]))
        if not items:
            continue
        fresh = [n for n in items if parse_time(n["created_at"]) >= cutoff]
        expired = [n["id"] for n in items if parse_time(n["created_at"]) < cutoff]
        if fresh:
            if mails >= max_mails:
                continue
            mails += 1
        plans.append(MailPlan(r["user_id"], r["email"], str(r["unsubscribe_token"]), fresh, expired))
    return plans


def build_mail(plan: MailPlan, site_url: str) -> tuple[str, str]:
    """사용자 한 명의 메일 제목·본문 (문구는 batch/notify.py, PRD 4장 F-13)."""
    kinds = {n["kind"] for n in plan.send}
    stocks = {n["srtn_cd"] for n in plan.send}
    subject = mail_subject(kinds, len(stocks))
    body = mail_body([n["body"] for n in plan.send], unsubscribe_url(site_url, plan.token))
    return subject, body


# ---------------------------------------------------------------- 입출력
def _chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def _recipients(db: Supabase) -> list[dict]:
    # Supabase 클래스에는 RPC 메서드가 없어 PostgREST rpc 경로를 서버용 키로 직접 부른다 (읽기 전용 함수)
    return db._req("POST", f"rpc/{RECIPIENT_RPC}", data={}) or []


def _unsent(db: Supabase, user_ids: list[str]) -> list[dict]:
    rows: list[dict] = []
    for chunk in _chunks(user_ids, IN_CHUNK):
        rows += db.select("notifications", {
            "user_id": f"in.({','.join(chunk)})",
            "emailed_at": "is.null",
            "select": NOTIFY_FIELDS,
            "order": "created_at.asc,id.asc",
        })
    return rows


def _mark_emailed(db: Supabase, user_id: str, ids: list[int]) -> None:
    if not ids:
        return
    db.update("notifications",
              {"user_id": f"eq.{user_id}", "id": f"in.({','.join(str(i) for i in ids)})"},
              {"emailed_at": now_iso()})


def _send_all(db: Supabase, plans: list[MailPlan], sender: str, password: str, site_url: str) -> int:
    """한 SMTP 연결로 보낸다. 연결·로그인 실패는 전체 중단(반환 1), 사용자별 실패는 기록하고 계속."""
    try:
        smtp = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=SMTP_TIMEOUT)
        smtp.login(sender, password)
    except (smtplib.SMTPException, OSError) as e:
        log(f"Gmail 연결·로그인 실패 ({type(e).__name__}), 메일을 보내지 않고 끝낸다")
        return 1
    sent = failed = 0
    try:
        for idx, plan in enumerate(plans, 1):
            if plan.send:
                try:
                    subject, body = build_mail(plan, site_url)
                    msg = EmailMessage()
                    msg["Subject"] = subject
                    msg["From"] = sender
                    msg["To"] = plan.email
                    msg.set_content(body)  # text/plain, utf-8 (FS 9-13: List-Unsubscribe 헤더 없음)
                    smtp.send_message(msg)
                except (smtplib.SMTPException, OSError) as e:
                    failed += 1
                    log(f"  메일 실패 (대상 {idx}번, {type(e).__name__}) — 알림은 그대로 두고 내일 다시 시도")
                    continue
                sent += 1
            try:
                _mark_emailed(db, plan.user_id, [n["id"] for n in plan.send] + plan.expired_ids)
            except RuntimeError as e:  # 메일은 나갔으니 기록 실패만 남기고 다음 사람으로
                log(f"  emailed_at 기록 실패 (대상 {idx}번): {e}")
    finally:
        try:
            smtp.quit()
        except (smtplib.SMTPException, OSError):
            pass  # 연결 종료 실패는 보낸 결과에 영향이 없다
    log(f"메일 발송 {sent}통, 실패 {failed}명")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="F-13 알림 메일 발송")
    ap.add_argument("--dry-run", action="store_true", help="DB를 읽기만 하고 대상·묶음 수만 출력 (발송·쓰기 없음)")
    a = ap.parse_args(argv)

    if not a.dry_run:
        missing = [n for n in CONFIG_NAMES if not load_env(n, required=False)]
        if missing:
            log(f"메일 설정이 없어 발송하지 않고 끝낸다 (없는 변수: {', '.join(missing)})")
            return 0
    site_url = load_env("SITE_URL", required=False)

    db = Supabase()
    recipients = _recipients(db)
    if not recipients:
        log("메일 받을 사용자가 없어")
        return 0
    notifications = _unsent(db, [r["user_id"] for r in recipients])
    plans = plan_mails(recipients, notifications, datetime.now(timezone.utc))
    mail_plans = [p for p in plans if p.send]
    expired = sum(len(p.expired_ids) for p in plans)
    log(f"대상 사용자 {len(recipients)}명, 메일 {len(mail_plans)}통 예정, 7일 넘어 건너뛸 알림 {expired}건")

    if a.dry_run:
        for p in mail_plans:  # 이메일 주소는 출력하지 않는다
            subject, _ = build_mail(p, site_url or "(SITE_URL 없음)")
            log(f"  [dry-run] 알림 {len(p.send)}건, 제목: {subject}")
        return 0

    sender = load_env("GMAIL_ADDRESS")
    password = load_env("GMAIL_APP_PASSWORD")
    # 메일 없이 건너뛸 알림만 있는 사용자도 emailed_at을 채워야 하므로 plans 전체를 넘긴다
    return _send_all(db, plans, sender, password, site_url)


if __name__ == "__main__":
    raise SystemExit(main())
