from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


AppStatus = Literal[
    "lead",
    "pre_evaluation",
    "docs_collection",
    "applied",
    "offer_received",
    "conditional_offer",
    "visa_stage",
    "enrolled",
    "rejected",
    "withdrawn",
]

# Valid transitions: key → allowed next statuses
STATUS_TRANSITIONS: dict[str, list[str]] = {
    "lead":              ["pre_evaluation", "withdrawn"],
    "pre_evaluation":    ["docs_collection", "rejected", "withdrawn"],
    "docs_collection":   ["applied", "withdrawn"],
    "applied":           ["offer_received", "conditional_offer", "rejected", "withdrawn"],
    "offer_received":    ["visa_stage", "withdrawn"],
    "conditional_offer": ["docs_collection", "offer_received", "rejected", "withdrawn"],
    "visa_stage":        ["enrolled", "rejected", "withdrawn"],
    "enrolled":          [],
    "rejected":          [],
    "withdrawn":         [],
}


class ApplicationCreate(BaseModel):
    student_id: str | None = None   # overridden from JWT in endpoint
    program_id: str | None = None   # nullable for lead-stage applications
    consultant_id: str | None = None
    agency_id: str | None = None
    notes: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: AppStatus
    note: str | None = None


class StatusHistoryEntry(BaseModel):
    status: str
    changed_by: str
    changed_at: datetime
    note: str | None


class ApplicationOut(BaseModel):
    id: str
    student_id: str
    program_id: str | None
    consultant_id: str | None
    agency_id: str | None
    status: str
    status_history: list[dict]
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ReviewCreate(BaseModel):
    agency_id: str
    consultant_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewOut(BaseModel):
    id: str
    student_id: str
    agency_id: str
    consultant_id: str | None
    rating: int
    comment: str | None
    is_verified: bool
    created_at: datetime


class ConsultantCreate(BaseModel):
    agency_id: str | None = None
    agency_name: str | None = Field(None, min_length=2, max_length=200)
    role: Literal["staff"] = "staff"  # agency-level admin role set by platform admins only
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = None
    role_title: str | None = None


class AgencyOut(BaseModel):
    id: str
    name: str
    license_no: str | None
    address: str | None
    city: str | None = None
    website: str | None = None
    avg_rating: float
    review_count: int
    is_active: bool
    created_at: datetime


class ConsultantOut(BaseModel):
    id: str
    user_id: str
    agency_id: str
    role: str
    full_name: str
    status: str = "pending"
    created_at: datetime


class ConsultantStatusUpdate(BaseModel):
    status: Literal["pending", "active", "banned"]


class ReassignBody(BaseModel):
    consultant_id: str
    agency_id: str
    note: str | None = None


class ForwardBody(BaseModel):
    consultant_id: str
    note: str | None = None


class MatchSettingsUpdate(BaseModel):
    weight_ranking: float | None = Field(None, ge=0, le=1)
    weight_cost_efficiency: float | None = Field(None, ge=0, le=1)
    weight_bd_acceptance: float | None = Field(None, ge=0, le=1)
    ai_top_n: int | None = Field(None, ge=1, le=20)
    filter_budget_buffer: float | None = Field(None, ge=0, le=1)


class AgencyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    license_no: str | None = None
    address: str | None = None
    city: str | None = None
    website: str | None = None


class AgencyUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    license_no: str | None = None
    address: str | None = None
    city: str | None = None
    website: str | None = None
    is_active: bool | None = None


class AdminAuditLog(BaseModel):
    id: str
    admin_user_id: str
    action: str
    resource_type: str
    resource_id: str | None
    old_value: dict | None
    new_value: dict | None
    created_at: datetime
