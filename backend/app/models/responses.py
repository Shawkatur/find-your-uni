"""
Pydantic response models for API endpoints that previously returned raw dicts.
"""
from __future__ import annotations
from datetime import date, datetime
from pydantic import BaseModel


# ─── Generic ─────────────────────────────────────────────────────────────────

class OkResponse(BaseModel):
    ok: bool = True


class CountResponse(BaseModel):
    count: int


# ─── Notifications ───────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    title: str
    body: str | None = None
    type: str
    is_read: bool
    data: dict = {}
    created_at: datetime


# ─── Tasks ───────────────────────────────────────────────────────────────────

class TaskOut(BaseModel):
    id: str
    application_id: str
    student_id: str
    title: str
    description: str | None = None
    due_date: date | None = None
    is_completed: bool = False
    completed_at: datetime | None = None
    created_by: str = "student"
    created_at: datetime
    updated_at: datetime


# ─── Scheduling ──────────────────────────────────────────────────────────────

class AvailabilityOut(BaseModel):
    id: str
    consultant_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool = True
    created_at: datetime


class BookingOut(BaseModel):
    id: str
    consultant_id: str
    student_id: str
    scheduled_at: datetime
    duration_minutes: int = 30
    status: str = "confirmed"
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# ─── Messages ────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    student_id: str
    consultant_id: str
    sender_role: str
    body: str
    created_at: datetime


class ChatMessageOut(BaseModel):
    """Message record as stored in the messages table."""
    id: str
    student_id: str
    consultant_id: str
    sender_type: str
    content: str
    is_read: bool = False
    created_at: datetime


# ─── Payments ────────────────────────────────────────────────────────────────

class PaymentInitiateResponse(BaseModel):
    payment_id: str
    payment_url: str


class PaymentVerifyResponse(BaseModel):
    payment_id: str
    status: str


# ─── Documents ───────────────────────────────────────────────────────────────

class DocumentListOut(BaseModel):
    """Document record with verification info and signed URL."""
    id: str
    student_id: str
    doc_type: str
    storage_url: str
    application_id: str | None = None
    uploaded_at: datetime
    verification_status: str | None = None
    rejection_reason: str | None = None
    url: str | None = None
    filename: str | None = None


class DocumentVerificationQueueOut(BaseModel):
    """Document in the verification queue with student name."""
    id: str
    student_id: str
    doc_type: str
    storage_url: str
    uploaded_at: datetime
    verification_status: str | None = None
    rejection_reason: str | None = None
    url: str | None = None
    filename: str | None = None
    student_name: str | None = None


class DocumentVerifyOut(BaseModel):
    """Document after verification update."""
    id: str
    student_id: str
    doc_type: str
    storage_url: str
    application_id: str | None = None
    uploaded_at: datetime
    verification_status: str | None = None
    rejection_reason: str | None = None
    verified_by: str | None = None
    verified_at: datetime | None = None


# ─── Consultants (public listing) ────────────────────────────────────────────

class ConsultantListOut(BaseModel):
    """Public consultant listing with embedded agency summary."""
    id: str
    full_name: str
    role_title: str | None = None
    agency_id: str
    agencies: dict | None = None


class ConsultantDetailOut(BaseModel):
    """Consultant detail with agency info."""
    id: str
    full_name: str
    role_title: str | None = None
    agency_id: str
    status: str = "active"
    agencies: dict | None = None


# ─── Shortlist ───────────────────────────────────────────────────────────────

class ShortlistCheckResponse(BaseModel):
    shortlisted: bool
    item_id: str | None = None


class ShortlistSavedResponse(BaseModel):
    saved: bool


class ShortlistUniversityOut(BaseModel):
    """Embedded university snapshot inside a shortlist item."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    tuition_usd_per_year: int | None = None
    scholarships_available: bool | None = None
    max_scholarship_pct: int | None = None
    min_ielts: float | None = None
    min_gpa_percentage: int | None = None
    acceptance_rate_bd: float | None = None
    website: str | None = None


class ShortlistItemOut(BaseModel):
    """A single shortlist entry with its embedded university."""
    id: str
    university_id: str
    added_by_role: str
    note: str | None = None
    added_at: str
    tuition_fee: float | None = None
    currency: str | None = None
    living_expense: float | None = None
    is_manual_entry: bool = False
    program_name: str | None = None
    university: ShortlistUniversityOut | None = None


class ShortlistAddResponse(BaseModel):
    """Raw row returned after inserting into student_university_shortlist."""
    id: str
    student_id: str
    university_id: str
    added_by_role: str
    note: str | None = None
    added_at: str | None = None
    tuition_fee: float | None = None
    currency: str | None = None
    living_expense: float | None = None
    is_manual_entry: bool = False
    program_name: str | None = None


# ─── Recommendations ────────────────────────────────────────────────────────

class RecommendationUniversityOut(BaseModel):
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None


class RecommendationProgramOut(BaseModel):
    id: str
    name: str
    degree_level: str | None = None
    field: str | None = None
    tuition_usd_per_year: int | None = None
    universities: RecommendationUniversityOut | None = None


class RecommendationConsultantOut(BaseModel):
    full_name: str


class RecommendationOut(BaseModel):
    """A consultant recommendation with nested program/consultant info."""
    id: str
    student_id: str
    consultant_id: str
    program_id: str
    notes: str | None = None
    status: str = "pending"
    reviewed_at: str | None = None
    created_at: str
    programs: RecommendationProgramOut | None = None
    consultants: RecommendationConsultantOut | None = None


class RecommendationAddResponse(BaseModel):
    """Raw row returned after inserting a recommendation."""
    id: str
    student_id: str
    consultant_id: str
    program_id: str
    notes: str | None = None
    status: str = "pending"
    reviewed_at: str | None = None
    created_at: str | None = None


class RecommendationReviewResponse(BaseModel):
    """Returned after a student approves/rejects a recommendation."""
    id: str
    status: str
    reviewed_at: str
    application_id: str | None = None


# ─── Consultant info (messages) ─────────────────────────────────────────────

class ConsultantInfoDetail(BaseModel):
    """Consultant contact fields returned by /messages/consultant-info."""
    id: str
    full_name: str
    phone: str | None = None
    role_title: str | None = None
    whatsapp: str | None = None


class ConsultantInfoResponse(BaseModel):
    """Response for GET /messages/consultant-info."""
    assigned: bool
    consultant: ConsultantInfoDetail | None = None


# ─── Universities ────────────────────────────────────────────────────────────

class ProgramSummaryOut(BaseModel):
    """Program summary embedded in university list/detail responses."""
    id: str
    name: str
    degree_level: str | None = None
    field: str | None = None
    tuition_usd_per_year: int | None = None
    is_active: bool | None = None
    university_id: str | None = None
    duration_years: float | None = None
    min_requirements: dict | None = None
    application_deadline: str | None = None
    intake_months: list[int] | None = None


class UniversityListItem(BaseModel):
    """Single university in the paginated list response."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    ranking_the: int | None = None
    tuition_usd_per_year: int | None = None
    acceptance_rate_overall: float | None = None
    acceptance_rate_bd: float | None = None
    min_ielts: float | None = None
    min_toefl: int | None = None
    min_gpa_percentage: int | None = None
    scholarships_available: bool | None = None
    max_scholarship_pct: int | None = None
    website: str | None = None
    data_source: str | None = None
    last_updated: str | None = None
    created_at: str | None = None
    intl_student_pct: float | None = None
    bd_students_known: int | None = None
    logo_url: str | None = None
    description: str | None = None
    programs: list[ProgramSummaryOut] = []


class UniversityListResponse(BaseModel):
    """Paginated university listing."""
    items: list[UniversityListItem] = []
    total: int = 0


class UniversityDetailResponse(BaseModel):
    """Full university detail with all programs."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    ranking_the: int | None = None
    tuition_usd_per_year: int | None = None
    acceptance_rate_overall: float | None = None
    acceptance_rate_bd: float | None = None
    min_ielts: float | None = None
    min_toefl: int | None = None
    min_gpa_percentage: int | None = None
    scholarships_available: bool | None = None
    max_scholarship_pct: int | None = None
    website: str | None = None
    data_source: str | None = None
    last_updated: str | None = None
    created_at: str | None = None
    intl_student_pct: float | None = None
    bd_students_known: int | None = None
    logo_url: str | None = None
    description: str | None = None
    programs: list[ProgramSummaryOut] = []


class UniversityCreateResponse(BaseModel):
    """Row returned after creating a university."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    ranking_the: int | None = None
    tuition_usd_per_year: int | None = None
    scholarships_available: bool = False
    max_scholarship_pct: int | None = None
    website: str | None = None
    data_source: str | None = None
    created_at: str | None = None


class UniversityUpdateResponse(BaseModel):
    """Row returned after updating a university."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    ranking_the: int | None = None
    tuition_usd_per_year: int | None = None
    acceptance_rate_overall: float | None = None
    acceptance_rate_bd: float | None = None
    min_ielts: float | None = None
    min_toefl: int | None = None
    min_gpa_percentage: int | None = None
    scholarships_available: bool | None = None
    max_scholarship_pct: int | None = None
    website: str | None = None
    data_source: str | None = None
    last_updated: str | None = None
    logo_url: str | None = None
    description: str | None = None


class UniversityFeaturedOut(BaseModel):
    """University shown on the featured/home screen."""
    id: str
    name: str
    country: str
    city: str | None = None
    ranking_qs: int | None = None
    tuition_usd_per_year: int | None = None
    scholarships_available: bool | None = None
    logo_url: str | None = None
    description: str | None = None
    acceptance_rate_bd: float | None = None


class UniversitySemanticOut(BaseModel):
    """Result from pgvector semantic search RPC."""
    id: str
    name: str | None = None
    country: str | None = None
    city: str | None = None
    ranking_qs: int | None = None
    tuition_usd_per_year: int | None = None
    similarity: float | None = None
