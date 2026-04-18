"""
Unit tests for Pydantic models — validation, edge cases, and constraints.
"""
import pytest
from pydantic import ValidationError

from app.models.student import StudentCreate, StudentUpdate, AcademicHistory, TestScores
from app.models.university import (
    UniversityCreate, ProgramCreate, MatchResultItem, UniversityFilter,
)
from app.models.application import (
    ApplicationCreate, ApplicationStatusUpdate, MatchSettingsUpdate,
    ConsultantCreate, ReviewCreate, ReassignBody, ForwardBody,
    AgencyCreate, STATUS_TRANSITIONS,
)


# ─── StudentCreate ───────────────────────────────────────────────────────────

class TestStudentCreate:
    def test_valid_student(self):
        s = StudentCreate(
            full_name="Jane Doe",
            phone="+8801712345678",
            academic_history=AcademicHistory(gpa_percentage=85),
            test_scores=TestScores(ielts=7.0),
            budget_usd_per_year=30000,
            preferred_countries=["us", "ca"],
            preferred_degree="master",
            preferred_fields=["cs"],
        )
        assert s.preferred_countries == ["US", "CA"]

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="A",
                academic_history=AcademicHistory(),
                budget_usd_per_year=30000,
            )

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="A" * 121,
                academic_history=AcademicHistory(),
                budget_usd_per_year=30000,
            )

    def test_budget_must_be_positive(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="Jane Doe",
                academic_history=AcademicHistory(),
                budget_usd_per_year=0,
            )

    def test_budget_negative(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="Jane Doe",
                academic_history=AcademicHistory(),
                budget_usd_per_year=-1000,
            )

    def test_countries_uppercased(self):
        s = StudentCreate(
            full_name="Jane Doe",
            academic_history=AcademicHistory(),
            budget_usd_per_year=10000,
            preferred_countries=["gb", "De"],
        )
        assert s.preferred_countries == ["GB", "DE"]

    def test_empty_countries_ok(self):
        s = StudentCreate(
            full_name="Jane Doe",
            academic_history=AcademicHistory(),
            budget_usd_per_year=10000,
        )
        assert s.preferred_countries == []

    def test_invalid_degree_level(self):
        with pytest.raises(ValidationError):
            StudentCreate(
                full_name="Jane Doe",
                academic_history=AcademicHistory(),
                budget_usd_per_year=10000,
                preferred_degree="postdoc",
            )


# ─── TestScores ──────────────────────────────────────────────────────────────

class TestTestScores:
    def test_valid_scores(self):
        t = TestScores(ielts=7.5, toefl=100, gre=320, gmat=700, sat=1400)
        assert t.ielts == 7.5

    def test_ielts_out_of_range(self):
        with pytest.raises(ValidationError):
            TestScores(ielts=10.0)

    def test_ielts_negative(self):
        with pytest.raises(ValidationError):
            TestScores(ielts=-1.0)

    def test_toefl_out_of_range(self):
        with pytest.raises(ValidationError):
            TestScores(toefl=121)

    def test_gre_too_low(self):
        with pytest.raises(ValidationError):
            TestScores(gre=100)

    def test_gre_too_high(self):
        with pytest.raises(ValidationError):
            TestScores(gre=341)

    def test_all_none(self):
        t = TestScores()
        assert t.ielts is None
        assert t.toefl is None

    def test_zero_ielts_valid(self):
        t = TestScores(ielts=0)
        assert t.ielts == 0


# ─── AcademicHistory ─────────────────────────────────────────────────────────

class TestAcademicHistory:
    def test_gpa_percentage_bounds(self):
        a = AcademicHistory(gpa_percentage=100)
        assert a.gpa_percentage == 100

        with pytest.raises(ValidationError):
            AcademicHistory(gpa_percentage=101)

        with pytest.raises(ValidationError):
            AcademicHistory(gpa_percentage=-1)


# ─── UniversityCreate ────────────────────────────────────────────────────────

class TestUniversityCreate:
    def test_valid(self):
        u = UniversityCreate(name="MIT", country="US", tuition_usd_per_year=50000)
        assert u.name == "MIT"

    def test_country_code_length(self):
        with pytest.raises(ValidationError):
            UniversityCreate(name="MIT", country="USA", tuition_usd_per_year=50000)

    def test_acceptance_rate_bounds(self):
        with pytest.raises(ValidationError):
            UniversityCreate(
                name="MIT", country="US", tuition_usd_per_year=50000,
                acceptance_rate_overall=101,
            )

    def test_zero_tuition_ok(self):
        u = UniversityCreate(name="Free Uni", country="DE", tuition_usd_per_year=0)
        assert u.tuition_usd_per_year == 0


# ─── ProgramCreate ───────────────────────────────────────────────────────────

class TestProgramCreate:
    def test_valid(self):
        p = ProgramCreate(name="MSc CS", degree_level="master", field="cs")
        assert p.is_active is True

    def test_invalid_degree(self):
        with pytest.raises(ValidationError):
            ProgramCreate(name="MSc CS", degree_level="postgraduate", field="cs")

    def test_duration_too_long(self):
        with pytest.raises(ValidationError):
            ProgramCreate(name="MSc CS", degree_level="master", field="cs", duration_years=11)

    def test_duration_zero(self):
        with pytest.raises(ValidationError):
            ProgramCreate(name="MSc CS", degree_level="master", field="cs", duration_years=0)


# ─── MatchResultItem ─────────────────────────────────────────────────────────

class TestMatchResultItem:
    def test_valid(self):
        m = MatchResultItem(
            university_id="u1", program_id="p1",
            university_name="MIT", program_name="CS",
            country="US", tuition_usd_per_year=50000,
            ranking_qs=1, score=0.95, breakdown={},
        )
        assert m.score == 0.95

    def test_score_above_1(self):
        with pytest.raises(ValidationError):
            MatchResultItem(
                university_id="u1", program_id="p1",
                university_name="MIT", program_name="CS",
                country="US", score=1.5, breakdown={},
            )

    def test_score_negative(self):
        with pytest.raises(ValidationError):
            MatchResultItem(
                university_id="u1", program_id="p1",
                university_name="MIT", program_name="CS",
                country="US", score=-0.1, breakdown={},
            )


# ─── MatchSettingsUpdate ─────────────────────────────────────────────────────

class TestMatchSettingsUpdate:
    def test_valid_weights_sum_to_1(self):
        m = MatchSettingsUpdate(
            weight_ranking=0.3,
            weight_cost_efficiency=0.4,
            weight_bd_acceptance=0.3,
        )
        assert m.weight_ranking == 0.3

    def test_weights_dont_sum_to_1(self):
        with pytest.raises(ValidationError, match="sum to 1.0"):
            MatchSettingsUpdate(
                weight_ranking=0.5,
                weight_cost_efficiency=0.5,
                weight_bd_acceptance=0.5,
            )

    def test_partial_weights_ok(self):
        # Partial updates don't trigger sum validation
        m = MatchSettingsUpdate(weight_ranking=0.5)
        assert m.weight_ranking == 0.5

    def test_all_none_ok(self):
        m = MatchSettingsUpdate()
        assert m.weight_ranking is None


# ─── ApplicationStatusUpdate ─────────────────────────────────────────────────

class TestApplicationStatusUpdate:
    def test_valid_status(self):
        s = ApplicationStatusUpdate(status="applied")
        assert s.status == "applied"

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            ApplicationStatusUpdate(status="random_status")


# ─── STATUS_TRANSITIONS ─────────────────────────────────────────────────────

class TestStatusTransitions:
    def test_lead_can_go_to_pre_evaluation(self):
        assert "pre_evaluation" in STATUS_TRANSITIONS["lead"]

    def test_enrolled_is_terminal(self):
        assert STATUS_TRANSITIONS["enrolled"] == []

    def test_rejected_is_terminal(self):
        assert STATUS_TRANSITIONS["rejected"] == []

    def test_withdrawn_is_terminal(self):
        assert STATUS_TRANSITIONS["withdrawn"] == []

    def test_all_statuses_have_transitions(self):
        expected = {
            "lead", "pre_evaluation", "docs_collection", "applied",
            "offer_received", "conditional_offer", "visa_stage",
            "enrolled", "rejected", "withdrawn",
        }
        assert set(STATUS_TRANSITIONS.keys()) == expected

    def test_withdrawn_reachable_from_non_terminal(self):
        for status, transitions in STATUS_TRANSITIONS.items():
            if transitions:  # non-terminal
                assert "withdrawn" in transitions, f"{status} should allow withdrawal"


# ─── ReviewCreate ─────────────────────────────────────────────────────────────

class TestReviewCreate:
    def test_valid(self):
        r = ReviewCreate(agency_id="a1", rating=5)
        assert r.rating == 5

    def test_rating_out_of_range(self):
        with pytest.raises(ValidationError):
            ReviewCreate(agency_id="a1", rating=0)
        with pytest.raises(ValidationError):
            ReviewCreate(agency_id="a1", rating=6)


# ─── ConsultantCreate ────────────────────────────────────────────────────────

class TestConsultantCreate:
    def test_valid(self):
        c = ConsultantCreate(full_name="John Doe", agency_id="a1")
        assert c.role == "staff"

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            ConsultantCreate(full_name="J", agency_id="a1")
