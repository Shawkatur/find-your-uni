"""
Messages API — real-time chat between students and consultants.

Student endpoints (JWT required):
  GET  /messages                  — list messages with assigned consultant
  POST /messages                  — send a message to consultant

Consultant endpoints (JWT required):
  GET  /students/{student_id}/messages   — list messages with a student
  POST /students/{student_id}/messages   — send a message to a student
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client
from app.models.responses import ChatMessageOut, ConsultantInfoResponse

router = APIRouter(tags=["messages"])


class MessageSend(BaseModel):
    content: str


async def _get_student_id(user: dict, client: AsyncClient) -> str:
    res = await client.table("students").select("id").eq("user_id", user["sub"]).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return res.data[0]["id"]


async def _get_consultant_for_student(student_id: str, client: AsyncClient) -> str | None:
    """Find the consultant assigned to this student via their most recent application."""
    res = await (
        client.table("applications")
        .select("consultant_id")
        .eq("student_id", student_id)
        .not_.is_("consultant_id", "null")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]["consultant_id"]
    return None


# ─── Student endpoints ────────────────────────────────────────────────────────

@router.get("/messages", response_model=list[ChatMessageOut])
async def student_get_messages(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
    limit: int = Query(50, ge=1, le=200),
    before: str | None = Query(None, description="ISO timestamp cursor — fetch messages before this time"),
):
    student_id = await _get_student_id(user, client)
    consultant_id = await _get_consultant_for_student(student_id, client)
    if not consultant_id:
        return []

    q = (
        client.table("messages")
        .select("id, student_id, consultant_id, sender_type, content, is_read, created_at")
        .eq("student_id", student_id)
        .eq("consultant_id", consultant_id)
    )
    if before:
        q = q.lt("created_at", before)
    res = await q.order("created_at", desc=True).limit(limit).execute()
    return list(reversed(res.data)) if res.data else []


@router.post("/messages", response_model=ChatMessageOut, status_code=201)
async def student_send_message(
    body: MessageSend,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    consultant_id = await _get_consultant_for_student(student_id, client)
    if not consultant_id:
        raise HTTPException(status_code=422, detail="No consultant assigned yet")

    res = await (
        client.table("messages")
        .insert({
            "student_id": student_id,
            "consultant_id": consultant_id,
            "sender_type": "student",
            "content": body.content.strip(),
        })
        .execute()
    )
    return res.data[0]


@router.get("/messages/consultant-info", response_model=ConsultantInfoResponse)
async def student_get_consultant_info(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(user, client)
    consultant_id = await _get_consultant_for_student(student_id, client)
    if not consultant_id:
        return {"assigned": False}

    res = await (
        client.table("consultants")
        .select("id, full_name, phone, role_title, whatsapp")
        .eq("id", consultant_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {"assigned": False}

    return {"assigned": True, "consultant": res.data[0]}


# ─── Consultant endpoints ─────────────────────────────────────────────────────

async def _verify_consultant_student_link(client: AsyncClient, consultant_id: str, student_id: str) -> None:
    """Verify the consultant is assigned to this student via an application."""
    link = await (
        client.table("applications")
        .select("id")
        .eq("student_id", student_id)
        .eq("consultant_id", consultant_id)
        .limit(1)
        .execute()
    )
    if not link.data:
        raise HTTPException(status_code=403, detail="Student is not assigned to you")


@router.get("/students/{student_id}/messages", response_model=list[ChatMessageOut])
async def consultant_get_messages(
    student_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
    limit: int = Query(50, ge=1, le=200),
    before: str | None = Query(None, description="ISO timestamp cursor — fetch messages before this time"),
):
    c_res = await client.table("consultants").select("id").eq("user_id", user["sub"]).limit(1).execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    consultant_id = c_res.data[0]["id"]

    await _verify_consultant_student_link(client, consultant_id, student_id)

    q = (
        client.table("messages")
        .select("id, student_id, consultant_id, sender_type, content, is_read, created_at")
        .eq("student_id", student_id)
        .eq("consultant_id", consultant_id)
    )
    if before:
        q = q.lt("created_at", before)
    res = await q.order("created_at", desc=True).limit(limit).execute()
    return list(reversed(res.data)) if res.data else []


@router.post("/students/{student_id}/messages", response_model=ChatMessageOut, status_code=201)
async def consultant_send_message(
    student_id: str,
    body: MessageSend,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    c_res = await client.table("consultants").select("id, full_name").eq("user_id", user["sub"]).limit(1).execute()
    if not c_res.data:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    consultant_id = c_res.data[0]["id"]

    await _verify_consultant_student_link(client, consultant_id, student_id)

    res = await (
        client.table("messages")
        .insert({
            "student_id": student_id,
            "consultant_id": consultant_id,
            "sender_type": "consultant",
            "content": body.content.strip(),
        })
        .execute()
    )
    return res.data[0]
