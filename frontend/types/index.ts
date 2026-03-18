// ─── Application Status ──────────────────────────────────────────────────────
export type AppStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "offer_received"
  | "enrolled"
  | "rejected"
  | "withdrawn";

// ─── User / Auth ─────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  role: "student" | "consultant" | "admin";
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

  // Academic
  ssc_gpa?: number;
  hsc_gpa?: number;
  bachelor_gpa?: number;
  bachelor_institution?: string;
  bachelor_field?: string;

  // Test scores
  ielts_score?: number;
  toefl_score?: number;
  gre_score?: number;
  gmat_score?: number;

  // Preferences
  target_degree: "bachelor" | "master" | "phd" | "diploma";
  target_fields: string[];
  target_countries: string[];
  budget_usd?: number;

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
  country: string;
  city?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  consultant_count?: number;
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
