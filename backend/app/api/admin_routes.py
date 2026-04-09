"""
Admin-only API routes. All endpoints require:
  1. JWT with role=admin or super_admin (via require_role("admin"))
  2. X-Admin-Secret header matching ADMIN_SECRET env var (via require_admin_secret)

Ghost mode (X-Ghost-Mode: true) is available to super_admin users only.
"""
from __future__ import annotations
import csv
import io
from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from pydantic import ValidationError
from supabase import AsyncClient

from app.core.config import get_settings
from app.core.security import require_role, require_admin_secret, get_current_user, get_ghost_context, GhostContext
from app.core.ghost import ghost_audit, ghost_notify_lead_assignment
from app.db.client import get_client
from app.models.application import ConsultantStatusUpdate, ReassignBody, MatchSettingsUpdate, AgencyCreate, AgencyUpdate
from app.models.university import ProgramCreate, ProgramUpdate, UniversityCreate

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
    agency_id: str | None = Query(None, description="Filter by agency"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    client: AsyncClient = Depends(get_client),
):
    """List all consultants with optional status/agency filters and pagination."""
    offset = (page - 1) * page_size
    q = client.table("consultants").select("*, agencies(name)", count="exact")
    if status:
        q = q.eq("status", status)
    if agency_id:
        q = q.eq("agency_id", agency_id)
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}


@router.get("/consultants/{consultant_id}")
async def get_consultant_detail(
    consultant_id: str,
    client: AsyncClient = Depends(get_client),
):
    """Consultant detail with their assigned applications, including student
    name, program, and status history."""
    c_res = await (
        client.table("consultants")
        .select("*, agencies(name)")
        .eq("id", consultant_id)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")

    apps_res = await (
        client.table("applications")
        .select(
            "id, status, status_history, notes, created_at, updated_at, "
            "student_id, students(id, full_name, phone, preferred_countries, preferred_degree), "
            "programs(name, degree_level, field, university_id)"
        )
        .eq("consultant_id", consultant_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return {"consultant": c_res.data[0], "applications": apps_res.data or []}


@router.patch("/consultants/{consultant_id}/status")
async def update_consultant_status(
    consultant_id: str,
    body: ConsultantStatusUpdate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
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

    action = "approve_consultant" if body.status == "active" else "ban_consultant" if body.status == "banned" else "update_consultant_status"
    await ghost_audit(client, ghost_ctx, action, "consultant", consultant_id, {"status": old_status}, {"status": body.status})

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
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Assign an unassigned lead to a consultant.
    In ghost mode, the assignment appears as a system/algorithm match."""
    # Verify consultant exists and is active
    c_res = await (
        client.table("consultants")
        .select("id, user_id, status")
        .eq("id", body.consultant_id)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    if c_res.data[0]["status"] != "active":
        raise HTTPException(status_code=400, detail="Consultant is not active")

    consultant = c_res.data[0]

    # Verify the consultant's agency_id matches the provided agency_id
    consultant_agency = await client.table("consultants").select("agency_id").eq("id", body.consultant_id).limit(1).execute()
    if consultant_agency.data and consultant_agency.data[0].get("agency_id") != body.agency_id:
        raise HTTPException(status_code=422, detail="agency_id does not match the consultant's agency")

    update: dict = {
        "consultant_id": body.consultant_id,
        "agency_id":     body.agency_id,
        "assigned_by":   None if ghost_ctx.is_ghost else ghost_ctx.admin_user_id,
        "assigned_source": ghost_ctx.source_label if ghost_ctx.is_ghost else "admin",
    }
    if body.note:
        update["notes"] = body.note

    res = await (
        client.table("applications")
        .update(update)
        .eq("id", application_id)
        .is_("consultant_id", "null")  # only assign if currently unassigned
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found or already assigned")

    await ghost_audit(client, ghost_ctx, "assign_lead", "application", application_id, None, {"consultant_id": body.consultant_id, "agency_id": body.agency_id})

    # Notify the consultant (masked in ghost mode)
    await ghost_notify_lead_assignment(
        client, application_id, consultant["user_id"], consultant["id"], ghost_ctx,
    )

    return res.data[0]


# ─── Reassign Any Application ─────────────────────────────────────────────────

@router.patch("/applications/{application_id}/reassign")
async def reassign_application(
    application_id: str,
    body: ReassignBody,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Reassign any application to a different consultant.
    In ghost mode, the reassignment appears as a system/algorithm action."""
    c_res = await (
        client.table("consultants")
        .select("id, user_id, status")
        .eq("id", body.consultant_id)
        .limit(1)
        .execute()
    )
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant not found")
    if c_res.data[0]["status"] != "active":
        raise HTTPException(status_code=400, detail="Target consultant is not active")

    consultant = c_res.data[0]

    old_res = await client.table("applications").select("consultant_id, agency_id").eq("id", application_id).limit(1).execute()
    old_assignment = old_res.data[0] if old_res.data else None

    update: dict = {
        "consultant_id": body.consultant_id,
        "agency_id":     body.agency_id,
        "assigned_by":   None if ghost_ctx.is_ghost else ghost_ctx.admin_user_id,
        "assigned_source": ghost_ctx.source_label if ghost_ctx.is_ghost else "admin",
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

    await ghost_audit(client, ghost_ctx, "reassign_application", "application", application_id, old_assignment, {"consultant_id": body.consultant_id, "agency_id": body.agency_id})

    # Notify the new consultant (masked in ghost mode)
    await ghost_notify_lead_assignment(
        client, application_id, consultant["user_id"], consultant["id"], ghost_ctx,
    )

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
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Update match scoring weights and AI settings."""
    current_res = await client.table("match_settings").select("*").order("updated_at", desc=True).limit(1).execute()
    if not current_res.data:
        raise HTTPException(status_code=404, detail="Match settings not found")
    current = current_res.data[0]

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    update_data["updated_by"] = ghost_ctx.admin_user_id
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await client.table("match_settings").update(update_data).eq("id", current["id"]).execute()
    await ghost_audit(client, ghost_ctx, "update_match_settings", "match_settings", current["id"], current, update_data)
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
        "id, user_id, full_name, phone, preferred_countries, preferred_degree, onboarding_completed, created_at",
        count="exact",
    )
    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        q = q.or_(f"full_name.ilike.%{safe}%,phone.ilike.%{safe}%")
    if onboarding_completed is not None:
        q = q.eq("onboarding_completed", onboarding_completed)
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data, "total": res.count or 0, "page": page, "page_size": page_size}


# ─── Agencies ─────────────────────────────────────────────────────────────────

@router.get("/agencies")
async def admin_list_agencies(
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: AsyncClient = Depends(get_client),
):
    """List agencies (admin view: includes inactive). Supports search by name."""
    offset = (page - 1) * page_size
    q = client.table("agencies").select("*", count="exact")
    if is_active is not None:
        q = q.eq("is_active", is_active)
    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        q = q.ilike("name", f"%{safe}%")
    res = await q.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    return {"items": res.data or [], "total": res.count or 0, "page": page, "page_size": page_size}


@router.get("/agencies/{agency_id}/overview")
async def admin_agency_overview(
    agency_id: str,
    client: AsyncClient = Depends(get_client),
):
    """Agency + its consultants, each with their assigned applications
    (joined with student + program names)."""
    a_res = await client.table("agencies").select("*").eq("id", agency_id).limit(1).execute()
    if not a_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")

    c_res = await (
        client.table("consultants")
        .select("*")
        .eq("agency_id", agency_id)
        .order("created_at", desc=True)
        .execute()
    )
    consultants = c_res.data or []

    consultant_ids = [c["id"] for c in consultants]
    apps_by_consultant: dict[str, list] = {cid: [] for cid in consultant_ids}
    if consultant_ids:
        apps_res = await (
            client.table("applications")
            .select(
                "id, status, consultant_id, updated_at, "
                "students(id, full_name, phone), "
                "programs(name, degree_level, field)"
            )
            .in_("consultant_id", consultant_ids)
            .order("updated_at", desc=True)
            .execute()
        )
        for app in apps_res.data or []:
            apps_by_consultant.setdefault(app["consultant_id"], []).append(app)

    for c in consultants:
        c["applications"] = apps_by_consultant.get(c["id"], [])

    return {"agency": a_res.data[0], "consultants": consultants}


@router.get("/agencies/{agency_id}")
async def admin_get_agency(agency_id: str, client: AsyncClient = Depends(get_client)):
    res = await client.table("agencies").select("*").eq("id", agency_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    return res.data[0]


@router.post("/agencies", status_code=201)
async def admin_create_agency(
    body: AgencyCreate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    res = await client.table("agencies").insert(body.model_dump(exclude_none=True)).execute()
    created = res.data[0]
    await ghost_audit(client, ghost_ctx, "create_agency", "agency", created["id"], None, body.model_dump(exclude_none=True))
    return created


@router.patch("/agencies/{agency_id}")
async def admin_update_agency(
    agency_id: str,
    body: AgencyUpdate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    before_res = await client.table("agencies").select("*").eq("id", agency_id).limit(1).execute()
    if not before_res.data:
        raise HTTPException(status_code=404, detail="Agency not found")
    before = before_res.data[0]

    update = body.model_dump(exclude_unset=True)
    if not update:
        return before

    res = await client.table("agencies").update(update).eq("id", agency_id).execute()
    after = res.data[0] if res.data else before
    await ghost_audit(
        client, ghost_ctx, "update_agency", "agency", agency_id,
        {k: before.get(k) for k in update.keys()}, update,
    )
    return after


# ─── Student Documents ────────────────────────────────────────────────────────

DOCS_BUCKET = "documents"


async def _admin_signed_url(client: AsyncClient, key: str) -> str | None:
    try:
        res = await client.storage.from_(DOCS_BUCKET).create_signed_url(key, 3600)
        return res.get("signedURL")
    except Exception:
        return None


@router.get("/students/{student_id}/documents")
async def admin_list_student_documents(
    student_id: str,
    client: AsyncClient = Depends(get_client),
):
    """List a student's uploaded documents with 1-hour signed download URLs."""
    res = await (
        client.table("documents")
        .select("*")
        .eq("student_id", student_id)
        .order("uploaded_at", desc=True)
        .execute()
    )
    docs = res.data or []
    for d in docs:
        d["signed_url"] = await _admin_signed_url(client, d.get("storage_url", ""))
    return docs


@router.delete("/documents/{document_id}", status_code=204)
async def admin_delete_document(
    document_id: str,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Delete a student document (storage object + DB row). Audited."""
    before_res = await client.table("documents").select("*").eq("id", document_id).limit(1).execute()
    if not before_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    before = before_res.data[0]

    storage_url = before.get("storage_url")
    if storage_url:
        try:
            await client.storage.from_(DOCS_BUCKET).remove([storage_url])
        except Exception:
            pass  # storage object may already be gone; still remove DB row

    await client.table("documents").delete().eq("id", document_id).execute()
    await ghost_audit(client, ghost_ctx, "delete_document", "document", document_id, before, None)
    return None


# ─── Programs (under universities) ────────────────────────────────────────────

@router.get("/universities/{university_id}/programs")
async def admin_list_programs(
    university_id: str,
    client: AsyncClient = Depends(get_client),
):
    """List all programs for a university (includes inactive)."""
    res = await (
        client.table("programs")
        .select("*")
        .eq("university_id", university_id)
        .order("name")
        .execute()
    )
    return res.data or []


@router.post("/universities/{university_id}/programs", status_code=201)
async def admin_create_program(
    university_id: str,
    body: ProgramCreate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    uni_res = await client.table("universities").select("id").eq("id", university_id).limit(1).execute()
    if not uni_res.data:
        raise HTTPException(status_code=404, detail="University not found")

    payload = body.model_dump(mode="json", exclude_none=True)
    payload["university_id"] = university_id
    res = await client.table("programs").insert(payload).execute()
    created = res.data[0]
    await ghost_audit(client, ghost_ctx, "create_program", "program", created["id"], None, payload)
    return created


@router.patch("/programs/{program_id}")
async def admin_update_program(
    program_id: str,
    body: ProgramUpdate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    before_res = await client.table("programs").select("*").eq("id", program_id).limit(1).execute()
    if not before_res.data:
        raise HTTPException(status_code=404, detail="Program not found")
    before = before_res.data[0]

    update = body.model_dump(mode="json", exclude_unset=True)
    if not update:
        return before

    res = await client.table("programs").update(update).eq("id", program_id).execute()
    after = res.data[0] if res.data else before
    await ghost_audit(
        client, ghost_ctx, "update_program", "program", program_id,
        {k: before.get(k) for k in update.keys()}, update,
    )
    return after


# ─── Deletes (universities / programs / agencies) ─────────────────────────────


async def _safe_delete(client: AsyncClient, table: str, row_id: str, ghost_ctx: GhostContext, action: str, resource: str):
    before_res = await client.table(table).select("*").eq("id", row_id).limit(1).execute()
    if not before_res.data:
        raise HTTPException(status_code=404, detail=f"{resource} not found")
    before = before_res.data[0]
    try:
        await client.table(table).delete().eq("id", row_id).execute()
    except Exception as e:
        msg = str(e).lower()
        if "foreign key" in msg or "violates" in msg or "23503" in msg:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete {resource}: it is referenced by other records. Deactivate it instead.",
            )
        raise
    await ghost_audit(client, ghost_ctx, action, resource, row_id, before, None)
    return None


@router.delete("/universities/{university_id}", status_code=204)
async def admin_delete_university(
    university_id: str,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    return await _safe_delete(client, "universities", university_id, ghost_ctx, "delete_university", "university")


@router.delete("/programs/{program_id}", status_code=204)
async def admin_delete_program(
    program_id: str,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    return await _safe_delete(client, "programs", program_id, ghost_ctx, "delete_program", "program")


@router.delete("/agencies/{agency_id}", status_code=204)
async def admin_delete_agency(
    agency_id: str,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    return await _safe_delete(client, "agencies", agency_id, ghost_ctx, "delete_agency", "agency")


# ─── Bulk Import (universities + programs) ────────────────────────────────────

BULK_IMPORT_MAX_BYTES = 2 * 1024 * 1024  # 2 MB
BULK_IMPORT_MAX_ROWS = 1000

UNIVERSITY_BOOL_FIELDS = {"scholarships_available"}
UNIVERSITY_INT_FIELDS = {
    "ranking_qs", "ranking_the", "tuition_usd_per_year",
    "min_toefl", "min_gpa_percentage", "max_scholarship_pct",
}
UNIVERSITY_FLOAT_FIELDS = {
    "acceptance_rate_overall", "acceptance_rate_bd", "min_ielts",
}
UNIVERSITY_STR_FIELDS = {
    "city", "website", "description", "logo_url",
}

PROGRAM_INT_FIELDS = {"program_tuition_usd_per_year"}
PROGRAM_FLOAT_FIELDS = {"duration_years"}

CSV_TEMPLATE = (
    "university_name,country,city,website,tuition_usd_per_year,ranking_qs,"
    "acceptance_rate_bd,scholarships_available,max_scholarship_pct,min_ielts,"
    "min_gpa_percentage,program_name,degree_level,field,"
    "program_tuition_usd_per_year,duration_years,application_deadline,intake_months\n"
    "Example University,US,Boston,https://example.edu,45000,80,55.0,true,50,6.5,"
    "70,MSc Computer Science,master,cs,,2,2026-12-01,1;9\n"
    "Example University,US,Boston,https://example.edu,45000,80,55.0,true,50,6.5,"
    "70,BSc Computer Science,bachelor,cs,,4,2026-12-01,9\n"
)


def _coerce(value: str | None, kind: str) -> object:
    if value is None:
        return None
    v = value.strip()
    if v == "":
        return None
    if kind == "int":
        return int(float(v))
    if kind == "float":
        return float(v)
    if kind == "bool":
        return v.lower() in ("true", "1", "yes", "y", "t")
    return v


@router.get("/universities/import-template")
async def admin_universities_import_template():
    return Response(
        content=CSV_TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="universities-template.csv"'},
    )


@router.post("/universities/bulk-import")
async def admin_universities_bulk_import(
    payload: dict = Body(...),
    dry_run: bool = Query(False),
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Bulk-import universities and programs from a denormalized CSV.

    Body: {"content_b64": "<base64 csv>"}
    Each row = one program. Rows are grouped by (university_name, country) and
    the parent university is upserted before its programs are inserted.
    """
    import base64
    b64 = (payload or {}).get("content_b64") or ""
    if not b64:
        raise HTTPException(status_code=400, detail="content_b64 required")
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="content_b64 is not valid base64")
    if len(raw) > BULK_IMPORT_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"CSV exceeds {BULK_IMPORT_MAX_BYTES // 1024} KB")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if len(rows) > BULK_IMPORT_MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"Max {BULK_IMPORT_MAX_ROWS} rows per import")
    if not rows:
        raise HTTPException(status_code=400, detail="CSV has no data rows")

    errors: list[dict] = []
    groups: dict[tuple[str, str], list[tuple[int, dict]]] = {}

    # ── Pass 1: parse + validate every row, group by university ──
    for idx, row in enumerate(rows, start=2):  # start=2 → row 1 is header
        try:
            uni_name = (row.get("university_name") or "").strip()
            country = (row.get("country") or "").strip().upper()
            if not uni_name or not country:
                errors.append({"row": idx, "field": "university_name/country", "message": "required"})
                continue

            uni_payload: dict = {"name": uni_name, "country": country}
            for f in UNIVERSITY_STR_FIELDS:
                v = _coerce(row.get(f), "str")
                if v is not None:
                    uni_payload[f] = v
            for f in UNIVERSITY_INT_FIELDS:
                v = _coerce(row.get(f), "int")
                if v is not None:
                    uni_payload[f] = v
            for f in UNIVERSITY_FLOAT_FIELDS:
                v = _coerce(row.get(f), "float")
                if v is not None:
                    uni_payload[f] = v
            for f in UNIVERSITY_BOOL_FIELDS:
                v = _coerce(row.get(f), "bool")
                if v is not None:
                    uni_payload[f] = v
            if "tuition_usd_per_year" not in uni_payload:
                uni_payload["tuition_usd_per_year"] = 0

            # Validate via existing pydantic model (raises on bad values)
            UniversityCreate(**uni_payload)

            # ── Program payload ──
            program_name = (row.get("program_name") or "").strip()
            degree = (row.get("degree_level") or "").strip().lower()
            field_ = (row.get("field") or "").strip()
            if not program_name or not degree or not field_:
                errors.append({"row": idx, "field": "program_name/degree_level/field", "message": "required"})
                continue

            min_req: dict = {}
            ielts = _coerce(row.get("program_min_ielts") or row.get("min_ielts"), "float")
            if ielts is not None:
                min_req["ielts"] = ielts
            gpa = _coerce(row.get("program_min_gpa_pct") or row.get("min_gpa_percentage"), "int")
            if gpa is not None:
                min_req["gpa_pct"] = gpa
            toefl = _coerce(row.get("min_toefl"), "int")
            if toefl is not None:
                min_req["toefl"] = toefl

            intake_raw = (row.get("intake_months") or "").strip()
            intake_months = (
                [int(x.strip()) for x in intake_raw.split(";") if x.strip().isdigit()]
                if intake_raw
                else None
            )

            program_payload: dict = {
                "name": program_name,
                "degree_level": degree,
                "field": field_,
                "tuition_usd_per_year": _coerce(row.get("program_tuition_usd_per_year"), "int"),
                "duration_years": _coerce(row.get("duration_years"), "float"),
                "application_deadline": _coerce(row.get("application_deadline"), "str"),
                "intake_months": intake_months,
                "min_requirements": min_req,
                "is_active": True,
            }
            program_payload = {k: v for k, v in program_payload.items() if v is not None or k == "min_requirements"}
            ProgramCreate(**program_payload)
            # Re-stringify deadline to ISO via mode=json after validation
            program_payload_json = ProgramCreate(**program_payload).model_dump(mode="json", exclude_none=True)

            groups.setdefault((uni_name, country), []).append((idx, {
                "uni": uni_payload,
                "program": program_payload_json,
            }))
        except ValidationError as ve:
            for e in ve.errors():
                loc = ".".join(str(x) for x in e.get("loc", []))
                errors.append({"row": idx, "field": loc, "message": e.get("msg", "invalid")})
        except (ValueError, TypeError) as ex:
            errors.append({"row": idx, "field": "row", "message": str(ex)})

    summary = {
        "dry_run": dry_run,
        "universities_created": 0,
        "universities_updated": 0,
        "programs_created": 0,
        "errors": errors,
    }

    if dry_run or not groups:
        summary["universities_seen"] = len(groups)
        if dry_run:
            # Report what *would* be created vs updated
            would_create = 0
            would_update = 0
            for (uni_name, country), _items in groups.items():
                existing = await (
                    client.table("universities")
                    .select("id,name,country")
                    .ilike("name", uni_name)
                    .eq("country", country)
                    .execute()
                )
                match = next(
                    (r for r in (existing.data or [])
                     if (r.get("name") or "").strip().lower() == uni_name.strip().lower()),
                    None,
                )
                if match:
                    would_update += 1
                else:
                    would_create += 1
            summary["universities_created"] = would_create
            summary["universities_updated"] = would_update
            summary["programs_created"] = sum(len(items) for items in groups.values())
        return summary

    # ── Pass 2: upsert universities + insert programs ──
    for (uni_name, country), items in groups.items():
        try:
            uni_payload = items[0][1]["uni"]
            existing = await (
                client.table("universities")
                .select("id,name,country")
                .ilike("name", uni_name)
                .eq("country", country)
                .execute()
            )
            # Tolerate whitespace/case differences in stored name
            match = next(
                (r for r in (existing.data or [])
                 if (r.get("name") or "").strip().lower() == uni_name.strip().lower()
                 and (r.get("country") or "").strip().upper() == country),
                None,
            )
            if match:
                existing = type("X", (), {"data": [match]})()
            if existing.data:
                university_id = existing.data[0]["id"]
                update_payload = {k: v for k, v in uni_payload.items() if k not in ("name", "country")}
                if update_payload:
                    await client.table("universities").update(update_payload).eq("id", university_id).execute()
                summary["universities_updated"] += 1
                await ghost_audit(
                    client, ghost_ctx, "bulk_update_university", "university",
                    university_id, None, update_payload,
                )
            else:
                ins = await client.table("universities").insert(uni_payload).execute()
                university_id = ins.data[0]["id"]
                summary["universities_created"] += 1
                await ghost_audit(
                    client, ghost_ctx, "bulk_create_university", "university",
                    university_id, None, uni_payload,
                )

            for row_idx, payload in items:
                try:
                    program_payload = {**payload["program"], "university_id": university_id}
                    p_ins = await client.table("programs").insert(program_payload).execute()
                    summary["programs_created"] += 1
                    if p_ins.data:
                        await ghost_audit(
                            client, ghost_ctx, "bulk_create_program", "program",
                            p_ins.data[0]["id"], None, program_payload,
                        )
                except Exception as pe:
                    errors.append({"row": row_idx, "field": "program", "message": str(pe)})
        except Exception as ue:
            for row_idx, _ in items:
                errors.append({"row": row_idx, "field": "university", "message": str(ue)})

    return summary


# ─── Bulk Import: Students ───────────────────────────────────────────────────

STUDENT_CSV_TEMPLATE = (
    "full_name,email,phone,budget_usd_per_year,preferred_countries,"
    "preferred_degree,preferred_fields,ielts,gpa_percentage\n"
    "Jane Doe,jane.doe@example.com,+8801712345678,30000,US;CA,master,cs;data_science,7.0,85\n"
    "John Smith,john.smith@example.com,+8801898765432,20000,GB;DE,bachelor,engineering,6.5,78\n"
)


@router.get("/students/import-template")
async def admin_students_import_template():
    """Return a CSV template for bulk student import."""
    return Response(
        content=STUDENT_CSV_TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="students-template.csv"'},
    )


@router.post("/students/bulk-import")
async def admin_students_bulk_import(
    payload: dict = Body(...),
    dry_run: bool = Query(False),
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Bulk-create students from a CSV.

    Each row creates an auth user (random password), a students row, and an
    unassigned lead application — same shape as a normal admin-source signup.
    Body: {"content_b64": "<base64 csv>"}
    """
    import base64
    import secrets

    b64 = (payload or {}).get("content_b64") or ""
    if not b64:
        raise HTTPException(status_code=400, detail="content_b64 required")
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="content_b64 is not valid base64")
    if len(raw) > BULK_IMPORT_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"CSV exceeds {BULK_IMPORT_MAX_BYTES // 1024} KB")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if len(rows) > BULK_IMPORT_MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"Max {BULK_IMPORT_MAX_ROWS} rows per import")
    if not rows:
        raise HTTPException(status_code=400, detail="CSV has no data rows")

    errors: list[dict] = []
    parsed: list[tuple[int, dict, str]] = []  # (row_idx, student_payload, email)

    # ── Pass 1: validate every row ──
    for idx, row in enumerate(rows, start=2):
        try:
            full_name = (row.get("full_name") or "").strip()
            email = (row.get("email") or "").strip().lower()
            if not full_name or not email:
                errors.append({"row": idx, "field": "full_name/email", "message": "required"})
                continue
            if "@" not in email or "." not in email.split("@")[-1]:
                errors.append({"row": idx, "field": "email", "message": "invalid email"})
                continue

            phone = _coerce(row.get("phone"), "str")
            budget = _coerce(row.get("budget_usd_per_year"), "int") or 0
            countries_raw = (row.get("preferred_countries") or "").strip()
            countries = [c.strip().upper() for c in countries_raw.split(";") if c.strip()] if countries_raw else []
            degree = (row.get("preferred_degree") or "").strip().lower() or None
            fields_raw = (row.get("preferred_fields") or "").strip()
            fields = [f.strip() for f in fields_raw.split(";") if f.strip()] if fields_raw else []
            ielts = _coerce(row.get("ielts"), "float")
            gpa_pct = _coerce(row.get("gpa_percentage"), "int")

            # Validate via existing pydantic model
            from app.models.student import StudentCreate
            StudentCreate(
                full_name=full_name,
                phone=phone,
                academic_history={"gpa_percentage": gpa_pct} if gpa_pct is not None else {},
                test_scores={"ielts": ielts} if ielts is not None else {},
                budget_usd_per_year=budget,
                preferred_countries=countries,
                preferred_degree=degree,
                preferred_fields=fields,
            )

            student_payload = {
                "full_name": full_name,
                "phone": phone,
                "academic_history": {"gpa_percentage": gpa_pct} if gpa_pct is not None else {},
                "test_scores": {"ielts": ielts} if ielts is not None else {},
                "budget_usd_per_year": budget,
                "preferred_countries": countries,
                "preferred_degree": degree,
                "preferred_fields": fields,
                "referral_source": "admin",
            }
            parsed.append((idx, student_payload, email))
        except ValidationError as ve:
            for e in ve.errors():
                loc = ".".join(str(x) for x in e.get("loc", []))
                errors.append({"row": idx, "field": loc, "message": e.get("msg", "invalid")})
        except (ValueError, TypeError) as ex:
            errors.append({"row": idx, "field": "row", "message": str(ex)})

    summary = {
        "dry_run": dry_run,
        "students_created": 0,
        "leads_created": 0,
        "errors": errors,
    }

    if dry_run:
        summary["students_created"] = len(parsed)
        summary["leads_created"] = len(parsed)
        return summary

    # ── Pass 2: create auth user → student row → lead application ──
    for row_idx, student_payload, email in parsed:
        try:
            # 1) Create auth user with a random password
            password = secrets.token_urlsafe(16)
            auth_res = await client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "app_metadata": {"role": "student"},
            })
            user_id = auth_res.user.id

            # 2) Insert student row
            student_payload["user_id"] = user_id
            ins = await client.table("students").insert(student_payload).execute()
            if not ins.data:
                raise RuntimeError("student insert returned no data")
            student_id = ins.data[0]["id"]
            summary["students_created"] += 1

            # 3) Unassigned lead application
            try:
                await client.table("applications").insert({
                    "student_id": student_id,
                    "status": "lead",
                }).execute()
                summary["leads_created"] += 1
            except Exception as le:
                errors.append({"row": row_idx, "field": "lead", "message": str(le)})

            await ghost_audit(
                client, ghost_ctx, "bulk_create_student", "student",
                student_id, None, {"email": email, **student_payload},
            )
        except Exception as ue:
            errors.append({"row": row_idx, "field": "student", "message": str(ue)})

    return summary


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
