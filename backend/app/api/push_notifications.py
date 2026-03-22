"""
POST /push/register    — upsert push token for any authenticated user (called on app launch)
DELETE /push/register  — remove push token on logout
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import AsyncClient
from typing import Literal

from app.core.security import get_current_user
from app.db.client import get_client
from app.db.queries import get_student_by_user_id

router = APIRouter(prefix="/push", tags=["push"])


class PushTokenBody(BaseModel):
    token: str
    platform: Literal["ios", "android"]


@router.post("/register", status_code=204)
async def register_push_token(
    body: PushTokenBody,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Upsert push token for the authenticated user (student or consultant)."""
    user_id = user["sub"]
    role = user.get("app_metadata", {}).get("role", "student")

    row: dict = {
        "user_id": user_id,
        "token": body.token,
        "platform": body.platform,
    }

    # Keep student_id populated for backwards compatibility
    if role == "student":
        student = await get_student_by_user_id(client, user_id)
        if student:
            row["student_id"] = student["id"]

    await (
        client.table("push_tokens")
        .upsert(row, on_conflict="user_id,token", ignore_duplicates=False)
        .execute()
    )


@router.delete("/register", status_code=204)
async def unregister_push_token(
    body: PushTokenBody,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Remove push token on logout."""
    await (
        client.table("push_tokens")
        .delete()
        .eq("user_id", user["sub"])
        .eq("token", body.token)
        .execute()
    )
