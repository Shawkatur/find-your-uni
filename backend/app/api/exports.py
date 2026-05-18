"""
PDF export endpoints for student profile and shortlist.

GET /exports/profile-pdf  — download student profile as PDF
GET /exports/shortlist-pdf — download shortlist comparison as PDF
"""
from __future__ import annotations

import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from supabase import AsyncClient

from app.core.security import get_current_user
from app.db.client import get_client

router = APIRouter(prefix="/exports", tags=["exports"])


def _make_pdf() -> FPDF:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)
    return pdf


def _header(pdf: FPDF, title: str):
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, f"Generated {datetime.utcnow().strftime('%B %d, %Y')}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)


def _section(pdf: FPDF, title: str):
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 8, f"  {title}", new_x="LMARGIN", new_y="NEXT", fill=True)
    pdf.ln(3)
    pdf.set_font("Helvetica", size=10)


def _row(pdf: FPDF, label: str, value: str):
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(55, 6, label)
    pdf.set_font("Helvetica", size=9)
    pdf.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")


@router.get("/profile-pdf")
async def export_profile_pdf(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_res = await (
        client.table("students")
        .select("*")
        .eq("user_id", user["sub"])
        .limit(1)
        .execute()
    )
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")

    s = student_res.data[0]
    pdf = _make_pdf()
    _header(pdf, "Student Profile")

    _section(pdf, "Personal Information")
    _row(pdf, "Full Name:", s.get("full_name") or "—")
    _row(pdf, "Email:", s.get("email") or "—")
    _row(pdf, "Phone:", s.get("phone") or "—")
    _row(pdf, "Date of Birth:", s.get("date_of_birth") or "—")
    _row(pdf, "Country:", s.get("country_of_residence") or "—")
    _row(pdf, "City:", s.get("city") or "—")
    pdf.ln(3)

    _section(pdf, "Academic Background")
    _row(pdf, "Education Level:", s.get("education_level") or "—")
    _row(pdf, "Institution:", s.get("institution_name") or "—")
    _row(pdf, "Major:", s.get("major") or "—")
    _row(pdf, "GPA:", str(s.get("gpa") or "—"))
    _row(pdf, "GPA Scale:", str(s.get("gpa_scale") or "—"))
    _row(pdf, "IELTS:", str(s.get("ielts_score") or "—"))
    _row(pdf, "TOEFL:", str(s.get("toefl_score") or "—"))
    pdf.ln(3)

    _section(pdf, "Preferences")
    _row(pdf, "Preferred Countries:", ", ".join(s.get("preferred_countries") or []) or "—")
    _row(pdf, "Study Level:", s.get("preferred_study_level") or "—")
    _row(pdf, "Budget:", str(s.get("budget_usd") or "—"))
    _row(pdf, "Intake:", s.get("preferred_intake") or "—")

    buf = io.BytesIO(pdf.output())
    buf.seek(0)
    filename = f"profile_{s.get('full_name', 'student').replace(' ', '_')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/shortlist-pdf")
async def export_shortlist_pdf(
    user: dict = Depends(get_current_user),
    client: AsyncClient = Depends(get_client),
):
    student_res = await (
        client.table("students")
        .select("id, full_name")
        .eq("user_id", user["sub"])
        .limit(1)
        .execute()
    )
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student profile not found")

    student = student_res.data[0]

    shortlist_res = await (
        client.table("shortlist")
        .select("*, universities(name, country, city, ranking_qs, tuition_usd_per_year, min_ielts, scholarships_available)")
        .eq("student_id", student["id"])
        .order("added_at", desc=True)
        .execute()
    )
    items = shortlist_res.data or []

    pdf = _make_pdf()
    _header(pdf, "University Shortlist")
    pdf.set_font("Helvetica", size=9)
    pdf.cell(0, 5, f"Student: {student.get('full_name', '—')}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, f"Total: {len(items)} universities", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    for i, item in enumerate(items, 1):
        uni = item.get("universities") or item.get("university") or {}
        _section(pdf, f"{i}. {uni.get('name', 'Unknown University')}")
        _row(pdf, "Country:", uni.get("country") or "—")
        _row(pdf, "City:", uni.get("city") or "—")
        _row(pdf, "QS Ranking:", f"#{uni['ranking_qs']}" if uni.get("ranking_qs") else "—")
        _row(pdf, "Tuition (USD/yr):", f"${uni['tuition_usd_per_year']:,.0f}" if uni.get("tuition_usd_per_year") else "—")
        _row(pdf, "Min IELTS:", str(uni.get("min_ielts") or "—"))
        _row(pdf, "Scholarships:", "Yes" if uni.get("scholarships_available") else "No")
        if item.get("program_name"):
            _row(pdf, "Program:", item["program_name"])
        if item.get("note"):
            _row(pdf, "Note:", item["note"])
        pdf.ln(3)

    buf = io.BytesIO(pdf.output())
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="shortlist.pdf"'},
    )
