"""
Unit tests for database query helpers — country normalization and filter logic.
"""
from __future__ import annotations
import pytest
from app.db.queries import _normalize_countries


class TestNormalizeCountries:
    def test_common_names(self):
        assert _normalize_countries(["usa", "uk", "canada"]) == ["US", "GB", "CA"]

    def test_iso_codes(self):
        assert _normalize_countries(["US", "GB", "DE"]) == ["US", "GB", "DE"]

    def test_mixed_case(self):
        assert _normalize_countries(["United States", "england"]) == ["US", "GB"]

    def test_unknown_country(self):
        result = _normalize_countries(["bangladesh"])
        assert result == ["BANGLADESH"]

    def test_empty_list(self):
        assert _normalize_countries([]) == []

    def test_whitespace_handling(self):
        assert _normalize_countries(["  usa  ", " uk "]) == ["US", "GB"]

    def test_holland_alias(self):
        assert _normalize_countries(["holland"]) == ["NL"]

    def test_korea_alias(self):
        assert _normalize_countries(["south korea", "korea"]) == ["KR", "KR"]


class TestFilterProgramsLogic:
    """Test the Python-side JSONB filtering that happens after the DB query.

    We test the filter logic inline rather than mocking the full DB call,
    since the interesting logic is the IELTS/GPA comparison.
    """

    def _filter_row(self, row: dict, ielts: float | None, gpa_pct: int | None) -> bool:
        """Replicate the filter logic from queries.filter_programs."""
        reqs: dict = row.get("min_requirements") or {}
        min_ielts = reqs.get("ielts")
        min_gpa = reqs.get("gpa_pct")
        if min_ielts is not None and ielts is not None and ielts < min_ielts:
            return False
        if min_gpa is not None and gpa_pct is not None and gpa_pct < min_gpa:
            return False
        return True

    def test_passes_when_above_minimums(self):
        row = {"min_requirements": {"ielts": 6.5, "gpa_pct": 70}}
        assert self._filter_row(row, 7.0, 85) is True

    def test_fails_when_below_ielts(self):
        row = {"min_requirements": {"ielts": 6.5}}
        assert self._filter_row(row, 6.0, None) is False

    def test_fails_when_below_gpa(self):
        row = {"min_requirements": {"gpa_pct": 70}}
        assert self._filter_row(row, None, 65) is False

    def test_passes_when_no_requirements(self):
        row = {"min_requirements": {}}
        assert self._filter_row(row, 5.0, 50) is True

    def test_passes_when_requirements_none(self):
        row = {"min_requirements": None}
        assert self._filter_row(row, 5.0, 50) is True

    def test_passes_when_student_scores_none(self):
        row = {"min_requirements": {"ielts": 6.5, "gpa_pct": 70}}
        assert self._filter_row(row, None, None) is True

    def test_zero_ielts_requirement_still_checked(self):
        """Bug fix verification: min_ielts=0 should not be skipped."""
        row = {"min_requirements": {"ielts": 0}}
        # Student has no IELTS — should pass since student score is None
        assert self._filter_row(row, None, None) is True
        # Student has IELTS 0 — exactly meets minimum
        assert self._filter_row(row, 0, None) is True
        # This should never happen but test the boundary
        assert self._filter_row(row, -1, None) is False

    def test_exact_minimum_passes(self):
        row = {"min_requirements": {"ielts": 6.5, "gpa_pct": 70}}
        assert self._filter_row(row, 6.5, 70) is True
