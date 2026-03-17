"""
POST /payments/initiate          — create SSLCommerz session → return payment_url
GET  /payments/verify/{txn_id}   — IPN webhook + manual verify from SSLCommerz
GET  /payments/history           — student's payment history
"""
from __future__ import annotations
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import AsyncClient

from app.core.security import get_current_user
from app.core.config import get_settings
from app.db.client import get_client
from app.db.queries import get_student_by_user_id

router = APIRouter(prefix="/payments", tags=["payments"])
settings = get_settings()


class PaymentInitBody(BaseModel):
    product: str        # 'match_premium' | 'application_fee' | 'consultation'
    amount_bdt: int
    application_id: str | None = None


@router.post("/initiate", response_model=dict)
async def initiate_payment(
    body: PaymentInitBody,
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

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
    client: AsyncClient = Depends(get_client),
):
    """
    Called as redirect from SSLCommerz after payment attempt.
    Updates payment record status.
    """
    new_status = "paid" if status == "success" else "failed"
    res = await (
        client.table("payments")
        .update({"status": new_status})
        .eq("id", payment_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"payment_id": payment_id, "status": new_status}


@router.post("/ipn")
async def ipn_webhook(request: Request, client: AsyncClient = Depends(get_client)):
    """
    Instant Payment Notification from SSLCommerz.
    Validates the response and marks payment as paid.
    """
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
                    f"https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
                    f"?val_id={val_id}&store_id={settings.SSLCOMMERZ_STORE_ID}"
                    f"&store_passwd={store_pass}&v=1&format=json"
                )
                vdata = vr.json()
        except Exception:
            return {"status": "ignored"}

        if vdata.get("status") == "VALID":
            await (
                client.table("payments")
                .update({"status": "paid", "transaction_id": val_id, "gateway_response": dict(form)})
                .eq("id", tran_id)
                .execute()
            )

    return {"status": "received"}


@router.get("/history", response_model=list[dict])
async def payment_history(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student = await get_student_by_user_id(client, user["sub"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    res = await (
        client.table("payments")
        .select("*")
        .eq("student_id", student["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []
