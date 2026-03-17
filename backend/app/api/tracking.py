"""
Tracking links for consultant intake flows.

GET  /tracking-links          — list consultant's own links (requires active consultant)
POST /tracking-links          — create a tracking link
GET  /intake/info/{code}      — PUBLIC: resolve code → branding info + increment clicks
"""
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException
from supabase import AsyncClient

from app.core.security import get_active_consultant_dep
from app.db.client import get_client
from app.models.tracking import TrackingLinkCreate, TrackingLinkOut, IntakeInfo

router = APIRouter(tags=["tracking"])

_active_consultant = get_active_consultant_dep()

ADMIN_CODE = "admin"


def _generate_code(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ─── Consultant endpoints ─────────────────────────────────────────────────────

@router.get("/tracking-links", response_model=list[TrackingLinkOut])
async def list_tracking_links(
    consultant: dict = Depends(_active_consultant),
    client: AsyncClient = Depends(get_client),
):
    res = await (
        client.table("tracking_links")
        .select("*")
        .eq("consultant_id", consultant["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/tracking-links", response_model=TrackingLinkOut, status_code=201)
async def create_tracking_link(
    body: TrackingLinkCreate,
    consultant: dict = Depends(_active_consultant),
    client: AsyncClient = Depends(get_client),
):
    # Generate a unique 8-char code
    for _ in range(10):
        code = _generate_code()
        exists = await client.table("tracking_links").select("id").eq("code", code).execute()
        if not exists.data:
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique code")

    row = {
        "consultant_id": consultant["id"],
        "agency_id":     consultant["agency_id"],
        "code":          code,
        "name":          body.name,
    }
    res = await client.table("tracking_links").insert(row).execute()
    return res.data[0]


# ─── Public endpoint ──────────────────────────────────────────────────────────

@router.get("/intake/info/{code}", response_model=IntakeInfo)
async def intake_info(
    code: str,
    client: AsyncClient = Depends(get_client),
):
    """
    Resolve a tracking code to branding info.
    Reserved code 'admin' returns platform branding with is_admin=True.
    Increments click counter for valid consultant codes.
    """
    if code == ADMIN_CODE:
        return IntakeInfo(
            code=ADMIN_CODE,
            consultant_name=None,
            agency_name=None,
            is_admin=True,
        )

    res = await (
        client.table("tracking_links")
        .select("*, consultants(full_name), agencies(name)")
        .eq("code", code)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid or expired intake link")

    link = res.data[0]

    # Increment clicks (fire-and-forget — ignore errors)
    try:
        await (
            client.table("tracking_links")
            .update({"clicks": link["clicks"] + 1})
            .eq("id", link["id"])
            .execute()
        )
    except Exception:
        pass

    consultant_name = (link.get("consultants") or {}).get("full_name")
    agency_name = (link.get("agencies") or {}).get("name")

    return IntakeInfo(
        code=code,
        consultant_name=consultant_name,
        agency_name=agency_name,
        is_admin=False,
    )
