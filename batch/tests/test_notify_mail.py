"""batch/notify_mail.py 순수 함수 단위 테스트 (DB·SMTP 없음). 실행: python3 -m unittest discover -s batch/tests -t ."""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from batch import notify_mail

NOW = datetime(2026, 11, 21, 6, 0, tzinfo=timezone.utc)


def _ts(days_ago: float) -> str:
    return (NOW - timedelta(days=days_ago)).isoformat()


def _note(nid: int, user: str, days_ago: float, kind: str = "new_results", srtn: str = "A005930") -> dict:
    return {"id": nid, "user_id": user, "srtn_cd": srtn, "kind": kind,
            "body": f"본문 {nid}", "created_at": _ts(days_ago)}


RECIPIENTS = [
    {"user_id": "u1", "email": "a@example.invalid", "unsubscribe_token": "11111111-1111-1111-1111-111111111111"},
    {"user_id": "u2", "email": "b@example.invalid", "unsubscribe_token": "22222222-2222-2222-2222-222222222222"},
]


class UnsubscribeUrlTest(unittest.TestCase):
    def test_builds_url_and_drops_trailing_slash(self) -> None:
        url = notify_mail.unsubscribe_url("http://100.124.240.114:16000/", "abc")
        self.assertEqual(url, "http://100.124.240.114:16000/unsubscribe?token=abc")


class PlanMailsTest(unittest.TestCase):
    def test_groups_per_user_in_created_order(self) -> None:
        notes = [_note(2, "u1", 1), _note(1, "u1", 2), _note(3, "u2", 0.5)]
        plans = notify_mail.plan_mails(RECIPIENTS, notes, NOW)
        self.assertEqual([p.user_id for p in plans], ["u1", "u2"])
        self.assertEqual([n["id"] for n in plans[0].send], [1, 2])  # 오래된 것부터
        self.assertEqual(plans[0].expired_ids, [])
        self.assertEqual(plans[0].token, RECIPIENTS[0]["unsubscribe_token"])

    def test_skips_notifications_older_than_seven_days(self) -> None:
        notes = [_note(1, "u1", 8), _note(2, "u1", 6.5), _note(3, "u1", 9.5)]
        (plan,) = notify_mail.plan_mails(RECIPIENTS[:1], notes, NOW)
        self.assertEqual([n["id"] for n in plan.send], [2])
        self.assertEqual(sorted(plan.expired_ids), [1, 3])

    def test_only_old_notifications_gives_no_mail_but_expired_ids(self) -> None:
        (plan,) = notify_mail.plan_mails(RECIPIENTS[:1], [_note(5, "u1", 30)], NOW)
        self.assertEqual(plan.send, [])
        self.assertEqual(plan.expired_ids, [5])

    def test_user_without_notifications_is_left_out(self) -> None:
        plans = notify_mail.plan_mails(RECIPIENTS, [_note(1, "u1", 1)], NOW)
        self.assertEqual([p.user_id for p in plans], ["u1"])

    def test_daily_cap_defers_extra_users_without_expiring_them(self) -> None:
        notes = [_note(1, "u1", 1), _note(2, "u2", 1)]
        plans = notify_mail.plan_mails(RECIPIENTS, notes, NOW, max_mails=1)
        self.assertEqual([p.user_id for p in plans], ["u1"])

    def test_cap_does_not_block_expire_only_users(self) -> None:
        notes = [_note(1, "u1", 1), _note(2, "u2", 30)]
        plans = notify_mail.plan_mails(RECIPIENTS, notes, NOW, max_mails=1)
        self.assertEqual([p.user_id for p in plans], ["u1", "u2"])
        self.assertEqual(plans[1].expired_ids, [2])

    def test_parses_timezone_naive_and_fraction_seconds(self) -> None:
        note = _note(1, "u1", 1)
        note["created_at"] = "2026-11-20T06:00:00.123456"  # 시간대 없음 → UTC로 본다
        (plan,) = notify_mail.plan_mails(RECIPIENTS[:1], [note], NOW)
        self.assertEqual(len(plan.send), 1)


class BuildMailTest(unittest.TestCase):
    def test_subject_counts_distinct_stocks_and_kinds(self) -> None:
        notes = [_note(1, "u1", 1, "new_results", "A005930"), _note(2, "u1", 1, "new_results", "A000660")]
        (plan,) = notify_mail.plan_mails(RECIPIENTS[:1], notes, NOW)
        subject, body = notify_mail.build_mail(plan, "http://host:16000")
        self.assertEqual(subject, "추적 종목 2개의 실적이 반영됐습니다")
        self.assertIn("본문 1\n\n본문 2", body)
        self.assertIn("http://host:16000/unsubscribe?token=11111111-1111-1111-1111-111111111111", body)

    def test_mixed_kinds_use_general_subject(self) -> None:
        notes = [_note(1, "u1", 1, "new_results"), _note(2, "u1", 1, "audit_change", "A000660")]
        (plan,) = notify_mail.plan_mails(RECIPIENTS[:1], notes, NOW)
        subject, _ = notify_mail.build_mail(plan, "http://host:16000")
        self.assertEqual(subject, "추적 종목 2개에 새 소식이 있습니다")


if __name__ == "__main__":
    unittest.main()
