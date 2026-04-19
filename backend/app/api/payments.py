"""
POST /payments/initiate          — create SSLCommerz session → return payment_url
GET  /payments/verify/{txn_id}   — IPN webhook + manual verify from SSLCommerz
GET  /payments/history           — student's payment history
"""
from __future__ import annotations
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from supabase import AsyncClient

from app.core.security import get_current_user, get_current_student_dep
from app.core.config import get_settings
from app.db.client import get_client
from app.db.queries import get_student_by_user_id

router = APIRouter(prefix="/payments", tags=["payments"])
get_student = get_current_student_dep()


class PaymentInitBody(BaseModel):
    product: str        # 'match_premium' | 'application_fee' | 'consultation'
    amount_bdt: int = Field(ge=100, le=500_000, description="Payment amount in BDT (100–500,000)")
    application_id: str | None = None


@router.post("/initiate", response_model=dict)
async def initiate_payment(
    body: PaymentInitBody,
    student: dict = Depends(get_student),
    client: AsyncClient = Depends(get_client),
):

    # Create a pending payment record first to get an ID
    pay_res = await (
        client.table("payments")
        .insert({
            "student_id":     student["id"],
            "application_id": body.application_id,
            "amount_bdt":     body.amount_bdt,
            "product":        body.product,
            "gateway":        "sslcommerz",
            "status":         "pending",
        })
        .execute()
    )
    payment = pay_res.data[0]
    payment_id = payment["id"]

    settings = get_settings()
    api_url = settings.SSLCOMMERZ_API_URL  # sandbox or live
    store_id = settings.SSLCOMMERZ_STORE_ID
    store_pass = settings.SSLCOMMERZ_STORE_PASS
    base_url = settings.APP_BASE_URL

    payload = {
        "store_id":      store_id,
        "store_passwd":  store_pass,
        "total_amount":  str(body.amount_bdt),
        "currency":      "BDT",
        "tran_id":       payment_id,
        "success_url":   f"{base_url}/payments/verify/{payment_id}?status=success",
        "fail_url":      f"{base_url}/payments/verify/{payment_id}?status=fail",
        "cancel_url":    f"{base_url}/payments/verify/{payment_id}?status=cancel",
        "ipn_url":       f"{base_url}/payments/ipn",
        "cus_name":      student["full_name"],
        "cus_email":     student.get("email", "noreply@findyouruni.com"),
        "cus_phone":     student.get("phone", "01700000000"),
        "cus_add1":      "Dhaka",
        "cus_city":      "Dhaka",
        "cus_country":   "Bangladesh",
        "product_name":  body.product,
        "product_category": "education",
        "product_profile":  "non-physical-goods",
        "shipping_method":  "NO",
        "num_of_item":   "1",
        "weight_of_items": "0",
        "product_amount":  str(body.amount_bdt),
        "vat":           "0",
        "discount_amount": "0",
        "convenience_fee": "0",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            resp = await http.post(api_url, data=payload)
            resp.raise_for_status()
            result = resp.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {exc}")

    if result.get("status") != "SUCCESS":
        raise HTTPException(status_code=502, detail=result.get("failedreason", "Gateway error"))

    return {
        "payment_id":  payment_id,
        "payment_url": result["GatewayPageURL"],
    }


@router.get("/verify/{payment_id}", response_model=dict)
async def verify_payment(
    payment_id: str,
    status: str = "success",
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    """
    Called as redirect from SSLCommerz after payment attempt.
    Does NOT mark as paid — only the validated IPN webhook can do that.
    On failure/cancel, marks as failed. On success, marks as pending_validation
    until IPN confirms.
    """
    # Look up the payment and verify it belongs to the authenticated user
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    existing = await (
        client.table("payments")
        .select("id, status, student_id")
        .eq("id", payment_id)
        .eq("student_id", student["id"])
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    current = existing.data[0]["status"]
    if current == "paid":
        # Already confirmed via IPN — don't overwrite
        return {"payment_id": payment_id, "status": "paid"}

    if status == "success":
        # Awaiting IPN validation — do NOT mark as paid from client redirect
        new_status = "pending_validation"
    else:
        new_status = "failed"

    await (
        client.table("payments")
        .update({"status": new_status})
        .eq("id", payment_id)
        .eq("status", "pending")  # only update if still pending (prevent replay)
        .execute()
    )
    return {"payment_id": payment_id, "status": new_status}


@router.post("/ipn")
async def ipn_webhook(request: Request, client: AsyncClient = Depends(get_client)):
    """
    Instant Payment Notification from SSLCommerz.
    Validates the response and marks payment as paid.
    """
    settings = get_settings()
    form = await request.form()
    tran_id  = form.get("tran_id")
    status   = form.get("status")
    val_id   = form.get("val_id")
    store_pass = settings.SSLCOMMERZ_STORE_PASS

    # Verify via SSLCommerz validation API
    if status == "VALID" and tran_id and val_id:
        try:
            async with httpx.AsyncClient(timeout=10.0) as http:
                vr = await http.get(
                    f"{settings.SSLCOMMERZ_VALIDATION_URL}"
                    f"?val_id={val_id}&store_id={settings.SSLCOMMERZ_STORE_ID}"
                    f"&store_passwd={store_pass}&v=1&format=json"
                )
                vdata = vr.json()
        except Exception:
            return {"status": "ignored"}

        if vdata.get("status") == "VALID":
            # Verify the paid amount matches the original payment record
            pay_res = await (
                client.table("payments")
                .select("id, amount_bdt, status")
                .eq("id", tran_id)
                .limit(1)
                .execute()
            )
            if not pay_res.data:
                return {"status": "ignored", "reason": "payment not found"}

            original_amount = pay_res.data[0].get("amount_bdt", 0)
            paid_amount = float(form.get("amount", 0))
            if abs(paid_amount - original_amount) > 1:
                # Amount mismatch — possible tampering
                from app.core.logger import logger
                logger.warning(
                    "IPN amount mismatch for %s: expected %s, got %s",
                    tran_id, original_amount, paid_amount,
                )
                await (
                    client.table("payments")
                    .update({"status": "failed", "gateway_response": {"error": "amount_mismatch", "paid": paid_amount, "expected": original_amount}})
                    .eq("id", tran_id)
                    .execute()
                )
                return {"status": "rejected", "reason": "amount mismatch"}

            # Store only safe, known fields from the gateway response
            safe_fields = {
                "tran_id": form.get("tran_id"),
                "val_id": form.get("val_id"),
                "amount": form.get("amount"),
                "currency": form.get("currency"),
                "card_type": form.get("card_type"),
                "tran_date": form.get("tran_date"),
            }
            await (
                client.table("payments")
                .update({"status": "paid", "transaction_id": val_id, "gateway_response": safe_fields})
                .eq("id", tran_id)
                .execute()
            )

    return {"status": "received"}


@router.get("/history", response_model=list[dict])
async def payment_history(
    student: dict = Depends(get_student),
    client: AsyncClient = Depends(get_client),
):

    res = await (
        client.table("payments")
        .select("id, student_id, application_id, amount_bdt, product, gateway, status, transaction_id, created_at")
        .eq("student_id", student["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
