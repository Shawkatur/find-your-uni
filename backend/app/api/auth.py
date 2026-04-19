"""
POST /auth/student/register    — create student profile after Supabase signup
POST /auth/consultant/register — create consultant profile + link to agency
GET  /auth/me                  — return current user's profile
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client
from app.db.queries import get_student_by_user_id
from app.models.student import StudentCreate, StudentOut, StudentUpdate
from app.models.application import ConsultantCreate, ConsultantOut

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_REF_CODE = "admin"


@router.post("/student/register", response_model=StudentOut, status_code=201)
async def register_student(
    body: StudentCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    user_id: str = user["sub"]

    # Prevent duplicate profiles
    existing = await get_student_by_user_id(client, user_id)
    if existing:
        raise HTTPException(status_code=409, detail="Student profile already exists")

    row = {
        "user_id":             user_id,
        "full_name":           body.full_name,
        "phone":               body.phone,
        "academic_history":    body.academic_history.model_dump(),
        "test_scores":         body.test_scores.model_dump(),
        "budget_usd_per_year": body.budget_usd_per_year,
        "preferred_countries": body.preferred_countries,
        "preferred_degree":    body.preferred_degree,
        "preferred_fields":    body.preferred_fields,
    }
    if body.ref_code:
        row["referral_source"] = body.ref_code

    res = await client.table("students").insert(row).execute()
    student = res.data[0]

    # Always create a lead application so the student lands in the admin
    # portal's lead queue immediately. If a ref_code is present we route to
    # the matching consultant; otherwise it stays unassigned (admin pool).
    await _create_lead_application(client, student["id"], body.ref_code or ADMIN_REF_CODE)

    return student


async def _create_lead_application(client: AsyncClient, student_id: str, ref_code: str) -> None:
    """Insert a lead-stage application linked to the tracking code's consultant."""
    lead: dict = {
        "student_id": student_id,
        "status":     "lead",
    }

    if ref_code == ADMIN_REF_CODE:
        # Unassigned lead — goes to admin pool
        pass
    else:
        link_res = await (
            client.table("tracking_links")
            .select("consultant_id, agency_id")
            .eq("code", ref_code)
            .limit(1)
            .execute()
        )
        if link_res.data:
            lead["consultant_id"] = link_res.data[0]["consultant_id"]
            lead["agency_id"]     = link_res.data[0]["agency_id"]

    try:
        await client.table("applications").insert(lead).execute()
    except Exception as exc:
        from app.core.logger import logger
        logger.error("Failed to create lead application for student %s (ref_code=%s): %s", student_id, ref_code, exc)


@router.post("/consultant/register", response_model=ConsultantOut, status_code=201)
async def register_consultant(
    body: ConsultantCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    user_id: str = user["sub"]

    # Prevent duplicate
    existing = await client.table("consultants").select("id").eq("user_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Consultant profile already exists")

    # Resolve agency: create new one from agency_name, or use existing agency_id
    agency_id = body.agency_id
    if not agency_id and body.agency_name:
        agency_res = await client.table("agencies").insert({"name": body.agency_name}).execute()
        agency_id = agency_res.data[0]["id"]
    elif agency_id:
        agency_res = await client.table("agencies").select("id").eq("id", agency_id).limit(1).execute()
        if not agency_res.data:
            raise HTTPException(status_code=404, detail="Agency not found")
    else:
        raise HTTPException(status_code=422, detail="Provide agency_id or agency_name")

    row = {
        "user_id":   user_id,
        "agency_id": agency_id,
        "role":      body.role,
        "full_name": body.full_name,
        "status":    "pending",
    }
    if body.phone:
        row["phone"] = body.phone
    if body.role_title:
        row["role_title"] = body.role_title
    res = await client.table("consultants").insert(row).execute()

    # Set role in Supabase auth metadata (skip in BYPASS_AUTH mode)
    from app.core.config import get_settings as _gs
    if not _gs().BYPASS_AUTH:
        await client.auth.admin.update_user_by_id(
            user_id,
            {"app_metadata": {"role": "consultant", "agency_id": agency_id}},
        )
    return res.data[0]


@router.patch("/student/profile", response_model=StudentOut)
async def update_student_profile(
    body: StudentUpdate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    update: dict = {}
    if body.full_name is not None:
        update["full_name"] = body.full_name
    if body.phone is not None:
        update["phone"] = body.phone
    if body.academic_history is not None:
        update["academic_history"] = body.academic_history.model_dump()
    if body.test_scores is not None:
        update["test_scores"] = body.test_scores.model_dump()
    if body.budget_usd_per_year is not None:
        update["budget_usd_per_year"] = body.budget_usd_per_year
    if body.preferred_countries is not None:
        update["preferred_countries"] = body.preferred_countries
    if body.preferred_degree is not None:
        update["preferred_degree"] = body.preferred_degree
    if body.preferred_fields is not None:
        update["preferred_fields"] = body.preferred_fields
    if body.push_enabled is not None:
        update["push_enabled"] = body.push_enabled
    if body.notify_status_changes is not None:
        update["notify_status_changes"] = body.notify_status_changes
    if body.notify_deadlines is not None:
        update["notify_deadlines"] = body.notify_deadlines
    if body.onboarding_completed is not None:
        update["onboarding_completed"] = body.onboarding_completed

    if not update:
        raise HTTPException(status_code=422, detail="No valid fields to update")

    res = await client.table("students").update(update).eq("id", student["id"]).execute()

    # Backfill: if this student has no application row at all, create an
    # unassigned lead so they show up in the admin portal's lead queue.
    # Covers existing students who registered before lead-on-register shipped.
    existing_apps = await (
        client.table("applications")
        .select("id")
        .eq("student_id", student["id"])
        .limit(1)
        .execute()
    )
    if not existing_apps.data:
        await _create_lead_application(client, student["id"], ADMIN_REF_CODE)

    return res.data[0]


@router.get("/me")
async def get_me(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    user_id: str = user["sub"]
    role = (user.get("app_metadata") or {}).get("role", "student")

    if role == "consultant":
        res = await client.table("consultants").select(
            "id, user_id, agency_id, role, full_name, phone, role_title, whatsapp, status, created_at, "
            "agencies(id, name, license_no, address, city, website, avg_rating, review_count, is_active, created_at)"
        ).eq("user_id", user_id).single().execute()
        return {"role": "consultant", "profile": res.data}
    else:
        student = await get_student_by_user_id(client, user_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found. Please complete registration.")
        return {"role": "student", "profile": student}
