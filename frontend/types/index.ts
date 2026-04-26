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

// ─── User / Auth ─────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  role: "student" | "consultant";
  created_at: string;
}

// ─── Student ─────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;

  // Raw JSONB columns from DB
  academic_history?: {
    ssc_gpa?: number;
    hsc_gpa?: number;
    bachelor_cgpa?: number;
    bachelor_institution?: string;
    bachelor_subject?: string;
    gpa_percentage?: number;
  };
  test_scores?: {
    ielts?: number;
    toefl?: number;
    gre?: number;
    gmat?: number;
    sat?: number;
  };
  preferred_degree?: "bachelor" | "master" | "phd" | "diploma";
  preferred_countries?: string[];
  preferred_fields?: string[];
  budget_usd_per_year?: number;

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
  acceptance_rate_overall?: number;
  acceptance_rate_bd?: number;
  tuition_usd_per_year?: number;
  min_ielts?: number;
  min_toefl?: number;
  min_gpa_percentage?: number;
  max_scholarship_pct?: number;
  scholarships_available?: boolean;
  description?: string;
  logo_url?: string;
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
  duration_years?: number;
  annual_tuition_usd?: number;
  application_deadline?: string;
  ielts_min?: number;
  gpa_min?: number;
  created_at: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────
export interface MatchBreakdown {
  ranking: number;
  cost_efficiency: number;
  bd_acceptance: number;
}

export interface MatchResultItem {
  university_id: string;
  program_id: string;
  university_name: string;
  program_name: string;
  country: string;
  tuition_usd_per_year: number | null;
  ranking_qs: number | null;
  score: number;               // 0–1 float from backend
  breakdown: MatchBreakdown;
  ai_summary: string | null;
}

// ─── Application ─────────────────────────────────────────────────────────────
export interface Application {
  id: string;
  student_id: string;
  university_id: string;
  program_id: string;
  consultant_id?: string;
  status: AppStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  university?: University;
  program?: Program;
  student?: Student;
  consultant?: Consultant;
  status_history?: StatusHistoryEntry[];
  documents?: Document[];
}

// Raw shape returned by the API (Supabase joined columns use plural keys).
// Use this when mapping API responses into the normalized `Application` type.
export interface ApplicationApiResponse extends Omit<Application, "student" | "program" | "university"> {
  students?: Student;
  student?: Student;
  programs?: Program & { universities?: University };
  program?: Program;
  universities?: University;
  university?: University;
}

export interface StatusHistoryEntry {
  status: AppStatus;
  note?: string;
  changed_by: string;
  changed_at: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────
export type DocType =
  | "passport"
  | "transcript"
  | "sop"
  | "lor"
  | "cv"
  | "ielts"
  | "toefl"
  | "gre"
  | "gmat"
  | "other";

export interface Document {
  id: string;
  student_id: string;
  application_id?: string;
  doc_type: DocType;
  filename: string;
  r2_key: string;
  url?: string;
  uploaded_at: string;
}

// ─── Consultant ───────────────────────────────────────────────────────────────
export interface Consultant {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  agency_id?: string;
  agency?: Agency;
  role_title?: string;
  whatsapp?: string;
  created_at: string;
}

// ─── Agency ──────────────────────────────────────────────────────────────────
export interface Agency {
  id: string;
  name: string;
  license_no?: string;
  address?: string;
  city?: string;
  website?: string;
  avg_rating?: number;
  review_count?: number;
  is_active?: boolean;
  created_at: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  agency_id: string;
  student_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ─── Match Settings ──────────────────────────────────────────────────────────
export interface MatchSettings {
  id: string;
  weight_ranking: number;
  weight_cost: number;
  weight_bd_acceptance: number;
  ai_top_n: number;
  budget_buffer_pct: number;
  updated_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Tracking Links ──────────────────────────────────────────────────────────
export interface TrackingLink {
  id: string;
  consultant_id: string;
  agency_id: string;
  code: string;
  name?: string;
  clicks: number;
  created_at: string;
}

// ─── Consultant with status ───────────────────────────────────────────────────
export interface ConsultantWithStatus extends Consultant {
  status: "pending" | "active" | "banned";
  agencies?: { name: string };
  student_count?: number;
}

// ─── Lead Application ─────────────────────────────────────────────────────────
export interface LeadApplication {
  id: string;
  student_id: string;
  consultant_id: string | null;
  agency_id: string | null;
  status: string;
  notes?: string;
  created_at: string;
  students?: {
    full_name: string;
    phone?: string;
    created_at: string;
  };
}

// ─── Intake Info (public tracking endpoint) ───────────────────────────────────
export interface IntakeInfo {
  code: string;
  consultant_name: string | null;
  agency_name: string | null;
  is_admin: boolean;
}
