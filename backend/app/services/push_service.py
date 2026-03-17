"""
Expo Push Notification service.
Wraps the Expo Push API (https://exp.host/--/api/v2/push/send).
No FCM/APNs credentials needed — Expo handles certificates on its servers.
"""
from __future__ import annotations
import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push(
    tokens: list[str],
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    """
    Send a push notification to one or more Expo push tokens.
    tokens: list of strings like 'ExponentPushToken[xxxxxx]'
    Silently ignores failures — push is always non-fatal.
    """
    if not tokens:
        return

    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
            "priority": "high",
        }
        for token in tokens
    ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                },
            )
    except Exception as exc:
        print(f"[push_service] Failed to send push: {exc}")


async def get_student_tokens(client, student_id: str) -> list[str]:
    """Fetch all active push tokens for a student from push_tokens table."""
    try:
        res = await (
            client.table("push_tokens")
            .select("token")
            .eq("student_id", student_id)
            .execute()
        )
        return [row["token"] for row in (res.data or [])]
    except Exception as exc:
        print(f"[push_service] Failed to fetch tokens: {exc}")
        return []
