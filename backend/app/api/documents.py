"""
POST  /documents/upload            — upload a document to Supabase Storage + record in DB
GET   /documents                   — list my documents (with signed download URLs)
DELETE /documents/{id}             — delete a document
GET   /documents/verification-queue — consultant: pending docs for their students
PATCH /documents/{id}/verify       — consultant: verify or reject a document
"""
from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logger import logger
from app.core.security import get_current_user, get_active_consultant_dep
from app.db.client import get_client
from app.db.queries import get_student_by_user_id
from supabase import AsyncClient

router = APIRouter(prefix="/documents", tags=["documents"])

BUCKET = "documents"
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

VALID_DOC_TYPES = {
    "passport", "transcript", "sop", "lor", "cv",
    "ielts_cert", "toefl_cert", "ielts", "toefl",
    "gre", "gmat", "nid", "other",
    "pte", "duolingo", "sat",
}

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf", "image/jpeg", "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def _ensure_bucket(client: AsyncClient) -> None:
    """Create the Supabase Storage bucket if it doesn't exist (idempotent)."""
    try:
        await client.storage.create_bucket(
            BUCKET,
            options={"public": False, "fileSizeLimit": MAX_SIZE_BYTES},
        )
    except Exception:
        pass  # bucket already exists


async def _signed_url(client: AsyncClient, key: str, settings) -> str | None:
    """Return a 1-hour signed download URL, or None if signing fails."""
    try:
        res = await client.storage.from_(BUCKET).create_signed_url(key, 3600)
        return res["signedURL"]
    except Exception:
        logger.warning("Failed to generate signed URL for key: %s", key)
        return None


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    application_id: str | None = Form(None),
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    settings = get_settings()

    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found. Please complete registration first.")

    if doc_type not in VALID_DOC_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid doc_type: {doc_type!r}")

    # Read in chunks to avoid buffering oversized files entirely into memory
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 256)  # 256 KB chunks
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
        chunks.append(chunk)
    content = b"".join(chunks)

    original_name = file.filename or "document"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "bin"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=f"File type '.{ext}' not allowed. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES and content_type != "application/octet-stream":
        raise HTTPException(status_code=422, detail=f"Content type '{content_type}' not allowed")
    doc_id = str(uuid.uuid4())
    key = f"{student['id']}/{doc_id}.{ext}"

    await _ensure_bucket(client)
    try:
        await client.storage.from_(BUCKET).upload(
            key, content, {"contentType": content_type}
        )
    except Exception as exc:
        logger.error("Storage upload failed for student %s: %s", student['id'], exc)
        raise HTTPException(status_code=500, detail="Storage upload failed")

    url = await _signed_url(client, key, settings)

    await client.table("documents").insert({
        "id":             doc_id,
        "student_id":     student["id"],
        "doc_type":       doc_type,
        "storage_url":    key,
        "application_id": application_id,
    }).execute()

    return {
        "id":           doc_id,
        "storage_url":  key,
        "url":          url,
        "filename":     original_name,
    }


@router.get("", response_model=list[dict])
async def list_documents(
    application_id: str | None = None,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    settings = get_settings()
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    query = client.table("documents").select(
        "id, student_id, doc_type, storage_url, application_id, uploaded_at, verification_status, rejection_reason"
    ).eq("student_id", student["id"])
    if application_id:
        query = query.eq("application_id", application_id)

    res = await query.order("uploaded_at", desc=True).execute()
    docs = res.data or []

    # Generate signed URLs in parallel instead of sequentially (N+1 fix)
    urls = await asyncio.gather(
        *[_signed_url(client, doc["storage_url"], settings) for doc in docs]
    )
    for doc, url in zip(docs, urls):
        doc["url"] = url
        doc["filename"] = doc["storage_url"].split("/")[-1]

    return docs


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    res = (
        await client.table("documents")
        .select("id, storage_url")
        .eq("id", doc_id)
        .eq("student_id", student["id"])
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")

    await client.table("documents").delete().eq("id", doc_id).execute()

    try:
        await client.storage.from_(BUCKET).remove([res.data["storage_url"]])
    except Exception as exc:
        logger.error("Storage delete failed (non-fatal) for doc %s: %s", doc_id, exc)


# ─── Consultant Document Verification ────────────────────────────────────────

get_consultant = get_active_consultant_dep()


class VerifyDocumentBody(BaseModel):
    status: Literal["verified", "rejected"]
    reason: str | None = None


@router.get("/verification-queue", response_model=list[dict])
async def list_verification_queue(
    consultant: dict = Depends(get_consultant),
    client: AsyncClient = Depends(get_client),
):
    """Return all pending-review documents for students assigned to this consultant."""
    settings = get_settings()
    consultant_id = consultant["id"]

    apps_res = await (
        client.table("applications")
        .select("student_id")
        .eq("consultant_id", consultant_id)
        .execute()
    )
    if not apps_res.data:
        return []

    student_ids = list({a["student_id"] for a in apps_res.data})

    docs_res = await (
        client.table("documents")
        .select("id, student_id, doc_type, storage_url, uploaded_at, verification_status, rejection_reason, students(full_name)")
        .in_("student_id", student_ids)
        .eq("verification_status", "pending_review")
        .order("uploaded_at", desc=True)
        .execute()
    )
    docs = docs_res.data or []

    urls = await asyncio.gather(
        *[_signed_url(client, doc["storage_url"], settings) for doc in docs]
    )
    for doc, url in zip(docs, urls):
        doc["url"] = url
        doc["filename"] = doc["storage_url"].split("/")[-1]
        student_data = doc.pop("students", None) or {}
        doc["student_name"] = student_data.get("full_name", "Unknown")

    return docs


@router.patch("/{doc_id}/verify", response_model=dict)
async def verify_document(
    doc_id: str,
    body: VerifyDocumentBody,
    consultant: dict = Depends(get_consultant),
    client: AsyncClient = Depends(get_client),
):
    """Verify or reject a student document."""
    consultant_id = consultant["id"]

    doc_res = await (
        client.table("documents")
        .select("id, student_id, verification_status")
        .eq("id", doc_id)
        .limit(1)
        .execute()
    )
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = doc_res.data[0]

    app_check = await (
        client.table("applications")
        .select("id")
        .eq("consultant_id", consultant_id)
        .eq("student_id", doc["student_id"])
        .limit(1)
        .execute()
    )
    if not app_check.data:
        raise HTTPException(status_code=403, detail="Student is not assigned to you")

    if body.status == "rejected" and not body.reason:
        raise HTTPException(status_code=422, detail="Rejection reason is required")

    update: dict = {
        "verification_status": body.status,
        "verified_by": consultant_id,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "rejection_reason": body.reason if body.status == "rejected" else None,
    }

    res = await (
        client.table("documents")
        .update(update)
        .eq("id", doc_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return res.data[0]
