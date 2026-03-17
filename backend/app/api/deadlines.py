"""
GET /deadlines — upcoming program application deadlines from the student's match results
"""
from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient
from datetime import date

from app.core.security import get_current_user
from app.db.client import get_client
from app.db.queries import get_student_by_user_id

router = APIRouter(prefix="/deadlines", tags=["deadlines"])


@router.get("", response_model=list[dict])
async def get_upcoming_deadlines(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """
    Return upcoming program deadlines from the student's cached match results,
    sorted by deadline date ascending. Only returns future deadlines.
    """
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Get cached match results
    cache_res = await (
        client.table("match_cache")
        .select("match_results")
        .eq("student_id", student["id"])
        .single()
        .execute()
    )

    if not cache_res.data:
        return []

    match_results: list[dict] = cache_res.data.get("match_results") or []
    if not match_results:
        return []

    # Collect program IDs from match cache
    program_ids = [
        r["program_id"] for r in match_results if r.get("program_id")
    ]
    if not program_ids:
        return []

    today = date.today().isoformat()
    prog_res = await (
        client.table("programs")
        .select("id, name, degree_level, field, application_deadline, universities(id, name, country, logo_url)")
        .in_("id", program_ids)
        .gte("application_deadline", today)
        .order("application_deadline", desc=False)
        .limit(20)
        .execute()
    )

    return prog_res.data or []
