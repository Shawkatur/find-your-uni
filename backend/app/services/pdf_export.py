"""
PDF generation utilities using reportlab.

Provides functions to render student profiles, shortlists, and application
summaries as downloadable PDF documents.
"""
from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# ── Shared helpers ────────────────────────────────────────────────────────────

_STYLES = getSampleStyleSheet()

_TITLE_STYLE = ParagraphStyle(
    "PDFTitle",
    parent=_STYLES["Heading1"],
    fontSize=18,
    spaceAfter=4,
    textColor=colors.HexColor("#1a1a1a"),
)

_SUBTITLE_STYLE = ParagraphStyle(
    "PDFSubtitle",
    parent=_STYLES["Normal"],
    fontSize=8,
    textColor=colors.gray,
    spaceAfter=12,
)

_SECTION_STYLE = ParagraphStyle(
    "PDFSection",
    parent=_STYLES["Heading2"],
    fontSize=13,
    spaceBefore=14,
    spaceAfter=6,
    textColor=colors.HexColor("#333333"),
)

_BODY_STYLE = ParagraphStyle(
    "PDFBody",
    parent=_STYLES["Normal"],
    fontSize=9,
    leading=13,
)

_LABEL_COL = colors.HexColor("#555555")
_HEADER_BG = colors.HexColor("#f0f0f0")
_TABLE_BORDER = colors.HexColor("#cccccc")


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%B %d, %Y")


def _safe(value: Any, fallback: str = "—") -> str:
    """Return a display-safe string for a value that may be None."""
    if value is None or value == "" or value == []:
        return fallback
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value)


def _build_doc(buffer: io.BytesIO, title: str) -> SimpleDocTemplate:
    return SimpleDocTemplate(
        buffer,
        pagesize=A4,
        title=title,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
    )


def _kv_table(rows: list[tuple[str, str]]) -> Table:
    """Create a two-column label/value table."""
    data = [[Paragraph(f"<b>{label}</b>", _BODY_STYLE), Paragraph(value, _BODY_STYLE)] for label, value in rows]
    col_widths = [55 * mm, 115 * mm]
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TEXTCOLOR", (0, 0), (0, -1), _LABEL_COL),
    ]))
    return t


# ── Profile PDF ──────────────────────────────────────────────────────────────


def generate_profile_pdf(student: dict) -> bytes:
    """Render a student profile summary as a PDF and return raw bytes."""
    buf = io.BytesIO()
    doc = _build_doc(buf, "Student Profile")
    story: list = []

    # Title
    story.append(Paragraph("Student Profile", _TITLE_STYLE))
    story.append(Paragraph(f"Generated {_timestamp()}", _SUBTITLE_STYLE))

    # Personal information
    story.append(Paragraph("Personal Information", _SECTION_STYLE))
    story.append(_kv_table([
        ("Full Name", _safe(student.get("full_name"))),
        ("Email", _safe(student.get("email"))),
        ("Phone", _safe(student.get("phone"))),
        ("Date of Birth", _safe(student.get("date_of_birth"))),
        ("Nationality", _safe(student.get("nationality"))),
        ("Country", _safe(student.get("country_of_residence"))),
        ("City", _safe(student.get("city"))),
    ]))
    story.append(Spacer(1, 6))

    # Academic background
    story.append(Paragraph("Academic Background", _SECTION_STYLE))
    academic = student.get("academic_history") or {}
    story.append(_kv_table([
        ("Education Level", _safe(student.get("education_level") or academic.get("education_level"))),
        ("Institution", _safe(student.get("institution_name") or academic.get("institution_name"))),
        ("Major", _safe(student.get("major") or academic.get("major"))),
        ("GPA", _safe(student.get("gpa") or academic.get("gpa"))),
        ("GPA Scale", _safe(student.get("gpa_scale") or academic.get("gpa_scale"))),
    ]))
    story.append(Spacer(1, 6))

    # Test scores
    story.append(Paragraph("Test Scores", _SECTION_STYLE))
    scores = student.get("test_scores") or {}
    story.append(_kv_table([
        ("IELTS", _safe(student.get("ielts_score") or scores.get("ielts"))),
        ("TOEFL", _safe(student.get("toefl_score") or scores.get("toefl"))),
        ("SAT", _safe(scores.get("sat"))),
        ("GRE", _safe(scores.get("gre"))),
        ("GMAT", _safe(scores.get("gmat"))),
    ]))
    story.append(Spacer(1, 6))

    # Preferences
    story.append(Paragraph("Preferences", _SECTION_STYLE))
    story.append(_kv_table([
        ("Preferred Countries", _safe(student.get("preferred_countries"))),
        ("Preferred Degree", _safe(student.get("preferred_degree") or student.get("preferred_study_level"))),
        ("Preferred Fields", _safe(student.get("preferred_fields"))),
        ("Budget (USD/yr)", _safe(student.get("budget_usd_per_year") or student.get("budget_usd"))),
        ("Preferred Intake", _safe(student.get("preferred_intake"))),
    ]))

    doc.build(story)
    return buf.getvalue()


# ── Shortlist PDF ────────────────────────────────────────────────────────────


def generate_shortlist_pdf(student: dict, shortlist: list[dict]) -> bytes:
    """Render the student's shortlisted universities as a PDF table."""
    buf = io.BytesIO()
    doc = _build_doc(buf, "University Shortlist")
    story: list = []

    story.append(Paragraph("University Shortlist", _TITLE_STYLE))
    story.append(Paragraph(f"Generated {_timestamp()}", _SUBTITLE_STYLE))
    story.append(Paragraph(
        f"Student: {_safe(student.get('full_name'))} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"Total: {len(shortlist)} universit{'y' if len(shortlist) == 1 else 'ies'}",
        _BODY_STYLE,
    ))
    story.append(Spacer(1, 10))

    if not shortlist:
        story.append(Paragraph("No universities shortlisted yet.", _BODY_STYLE))
        doc.build(story)
        return buf.getvalue()

    # Table header
    headers = ["#", "University", "Country", "City", "QS Rank", "Tuition (USD/yr)", "IELTS", "Scholarships"]
    rows = [headers]

    for idx, item in enumerate(shortlist, 1):
        uni = item.get("universities") or item.get("university") or {}
        ranking = f"#{uni['ranking_qs']}" if uni.get("ranking_qs") else "—"
        tuition = f"${uni['tuition_usd_per_year']:,.0f}" if uni.get("tuition_usd_per_year") else "—"
        ielts = str(uni["min_ielts"]) if uni.get("min_ielts") else "—"
        scholarships = "Yes" if uni.get("scholarships_available") else "No"
        rows.append([
            str(idx),
            uni.get("name", "Unknown"),
            uni.get("country", "—"),
            uni.get("city", "—"),
            ranking,
            tuition,
            ielts,
            scholarships,
        ])

    col_widths = [8 * mm, 48 * mm, 22 * mm, 22 * mm, 18 * mm, 28 * mm, 14 * mm, 22 * mm]
    t = Table(rows, colWidths=col_widths, hAlign="LEFT", repeatRows=1)
    t.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), _HEADER_BG),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        # Body rows
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, _TABLE_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        # Alternating row colors
        *[("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f9f9f9")) for i in range(2, len(rows), 2)],
    ]))
    story.append(t)

    # Notes section (if any items have notes or program names)
    notes_items = [(idx, item) for idx, item in enumerate(shortlist, 1) if item.get("note") or item.get("program_name")]
    if notes_items:
        story.append(Spacer(1, 12))
        story.append(Paragraph("Notes", _SECTION_STYLE))
        for idx, item in notes_items:
            uni = item.get("universities") or item.get("university") or {}
            parts = []
            if item.get("program_name"):
                parts.append(f"Program: {item['program_name']}")
            if item.get("note"):
                parts.append(item["note"])
            story.append(Paragraph(
                f"<b>{idx}. {uni.get('name', 'Unknown')}:</b> {' | '.join(parts)}",
                _BODY_STYLE,
            ))

    doc.build(story)
    return buf.getvalue()


# ── Application summary PDF ─────────────────────────────────────────────────


def generate_application_summary_pdf(application: dict) -> bytes:
    """Render an application summary (with program/university info) as a PDF."""
    buf = io.BytesIO()
    doc = _build_doc(buf, "Application Summary")
    story: list = []

    story.append(Paragraph("Application Summary", _TITLE_STYLE))
    story.append(Paragraph(f"Generated {_timestamp()}", _SUBTITLE_STYLE))

    # Application details
    story.append(Paragraph("Application Details", _SECTION_STYLE))

    program = application.get("programs") or {}
    uni = program.get("universities") or {}
    student = application.get("students") or {}

    story.append(_kv_table([
        ("Application ID", _safe(application.get("id"))),
        ("Status", _safe(application.get("status", "").replace("_", " ").title())),
        ("Student", _safe(student.get("full_name"))),
        ("Created", _safe(application.get("created_at", "")[:10] if application.get("created_at") else None)),
        ("Last Updated", _safe(application.get("updated_at", "")[:10] if application.get("updated_at") else None)),
    ]))
    story.append(Spacer(1, 6))

    # Program and university
    if program:
        story.append(Paragraph("Program Information", _SECTION_STYLE))
        story.append(_kv_table([
            ("Program", _safe(program.get("name"))),
            ("Degree Level", _safe(program.get("degree_level"))),
            ("Field", _safe(program.get("field"))),
            ("Tuition (USD/yr)", f"${program['tuition_usd_per_year']:,.0f}" if program.get("tuition_usd_per_year") else "—"),
        ]))
        story.append(Spacer(1, 6))

    if uni:
        story.append(Paragraph("University Information", _SECTION_STYLE))
        story.append(_kv_table([
            ("University", _safe(uni.get("name"))),
            ("Country", _safe(uni.get("country"))),
            ("City", _safe(uni.get("city"))),
            ("QS Ranking", f"#{uni['ranking_qs']}" if uni.get("ranking_qs") else "—"),
            ("Website", _safe(uni.get("website"))),
        ]))
        story.append(Spacer(1, 6))

    # Status history
    history = application.get("status_history") or []
    if history:
        story.append(Paragraph("Status History", _SECTION_STYLE))
        h_headers = ["Date", "Status", "Note"]
        h_rows = [h_headers]
        for entry in history:
            changed_at = entry.get("changed_at", "")[:10] if entry.get("changed_at") else "—"
            status = (entry.get("status") or "—").replace("_", " ").title()
            note = entry.get("note") or "—"
            h_rows.append([changed_at, status, note])

        h_col_widths = [28 * mm, 35 * mm, 110 * mm]
        ht = Table(h_rows, colWidths=h_col_widths, hAlign="LEFT", repeatRows=1)
        ht.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _HEADER_BG),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, _TABLE_BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(ht)

    doc.build(story)
    return buf.getvalue()
