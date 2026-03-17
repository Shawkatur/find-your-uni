"""
Admin-only API routes. All endpoints require:
  1. JWT with role=admin  (via require_role("admin"))
  2. X-Admin-Secret header matching ADMIN_SECRET env var (via require_admin_secret)
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import AsyncClient

from app.core.config import get_settings
from app.core.security import require_role, require_admin_secret, get_current_user
from app.db.client import get_client
from app.models.application import ConsultantStatusUpdate, ReassignBody, MatchSettingsUpdate

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin")), Depends(require_admin_secret)],
)


async def _audit(client: AsyncClient, admin_user_id: str, action: str, resource_type: str, resource_id: str | None, old_value: dict | None, new_value: dict | None):
    """Insert a row into admin_audit_log (best-effort, does not raise on failure)."""
    try:
        await client.table("admin_audit_log").insert({
            "admin_user_id": admin_user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "old_value": old_value,
            "new_value": new_value,
        }).execute()
    except Exception:
        pass  # Audit failure must not block the primary operation


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
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Approve or ban a consultant."""
    old_res = await client.table("consultants").select("id, status").eq("id", consultant_id).limit(1).execute()
    if not old_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    old_status = old_res.data[0]["status"]

    res = await (
        client.table("consultants")
        .update({"status": body.status})
        .eq("id", consultant_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")

    settings = get_settings()
    admin_id = user["sub"] if not settings.BYPASS_AUTH else "00000000-0000-0000-0000-000000000001"
    action = "approve_consultant" if body.status == "active" else "ban_consultant" if body.status == "banned" else "update_consultant_status"
    await _audit(client, admin_id, action, "consultant", consultant_id, {"status": old_status}, {"status": body.status})

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
    user: dict = Depends(get_current_user),
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

    settings = get_settings()
    admin_id = user["sub"] if not settings.BYPASS_AUTH else "00000000-0000-0000-0000-000000000001"
    await _audit(client, admin_id, "assign_lead", "application", application_id, None, {"consultant_id": body.consultant_id, "agency_id": body.agency_id})

    return res.data[0]


# ─── Reassign Any Application ─────────────────────────────────────────────────

@router.patch("/applications/{application_id}/reassign")
async def reassign_application(
    application_id: str,
    body: ReassignBody,
    user: dict = Depends(get_current_user),
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

    old_res = await client.table("applications").select("consultant_id, agency_id").eq("id", application_id).limit(1).execute()
    old_assignment = old_res.data[0] if old_res.data else None

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

    settings = get_settings()
    admin_id = user["sub"] if not settings.BYPASS_AUTH else "00000000-0000-0000-0000-000000000001"
    await _audit(client, admin_id, "reassign_application", "application", application_id, old_assignment, {"consultant_id": body.consultant_id, "agency_id": body.agency_id})

    return res.data[0]


# ─── Match Settings ────────────────────────────────────────────────────────────

@router.get("/match-settings")
async def get_match_settings(client: AsyncClient = Depends(get_client)):
    """Get current match scoring weights and AI settings."""
    res = await client.table("match_settings").select("*").order("updated_at", desc=True).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Match settings not found")
    return res.data[0]


@router.patch("/match-settings")
async def update_match_settings(
    body: MatchSettingsUpdate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Update match scoring weights and AI settings."""
    current_res = await client.table("match_settings").select("*").order("updated_at", desc=True).limit(1).execute()
    if not current_res.data:
        raise HTTPException(status_code=404, detail="Match settings not found")
    current = current_res.data[0]

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    settings = get_settings()
    admin_id = user["sub"] if not settings.BYPASS_AUTH else "00000000-0000-0000-0000-000000000001"
    update_data["updated_by"] = admin_id
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await client.table("match_settings").update(update_data).eq("id", current["id"]).execute()
    await _audit(client, admin_id, "update_match_settings", "match_settings", current["id"], current, update_data)
    return res.data[0]


# ─── Students ─────────────────────────────────────────────────────────────────

@router.get("/students")
async def list_students(
    search: str | None = Query(None, description="Search by name or phone"),
    onboarding_completed: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client: AsyncClient = Depends(get_client),
):
    """Paginated list of all students with optional search."""
    offset = (page - 1) * page_size
    q = client.table("students").select(
        "id, user_id, full_name, phone, preferred_countries, degree_level, onboarding_completed, created_at",
        count="exact",
    )
    if search:
        q = q.or_(f"full_name.ilike.%{search}%,phone.ilike.%{search}%")
    if onboarding_completed is not None:
        q = q.eq("onboarding_completed", onboarding_completed)
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}


# ─── Audit Log ────────────────────────────────────────────────────────────────

@router.get("/audit-log")
async def get_audit_log(
    resource_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: AsyncClient = Depends(get_client),
):
    """View admin audit log entries."""
    offset = (page - 1) * page_size
    q = client.table("admin_audit_log").select("*", count="exact")
    if resource_type:
        q = q.eq("resource_type", resource_type)
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}
