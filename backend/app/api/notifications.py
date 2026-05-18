"""
GET   /notifications           — list user's notifications (paginated)
GET   /notifications/unread    — unread count
PATCH /notifications/{id}/read — mark one as read
PATCH /notifications/read-all  — mark all as read
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client
from app.models.responses import NotificationOut, CountResponse, OkResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    res = await (
        client.table("notifications")
        .select("id, title, body, type, is_read, data, created_at")
        .eq("user_id", user["sub"])
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return res.data or []


@router.get("/unread", response_model=CountResponse)
async def unread_count(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    res = await (
        client.table("notifications")
        .select("id", count="exact")
        .eq("user_id", user["sub"])
        .eq("is_read", False)
        .execute()
    )
    return {"count": res.count or 0}


@router.patch("/{notification_id}/read", response_model=OkResponse)
async def mark_read(
    notification_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    res = await (
        client.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", user["sub"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}


@router.patch("/read-all", response_model=OkResponse)
async def mark_all_read(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    await (
        client.table("notifications")
        .update({"is_read": True})
        .eq("user_id", user["sub"])
        .eq("is_read", False)
        .execute()
    )
    return {"ok": True}
