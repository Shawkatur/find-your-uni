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


# ─── Shortlist ───────────────────────────────────────────────────────────────

class ShortlistCheckResponse(BaseModel):
    shortlisted: bool
    item_id: str | None = None
