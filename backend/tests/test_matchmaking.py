"""
Unit tests for the matchmaking engine — scoring, normalization, and edge cases.
"""
import pytest
from app.services.matchmaking import (
    normalize_ranking,
    cost_efficiency_score,
    _score_program,
)


# ─── normalize_ranking ───────────────────────────────────────────────────────

class TestNormalizeRanking:
    def test_rank_1(self):
        assert normalize_ranking(1) == pytest.approx(0.9993, abs=0.001)

    def test_rank_100(self):
        assert normalize_ranking(100) == pytest.approx(0.9333, abs=0.001)

    def test_rank_1500(self):
        assert normalize_ranking(1500) == 0.0

    def test_rank_above_max(self):
        assert normalize_ranking(2000) == 0.0

    def test_rank_none(self):
        assert normalize_ranking(None) == 0.0

    def test_rank_zero(self):
        assert normalize_ranking(0) == 0.0

    def test_rank_negative(self):
        assert normalize_ranking(-5) == 0.0

    def test_custom_max_rank(self):
        assert normalize_ranking(50, max_rank=100) == pytest.approx(0.5, abs=0.01)


# ─── cost_efficiency_score ───────────────────────────────────────────────────

class TestCostEfficiencyScore:
    def test_tuition_equals_budget(self):
        score = cost_efficiency_score(30000, 30000, False, None)
        assert score == 0.0

    def test_tuition_below_budget(self):
        score = cost_efficiency_score(20000, 30000, False, None)
        assert score == pytest.approx(0.3333, abs=0.001)

    def test_tuition_above_budget(self):
        score = cost_efficiency_score(40000, 30000, False, None)
        assert score == 0.0

    def test_zero_budget(self):
        score = cost_efficiency_score(10000, 0, False, None)
        assert score == 0.0

    def test_scholarship_bonus(self):
        without = cost_efficiency_score(20000, 30000, False, None)
        with_sch = cost_efficiency_score(20000, 30000, True, 50)
        assert with_sch > without

    def test_scholarship_bonus_capped_at_1(self):
        score = cost_efficiency_score(0, 100000, True, 100)
        assert score <= 1.0

    def test_free_tuition(self):
        score = cost_efficiency_score(0, 30000, False, None)
        assert score == 1.0

    def test_negative_tuition_treated_as_free(self):
        # Budget - negative tuition > budget, so ratio > 1, clamped to 1
        score = cost_efficiency_score(-5000, 30000, False, None)
        assert score == 1.0


# ─── _score_program ──────────────────────────────────────────────────────────

class TestScoreProgram:
    def _default_weights(self):
        return {
            "weight_ranking": 0.30,
            "weight_cost_efficiency": 0.40,
            "weight_bd_acceptance": 0.30,
        }

    def _make_row(self, **overrides):
        uni = {
            "id": "u1",
            "name": "Test Uni",
            "country": "US",
            "ranking_qs": 100,
            "tuition_usd_per_year": 25000,
            "scholarships_available": False,
            "max_scholarship_pct": None,
            "acceptance_rate_bd": 55.0,
        }
        uni.update(overrides.pop("uni_overrides", {}))
        row = {
            "id": "p1",
            "name": "MSc CS",
            "tuition_usd_per_year": None,
            "universities": uni,
        }
        row.update(overrides)
        return row

    def test_score_within_bounds(self):
        row = self._make_row()
        score, breakdown = _score_program(row, 30000, self._default_weights())
        assert 0.0 <= score <= 1.0

    def test_breakdown_keys(self):
        row = self._make_row()
        _, breakdown = _score_program(row, 30000, self._default_weights())
        assert "ranking" in breakdown
        assert "cost_efficiency" in breakdown
        assert "bd_acceptance" in breakdown

    def test_higher_ranking_gives_higher_score(self):
        row_good = self._make_row(uni_overrides={"ranking_qs": 10})
        row_bad = self._make_row(uni_overrides={"ranking_qs": 500})
        score_good, _ = _score_program(row_good, 30000, self._default_weights())
        score_bad, _ = _score_program(row_bad, 30000, self._default_weights())
        assert score_good > score_bad

    def test_unranked_university(self):
        row = self._make_row(uni_overrides={"ranking_qs": None})
        score, breakdown = _score_program(row, 30000, self._default_weights())
        assert breakdown["ranking"] == 0.0
        assert 0.0 <= score <= 1.0

    def test_unknown_bd_acceptance_defaults_to_50(self):
        row = self._make_row(uni_overrides={"acceptance_rate_bd": None})
        _, breakdown = _score_program(row, 30000, self._default_weights())
        assert breakdown["bd_acceptance"] == 0.5

    def test_score_clamped_with_bad_weights(self):
        """Weights summing to > 1.0 should still produce clamped score."""
        bad_weights = {
            "weight_ranking": 1.0,
            "weight_cost_efficiency": 1.0,
            "weight_bd_acceptance": 1.0,
        }
        row = self._make_row(
            uni_overrides={"ranking_qs": 1, "acceptance_rate_bd": 100.0}
        )
        score, _ = _score_program(row, 100000, bad_weights)
        assert score <= 1.0

    def test_zero_budget(self):
        row = self._make_row()
        score, breakdown = _score_program(row, 0, self._default_weights())
        assert breakdown["cost_efficiency"] == 0.0

    def test_program_tuition_overrides_university(self):
        row = self._make_row(
            tuition_usd_per_year=10000,
            uni_overrides={"tuition_usd_per_year": 50000},
        )
        _, breakdown = _score_program(row, 30000, self._default_weights())
        # Program tuition is 10k vs budget 30k = 0.667 cost efficiency
        assert breakdown["cost_efficiency"] > 0.5
