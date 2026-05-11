"""
POST /auth/student/register    — create student profile after Supabase signup
POST /auth/consultant/register — create consultant profile + link to agency
POST /auth/verify-otp          — promote unverified lead to lead after OTP
GET  /auth/me                  — return current user's profile
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AsyncClient
import httpx

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db.client import get_client
from app.db.queries import get_student_by_user_id
from app.models.student import StudentCreate, StudentOut, StudentUpdate
from app.models.application import ConsultantCreate, ConsultantOut

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_REF_CODE = "admin"

DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "guerrillamail.com", "throwaway.email",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "dispostable.com", "trashmail.com", "fakeinbox.com", "tempail.com",
    "mailnesia.com", "maildrop.cc", "discard.email", "temp-mail.org",
    "getnada.com", "10minutemail.com", "mohmal.com", "burnermail.io",
}


async def _verify_turnstile(token: str) -> bool:
    """Verify a Cloudflare Turnstile token. Returns True if valid."""
    secret = get_settings().TURNSTILE_SECRET_KEY
    if not secret:
        return True
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": secret, "response": token},
        )
        return resp.json().get("success", False)


@router.post("/student/register", response_model=StudentOut, status_code=201)
async def register_student(
    body: StudentCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    user_id: str = user["sub"]

    # --- Layer 1: Turnstile bot check ---
    if get_settings().TURNSTILE_SECRET_KEY:
        if not body.turnstile_token:
            raise HTTPException(status_code=403, detail="Bot verification required")
        if not await _verify_turnstile(body.turnstile_token):
            raise HTTPException(status_code=403, detail="Bot verification failed")

    # --- Layer 2: Disposable email check ---
    email = (user.get("email") or "").lower()
    domain = email.split("@")[-1] if "@" in email else ""
    if domain in DISPOSABLE_DOMAINS:
        raise HTTPException(status_code=422, detail="Please provide a valid personal email address")

    # Prevent duplicate profiles
    existing = await get_student_by_user_id(client, user_id)
    if existing:
        raise HTTPException(status_code=409, detail="Student profile already exists")

    row = {
        "user_id":             user_id,
        "full_name":           body.full_name,
        "phone":               body.phone,
        "nationality":         body.nationality,
        "date_of_birth":       str(body.date_of_birth) if body.date_of_birth else None,
        "gender":              body.gender,
        "academic_history":    body.academic_history.model_dump(),
        "test_scores":         body.test_scores.model_dump(),
        "personal_details":    body.personal_details.model_dump(),
        "work_experience":     [w.model_dump() for w in body.work_experience],
        "budget_usd_per_year": body.budget_usd_per_year,
        "preferred_countries": body.preferred_countries,
        "preferred_degree":    body.preferred_degree,
        "preferred_fields":    body.preferred_fields,
    }
    if body.ref_code:
        row["referral_source"] = body.ref_code
        if body.ref_code != ADMIN_REF_CODE:
            row["pipeline_status"] = "invited"

    res = await client.table("students").insert(row).execute()
    student = res.data[0]

    # --- Layer 3: Create as unverified until OTP confirmed ---
    await _create_lead_application(client, student["id"], body.ref_code or ADMIN_REF_CODE)

    return student


async def _create_lead_application(client: AsyncClient, student_id: str, ref_code: str) -> None:
    """Insert an unverified application linked to the tracking code's consultant."""
    lead: dict = {
        "student_id": student_id,
        "status":     "unverified",
    }

    if ref_code == ADMIN_REF_CODE:
        lead["assigned_source"] = "admin"
    else:
        link_res = await (
            client.table("tracking_links")
            .select("consultant_id, agency_id")
            .eq("code", ref_code)
            .limit(1)
            .execute()
        )
        if link_res.data:
            lead["consultant_id"]   = link_res.data[0]["consultant_id"]
            lead["agency_id"]       = link_res.data[0]["agency_id"]
            lead["assigned_source"] = "tracking_link"

    try:
        await client.table("applications").insert(lead).execute()
    except Exception as exc:
        from app.core.logger import logger
        logger.error("Failed to create lead application for student %s (ref_code=%s): %s", student_id, ref_code, exc)


@router.post("/verify-otp")
async def verify_otp_promote_lead(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """After Supabase email/OTP verification, promote unverified → lead."""
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    res = await (
        client.table("applications")
        .update({"status": "lead"})
        .eq("student_id", student["id"])
        .eq("status", "unverified")
        .execute()
    )
    if not res.data:
        return {"promoted": 0, "message": "No unverified leads found (already verified)"}
    return {"promoted": len(res.data), "message": "Lead verified successfully"}


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
    fields = body.model_fields_set
    if "full_name" in fields:
        update["full_name"] = body.full_name
    if "phone" in fields:
        update["phone"] = body.phone or None
    if "nationality" in fields:
        update["nationality"] = body.nationality or None
    if "date_of_birth" in fields:
        update["date_of_birth"] = str(body.date_of_birth) if body.date_of_birth else None
    if "gender" in fields:
        update["gender"] = body.gender
    if "academic_history" in fields:
        update["academic_history"] = body.academic_history.model_dump() if body.academic_history else None
    if "test_scores" in fields:
        update["test_scores"] = body.test_scores.model_dump() if body.test_scores else None
    if "personal_details" in fields:
        update["personal_details"] = body.personal_details.model_dump() if body.personal_details else None
    if "work_experience" in fields:
        update["work_experience"] = [w.model_dump() for w in body.work_experience] if body.work_experience else []
    if "budget_usd_per_year" in fields:
        update["budget_usd_per_year"] = body.budget_usd_per_year
    if "preferred_countries" in fields:
        update["preferred_countries"] = body.preferred_countries
    if "preferred_degree" in fields:
        update["preferred_degree"] = body.preferred_degree
    if "preferred_fields" in fields:
        update["preferred_fields"] = body.preferred_fields
    if "push_enabled" in fields:
        update["push_enabled"] = body.push_enabled
    if "notify_status_changes" in fields:
        update["notify_status_changes"] = body.notify_status_changes
    if "notify_deadlines" in fields:
        update["notify_deadlines"] = body.notify_deadlines
    if "onboarding_completed" in fields:
        update["onboarding_completed"] = body.onboarding_completed

    if not update:
        raise HTTPException(status_code=422, detail="No valid fields to update")

    try:
        res = await client.table("students").update(update).eq("id", student["id"]).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Database update failed")

    if not res.data:
        raise HTTPException(status_code=500, detail="Update returned no data")

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
        ).eq("user_id", user_id).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Consultant profile not found. Please complete registration.")
        return {"role": "consultant", "profile": res.data[0]}
    else:
        student = await get_student_by_user_id(client, user_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student profile not found. Please complete registration.")
        return {"role": "student", "profile": student}
