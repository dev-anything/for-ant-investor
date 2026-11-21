"""batch/notify.py 단위 테스트 (표준 라이브러리 unittest).

실행: 프로젝트 루트에서 `python3 -m unittest`
"""

from __future__ import annotations

import unittest

from batch import notify

FORBIDDEN = ("사라", "팔라", "좋은 회사", "목표가", "매수", "매도", "추천")


def _audit(row_no: int, opinion: str | None, adtor: str = "가나회계법인") -> dict:
    return {"row_no": row_no, "adt_opinion": opinion, "adtor": adtor}


class AmountTest(unittest.TestCase):
    def test_jo_and_eok(self) -> None:
        self.assertEqual(notify.amount_text(3_500_000_000_000), "3.5조 원")
        self.assertEqual(notify.amount_text(180_000_000_000), "1,800억 원")
        self.assertEqual(notify.amount_text(-65_700_000_000), "-657억 원")
        self.assertIsNone(notify.amount_text(None))

    def test_boundaries(self) -> None:
        self.assertEqual(notify.amount_text(999_900_000_000), "9,999억 원")  # 9,999억
        self.assertEqual(notify.amount_text(999_950_000_000), "1.0조 원")  # 반올림으로 1만 억
        self.assertEqual(notify.amount_text(1_000_000_000_000), "1.0조 원")  # 1조
        self.assertEqual(notify.amount_text(0), "0억 원")


class ChangePhraseTest(unittest.TestCase):
    def test_increase_and_decrease(self) -> None:
        self.assertEqual(notify.change_phrase(3_500, 3_000), "(전년보다 16.7% 증가)")
        self.assertEqual(notify.change_phrase(180, 205), "(전년보다 12.2% 감소)")

    def test_same_value(self) -> None:
        self.assertEqual(notify.change_phrase(100, 100), "(전년과 같아)")

    def test_no_prior_or_non_positive_base(self) -> None:
        self.assertIsNone(notify.change_phrase(100, None))
        self.assertIsNone(notify.change_phrase(100, 0))
        self.assertIsNone(notify.change_phrase(100, -5))


class ResultsBodyTest(unittest.TestCase):
    ROWS = [
        {"fiscal_year": 2025, "revenue": 3_000_000_000_000, "operating_income": 205_000_000_000,
         "net_income": 150_000_000_000},
        {"fiscal_year": 2026, "revenue": 3_500_000_000_000, "operating_income": 180_000_000_000,
         "net_income": 120_000_000_000},
    ]

    def test_general_company(self) -> None:
        body = notify.results_body("농심", 2026, self.ROWS, [{"id": 1}], False)
        self.assertEqual(body, "\n".join([
            "농심의 2026년 실적이 반영됐어.",
            "매출액 3.5조 원 (전년보다 16.7% 증가), 영업이익 1,800억 원 (전년보다 12.2% 감소)",
            "눈여겨볼 변화: 매출은 늘었는데 영업이익률은 줄었어",
        ]))

    def test_financial_company_uses_operating_and_net_income_only(self) -> None:
        # 금융회사는 매출을 쓰지 않고, 금융회사에 안 맞는 문장 1번은 건너뛴다
        body = notify.results_body("은행", 2026, self.ROWS, [{"id": 1}, {"id": 5, "year": 2026}], True)
        self.assertEqual(body.splitlines()[1],
                         "영업이익 1,800억 원 (전년보다 12.2% 감소), 순이익 1,200억 원 (전년보다 20.0% 감소)")
        self.assertEqual(body.splitlines()[2], "눈여겨볼 변화: 2026년에 영업이익이 적자로 돌아섰어")
        self.assertNotIn("매출", body)

    def test_no_prior_year_and_no_insight(self) -> None:
        body = notify.results_body("농심", 2026, self.ROWS[1:], [], False)
        self.assertEqual(body, "농심의 2026년 실적이 반영됐어.\n"
                               "매출액 3.5조 원, 영업이익 1,800억 원")

    def test_missing_year_row_is_error(self) -> None:
        with self.assertRaises(ValueError):
            notify.results_body("농심", 2027, self.ROWS, [], False)

    def test_insight_sentences(self) -> None:
        self.assertEqual(notify.insight_sentence({"id": 6, "n": 3}), "영업적자가 3년째 이어지고 있어")
        self.assertEqual(notify.insight_sentence({"id": 7, "prev": 120.5, "curr": 160.2}),
                         "부채비율이 1년 사이 120.5%에서 160.2%로 올랐어")
        self.assertEqual(notify.insight_sentence({"id": 4, "year": 2025}), "2025년에 영업이익이 흑자로 돌아섰어")
        self.assertIsNone(notify.insight_sentence({"id": 99}))
        self.assertIsNone(notify.insight_sentence({"id": 6}))  # 값 없으면 문장 없음


class AuditTest(unittest.TestCase):
    def test_one_row_changed(self) -> None:
        prev = [_audit(1, "적정의견"), _audit(2, "적정의견")]
        curr = [_audit(1, "적정의견"), _audit(2, "한정의견")]
        self.assertIs(notify.audit_changed(prev, curr), True)
        self.assertEqual(notify.changed_opinion(prev, curr), ("적정의견", "한정의견"))

    def test_same_opinion_different_auditor_is_not_a_change(self) -> None:
        prev = [_audit(1, "적정의견", "가나회계법인")]
        curr = [_audit(1, "적정의견", "다라회계법인")]
        self.assertIs(notify.audit_changed(prev, curr), False)
        self.assertIsNone(notify.changed_opinion(prev, curr))

    def test_empty_opinion_is_ignored(self) -> None:
        prev = [_audit(1, "적정의견")]
        curr = [_audit(1, None)]
        self.assertIs(notify.audit_changed(prev, curr), False)
        self.assertIs(notify.audit_changed([_audit(1, "")], [_audit(1, "의견거절")]), False)

    def test_more_than_two_rows_is_held(self) -> None:
        three = [_audit(1, "적정의견"), _audit(2, "적정의견"), _audit(3, "적정의견")]
        self.assertIsNone(notify.audit_changed(three, [_audit(1, "한정의견")]))
        self.assertIsNone(notify.audit_changed([_audit(1, "적정의견")], three))
        self.assertIsNone(notify.changed_opinion(three, three))

    def test_first_collection_has_no_alert(self) -> None:
        self.assertIs(notify.audit_changed([], [_audit(1, "한정의견")]), False)
        self.assertIsNone(notify.changed_opinion([], [_audit(1, "한정의견")]))

    def test_audit_body(self) -> None:
        self.assertEqual(notify.audit_body("농심", 2026, "적정의견", "의견거절"),
                         "농심의 2026년 감사의견이 '적정의견'에서 '의견거절'으로 바뀌었어.")

    def test_new_year_arrived(self) -> None:
        self.assertTrue(notify.new_year_arrived(2025, 2026))
        self.assertFalse(notify.new_year_arrived(2026, 2026))
        self.assertFalse(notify.new_year_arrived(None, 2026))  # 첫 수집은 알리지 않음
        self.assertFalse(notify.new_year_arrived(2025, None))


class DelistedTest(unittest.TestCase):
    def test_delisted_body_has_no_reason(self) -> None:
        self.assertEqual(notify.delisted_body("농심"), "농심이 KRX 상장종목 목록에서 빠졌어.")


class DedupeKeyTest(unittest.TestCase):
    def test_shape(self) -> None:
        self.assertEqual(notify.dedupe_key("new_results", "A005930", 2026), "new_results:A005930:2026")
        self.assertEqual(notify.dedupe_key("delisted", "A005930", "20261121"),
                         "delisted:A005930:20261121")

    def test_same_change_same_key_different_year_different_key(self) -> None:
        # 같은 연도의 감사의견 변경은 의견 문자열이 달라도 같은 키 → 두 번 안 넣음
        self.assertEqual(notify.dedupe_key("audit_change", "A005930", 2026),
                         notify.dedupe_key("audit_change", "A005930", 2026))
        self.assertNotEqual(notify.dedupe_key("audit_change", "A005930", 2026),
                            notify.dedupe_key("audit_change", "A005930", 2025))
        self.assertNotEqual(notify.dedupe_key("audit_change", "A005930", 2026),
                            notify.dedupe_key("new_results", "A005930", 2026))

    def test_invalid_kind_and_code(self) -> None:
        with self.assertRaises(ValueError):
            notify.dedupe_key("price_move", "A005930", 2026)
        with self.assertRaises(ValueError):
            notify.dedupe_key("new_results", "", 2026)


class MailTest(unittest.TestCase):
    def test_subject_four_forms(self) -> None:
        self.assertEqual(notify.mail_subject({"new_results"}, 2), "추적 종목 2개의 실적이 반영됐습니다")
        self.assertEqual(notify.mail_subject(["delisted"], 1), "추적 종목 1개가 상장종목 목록에서 빠졌습니다")
        self.assertEqual(notify.mail_subject({"audit_change"}, 3), "추적 종목 3개의 감사의견이 바뀌었습니다")
        self.assertEqual(notify.mail_subject({"new_results", "audit_change"}, 2),
                         "추적 종목 2개에 새 소식이 있습니다")

    def test_subject_invalid(self) -> None:
        with self.assertRaises(ValueError):
            notify.mail_subject(set(), 1)
        with self.assertRaises(ValueError):
            notify.mail_subject({"news"}, 1)

    def test_body_contains_bodies_source_disclaimer_and_unsubscribe(self) -> None:
        url = "http://example.invalid/unsubscribe?token=abc"
        text = notify.mail_body(["첫째 알림.", "둘째 알림."], url)
        self.assertTrue(text.startswith("첫째 알림.\n\n둘째 알림."))
        for line in notify.SOURCE_LINES:
            self.assertIn(line, text)
        self.assertIn(notify.DISCLAIMER, text)
        self.assertIn(notify.UNSUBSCRIBE_LINE + "\n" + url, text)
        self.assertEqual(text.rstrip().splitlines()[-1], url)

    def test_body_empty_is_error(self) -> None:
        with self.assertRaises(ValueError):
            notify.mail_body([], "http://example.invalid/")

    def test_sample_text_has_no_forbidden_expressions(self) -> None:
        text = notify._sample()
        for word in FORBIDDEN:
            self.assertNotIn(word, text)


if __name__ == "__main__":
    unittest.main()
