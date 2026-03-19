"""
POST /match           — run full 3-layer matchmaking for authenticated student
GET  /match/results   — return cached results (fast)
DELETE /match/cache   — invalidate cache (e.g., after profile update)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import AsyncClient

from app.core.config import get_settings
from app.core.limiter import limiter
from app.core.security import get_current_user, get_current_student_dep
from app.db.client import get_client
from app.db.queries import get_match_cache
from app.models.university import MatchResultItem
from app.services.matchmaking import run_matchmaking

router = APIRouter(prefix="/match", tags=["match"])
get_student = get_current_student_dep()


@router.post("", response_model=list[MatchResultItem])
@limiter.limit(get_settings().MATCH_RATE_LIMIT)
async def run_match(
    request: Request,
    run_ai: bool = True,
    student: dict = Depends(get_student),
    client: AsyncClient = Depends(get_client),
):
    """
    Run full matchmaking (filter → score → AI) for the authenticated student.
    Results are cached in match_cache; re-running overwrites the cache.
    """
    results = await run_matchmaking(client, student, run_ai=run_ai)
    return results


@router.get("/results", response_model=list[MatchResultItem])
async def get_results(
    student: dict = Depends(get_student),
    client: AsyncClient = Depends(get_client),
):
    """Return cached match results. Returns 404 if match has not been run yet."""
    cache = await get_match_cache(client, student["id"])
    if not cache:
        raise HTTPException(status_code=404, detail="No match results yet. POST /match to run matching.")

    return cache["match_results"]


@router.delete("/cache", status_code=204)
async def invalidate_cache(
    student: dict = Depends(get_student),
    client: AsyncClient = Depends(get_client),
):
    """Invalidate the match cache for the authenticated student."""
    await client.table("match_cache").delete().eq("student_id", student["id"]).execute()
