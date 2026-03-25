#!/usr/bin/env python3
"""
Seed sample dev data:
  - 2 agencies
  - 4 consultants (2 per agency)
  - 25 students
  - 20 universities + 60 programs (3 per uni)
  - 100 applications spread across statuses

Usage:
  python scripts/seed_sample_data.py

Note: This script creates Supabase Auth users for students and consultants
using the admin API (service role key required).
"""
import asyncio
import random
import sys
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.client import get_client
from app.models.application import STATUS_TRANSITIONS

# ─── Sample data ──────────────────────────────────────────────────────────────

AGENCIES = [
    {"name": "EduPath Bangladesh",     "license_no": "BD-EDU-2021-001", "address": "Gulshan-2, Dhaka",   "city": "Dhaka", "website": "https://edupathbd.com",    "whatsapp": "8801711000001"},
    {"name": "GlobalVisa Consultants", "license_no": "BD-EDU-2019-042", "address": "Dhanmondi, Dhaka",   "city": "Dhaka", "website": "https://globalvisabd.com", "whatsapp": "8801711000002"},
]

CONSULTANTS_DATA = [
    {"full_name": "Rahim Chowdhury", "role": "admin", "agency_idx": 0},
    {"full_name": "Fatima Begum",    "role": "staff", "agency_idx": 0},
    {"full_name": "Karim Ahmed",     "role": "admin", "agency_idx": 1},
    {"full_name": "Nusrat Islam",    "role": "staff", "agency_idx": 1},
]

STUDENT_NAMES = [
    # Original 10
    "Arif Hossain",    "Sumaiya Khan",    "Tanvir Rahman",   "Mitu Akter",
    "Sabbir Hasan",    "Tania Sultana",   "Mahfuz Ali",      "Rima Parvin",
    "Imran Uddin",     "Sadia Noor",
    # Additional 15
    "Rakib Islam",     "Farjana Begum",   "Nafis Ahmed",     "Liza Khatun",
    "Shahriar Kabir",  "Nadia Chowdhury", "Rezaul Karim",    "Sharmin Akter",
    "Asif Mahmud",     "Priya Das",       "Touhid Hasan",    "Mariam Sultana",
    "Raihan Hossain",  "Ayesha Siddiqua", "Jakaria Islam",
]

UNIVERSITIES_SEED = [
    # ── Canada ──────────────────────────────────────────────────────────────
    {
        "name": "University of Toronto",
        "country": "CA", "city": "Toronto",
        "ranking_qs": 25, "ranking_the": 18,
        "tuition_usd_per_year": 32000,
        "acceptance_rate_overall": 43.0, "acceptance_rate_bd": 35.0,
        "min_ielts": 6.5, "min_toefl": 100, "min_gpa_percentage": 65,
        "scholarships_available": True, "max_scholarship_pct": 50,
        "website": "https://utoronto.ca",
        "data_source": "manual",
        "intl_student_pct": 22.0, "bd_students_known": 450,
        "description": "Canada's top-ranked university, known for research excellence in CS, medicine, and engineering. One of the largest Bangladeshi student communities in North America.",
    },
    {
        "name": "University of British Columbia",
        "country": "CA", "city": "Vancouver",
        "ranking_qs": 34, "ranking_the": 40,
        "tuition_usd_per_year": 28000,
        "acceptance_rate_overall": 52.0, "acceptance_rate_bd": 42.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 60,
        "scholarships_available": True, "max_scholarship_pct": 40,
        "website": "https://ubc.ca",
        "data_source": "manual",
        "intl_student_pct": 25.0, "bd_students_known": 380,
        "description": "World-class research university in Vancouver, strong in engineering, business, and environmental sciences. Beautiful campus; high quality of life.",
    },
    {
        "name": "McGill University",
        "country": "CA", "city": "Montreal",
        "ranking_qs": 46, "ranking_the": 46,
        "tuition_usd_per_year": 22000,
        "acceptance_rate_overall": 38.0, "acceptance_rate_bd": 30.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 65,
        "scholarships_available": True, "max_scholarship_pct": 35,
        "website": "https://mcgill.ca",
        "data_source": "manual",
        "intl_student_pct": 27.0, "bd_students_known": 220,
        "description": "Prestigious bilingual university in Montreal; top medical school and strong graduate programs in science and engineering.",
    },
    {
        "name": "University of Waterloo",
        "country": "CA", "city": "Waterloo",
        "ranking_qs": 112, "ranking_the": 201,
        "tuition_usd_per_year": 24000,
        "acceptance_rate_overall": 53.0, "acceptance_rate_bd": 45.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 65,
        "scholarships_available": True, "max_scholarship_pct": 30,
        "website": "https://uwaterloo.ca",
        "data_source": "manual",
        "intl_student_pct": 30.0, "bd_students_known": 310,
        "description": "World's largest co-op program; globally recognised for computer science, mathematics, and engineering. Silicon Valley's top feeder school.",
    },
    # ── United Kingdom ───────────────────────────────────────────────────────
    {
        "name": "University of Manchester",
        "country": "GB", "city": "Manchester",
        "ranking_qs": 32, "ranking_the": 58,
        "tuition_usd_per_year": 25000,
        "acceptance_rate_overall": 55.0, "acceptance_rate_bd": 48.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 55,
        "scholarships_available": True, "max_scholarship_pct": 30,
        "website": "https://manchester.ac.uk",
        "data_source": "manual",
        "intl_student_pct": 35.0, "bd_students_known": 600,
        "description": "Russell Group research university; strong in engineering, business, and life sciences. Largest single-campus university in the UK.",
    },
    {
        "name": "University of Edinburgh",
        "country": "GB", "city": "Edinburgh",
        "ranking_qs": 22, "ranking_the": 30,
        "tuition_usd_per_year": 26000,
        "acceptance_rate_overall": 44.0, "acceptance_rate_bd": 38.0,
        "min_ielts": 6.5, "min_toefl": 92, "min_gpa_percentage": 60,
        "scholarships_available": True, "max_scholarship_pct": 40,
        "website": "https://ed.ac.uk",
        "data_source": "manual",
        "intl_student_pct": 38.0, "bd_students_known": 280,
        "description": "Ancient Scottish university ranked in world's top 25; excellent for informatics, medicine, and arts. Home to Chevening scholars.",
    },
    {
        "name": "University of Leeds",
        "country": "GB", "city": "Leeds",
        "ranking_qs": 86, "ranking_the": 139,
        "tuition_usd_per_year": 23000,
        "acceptance_rate_overall": 62.0, "acceptance_rate_bd": 55.0,
        "min_ielts": 6.0, "min_toefl": 87, "min_gpa_percentage": 50,
        "scholarships_available": True, "max_scholarship_pct": 25,
        "website": "https://leeds.ac.uk",
        "data_source": "manual",
        "intl_student_pct": 32.0, "bd_students_known": 520,
        "description": "Russell Group university popular with Bangladeshi students; strong in business, engineering, and health sciences. Active Bangladeshi student society.",
    },
    # ── Australia ────────────────────────────────────────────────────────────
    {
        "name": "Monash University",
        "country": "AU", "city": "Melbourne",
        "ranking_qs": 42, "ranking_the": 70,
        "tuition_usd_per_year": 23000,
        "acceptance_rate_overall": 60.0, "acceptance_rate_bd": 55.0,
        "min_ielts": 6.0, "min_toefl": 79, "min_gpa_percentage": 55,
        "scholarships_available": True, "max_scholarship_pct": 35,
        "website": "https://monash.edu",
        "data_source": "manual",
        "intl_student_pct": 38.0, "bd_students_known": 420,
        "description": "Australia's largest university; strong engineering, medicine, and business schools. Multiple campuses across Australia and Malaysia.",
    },
    {
        "name": "University of Melbourne",
        "country": "AU", "city": "Melbourne",
        "ranking_qs": 14, "ranking_the": 33,
        "tuition_usd_per_year": 27000,
        "acceptance_rate_overall": 70.0, "acceptance_rate_bd": 60.0,
        "min_ielts": 6.5, "min_toefl": 79, "min_gpa_percentage": 60,
        "scholarships_available": True, "max_scholarship_pct": 50,
        "website": "https://unimelb.edu.au",
        "data_source": "manual",
        "intl_student_pct": 40.0, "bd_students_known": 350,
        "description": "Australia's #1 ranked university; graduate-model system with globally recognised degrees. Melbourne Research Scholarship covers full fees.",
    },
    {
        "name": "University of Queensland",
        "country": "AU", "city": "Brisbane",
        "ranking_qs": 47, "ranking_the": 93,
        "tuition_usd_per_year": 21000,
        "acceptance_rate_overall": 68.0, "acceptance_rate_bd": 60.0,
        "min_ielts": 6.0, "min_toefl": 87, "min_gpa_percentage": 55,
        "scholarships_available": True, "max_scholarship_pct": 30,
        "website": "https://uq.edu.au",
        "data_source": "manual",
        "intl_student_pct": 30.0, "bd_students_known": 280,
        "description": "Group of Eight university in Brisbane; excellent research, vibrant campus life, and a growing Bangladeshi community.",
    },
    # ── Germany ──────────────────────────────────────────────────────────────
    {
        "name": "TU Munich",
        "country": "DE", "city": "Munich",
        "ranking_qs": 37, "ranking_the": 30,
        "tuition_usd_per_year": 2000,
        "acceptance_rate_overall": 35.0, "acceptance_rate_bd": 28.0,
        "min_ielts": 6.0, "min_toefl": 88, "min_gpa_percentage": 70,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://tum.de",
        "data_source": "manual",
        "intl_student_pct": 28.0, "bd_students_known": 120,
        "description": "Germany's top technical university; near-zero tuition, world-leading in engineering and natural sciences. DAAD scholarships widely available.",
    },
    {
        "name": "RWTH Aachen University",
        "country": "DE", "city": "Aachen",
        "ranking_qs": 106, "ranking_the": 155,
        "tuition_usd_per_year": 1500,
        "acceptance_rate_overall": 40.0, "acceptance_rate_bd": 32.0,
        "min_ielts": 6.0, "min_toefl": 85, "min_gpa_percentage": 65,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://rwth-aachen.de",
        "data_source": "manual",
        "intl_student_pct": 20.0, "bd_students_known": 90,
        "description": "Europe's leading technical institution; renowned for mechanical and electrical engineering. Strong industry ties with automotive and energy sectors.",
    },
    # ── United States ────────────────────────────────────────────────────────
    {
        "name": "Massachusetts Institute of Technology",
        "country": "US", "city": "Cambridge",
        "ranking_qs": 1, "ranking_the": 5,
        "tuition_usd_per_year": 57000,
        "acceptance_rate_overall": 4.0, "acceptance_rate_bd": 2.0,
        "min_ielts": 7.0, "min_toefl": 90, "min_gpa_percentage": 85,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://mit.edu",
        "data_source": "manual",
        "intl_student_pct": 30.0, "bd_students_known": 40,
        "description": "World's #1 university for engineering and technology; need-blind financial aid for all international students. Extraordinary alumni network.",
    },
    {
        "name": "Stanford University",
        "country": "US", "city": "Stanford",
        "ranking_qs": 5, "ranking_the": 3,
        "tuition_usd_per_year": 56000,
        "acceptance_rate_overall": 4.3, "acceptance_rate_bd": 2.5,
        "min_ielts": 7.0, "min_toefl": 100, "min_gpa_percentage": 85,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://stanford.edu",
        "data_source": "manual",
        "intl_student_pct": 22.0, "bd_students_known": 35,
        "description": "Silicon Valley's premier research university; powerhouse for CS, AI, business, and entrepreneurship. Knight-Hennessy Scholars offers full funding.",
    },
    {
        "name": "University of Michigan",
        "country": "US", "city": "Ann Arbor",
        "ranking_qs": 23, "ranking_the": 26,
        "tuition_usd_per_year": 50000,
        "acceptance_rate_overall": 20.0, "acceptance_rate_bd": 15.0,
        "min_ielts": 6.5, "min_toefl": 84, "min_gpa_percentage": 75,
        "scholarships_available": True, "max_scholarship_pct": 50,
        "website": "https://umich.edu",
        "data_source": "manual",
        "intl_student_pct": 16.0, "bd_students_known": 180,
        "description": "Top public research university; excellent graduate programs in engineering, business, and public policy. Strong Bangladeshi student association.",
    },
    # ── Singapore ────────────────────────────────────────────────────────────
    {
        "name": "National University of Singapore",
        "country": "SG", "city": "Singapore",
        "ranking_qs": 8, "ranking_the": 19,
        "tuition_usd_per_year": 18000,
        "acceptance_rate_overall": 25.0, "acceptance_rate_bd": 20.0,
        "min_ielts": 6.0, "min_toefl": 85, "min_gpa_percentage": 70,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://nus.edu.sg",
        "data_source": "manual",
        "intl_student_pct": 35.0, "bd_students_known": 150,
        "description": "Asia's top university; exceptional for CS, engineering, and business. Many full scholarships available for Bangladeshi students; gateway to ASEAN.",
    },
    # ── Netherlands ──────────────────────────────────────────────────────────
    {
        "name": "Delft University of Technology",
        "country": "NL", "city": "Delft",
        "ranking_qs": 57, "ranking_the": 57,
        "tuition_usd_per_year": 16000,
        "acceptance_rate_overall": 58.0, "acceptance_rate_bd": 45.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 60,
        "scholarships_available": True, "max_scholarship_pct": 50,
        "website": "https://tudelft.nl",
        "data_source": "manual",
        "intl_student_pct": 26.0, "bd_students_known": 110,
        "description": "Europe's best technical university outside Germany–UK; English-taught programs in engineering, architecture, and design. Holland Scholarship available.",
    },
    # ── Sweden ───────────────────────────────────────────────────────────────
    {
        "name": "KTH Royal Institute of Technology",
        "country": "SE", "city": "Stockholm",
        "ranking_qs": 98, "ranking_the": 201,
        "tuition_usd_per_year": 14000,
        "acceptance_rate_overall": 45.0, "acceptance_rate_bd": 38.0,
        "min_ielts": 6.5, "min_toefl": 90, "min_gpa_percentage": 60,
        "scholarships_available": True, "max_scholarship_pct": 75,
        "website": "https://kth.se",
        "data_source": "manual",
        "intl_student_pct": 22.0, "bd_students_known": 85,
        "description": "Sweden's leading technical university; strong in ICT, energy, and sustainable technology. Swedish Institute Scholarship covers full tuition and living costs.",
    },
    # ── New Zealand ──────────────────────────────────────────────────────────
    {
        "name": "University of Auckland",
        "country": "NZ", "city": "Auckland",
        "ranking_qs": 87, "ranking_the": 201,
        "tuition_usd_per_year": 19000,
        "acceptance_rate_overall": 63.0, "acceptance_rate_bd": 55.0,
        "min_ielts": 6.0, "min_toefl": 80, "min_gpa_percentage": 55,
        "scholarships_available": True, "max_scholarship_pct": 30,
        "website": "https://auckland.ac.nz",
        "data_source": "manual",
        "intl_student_pct": 25.0, "bd_students_known": 170,
        "description": "New Zealand's #1 university; affordable tuition, high quality of life, and a clear PR pathway. Growing Bangladeshi community in Auckland.",
    },
    # ── Japan ────────────────────────────────────────────────────────────────
    {
        "name": "University of Tokyo",
        "country": "JP", "city": "Tokyo",
        "ranking_qs": 28, "ranking_the": 39,
        "tuition_usd_per_year": 5000,
        "acceptance_rate_overall": 30.0, "acceptance_rate_bd": 22.0,
        "min_ielts": 6.5, "min_toefl": 79, "min_gpa_percentage": 70,
        "scholarships_available": True, "max_scholarship_pct": 100,
        "website": "https://u-tokyo.ac.jp",
        "data_source": "manual",
        "intl_student_pct": 12.0, "bd_students_known": 80,
        "description": "Japan's premier research university; MEXT scholarship covers full tuition and a monthly living stipend. Ideal for research-focused students.",
    },
]

PROGRAM_TEMPLATES = [
    {"name": "MSc Computer Science",             "degree_level": "master",   "field": "cs",          "duration_years": 1.5, "intake_months": [9, 1]},
    {"name": "MSc Data Science",                 "degree_level": "master",   "field": "cs",          "duration_years": 1.0, "intake_months": [9]},
    {"name": "MSc Artificial Intelligence",      "degree_level": "master",   "field": "cs",          "duration_years": 1.5, "intake_months": [9]},
    {"name": "MBA",                              "degree_level": "master",   "field": "business",    "duration_years": 2.0, "intake_months": [9, 1]},
    {"name": "MSc Finance",                      "degree_level": "master",   "field": "business",    "duration_years": 1.0, "intake_months": [9]},
    {"name": "MEng Electrical Engineering",      "degree_level": "master",   "field": "engineering", "duration_years": 1.5, "intake_months": [9]},
    {"name": "MSc Civil Engineering",            "degree_level": "master",   "field": "engineering", "duration_years": 1.5, "intake_months": [9]},
    {"name": "MSc Biomedical Engineering",       "degree_level": "master",   "field": "health",      "duration_years": 1.5, "intake_months": [9]},
    {"name": "MSc Public Health",                "degree_level": "master",   "field": "health",      "duration_years": 1.0, "intake_months": [9]},
    {"name": "BSc Computer Science",             "degree_level": "bachelor", "field": "cs",          "duration_years": 4.0, "intake_months": [9]},
    {"name": "BEng Mechanical Engineering",      "degree_level": "bachelor", "field": "engineering", "duration_years": 4.0, "intake_months": [9]},
    {"name": "BBA Business Administration",      "degree_level": "bachelor", "field": "business",    "duration_years": 4.0, "intake_months": [9, 1]},
    {"name": "PhD Computer Science",             "degree_level": "phd",      "field": "cs",          "duration_years": 4.0, "intake_months": [9, 1]},
    {"name": "PhD Electrical Engineering",       "degree_level": "phd",      "field": "engineering", "duration_years": 4.5, "intake_months": [9]},
]

ALL_STATUSES = list(STATUS_TRANSITIONS.keys())

# Minimal valid PDF for demo document uploads
MINIMAL_PDF = (
    b"%PDF-1.0\n1 0 obj<</Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</MediaBox[0 0 612 792]>>endobj\n"
    b"trailer<</Root 1 0 R>>"
)

_DOC_TYPES = ["transcript", "passport", "ielts_cert", "cv", "sop"]

_BACHELOR_SUBJECTS = ["CSE", "EEE", "BBA", "Civil Engineering", "Physics", "Chemistry",
                      "Pharmacy", "Textile Engineering", "Architecture", "Economics",
                      "Mechanical Engineering", "Statistics"]
_PREFERRED_FIELDS  = ["cs", "engineering", "business", "health", "law", "education"]
_ALL_COUNTRIES     = ["CA", "GB", "AU", "DE", "US", "SG", "NL", "SE", "NZ", "JP"]


def random_student_row(user_id: str, name: str) -> dict:
    has_gre   = random.random() > 0.5
    has_gmat  = random.random() > 0.7
    test_scores = {
        "ielts": round(random.uniform(6.0, 8.5), 1),
        "toefl": random.randint(80, 115),
    }
    if has_gre:
        test_scores["gre"] = random.randint(295, 330)
    if has_gmat:
        test_scores["gmat"] = random.randint(580, 730)

    degree_pref = random.choice(["master", "master", "master", "bachelor", "phd"])
    return {
        "user_id":   user_id,
        "full_name": name,
        "phone":     f"880171{random.randint(1000000, 9999999)}",
        "academic_history": {
            "ssc_gpa":          round(random.uniform(3.5, 5.0), 2),
            "hsc_gpa":          round(random.uniform(3.5, 5.0), 2),
            "bachelor_cgpa":    round(random.uniform(2.8, 4.0), 2),
            "bachelor_subject": random.choice(_BACHELOR_SUBJECTS),
            "gpa_percentage":   random.randint(50, 90),
        },
        "test_scores": test_scores,
        "budget_usd_per_year": random.choice([8000, 12000, 15000, 20000, 25000, 30000, 35000, 45000]),
        "preferred_countries": random.sample(_ALL_COUNTRIES, k=random.randint(2, 4)),
        "preferred_degree":    degree_pref,
        "preferred_fields":    random.sample(_preferred_fields_for(degree_pref), k=random.randint(1, 3)),
        "push_enabled":           True,
        "notify_status_changes":  True,
        "notify_deadlines":       True,
        "onboarding_completed":   True,
    }


def _preferred_fields_for(degree: str) -> list:
    if degree == "phd":
        return ["cs", "engineering", "health"]
    return _PREFERRED_FIELDS


async def seed():
    client = await get_client()

    # Ensure storage bucket exists
    try:
        await client.storage.create_bucket("documents", {"public": False})
        print("Created 'documents' storage bucket")
    except Exception:
        print("Storage bucket 'documents' already exists")

    print("Seeding agencies...")
    agency_ids = []
    for ag in AGENCIES:
        res = await client.table("agencies").insert(ag).execute()
        agency_ids.append(res.data[0]["id"])
        print(f"  Agency: {ag['name']} → {agency_ids[-1]}")

    print("\nSeeding consultants (creating auth users)...")
    consultant_ids = []
    for c in CONSULTANTS_DATA:
        email = f"{c['full_name'].lower().replace(' ', '.')}@seed.test"
        auth_res = await client.auth.admin.create_user({
            "email":         email,
            "password":      "Seed@12345",
            "email_confirm": True,
            "app_metadata":  {"role": "consultant", "agency_id": agency_ids[c["agency_idx"]]},
        })
        user_id = auth_res.user.id
        row = {
            "user_id":   user_id,
            "agency_id": agency_ids[c["agency_idx"]],
            "role":      c["role"],
            "full_name": c["full_name"],
            "status":    "active",
        }
        res = await client.table("consultants").insert(row).execute()
        consultant_ids.append(res.data[0]["id"])
        print(f"  Consultant: {c['full_name']} → {consultant_ids[-1]}")

    print("\nSeeding universities + programs...")
    uni_ids    = []
    program_ids = []
    for uni in UNIVERSITIES_SEED:
        res = await client.table("universities").insert(uni).execute()
        uid = res.data[0]["id"]
        uni_ids.append(uid)

        # 3 programs per university, drawn without replacement from templates
        for pt in random.sample(PROGRAM_TEMPLATES, 3):
            p_row = {
                "university_id":        uid,
                "name":                 pt["name"],
                "degree_level":         pt["degree_level"],
                "field":                pt["field"],
                "duration_years":       pt["duration_years"],
                "intake_months":        pt["intake_months"],
                "tuition_usd_per_year": max(500, uni["tuition_usd_per_year"] + random.randint(-3000, 3000)),
                "min_requirements": {
                    "ielts":   uni.get("min_ielts", 6.0),
                    "gpa_pct": uni.get("min_gpa_percentage", 55),
                },
                "application_deadline": date(2026, 1, 15).isoformat(),
            }
            p_res = await client.table("programs").insert(p_row).execute()
            program_ids.append(p_res.data[0]["id"])

        print(f"  Uni: {uni['name']} ({uni['country']}) → {uid}  [3 programs]")

    print("\nSeeding students (creating auth users)...")
    student_ids = []
    for name in STUDENT_NAMES:
        email = f"{name.lower().replace(' ', '.')}@seed.test"
        auth_res = await client.auth.admin.create_user({
            "email":         email,
            "password":      "Seed@12345",
            "email_confirm": True,
            "app_metadata":  {"role": "student"},
        })
        user_id = auth_res.user.id
        row = random_student_row(user_id, name)
        res = await client.table("students").insert(row).execute()
        student_ids.append(res.data[0]["id"])
        print(f"  Student: {name} → {student_ids[-1]}")

    print("\nSeeding demo documents...")
    total_docs = 0
    for sid in student_ids:
        doc_types = random.sample(_DOC_TYPES, k=random.randint(2, 3))
        for doc_type in doc_types:
            file_id = str(uuid.uuid4())
            storage_path = f"{sid}/{file_id}.pdf"
            try:
                await client.storage.from_("documents").upload(
                    storage_path, MINIMAL_PDF,
                    {"content-type": "application/pdf"},
                )
            except Exception as exc:
                print(f"  ⚠ Storage upload failed for {storage_path}: {exc}")
                continue
            await client.table("documents").insert({
                "student_id":  sid,
                "doc_type":    doc_type,
                "storage_url": storage_path,
            }).execute()
            total_docs += 1
    print(f"  Uploaded {total_docs} documents across {len(student_ids)} students")

    print("\nSeeding 100 applications...")
    for i in range(100):
        student_id    = random.choice(student_ids)
        program_id    = random.choice(program_ids)
        consultant_id = random.choice(consultant_ids)
        agency_idx    = 0 if consultant_id in consultant_ids[:2] else 1
        agency_id     = agency_ids[agency_idx]

        # Bias toward earlier statuses but include full lifecycle examples
        weights = [20, 15, 15, 15, 10, 8, 7, 5, 3, 2]  # matches ALL_STATUSES order
        status  = random.choices(ALL_STATUSES, weights=weights[:len(ALL_STATUSES)], k=1)[0]

        history = [{"status": "lead", "changed_by": "seed",
                    "changed_at": datetime.now(timezone.utc).isoformat(), "note": "Seeded"}]
        if status != "lead":
            history.append({"status": status, "changed_by": "seed",
                             "changed_at": datetime.now(timezone.utc).isoformat(), "note": "Seeded"})

        await client.table("applications").insert({
            "student_id":     student_id,
            "program_id":     program_id,
            "consultant_id":  consultant_id,
            "agency_id":      agency_id,
            "status":         status,
            "status_history": history,
        }).execute()

    print(f"\n✓ Done! Seeded:"
          f"\n  {len(agency_ids)} agencies"
          f"\n  {len(consultant_ids)} consultants (status=active)"
          f"\n  {len(uni_ids)} universities"
          f"\n  {len(program_ids)} programs"
          f"\n  {len(student_ids)} students"
          f"\n  {total_docs} documents"
          f"\n  100 applications"
          f"\n\n  Consultant login: rahim.chowdhury@seed.test / Seed@12345")


if __name__ == "__main__":
    asyncio.run(seed())
