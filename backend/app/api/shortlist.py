"""
Shortlist API — students and consultants bookmark universities.
Recommendations API — consultants propose programs; students approve/reject.

Student endpoints  (JWT required, resolves own student profile):
  GET    /shortlist                         — list saved universities
  POST   /shortlist                         — add university
  DELETE /shortlist/{university_id}         — remove university
  GET    /shortlist/check/{university_id}   — {"saved": bool}
  GET    /recommendations                   — list program recommendations
  PATCH  /recommendations/{id}/review       — approve or reject a recommendation

Consultant endpoints (JWT required, agency-scoped):
  GET    /students/{student_id}/shortlist                    — view student's shortlist
  POST   /students/{student_id}/shortlist                    — add for student
  DELETE /students/{student_id}/shortlist/{university_id}    — remove for student
  GET    /students/{student_id}/recommendations              — list recommendations
  POST   /students/{student_id}/recommendations              — recommend a program
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client

router = APIRouter(tags=["shortlist"])

_UNI_FIELDS = (
    "id, name, country, city, ranking_qs, tuition_usd_per_year, "
    "scholarships_available, max_scholarship_pct, min_ielts, "
    "min_gpa_percentage, acceptance_rate_bd, website"
)


class ShortlistAdd(BaseModel):
    university_id: str
    note: str | None = None


class RecommendationAdd(BaseModel):
    program_id: str
    notes: str | None = None


class RecommendationReview(BaseModel):
    status: Literal["approved", "rejected"]


# ─── helpers ──────────────────────────────────────────────────────────────────

async def _get_student_id(user: dict, client: AsyncClient) -> str:
    res = await client.table("students").select("id").eq("user_id", user["sub"]).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return res.data[0]["id"]


async def _get_consultant_student_ids(user: dict, client: AsyncClient) -> list[str]:
    """Return student_ids that belong to the same agency as the caller consultant."""
    c_res = await client.table("consultants").select("agency_id").eq("user_id", user["sub"]).limit(1).execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    agency_id = c_res.data[0]["agency_id"]

    a_res = await (
        client.table("applications")
        .select("student_id")
        .eq("agency_id", agency_id)
        .execute()
    )
    return [row["student_id"] for row in (a_res.data or [])]


async def _get_consultant_info(user: dict, client: AsyncClient) -> dict:
    """Return the consultant row {id, agency_id} for the authenticated user."""
    res = await client.table("consultants").select("id, agency_id").eq("user_id", user["sub"]).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    return res.data[0]


_REC_SELECT = (
    "id, student_id, consultant_id, program_id, notes, status, reviewed_at, created_at, "
    "programs(id, name, degree_level, field, tuition_usd_per_year, "
    "universities(id, name, country, city, ranking_qs)), "
    "consultants(full_name)"
)


async def _fetch_shortlist(student_id: str, client: AsyncClient) -> list[dict]:
    res = await (
        client.table("student_university_shortlist")
        .select(f"id, university_id, added_by_role, note, added_at, universities({_UNI_FIELDS})")
        .eq("student_id", student_id)
        .order("added_at", desc=True)
        .execute()
    )
    items = []
    for row in (res.data or []):
        items.append({
            "id": row["id"],
            "university_id": row["university_id"],
            "added_by_role": row["added_by_role"],
            "note": row["note"],
            "added_at": row["added_at"],
            "university": row.get("universities"),
        })
    return items


# ─── Student endpoints ────────────────────────────────────────────────────────

@router.get("/shortlist", response_model=list[dict])
async def get_shortlist(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    return await _fetch_shortlist(student_id, client)


@router.get("/shortlist/check/{university_id}", response_model=dict)
async def check_shortlist(
    university_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    res = await (
        client.table("student_university_shortlist")
        .select("id")
        .eq("student_id", student_id)
        .eq("university_id", university_id)
        .execute()
    )
    return {"saved": bool(res.data)}


@router.post("/shortlist", response_model=dict, status_code=201)
async def add_to_shortlist(
    body: ShortlistAdd,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    # Check if already shortlisted
    existing = await (
        client.table("student_university_shortlist")
        .select("id")
        .eq("student_id", student_id)
        .eq("university_id", body.university_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already in shortlist")
    res = await (
        client.table("student_university_shortlist")
        .insert({
            "student_id": student_id,
            "university_id": body.university_id,
            "added_by_role": "student",
            "note": body.note,
        })
        .execute()
    )
    return res.data[0]


@router.delete("/shortlist/{university_id}", status_code=204)
async def remove_from_shortlist(
    university_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    await (
        client.table("student_university_shortlist")
        .delete()
        .eq("student_id", student_id)
        .eq("university_id", university_id)
        .execute()
    )


# ─── Consultant endpoints ─────────────────────────────────────────────────────

@router.get("/students/{student_id}/shortlist", response_model=list[dict])
async def consultant_get_shortlist(
    student_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    allowed = await _get_consultant_student_ids(user, client)
    if student_id not in allowed:
        raise HTTPException(status_code=403, detail="Student not in your agency")
    return await _fetch_shortlist(student_id, client)


@router.post("/students/{student_id}/shortlist", response_model=dict, status_code=201)
async def consultant_add_shortlist(
    student_id: str,
    body: ShortlistAdd,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    allowed = await _get_consultant_student_ids(user, client)
    if student_id not in allowed:
        raise HTTPException(status_code=403, detail="Student not in your agency")
    # Check if already shortlisted
    existing = await (
        client.table("student_university_shortlist")
        .select("id")
        .eq("student_id", student_id)
        .eq("university_id", body.university_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already in shortlist")
    res = await (
        client.table("student_university_shortlist")
        .insert({
            "student_id": student_id,
            "university_id": body.university_id,
            "added_by_role": "consultant",
            "note": body.note,
        })
        .execute()
    )
    return res.data[0]


@router.delete("/students/{student_id}/shortlist/{university_id}", status_code=204)
async def consultant_remove_shortlist(
    student_id: str,
    university_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    allowed = await _get_consultant_student_ids(user, client)
    if student_id not in allowed:
        raise HTTPException(status_code=403, detail="Student not in your agency")
    await (
        client.table("student_university_shortlist")
        .delete()
        .eq("student_id", student_id)
        .eq("university_id", university_id)
        .execute()
    )


# ─── Consultant recommendation endpoints ────────────────────────────────────


@router.get("/students/{student_id}/recommendations", response_model=list[dict])
async def consultant_get_recommendations(
    student_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    allowed = await _get_consultant_student_ids(user, client)
    if student_id not in allowed:
        raise HTTPException(status_code=403, detail="Student not in your agency")
    res = await (
        client.table("consultant_recommendations")
        .select(_REC_SELECT)
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/students/{student_id}/recommendations", response_model=dict, status_code=201)
async def consultant_add_recommendation(
    student_id: str,
    body: RecommendationAdd,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    allowed = await _get_consultant_student_ids(user, client)
    if student_id not in allowed:
        raise HTTPException(status_code=403, detail="Student not in your agency")

    consultant = await _get_consultant_info(user, client)

    prog = await (
        client.table("programs").select("id, is_active").eq("id", body.program_id).limit(1).execute()
    )
    if not prog.data:
        raise HTTPException(status_code=404, detail="Program not found")
    if not prog.data[0].get("is_active", True):
        raise HTTPException(status_code=422, detail="Program is no longer active")

    existing = await (
        client.table("consultant_recommendations")
        .select("id")
        .eq("student_id", student_id)
        .eq("program_id", body.program_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="This program has already been recommended to this student")

    res = await (
        client.table("consultant_recommendations")
        .insert({
            "student_id": student_id,
            "consultant_id": consultant["id"],
            "program_id": body.program_id,
            "notes": body.notes,
        })
        .execute()
    )
    return res.data[0]


# ─── Student recommendation endpoints ───────────────────────────────────────


@router.get("/recommendations", response_model=list[dict])
async def student_get_recommendations(
    status: str | None = Query(None),
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    query = (
        client.table("consultant_recommendations")
        .select(_REC_SELECT)
        .eq("student_id", student_id)
    )
    if status:
        query = query.eq("status", status)
    res = await query.order("created_at", desc=True).execute()
    return res.data or []


@router.patch("/recommendations/{rec_id}/review", response_model=dict)
async def student_review_recommendation(
    rec_id: str,
    body: RecommendationReview,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)

    rec_res = await (
        client.table("consultant_recommendations")
        .select("id, student_id, consultant_id, program_id, status")
        .eq("id", rec_id)
        .limit(1)
        .execute()
    )
    if not rec_res.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec = rec_res.data[0]

    if rec["student_id"] != student_id:
        raise HTTPException(status_code=403, detail="Not your recommendation")
    if rec["status"] != "pending":
        raise HTTPException(status_code=422, detail="Already reviewed")

    now = datetime.now(timezone.utc).isoformat()
    await (
        client.table("consultant_recommendations")
        .update({"status": body.status, "reviewed_at": now})
        .eq("id", rec_id)
        .execute()
    )

    application_id = None
    if body.status == "approved":
        dup = await (
            client.table("applications")
            .select("id")
            .eq("student_id", student_id)
            .eq("program_id", rec["program_id"])
            .limit(1)
            .execute()
        )
        if not dup.data:
            c_res = await (
                client.table("consultants")
                .select("agency_id")
                .eq("id", rec["consultant_id"])
                .limit(1)
                .execute()
            )
            agency_id = c_res.data[0]["agency_id"] if c_res.data else None

            app_res = await (
                client.table("applications")
                .insert({
                    "student_id": student_id,
                    "program_id": rec["program_id"],
                    "consultant_id": rec["consultant_id"],
                    "agency_id": agency_id,
                    "status": "lead",
                    "assigned_source": "recommendation",
                    "status_history": [{
                        "status": "lead",
                        "changed_by": user["sub"],
                        "changed_at": now,
                        "note": "Created from approved recommendation",
                    }],
                })
                .execute()
            )
            application_id = app_res.data[0]["id"] if app_res.data else None
        else:
            application_id = dup.data[0]["id"]

    return {
        "id": rec_id,
        "status": body.status,
        "reviewed_at": now,
        "application_id": application_id,
    }
