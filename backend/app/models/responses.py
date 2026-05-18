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
