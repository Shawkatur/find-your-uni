"""
Ghost Mode utilities for Super Admin stealth operations.

- ghost_audit: logs admin actions with ghost/source metadata
- ghost_notify_lead_assignment: sends masked lead assignment notifications
- ghost_read: future-proof read helper (SELECTs are inherently ghost-safe)
"""
from __future__ import annotations

from supabase import AsyncClient

from app.core.logger import logger
from app.core.security import GhostContext
from app.services.push_service import send_push, get_tokens_by_user_id


async def ghost_audit(
    client: AsyncClient,
    ghost_ctx: GhostContext,
    action: str,
    resource_type: str,
    resource_id: str | None,
    old_value: dict | None,
    new_value: dict | None,
) -> None:
    """Insert an audit row that always records the real admin identity.
    The is_ghost flag and source_label track what was shown externally."""
    try:
        await client.table("admin_audit_log").insert({
            "admin_user_id": ghost_ctx.admin_user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "old_value": old_value,
            "new_value": new_value,
            "is_ghost": ghost_ctx.is_ghost,
            "source_label": ghost_ctx.source_label if ghost_ctx.is_ghost else "admin",
        }).execute()
    except Exception as exc:
        logger.error(
            "Ghost audit insert failed (action=%s, resource=%s/%s): %s",
            action, resource_type, resource_id, exc,
        )


async def ghost_notify_lead_assignment(
    client: AsyncClient,
    application_id: str,
    consultant_user_id: str,
    consultant_id: str,
    ghost_ctx: GhostContext,
) -> None:
    """Notify a consultant about a new lead assignment.
    In ghost mode the notification appears as an automated system event."""
    if ghost_ctx.is_ghost:
        event_type = "system_match"
        title = "New Lead Matched"
        body = "A new student has been matched to your profile."
    else:
        event_type = "lead_assigned"
        title = "Lead Assigned"
        body = "A new lead has been assigned to you."

    # 1. Supabase Realtime broadcast to consultant
    channel = client.channel(f"consultant:{consultant_user_id}")
    try:
        await channel.subscribe()
        await channel.send_broadcast(
            event=event_type,
            payload={
                "application_id": application_id,
                "source": "system_match" if ghost_ctx.is_ghost else "admin",
                "message": body,
            },
        )
    except Exception as exc:
        logger.error("Ghost realtime broadcast failed for application %s: %s", application_id, exc)
    finally:
        await client.remove_channel(channel)

    # 2. Expo Push notification to consultant (if they have tokens)
    try:
        tokens = await get_tokens_by_user_id(client, consultant_user_id)
        if tokens:
            await send_push(
                tokens=tokens,
                title=title,
                body=body,
                data={
                    "application_id": application_id,
                    "type": event_type,
                },
            )
    except Exception as exc:
        logger.error("Ghost push notification failed for consultant %s: %s", consultant_id, exc)


async def ghost_read(
    client: AsyncClient,
    table: str,
    select: str,
    filters: dict,
) -> list:
    """Perform a ghost-safe read. Currently a passthrough since SELECT queries
    do not trigger updated_at triggers. When messaging/is_read/last_seen are
    added, this function will skip those side-effect updates."""
    q = client.table(table).select(select)
    for key, value in filters.items():
        q = q.eq(key, value)
    res = await q.execute()
    return res.data or []
