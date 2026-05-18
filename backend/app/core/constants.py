"""
Centralized constants shared across the backend.
Frontend mirrors these in frontend/lib/constants.ts.
"""

# ─── Matchmaking defaults ────────────────────────────────────────────────────
MAX_QS_RANK = 1500
DEFAULT_BUDGET_USD = 20_000
DEFAULT_ACCEPTANCE_RATE_BD = 50.0
SCHOLARSHIP_BONUS_FACTOR = 0.15
DEFAULT_SCHOLARSHIP_PCT = 25
RESULT_BUFFER = 5

# ─── File uploads ────────────────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
SIGNED_URL_EXPIRY_SECONDS = 3600
UPLOAD_CHUNK_SIZE = 256 * 1024  # 256 KB

# ─── AI ──────────────────────────────────────────────────────────────────────
AI_TEMPERATURE = 0.4
AI_MAX_TOKENS = 1500

# ─── Payments ────────────────────────────────────────────────────────────────
MIN_PAYMENT_BDT = 100
MAX_PAYMENT_BDT = 500_000
PAYMENT_AMOUNT_TOLERANCE_BDT = 1
SSLCOMMERZ_TIMEOUT_SECONDS = 10.0

# ─── Program filter ─────────────────────────────────────────────────────────
PROGRAM_FILTER_LIMIT = 200

# ─── Document types ──────────────────────────────────────────────────────────
VALID_DOC_TYPES = {
    "passport", "transcript", "sop", "lor", "cv",
    "ielts_cert", "toefl_cert", "ielts", "toefl",
    "gre", "gmat", "nid", "other",
    "pte", "duolingo", "sat",
}

# ─── Application statuses ───────────────────────────────────────────────────
APP_STATUSES = [
    "unverified", "lead", "pre_evaluation", "docs_collection", "applied",
    "offer_received", "conditional_offer", "visa_stage", "enrolled",
    "rejected", "withdrawn", "junk",
]

STATUS_LABELS = {
    "lead":              "Enquiry Received",
    "unverified":        "Unverified",
    "pre_evaluation":    "Profile Evaluated",
    "docs_collection":   "Documents Needed",
    "applied":           "Application Submitted",
    "offer_received":    "Offer Letter Received!",
    "conditional_offer": "Conditional Offer",
    "visa_stage":        "Visa Stage",
    "enrolled":          "Enrolled — Congrats!",
    "rejected":          "Application Update",
    "withdrawn":         "Application Withdrawn",
    "junk":              "Junk Lead",
}

DEGREE_LEVELS = ["bachelor", "master", "phd", "diploma"]

VERIFICATION_STATUSES = ["pending_review", "verified", "rejected"]

CONSULTANT_STATUSES = ["pending", "active", "banned", "rejected"]

PIPELINE_STATUSES = [
    "invited", "onboarding", "gathering_docs",
    "ready_to_apply", "applied", "enrolled",
]
