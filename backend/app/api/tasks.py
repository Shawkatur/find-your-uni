"""
CRUD for application tasks/deadlines.

GET    /tasks?application_id=...  — list tasks for an application
POST   /tasks                     — create a task
PATCH  /tasks/{id}                — update a task (title, due_date, is_completed)
DELETE /tasks/{id}                — delete a task
GET    /tasks/upcoming            — student's upcoming deadlines across all applications
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client
from app.models.responses import TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    application_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None


async def _get_student_id(client: AsyncClient, user_id: str) -> str:
    res = await client.table("students").select("id").eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return res.data[0]["id"]


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    application_id: str = Query(...),
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(client, user["sub"])
    res = await (
        client.table("application_tasks")
        .select("*")
        .eq("application_id", application_id)
        .eq("student_id", student_id)
        .order("due_date", desc=False, nulls_first=False)
        .order("created_at", desc=False)
        .execute()
    )
    return res.data or []


@router.get("/upcoming")
async def upcoming_tasks(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
    limit: int = Query(10, ge=1, le=50),
):
    student_id = await _get_student_id(client, user["sub"])
    res = await (
        client.table("application_tasks")
        .select("*, applications(university_id, universities(name))")
        .eq("student_id", student_id)
        .eq("is_completed", False)
        .not_.is_("due_date", "null")
        .order("due_date", desc=False)
        .limit(limit)
        .execute()
    )
    return res.data or []


@router.post("", status_code=201, response_model=TaskOut)
async def create_task(
    body: TaskCreate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(client, user["sub"])
    # Verify application ownership
    app_check = await (
        client.table("applications")
        .select("id")
        .eq("id", body.application_id)
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )
    if not app_check.data:
        raise HTTPException(status_code=403, detail="Application not found or not yours")

    row = {
        "application_id": body.application_id,
        "student_id": student_id,
        "title": body.title,
        "description": body.description,
        "due_date": body.due_date.isoformat() if body.due_date else None,
        "created_by": "student",
    }
    res = await client.table("application_tasks").insert(row).execute()
    return res.data[0] if res.data else row


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(client, user["sub"])
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "is_completed" in updates:
        if updates["is_completed"]:
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            updates["completed_at"] = None

    if "due_date" in updates and updates["due_date"]:
        updates["due_date"] = updates["due_date"].isoformat()

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await (
        client.table("application_tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("student_id", student_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return res.data[0]


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_id = await _get_student_id(client, user["sub"])
    res = await (
        client.table("application_tasks")
        .delete()
        .eq("id", task_id)
        .eq("student_id", student_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found")
