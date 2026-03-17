"""
Admin-only API routes. All endpoints require:
  1. JWT with role=admin  (via require_role("admin"))
  2. X-Admin-Secret header matching ADMIN_SECRET env var (via require_admin_secret)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import AsyncClient

from app.core.security import require_role, require_admin_secret
from app.db.client import get_client
from app.models.application import ConsultantStatusUpdate, ReassignBody

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin")), Depends(require_admin_secret)],
)


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(client: AsyncClient = Depends(get_client)):
    """Dashboard counts for the admin portal."""
    students_res = await client.table("students").select("id", count="exact").execute()
    consultants_res = await client.table("consultants").select("id", count="exact").execute()
    apps_res = await client.table("applications").select("id", count="exact").execute()
    leads_res = (
        await client.table("applications")
        .select("id", count="exact")
        .is_("consultant_id", "null")
        .eq("status", "lead")
        .execute()
    )
    pending_res = (
        await client.table("consultants")
        .select("id", count="exact")
        .eq("status", "pending")
        .execute()
    )
    return {
        "total_students":            students_res.count or 0,
        "total_consultants":         consultants_res.count or 0,
        "total_applications":        apps_res.count or 0,
        "unassigned_leads":          leads_res.count or 0,
        "pending_consultant_approvals": pending_res.count or 0,
    }


# ─── Consultants ──────────────────────────────────────────────────────────────

@router.get("/consultants")
async def list_consultants(
    status: str | None = Query(None, description="Filter by status: pending|active|banned"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client: AsyncClient = Depends(get_client),
):
    """List all consultants with optional status filter and pagination."""
    offset = (page - 1) * page_size
    q = client.table("consultants").select("*, agencies(name)", count="exact")
    if status:
        q = q.eq("status", status)
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}


@router.patch("/consultants/{consultant_id}/status")
async def update_consultant_status(
    consultant_id: str,
    body: ConsultantStatusUpdate,
    client: AsyncClient = Depends(get_client),
):
    """Approve or ban a consultant."""
    res = await (
        client.table("consultants")
        .update({"status": body.status})
        .eq("id", consultant_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    return res.data[0]


# ─── Unassigned Leads ─────────────────────────────────────────────────────────

@router.get("/leads")
async def list_unassigned_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client: AsyncClient = Depends(get_client),
):
    """Applications with no consultant assigned and status='lead'."""
    offset = (page - 1) * page_size
    res = await (
        client.table("applications")
        .select("*, students(full_name, phone, created_at)", count="exact")
        .is_("consultant_id", "null")
        .eq("status", "lead")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}


@router.patch("/leads/{application_id}/assign")
async def assign_lead(
    application_id: str,
    body: ReassignBody,
    client: AsyncClient = Depends(get_client),
):
    """Assign an unassigned lead to a consultant."""
    # Verify consultant exists and is active
    c_res = await (
        client.table("consultants")
        .select("id, status")
        .eq("id", body.consultant_id)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    if c_res.data[0]["status"] != "active":
        raise HTTPException(status_code=400, detail="Consultant is not active")

    update: dict = {
        "consultant_id": body.consultant_id,
        "agency_id":     body.agency_id,
    }
    if body.note:
        update["notes"] = body.note

    res = await (
        client.table("applications")
        .update(update)
        .eq("id", application_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return res.data[0]


# ─── Reassign Any Application ─────────────────────────────────────────────────

@router.patch("/applications/{application_id}/reassign")
async def reassign_application(
    application_id: str,
    body: ReassignBody,
    client: AsyncClient = Depends(get_client),
):
    """Reassign any application to a different consultant."""
    c_res = await (
        client.table("consultants")
        .select("id, status")
        .eq("id", body.consultant_id)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    if c_res.data[0]["status"] != "active":
        raise HTTPException(status_code=400, detail="Target consultant is not active")

    update: dict = {
        "consultant_id": body.consultant_id,
        "agency_id":     body.agency_id,
    }
    if body.note:
        update["notes"] = body.note

    res = await (
        client.table("applications")
        .update(update)
        .eq("id", application_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return res.data[0]
