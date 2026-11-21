"""batch/notify_io.py 순수 함수 단위 테스트 (DB 없음). 실행: python3 -m unittest discover -s batch/tests -t ."""

from __future__ import annotations

import unittest

from batch import notify_io


class AlertRowTest(unittest.TestCase):
    def test_new_results_key_uses_fiscal_year(self) -> None:
        row = notify_io.alert_row("u1", "A005930", "new_results", 2026, "본문", 2026)
        self.assertEqual(row["dedupe_key"], "new_results:A005930:2026")
        self.assertEqual(row["fiscal_year"], 2026)
        self.assertEqual(set(row), {"user_id", "srtn_cd", "kind", "fiscal_year", "body", "dedupe_key"})

    def test_delisted_key_uses_bas_dt_and_no_year(self) -> None:
        row = notify_io.alert_row("u1", "A005930", "delisted", None, "본문", "2026-11-21")
        self.assertEqual(row["dedupe_key"], "delisted:A005930:2026-11-21")
        self.assertIsNone(row["fiscal_year"])

    def test_unknown_kind_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            notify_io.alert_row("u1", "A005930", "price", None, "본문", 1)


class AuditAlertYearTest(unittest.TestCase):
    def test_first_collection_is_not_compared(self) -> None:
        self.assertIsNone(notify_io.audit_alert_year(set(), {2023, 2024, 2025}))

    def test_no_new_latest_year_is_none(self) -> None:
        self.assertIsNone(notify_io.audit_alert_year({2024, 2025}, {2024, 2025}))

    def test_new_latest_year_compared_when_previous_exists(self) -> None:
        self.assertEqual(notify_io.audit_alert_year({2023, 2024}, {2023, 2024, 2025}), 2025)

    def test_missing_previous_year_is_none(self) -> None:
        self.assertIsNone(notify_io.audit_alert_year({2022}, {2022, 2025}))

    def test_only_latest_year_counts_not_older_new_years(self) -> None:
        # 2023도 새로 들어왔어도 최신 연도 하나만 비교한다 (과거 연도 변화는 알리지 않음)
        self.assertEqual(notify_io.audit_alert_year({2022}, {2022, 2023, 2024}), 2024)


if __name__ == "__main__":
    unittest.main()
