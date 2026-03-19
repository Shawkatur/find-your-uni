"""
GET  /scholarships              — paginated list with filters
GET  /scholarships/{id}         — scholarship detail
POST /scholarships/{id}/save    — bookmark (student auth)
DELETE /scholarships/{id}/save  — remove bookmark
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client
from app.db.queries import get_student_by_user_id

router = APIRouter(prefix="/scholarships", tags=["scholarships"])


@router.get("", response_model=list[dict])
async def list_scholarships(
    country: str | None = None,
    degree: str | None = None,
    field: str | None = None,
    bd_eligible: bool | None = None,
    fully_funded: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    client: AsyncClient = Depends(get_client),
):
    offset = (page - 1) * page_size
    query = client.table("scholarships").select("*").eq("is_active", True)

    if country:
        query = query.eq("country", country.upper())
    if bd_eligible is not None:
        query = query.eq("bd_eligible", bd_eligible)
    if fully_funded is not None:
        query = query.eq("is_fully_funded", fully_funded)
    # degree and field are array columns — use contains filter
    if degree:
        query = query.contains("degree_levels", [degree])
    if field:
        query = query.contains("fields", [field])

    res = await (
        query
        .order("deadline", desc=False, nullsfirst=False)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return res.data or []


@router.get("/{scholarship_id}", response_model=dict)
async def get_scholarship(
    scholarship_id: str,
    client: AsyncClient = Depends(get_client),
):
    res = await (
        client.table("scholarships")
        .select("*")
        .eq("id", scholarship_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return res.data


@router.post("/{scholarship_id}/save", status_code=204)
async def save_scholarship(
    scholarship_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    await (
        client.table("student_scholarship_saves")
        .upsert(
            {"student_id": student["id"], "scholarship_id": scholarship_id},
            on_conflict="student_id,scholarship_id",
        )
        .execute()
    )


@router.delete("/{scholarship_id}/save", status_code=204)
async def unsave_scholarship(
    scholarship_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        return

    await (
        client.table("student_scholarship_saves")
        .delete()
        .eq("student_id", student["id"])
        .eq("scholarship_id", scholarship_id)
        .execute()
    )


@router.get("/saved/me", response_model=list[dict])
async def get_saved_scholarships(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Return all scholarships bookmarked by the authenticated student."""
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    res = await (
        client.table("student_scholarship_saves")
        .select("scholarships(*)")
        .eq("student_id", student["id"])
        .execute()
    )
    return [row["scholarships"] for row in (res.data or []) if row.get("scholarships")]
