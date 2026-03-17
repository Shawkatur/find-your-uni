// ─── Application Status ──────────────────────────────────────────────────────
export type AppStatus =
  | "lead"
  | "pre_evaluation"
  | "docs_collection"
  | "applied"
  | "offer_received"
  | "conditional_offer"
  | "visa_stage"
  | "enrolled"
  | "rejected"
  | "withdrawn";

// ─── Student ─────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  academic_history: {
    ssc_gpa?: number;
    hsc_gpa?: number;
    bachelor_cgpa?: number;
    bachelor_subject?: string;
    gpa_percentage?: number;
  };
  test_scores: {
    ielts?: number;
    toefl?: number;
    gre?: number;
    gmat?: number;
    sat?: number;
  };
  budget_usd_per_year: number;
  preferred_countries: string[];
  preferred_degree?: string;
  preferred_fields: string[];
  push_enabled?: boolean;
  notify_status_changes?: boolean;
  notify_deadlines?: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

// ─── University ───────────────────────────────────────────────────────────────
export interface University {
  id: string;
  name: string;
  country: string;
  city?: string;
  website?: string;
  ranking_qs?: number;
  ranking_the?: number;
  tuition_usd_per_year: number;
  acceptance_rate_overall?: number;
  acceptance_rate_bd?: number;
  min_ielts?: number;
  min_toefl?: number;
  min_gpa_percentage?: number;
  scholarships_available: boolean;
  max_scholarship_pct?: number;
  intl_student_pct?: number;
  logo_url?: string;
  description?: string;
  programs?: Program[];
  created_at: string;
}

// ─── Program ─────────────────────────────────────────────────────────────────
export interface Program {
  id: string;
  university_id: string;
  name: string;
  degree_level: "bachelor" | "master" | "phd" | "diploma";
  field: string;
  tuition_usd_per_year?: number;
  duration_years?: number;
  application_deadline?: string;
  intake_months?: number[];
  is_active: boolean;
  created_at: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────
export interface MatchScore {
  total: number;
  ranking: number;
  cost_efficiency: number;
  bd_acceptance: number;
  eligibility: number;
}

export interface MatchResultItem {
  university: University;
  program: Program;
  score: MatchScore;
  ai_summary: string;
  cached_at: string;
}

// ─── Application ─────────────────────────────────────────────────────────────
export interface Application {
  id: string;
  student_id: string;
  program_id?: string;
  consultant_id?: string;
  agency_id?: string;
  status: AppStatus;
  status_history: StatusHistoryEntry[];
  notes?: string;
  created_at: string;
  updated_at: string;
  programs?: Program & { universities?: University };
  consultants?: Consultant;
}

export interface StatusHistoryEntry {
  status: string;
  changed_by: string;
  changed_at: string;
  note?: string;
}

// ─── Consultant / Agency ─────────────────────────────────────────────────────
export interface Consultant {
  id: string;
  user_id: string;
  full_name: string;
  agency_id: string;
  role: string;
  status: "pending" | "active" | "banned";
  whatsapp?: string;
  created_at: string;
  agencies?: Agency;
}

export interface Agency {
  id: string;
  name: string;
  license_no?: string;
  address?: string;
  city?: string;
  website?: string;
  whatsapp?: string;
  logo_url?: string;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  student_id: string;
  agency_id: string;
  consultant_id?: string;
  rating: number;
  comment?: string;
  is_verified: boolean;
  created_at: string;
}

// ─── Scholarship ─────────────────────────────────────────────────────────────
export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country?: string;
  degree_levels: string[];
  fields: string[];
  amount_usd?: number;
  is_fully_funded: boolean;
  deadline?: string;
  application_url?: string;
  bd_eligible: boolean;
  is_active: boolean;
  created_at: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  student_id: string;
  application_id?: string;
  amount_bdt: number;
  product: string;
  gateway: string;
  transaction_id?: string;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
}

// ─── Deadline ─────────────────────────────────────────────────────────────────
export interface UpcomingDeadline {
  id: string;
  name: string;
  degree_level: string;
  field: string;
  application_deadline: string;
  universities: {
    id: string;
    name: string;
    country: string;
    logo_url?: string;
  };
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface AppNotification {
  application_id: string;
  new_status: AppStatus;
  note?: string;
  received_at: string;
}

// ─── Setup Wizard Store ───────────────────────────────────────────────────────
export interface SetupWizardState {
  degree?: "bachelor" | "master" | "phd" | "diploma";
  ssc_gpa?: number;
  hsc_gpa?: number;
  bachelor_cgpa?: number;
  gpa_percentage?: number;
  ielts?: number;
  toefl?: number;
  gre?: number;
  countries: string[];
  fields: string[];
  budget_usd_per_year: number;
  full_name?: string;
  phone?: string;
  ref_code?: string;
}
