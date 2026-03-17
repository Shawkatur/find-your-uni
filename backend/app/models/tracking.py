from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field


class TrackingLinkCreate(BaseModel):
    name: str | None = Field(None, max_length=100)


class TrackingLinkOut(BaseModel):
    id: str
    consultant_id: str
    agency_id: str
    code: str
    name: str | None
    clicks: int
    created_at: datetime


class IntakeInfo(BaseModel):
    code: str
    consultant_name: str | None
    agency_name: str | None
    is_admin: bool
