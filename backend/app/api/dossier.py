"""
POST /dossier/super-admin   — super admin downloads ZIP of student dossiers
POST /dossier/consultant    — consultant downloads ZIP (scoped to their agency)
"""
from __future__ import annotations

import io
import json
import re
import zipfile
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from supabase import AsyncClient

from app.core.config import get_settings
from app.core.logger import logger
from app.core.security import (
    get_active_consultant_dep,
    require_admin_secret,
    require_super_admin,
)
from app.db.client import get_client

router = APIRouter(prefix="/dossier", tags=["dossier"])

BUCKET = "documents"
MAX_STUDENTS = 10


# ─── Request Model ───────────────────────────────────────────────────────────

class DossierRequest(BaseModel):
    student_ids: list[str] = Field(min_length=1, max_length=MAX_STUDENTS)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _sanitize_filename(name: str) -> str:
    """Remove characters unsafe for ZIP paths."""
    return re.sub(r'[^\w\s\-]', '', name).strip().replace(' ', '_') or "student"


def _format_profile_summary(student: dict) -> str:
    """Generate a human-readable text summary of a student profile."""
    academic: dict = student.get("academic_history") or {}
    scores: dict = student.get("test_scores") or {}
    countries = student.get("preferred_countries") or []
    fields = student.get("preferred_fields") or []

    lines = [
        "STUDENT DOSSIER",
        "=" * 50,
        f"Name:                {student.get('full_name', 'N/A')}",
        f"Phone:               {student.get('phone') or 'N/A'}",
        f"Preferred Degree:    {student.get('preferred_degree') or 'N/A'}",
        f"Preferred Countries: {', '.join(countries) if countries else 'N/A'}",
        f"Preferred Fields:    {', '.join(fields) if fields else 'N/A'}",
        f"Budget (USD/year):   {student.get('budget_usd_per_year') or 'N/A'}",
        "",
        "ACADEMIC HISTORY",
        "-" * 50,
    ]

    if academic:
        for key, val in academic.items():
            label = key.replace("_", " ").title()
            lines.append(f"  {label}: {val}")
    else:
        lines.append("  N/A")

    lines += [
        "",
        "TEST SCORES",
        "-" * 50,
    ]

    if scores:
        for key, val in scores.items():
            if val is not None:
                lines.append(f"  {key.upper()}: {val}")
    else:
        lines.append("  N/A")

    lines += [
        "",
        "-" * 50,
        f"Profile Created: {student.get('created_at', 'N/A')}",
        f"Dossier Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    ]

    return "\n".join(lines)


async def _download_document(client: AsyncClient, storage_url: str) -> bytes | None:
    """Download a file from Supabase Storage. Returns bytes or None on failure."""
    try:
        res = await client.storage.from_(BUCKET).download(storage_url)
        return res
    except Exception as exc:
        logger.warning("Failed to download document %s: %s", storage_url, exc)
        return None


async def _build_zip(student_ids: list[str], client: AsyncClient) -> io.BytesIO:
    """Build an in-memory ZIP with a subfolder per student containing
    profile_summary.txt and all uploaded documents."""
    buf = io.BytesIO()

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for sid in student_ids:
            # Fetch student profile
            student_res = await (
                client.table("students")
                .select("*")
                .eq("id", sid)
                .limit(1)
                .execute()
            )
            if not student_res.data:
                zf.writestr(f"STUDENT_NOT_FOUND_{sid[:8]}.txt", f"No student found with id: {sid}")
                continue

            student = student_res.data[0]
            folder = f"{_sanitize_filename(student.get('full_name', 'unknown'))}_{sid[:8]}"

            # Write profile summary
            summary = _format_profile_summary(student)
            zf.writestr(f"{folder}/profile_summary.txt", summary)

            # Fetch and write documents
            docs_res = await (
                client.table("documents")
                .select("id, doc_type, storage_url")
                .eq("student_id", sid)
                .execute()
            )
            for doc in (docs_res.data or []):
                storage_url = doc.get("storage_url", "")
                doc_type = doc.get("doc_type", "document")
                doc_id = doc.get("id", "")[:8]

                # Extract extension from storage_url
                ext = storage_url.rsplit(".", 1)[-1] if "." in storage_url else "bin"

                content = await _download_document(client, storage_url)
                if content is not None:
                    zf.writestr(f"{folder}/{doc_type}_{doc_id}.{ext}", content)
                else:
                    zf.writestr(
                        f"{folder}/{doc_type}_{doc_id}_DOWNLOAD_FAILED.txt",
                        f"Failed to download: {storage_url}",
                    )

    total_size = buf.tell()
    if total_size > 50 * 1024 * 1024:
        logger.warning("Large dossier ZIP generated: %.1f MB", total_size / (1024 * 1024))

    buf.seek(0)
    return buf


def _zip_response(buf: io.BytesIO, filename: str = "student_dossiers.zip") -> StreamingResponse:
    """Wrap a BytesIO buffer in a StreamingResponse for ZIP download."""
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post(
    "/super-admin",
    dependencies=[Depends(require_super_admin()), Depends(require_admin_secret)],
)
async def download_dossier_super_admin(
    body: DossierRequest,
    client: AsyncClient = Depends(get_client),
):
    """Super admin: download a ZIP of student dossiers (max 10)."""
    buf = await _build_zip(body.student_ids, client)
    return _zip_response(buf)


get_consultant = get_active_consultant_dep()


@router.post("/consultant")
async def download_dossier_consultant(
    body: DossierRequest,
    consultant: dict = Depends(get_consultant),
    client: AsyncClient = Depends(get_client),
):
    """Consultant: download dossiers for students in their agency only (max 10)."""
    agency_id = consultant["agency_id"]

    # Verify every requested student belongs to this consultant's agency
    for sid in body.student_ids:
        check = await (
            client.table("applications")
            .select("id")
            .eq("student_id", sid)
            .eq("agency_id", agency_id)
            .limit(1)
            .execute()
        )
        if not check.data:
            raise HTTPException(
                status_code=403,
                detail=f"Student {sid[:8]}... is not linked to your agency",
            )

    buf = await _build_zip(body.student_ids, client)
    return _zip_response(buf)
