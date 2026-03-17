"""
Notification helpers:
  - Supabase Realtime broadcast (in-app)
  - Expo Push notifications (mobile)
  - WhatsApp wa.me deep link generation (no API cost)
"""
from __future__ import annotations
import urllib.parse
from supabase import AsyncClient
from app.services.push_service import send_push, get_student_tokens


async def notify_status_change(
    client: AsyncClient,
    application_id: str,
    student_user_id: str,
    new_status: str,
    student_id: str | None = None,
    note: str | None = None,
) -> None:
    """
    Broadcast an application status-change event via:
    1. Supabase Realtime (web frontend)
    2. Expo Push Notification (mobile app)
    """
    # 1. Realtime broadcast
    channel = client.channel(f"application:{student_user_id}")
    try:
        await channel.subscribe()
        await channel.send_broadcast(
            event="status_update",
            payload={
                "application_id": application_id,
                "new_status": new_status,
                "note": note,
            },
        )
    except Exception as exc:
        print(f"[notifications] Realtime broadcast failed: {exc}")
    finally:
        await client.remove_channel(channel)

    # 2. Expo Push (mobile) — check if student has push enabled
    if student_id:
        try:
            student_res = await (
                client.table("students")
                .select("notify_status_changes, push_enabled")
                .eq("id", student_id)
                .single()
                .execute()
            )
            prefs = student_res.data or {}
            if prefs.get("push_enabled") and prefs.get("notify_status_changes"):
                tokens = await get_student_tokens(client, student_id)
                status_labels = {
                    "lead":              "Enquiry Received",
                    "pre_evaluation":    "Profile Evaluated",
                    "docs_collection":   "Documents Needed",
                    "applied":           "Application Submitted",
                    "offer_received":    "Offer Letter Received!",
                    "conditional_offer": "Conditional Offer",
                    "visa_stage":        "Visa Stage",
                    "enrolled":          "Enrolled — Congrats!",
                    "rejected":          "Application Update",
                    "withdrawn":         "Application Withdrawn",
                }
                label = status_labels.get(new_status, new_status)
                await send_push(
                    tokens=tokens,
                    title=f"Application Update: {label}",
                    body=note or "Your application status has been updated. Tap to view details.",
                    data={"application_id": application_id, "status": new_status},
                )
        except Exception as exc:
            print(f"[notifications] Push notification failed: {exc}")


def whatsapp_link(phone: str, message: str) -> str:
    """
    Generate a wa.me deep link for the given phone number and pre-filled message.
    Phone should be in international format without '+', e.g. '8801712345678'.
    """
    phone = phone.lstrip("+").replace(" ", "").replace("-", "")
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/{phone}?text={encoded}"


def status_update_whatsapp_message(
    student_name: str,
    university_name: str,
    program_name: str,
    new_status: str,
) -> str:
    status_labels = {
        "lead":              "Initial Enquiry Received",
        "pre_evaluation":    "Profile Pre-Evaluated",
        "docs_collection":   "Documents Being Collected",
        "applied":           "Application Submitted",
        "offer_received":    "Offer Letter Received",
        "conditional_offer": "Conditional Offer Received",
        "visa_stage":        "Visa Application Stage",
        "enrolled":          "Enrolled — Congratulations!",
        "rejected":          "Application Not Successful",
        "withdrawn":         "Application Withdrawn",
    }
    label = status_labels.get(new_status, new_status)
    return (
        f"Dear {student_name},\n\n"
        f"Your application update:\n"
        f"University: {university_name}\n"
        f"Program: {program_name}\n"
        f"Status: {label}\n\n"
        f"Please log in to the portal for details or contact your consultant."
    )
