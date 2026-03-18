"""
Shortlist API — students and consultants bookmark universities.

Student endpoints  (JWT required, resolves own student profile):
  GET    /shortlist                         — list saved universities
  POST   /shortlist                         — add university
  DELETE /shortlist/{university_id}         — remove university
  GET    /shortlist/check/{university_id}   — {"saved": bool}

Consultant endpoints (JWT required, agency-scoped):
  GET    /students/{student_id}/shortlist                    — view student's shortlist
  POST   /students/{student_id}/shortlist                    — add for student
  DELETE /students/{student_id}/shortlist/{university_id}    — remove for student
"""

from fastapi import APIRouter, Depends, HTTPException
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


# ─── helpers ──────────────────────────────────────────────────────────────────

async def _get_student_id(user: dict, client: AsyncClient) -> str:
    res = await client.table("students").select("id").eq("user_id", user["sub"]).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return res.data["id"]


async def _get_consultant_student_ids(user: dict, client: AsyncClient) -> list[str]:
    """Return student_ids that belong to the same agency as the caller consultant."""
    c_res = await client.table("consultants").select("agency_id").eq("user_id", user["sub"]).single().execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    agency_id = c_res.data["agency_id"]

    a_res = await (
        client.table("applications")
        .select("student_id")
        .eq("agency_id", agency_id)
        .execute()
    )
    return [row["student_id"] for row in (a_res.data or [])]


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
    try:
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
    except Exception as exc:
        if "duplicate" in str(exc).lower() or "unique" in str(exc).lower():
            raise HTTPException(status_code=409, detail="Already in shortlist")
        raise
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
    try:
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
    except Exception as exc:
        if "duplicate" in str(exc).lower() or "unique" in str(exc).lower():
            raise HTTPException(status_code=409, detail="Already in shortlist")
        raise
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
