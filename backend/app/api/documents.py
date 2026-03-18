"""
POST /documents/upload  — upload a document to Supabase Storage + record in DB
GET  /documents         — list my documents (with signed download URLs)
DELETE /documents/{id}  — delete a document
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from app.core.config import get_settings
from app.core.security import get_current_user
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


async def _signed_url(client: AsyncClient, key: str, settings) -> str:
    """Return a 1-hour signed download URL; fall back to public URL on error."""
    try:
        res = await client.storage.from_(BUCKET).create_signed_url(key, 3600)
        return res["signedURL"]
    except Exception:
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{key}"


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

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    original_name = file.filename or "document"
    ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "bin"
    doc_id = str(uuid.uuid4())
    key = f"{student['id']}/{doc_id}.{ext}"
    content_type = file.content_type or "application/octet-stream"

    await _ensure_bucket(client)
    try:
        await client.storage.from_(BUCKET).upload(
            key, content, {"contentType": content_type}
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {exc}")

    url = await _signed_url(client, key, settings)

    await client.table("documents").insert({
        "id":             doc_id,
        "student_id":     student["id"],
        "doc_type":       doc_type,
        "storage_url":    key,
        "application_id": application_id,
    }).execute()

    return {
        "document_id":  doc_id,
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

    query = client.table("documents").select("*").eq("student_id", student["id"])
    if application_id:
        query = query.eq("application_id", application_id)

    res = await query.order("uploaded_at", desc=True).execute()
    docs = res.data or []

    for doc in docs:
        doc["url"]      = await _signed_url(client, doc["storage_url"], settings)
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

    try:
        await client.storage.from_(BUCKET).remove([res.data["storage_url"]])
    except Exception as exc:
        print(f"[documents] Storage delete failed (non-fatal): {exc}")

    await client.table("documents").delete().eq("id", doc_id).execute()
