"""
POST /push/register    — upsert student push token (called on app launch)
DELETE /push/register  — remove push token on logout
"""
from fastapi import APIRouter, Depends, HTTPException
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
    """Upsert push token for the authenticated student."""
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    await (
        client.table("push_tokens")
        .upsert(
            {
                "student_id": student["id"],
                "token": body.token,
                "platform": body.platform,
            },
            on_conflict="student_id,token",
        )
        .execute()
    )


@router.delete("/register", status_code=204)
async def unregister_push_token(
    body: PushTokenBody,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """Remove push token on logout."""
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        return  # silent — student might not have a profile yet

    await (
        client.table("push_tokens")
        .delete()
        .eq("student_id", student["id"])
        .eq("token", body.token)
        .execute()
    )
