"""
Consultant scheduling: availability slots + student booking.

Consultant endpoints:
  GET    /scheduling/availability         — list own availability
  POST   /scheduling/availability         — add a slot
  DELETE /scheduling/availability/{id}    — remove a slot
  GET    /scheduling/bookings             — list own bookings

Student endpoints:
  GET    /scheduling/consultant/{id}/slots — view consultant's availability
  POST   /scheduling/book                  — book a slot
  PATCH  /scheduling/bookings/{id}/cancel  — cancel a booking
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client

router = APIRouter(prefix="/scheduling", tags=["scheduling"])


class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str


class BookingCreate(BaseModel):
    consultant_id: str
    scheduled_at: str
    duration_minutes: int = 30
    notes: Optional[str] = None


async def _get_consultant_id(client: AsyncClient, user_id: str) -> str:
    res = await client.table("consultants").select("id").eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    return res.data[0]["id"]


async def _get_student_id(client: AsyncClient, user_id: str) -> str:
    res = await client.table("students").select("id").eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return res.data[0]["id"]


# ─── Consultant endpoints ─────────────────────────────────────────────────────

@router.get("/availability")
async def list_availability(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    consultant_id = await _get_consultant_id(client, user["sub"])
    res = await (
        client.table("consultant_availability")
        .select("*")
        .eq("consultant_id", consultant_id)
        .eq("is_active", True)
        .order("day_of_week")
        .order("start_time")
        .execute()
    )
    return res.data or []


@router.post("/availability", status_code=201)
async def add_availability(
    body: AvailabilityCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    consultant_id = await _get_consultant_id(client, user["sub"])
    if not (0 <= body.day_of_week <= 6):
        raise HTTPException(status_code=400, detail="day_of_week must be 0-6")

    res = await (
        client.table("consultant_availability")
        .insert({
            "consultant_id": consultant_id,
            "day_of_week": body.day_of_week,
            "start_time": body.start_time,
            "end_time": body.end_time,
        })
        .execute()
    )
    return res.data[0] if res.data else {"ok": True}


@router.delete("/availability/{slot_id}", status_code=204)
async def remove_availability(
    slot_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    consultant_id = await _get_consultant_id(client, user["sub"])
    await (
        client.table("consultant_availability")
        .update({"is_active": False})
        .eq("id", slot_id)
        .eq("consultant_id", consultant_id)
        .execute()
    )


@router.get("/bookings")
async def list_bookings(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
    role: str = Query("consultant"),
):
    if role == "consultant":
        consultant_id = await _get_consultant_id(client, user["sub"])
        res = await (
            client.table("bookings")
            .select("*, students(full_name, email)")
            .eq("consultant_id", consultant_id)
            .order("scheduled_at", desc=True)
            .limit(50)
            .execute()
        )
    else:
        student_id = await _get_student_id(client, user["sub"])
        res = await (
            client.table("bookings")
            .select("*, consultants(full_name)")
            .eq("student_id", student_id)
            .order("scheduled_at", desc=True)
            .limit(50)
            .execute()
        )
    return res.data or []


# ─── Student endpoints ────────────────────────────────────────────────────────

@router.get("/consultant/{consultant_id}/slots")
async def get_consultant_slots(
    consultant_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    res = await (
        client.table("consultant_availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("consultant_id", consultant_id)
        .eq("is_active", True)
        .order("day_of_week")
        .order("start_time")
        .execute()
    )
    return res.data or []


@router.post("/book", status_code=201)
async def book_slot(
    body: BookingCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(client, user["sub"])

    scheduled = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
    if scheduled < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book in the past")

    # Check for conflicts
    conflict = await (
        client.table("bookings")
        .select("id")
        .eq("consultant_id", body.consultant_id)
        .eq("status", "confirmed")
        .eq("scheduled_at", body.scheduled_at)
        .limit(1)
        .execute()
    )
    if conflict.data:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    res = await (
        client.table("bookings")
        .insert({
            "consultant_id": body.consultant_id,
            "student_id": student_id,
            "scheduled_at": body.scheduled_at,
            "duration_minutes": body.duration_minutes,
            "notes": body.notes,
        })
        .execute()
    )
    return res.data[0] if res.data else {"ok": True}


@router.patch("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    # Allow both student and consultant to cancel
    res = await (
        client.table("bookings")
        .update({"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", booking_id)
        .eq("status", "confirmed")
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Booking not found or already cancelled")
    return {"ok": True}
