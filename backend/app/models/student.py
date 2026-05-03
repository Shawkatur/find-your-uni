from __future__ import annotations
from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, Field, field_validator


DegreeLevel = Literal["bachelor", "master", "phd", "diploma"]
PipelineStatus = Literal["invited", "onboarding", "gathering_docs", "ready_to_apply", "applied", "enrolled"]
Gender = Literal["male", "female", "other"]


class AcademicHistory(BaseModel):
    ssc_gpa: float | None = None
    ssc_board: str | None = None
    ssc_institution: str | None = None
    ssc_year: int | None = None
    ssc_grading_system: str | None = None

    hsc_gpa: float | None = None
    hsc_board: str | None = None
    hsc_institution: str | None = None
    hsc_year: int | None = None
    hsc_grading_system: str | None = None

    bachelor_cgpa: float | None = None
    bachelor_institution: str | None = None
    bachelor_subject: str | None = None
    bachelor_year: int | None = None
    bachelor_grading_system: str | None = None

    postgrad_gpa: float | None = None
    postgrad_institution: str | None = None
    postgrad_field: str | None = None
    postgrad_year: int | None = None
    postgrad_grading_system: str | None = None

    gpa_percentage: int | None = Field(None, ge=0, le=100)


class TestScores(BaseModel):
    ielts: float | None = Field(None, ge=0, le=9)
    ielts_listening: float | None = Field(None, ge=0, le=9)
    ielts_reading: float | None = Field(None, ge=0, le=9)
    ielts_writing: float | None = Field(None, ge=0, le=9)
    ielts_speaking: float | None = Field(None, ge=0, le=9)
    ielts_date: str | None = None
    ielts_trf: str | None = None

    toefl: int | None = Field(None, ge=0, le=120)
    toefl_date: str | None = None

    pte: int | None = Field(None, ge=10, le=90)
    pte_date: str | None = None

    duolingo: int | None = Field(None, ge=10, le=160)
    duolingo_date: str | None = None

    gre: int | None = Field(None, ge=260, le=340)
    gre_verbal: int | None = Field(None, ge=130, le=170)
    gre_quant: int | None = Field(None, ge=130, le=170)
    gre_awa: float | None = Field(None, ge=0, le=6)
    gre_date: str | None = None

    gmat: int | None = Field(None, ge=200, le=800)
    gmat_date: str | None = None

    sat: int | None = Field(None, ge=400, le=1600)
    sat_date: str | None = None


class PersonalDetails(BaseModel):
    passport_number: str | None = None
    passport_issue_date: str | None = None
    passport_expiry_date: str | None = None
    passport_issue_country: str | None = None

    address_city: str | None = None
    address_country: str | None = None
    address_postal_code: str | None = None

    emergency_name: str | None = None
    emergency_phone: str | None = None
    emergency_relation: str | None = None


class WorkExperienceItem(BaseModel):
    organization: str | None = None
    position: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    currently_working: bool = False


class StudentCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    academic_history: AcademicHistory
    test_scores: TestScores = TestScores()
    personal_details: PersonalDetails = PersonalDetails()
    work_experience: list[WorkExperienceItem] = Field(default_factory=list)
    budget_usd_per_year: int = Field(gt=0)
    preferred_countries: list[str] = Field(default_factory=list, max_length=10)
    preferred_degree: DegreeLevel | None = None
    preferred_fields: list[str] = Field(default_factory=list, max_length=10)
    ref_code: str | None = None

    @field_validator("preferred_countries")
    @classmethod
    def uppercase_countries(cls, v: list[str]) -> list[str]:
        return [c.upper() for c in v]


class StudentUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    academic_history: AcademicHistory | None = None
    test_scores: TestScores | None = None
    personal_details: PersonalDetails | None = None
    work_experience: list[WorkExperienceItem] | None = None
    budget_usd_per_year: int | None = Field(None, gt=0)
    preferred_countries: list[str] | None = None
    preferred_degree: DegreeLevel | None = None
    preferred_fields: list[str] | None = None
    push_enabled: bool | None = None
    notify_status_changes: bool | None = None
    notify_deadlines: bool | None = None
    onboarding_completed: bool | None = None


class StudentOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str | None
    nationality: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    academic_history: dict
    test_scores: dict
    personal_details: dict = {}
    work_experience: list = []
    budget_usd_per_year: int
    preferred_countries: list[str]
    preferred_degree: str | None
    preferred_fields: list[str]
    push_enabled: bool = True
    notify_status_changes: bool = True
    notify_deadlines: bool = True
    onboarding_completed: bool = False
    pipeline_status: PipelineStatus = "onboarding"
    created_at: datetime
    updated_at: datetime


class ConsultantStudentOut(BaseModel):
    """Lightweight student record for the consultant CRM roster."""
    id: str
    full_name: str
    phone: str | None = None
    email: str | None = None
    pipeline_status: PipelineStatus = "onboarding"
    preferred_countries: list[str] = []
    preferred_degree: str | None = None
    assigned_source: str | None = None
    has_rejected_docs: bool = False
    created_at: datetime
