"""
Super Admin routes — accessible only to super_admin role.
These endpoints power the standalone admin dashboard and are invisible
to the main student/consultant application.

All endpoints require:
  1. JWT with role=super_admin (via require_super_admin)
  2. X-Admin-Secret header (via require_admin_secret)
"""
from __future__ import annotations
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from supabase import AsyncClient

from app.core.security import (
    require_super_admin,
    require_admin_secret,
    get_ghost_context,
    GhostContext,
)
from app.core.ghost import ghost_audit, ghost_notify_lead_assignment, ghost_read
from app.db.client import get_client
from app.models.student import StudentUpdate

router = APIRouter(
    prefix="/super-admin",
    tags=["super-admin"],
    dependencies=[Depends(require_super_admin()), Depends(require_admin_secret)],
)


# ─── Request / Response Models ────────────────────────────────────────────────

class BulkAssignItem(BaseModel):
    application_id: str
    consultant_id: str
    agency_id: str


class BulkAssignBody(BaseModel):
    assignments: list[BulkAssignItem] = Field(min_length=1, max_length=100)


# ─── Analytics: Overview ──────────────────────────────────────────────────────

@router.get("/analytics/overview")
async def analytics_overview(client: AsyncClient = Depends(get_client)):
    """Global platform overview with counts and conversion funnel."""
    # Run all independent queries in parallel.
    # The funnel is computed from a single fetch of `applications.status`
    # instead of one count query per status (was 10 sequential round-trips).
    (
        students_res,
        consultants_res,
        agencies_res,
        apps_res,
        all_apps_res,
        leads_res,
        pending_res,
    ) = await asyncio.gather(
        client.table("students").select("id", count="exact").execute(),
        client.table("consultants").select("id", count="exact").execute(),
        client.table("agencies").select("id", count="exact").execute(),
        client.table("applications").select("id", count="exact").execute(),
        client.table("applications").select("status").execute(),
        client.table("applications")
            .select("id", count="exact")
            .is_("consultant_id", "null")
            .eq("status", "lead")
            .execute(),
        client.table("consultants")
            .select("id", count="exact")
            .eq("status", "pending")
            .execute(),
    )

    # Group statuses in Python
    funnel: dict[str, int] = {}
    for row in (all_apps_res.data or []):
        s = row.get("status")
        if not s:
            continue
        funnel[s] = funnel.get(s, 0) + 1

    return {
        "total_students": students_res.count or 0,
        "total_consultants": consultants_res.count or 0,
        "total_agencies": agencies_res.count or 0,
        "total_applications": apps_res.count or 0,
        "unassigned_leads": leads_res.count or 0,
        "pending_consultant_approvals": pending_res.count or 0,
        "conversion_funnel": funnel,
    }


# ─── Analytics: Revenue ──────────────────────────────────────────────────────

@router.get("/analytics/revenue")
async def analytics_revenue(
    months: int = Query(12, ge=1, le=36, description="Months of history to include"),
    client: AsyncClient = Depends(get_client),
):
    """SSLCommerz BDT revenue aggregates."""
    # Filter payments by time window
    cutoff = (datetime.now(timezone.utc) - timedelta(days=months * 30)).isoformat()
    payments_res = await client.table("payments").select(
        "id, amount_bdt, product, status, created_at"
    ).gte("created_at", cutoff).execute()
    rows = payments_res.data or []

    total_paid = 0
    total_pending = 0
    total_failed = 0
    by_product: dict[str, int] = {}
    by_month: dict[str, int] = {}
    paid_count = 0

    for row in rows:
        amt = row.get("amount_bdt") or 0
        st = row.get("status", "")
        product = row.get("product", "other")
        created = row.get("created_at", "")

        if st == "paid":
            total_paid += amt
            paid_count += 1
            by_product[product] = by_product.get(product, 0) + amt
            # Group by YYYY-MM
            month_key = created[:7] if len(created) >= 7 else "unknown"
            by_month[month_key] = by_month.get(month_key, 0) + amt
        elif st in ("pending", "pending_validation"):
            total_pending += amt
        elif st == "failed":
            total_failed += amt

    total_count = len(rows)
    success_rate = (paid_count / total_count * 100) if total_count > 0 else 0.0
    avg_payment = (total_paid / paid_count) if paid_count > 0 else 0

    return {
        "total_paid_bdt": total_paid,
        "total_pending_bdt": total_pending,
        "total_failed_bdt": total_failed,
        "paid_count": paid_count,
        "total_transactions": total_count,
        "success_rate_pct": round(success_rate, 2),
        "avg_payment_bdt": round(avg_payment, 2),
        "revenue_by_product": by_product,
        "revenue_by_month": dict(sorted(by_month.items(), reverse=True)),
    }


# ─── Ghost Reads ─────────────────────────────────────────────────────────────

@router.get("/students/{student_id}/ghost")
async def ghost_student_profile(
    student_id: str,
    client: AsyncClient = Depends(get_client),
):
    """Full student profile with related data. Read-only, no timestamp side effects."""
    student_res = await client.table("students").select("*").eq("id", student_id).limit(1).execute()
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = student_res.data[0]

    # Fetch related data in parallel-safe manner
    apps_res = await client.table("applications").select(
        "*, programs(name, university_id, degree_level, field)"
    ).eq("student_id", student_id).order("created_at", desc=True).execute()

    docs_res = await client.table("documents").select("*").eq("student_id", student_id).execute()

    payments_res = await client.table("payments").select("*").eq("student_id", student_id).order("created_at", desc=True).execute()

    match_res = await client.table("match_cache").select("*").eq("student_id", student_id).limit(1).execute()

    return {
        "student": student,
        "applications": apps_res.data or [],
        "documents": docs_res.data or [],
        "payments": payments_res.data or [],
        "match_cache": match_res.data[0] if match_res.data else None,
    }


@router.patch("/students/{student_id}")
async def update_student(
    student_id: str,
    body: StudentUpdate,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Super-admin edit of a student profile. Audited via ghost_audit."""
    before_res = await client.table("students").select("*").eq("id", student_id).limit(1).execute()
    if not before_res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    before = before_res.data[0]

    update = body.model_dump(exclude_unset=True)
    if body.preferred_countries is not None:
        update["preferred_countries"] = [c.upper() for c in body.preferred_countries]

    if not update:
        return before

    res = await client.table("students").update(update).eq("id", student_id).execute()
    after = res.data[0] if res.data else before

    await ghost_audit(
        client, ghost_ctx, "update_student", "student", student_id,
        {k: before.get(k) for k in update.keys()}, update,
    )
    return after


@router.get("/applications/{application_id}/ghost")
async def ghost_application_detail(
    application_id: str,
    client: AsyncClient = Depends(get_client),
):
    """Full application detail with student and program info. Read-only."""
    app_res = await (
        client.table("applications")
        .select("*, students(id, full_name, phone, preferred_countries, preferred_degree), programs(name, university_id, degree_level, field, tuition_usd_per_year)")
        .eq("id", application_id)
        .limit(1)
        .execute()
    )
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")

    application = app_res.data[0]

    # If there's a program with a university_id, fetch university details
    program = application.get("programs")
    university = None
    if program and program.get("university_id"):
        uni_res = await (
            client.table("universities")
            .select("id, name, country, city, ranking_qs, tuition_usd_per_year")
            .eq("id", program["university_id"])
            .limit(1)
            .execute()
        )
        university = uni_res.data[0] if uni_res.data else None

    return {
        "application": application,
        "university": university,
    }


# ─── Activity Feed ────────────────────────────────────────────────────────────

@router.get("/activity-feed")
async def activity_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: AsyncClient = Depends(get_client),
):
    """Recent platform activity aggregated from audit logs, registrations, and payments."""
    offset = (page - 1) * page_size

    # Audit log entries (admin actions)
    audit_res = await (
        client.table("admin_audit_log")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    # Recent student registrations
    students_res = await (
        client.table("students")
        .select("id, full_name, created_at")
        .order("created_at", desc=True)
        .range(0, 9)
        .execute()
    )

    # Recent payments
    payments_res = await (
        client.table("payments")
        .select("id, student_id, amount_bdt, product, status, created_at")
        .order("created_at", desc=True)
        .range(0, 9)
        .execute()
    )

    return {
        "audit_log": {"items": audit_res.data or [], "total": audit_res.count or 0},
        "recent_registrations": students_res.data or [],
        "recent_payments": payments_res.data or [],
        "page": page,
        "page_size": page_size,
    }


# ─── Bulk Lead Assignment (Ghost Mode) ────────────────────────────────────────

@router.post("/leads/bulk-assign")
async def bulk_assign_leads(
    body: BulkAssignBody,
    ghost_ctx: GhostContext = Depends(get_ghost_context),
    client: AsyncClient = Depends(get_client),
):
    """Assign multiple leads at once. Ghost mode is the default behavior for
    this endpoint — all assignments appear as system/algorithm matches."""
    results = []
    errors = []

    for item in body.assignments:
        try:
            # Verify consultant
            c_res = await (
                client.table("consultants")
                .select("id, user_id, status")
                .eq("id", item.consultant_id)
                .limit(1)
                .execute()
            )
            if not c_res.data:
                errors.append({"application_id": item.application_id, "error": "Consultant not found"})
                continue
            if c_res.data[0]["status"] != "active":
                errors.append({"application_id": item.application_id, "error": "Consultant not active"})
                continue

            consultant = c_res.data[0]

            update = {
                "consultant_id": item.consultant_id,
                "agency_id": item.agency_id,
                "assigned_by": None if ghost_ctx.is_ghost else ghost_ctx.admin_user_id,
                "assigned_source": ghost_ctx.source_label if ghost_ctx.is_ghost else "admin",
            }

            res = await (
                client.table("applications")
                .update(update)
                .eq("id", item.application_id)
                .execute()
            )
            if not res.data:
                errors.append({"application_id": item.application_id, "error": "Application not found"})
                continue

            await ghost_audit(
                client, ghost_ctx, "bulk_assign_lead", "application",
                item.application_id, None,
                {"consultant_id": item.consultant_id, "agency_id": item.agency_id},
            )

            await ghost_notify_lead_assignment(
                client, item.application_id, consultant["user_id"], consultant["id"], ghost_ctx,
            )

            results.append({"application_id": item.application_id, "status": "assigned"})

        except Exception as exc:
            errors.append({"application_id": item.application_id, "error": str(exc)})

    return {
        "assigned": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }
