-- =============================================================================
-- Find Your University — Initial Schema
-- Run via: supabase db push  (from /supabase directory)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- UNIVERSITIES
-- =============================================================================
CREATE TABLE universities (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  country                 TEXT NOT NULL,                  -- ISO 3166-1 alpha-2 (US, CA, GB, AU, DE…)
  city                    TEXT,
  ranking_qs              INT,
  ranking_the             INT,
  tuition_usd_per_year    INT NOT NULL DEFAULT 0,
  acceptance_rate_overall NUMERIC(5,2),                   -- 0–100
  acceptance_rate_bd      NUMERIC(5,2),                   -- crowdsourced; 0–100
  min_ielts               NUMERIC(3,1),
  min_toefl               INT,
  min_gpa_percentage      INT,                            -- e.g. 65 means 65%
  scholarships_available  BOOLEAN NOT NULL DEFAULT false,
  max_scholarship_pct     INT,                            -- 0–100
  website                 TEXT,
  data_source             TEXT NOT NULL DEFAULT 'manual', -- 'qs_kaggle' | 'us_scorecard' | 'manual' | 'consultant'
  last_updated            TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding               vector(1536),                   -- pgvector for semantic search
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_universities_country  ON universities(country);
CREATE INDEX idx_universities_ranking  ON universities(ranking_qs);
CREATE INDEX idx_universities_tuition  ON universities(tuition_usd_per_year);
-- Approximate nearest-neighbour index for pgvector
CREATE INDEX idx_universities_embedding ON universities USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- PROGRAMS
-- =============================================================================
CREATE TABLE programs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id        UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  degree_level         TEXT NOT NULL CHECK (degree_level IN ('bachelor','master','phd','diploma')),
  field                TEXT NOT NULL,                    -- 'engineering'|'business'|'health'|'cs'|'law'|…
  tuition_usd_per_year INT,
  duration_years       NUMERIC(3,1),
  min_requirements     JSONB NOT NULL DEFAULT '{}',
  -- {"ielts": 6.5, "gpa_pct": 65, "work_exp_years": 0, "toefl": 90}
  application_deadline DATE,
  intake_months        INT[],                            -- [1, 9] = January and September
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_university   ON programs(university_id);
CREATE INDEX idx_programs_degree_field ON programs(degree_level, field);
CREATE INDEX idx_programs_active       ON programs(is_active);

-- =============================================================================
-- MATCH SETTINGS (admin-configurable scoring weights)
-- =============================================================================
CREATE TABLE match_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weight_ranking        NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  weight_cost_efficiency NUMERIC(4,3) NOT NULL DEFAULT 0.400,
  weight_bd_acceptance  NUMERIC(4,3) NOT NULL DEFAULT 0.300,
  ai_top_n              INT NOT NULL DEFAULT 10,         -- how many results to pass to GPT
  filter_budget_buffer  NUMERIC(4,3) NOT NULL DEFAULT 0.100,  -- 10% over-budget allowed
  updated_by            UUID,                            -- auth.users.id
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings row
INSERT INTO match_settings (weight_ranking, weight_cost_efficiency, weight_bd_acceptance)
VALUES (0.300, 0.400, 0.300);

-- =============================================================================
-- STUDENTS
-- =============================================================================
CREATE TABLE students (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID UNIQUE NOT NULL,               -- FK → auth.users (enforced by Supabase)
  full_name          TEXT NOT NULL,
  phone              TEXT,
  academic_history   JSONB NOT NULL DEFAULT '{}',
  -- {"ssc_gpa": 5.0, "hsc_gpa": 4.5, "bachelor_cgpa": 3.2, "bachelor_subject": "CSE", "gpa_percentage": 75}
  test_scores        JSONB NOT NULL DEFAULT '{}',
  -- {"ielts": 6.5, "toefl": 90, "gre": 310, "gmat": 650, "sat": 1400}
  budget_usd_per_year INT NOT NULL,
  preferred_countries TEXT[] NOT NULL DEFAULT '{}',      -- ['CA','UK','AU','US','DE']
  preferred_degree    TEXT CHECK (preferred_degree IN ('bachelor','master','phd','diploma')),
  preferred_fields    TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_user_id ON students(user_id);

-- =============================================================================
-- AGENCIES
-- =============================================================================
CREATE TABLE agencies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  license_no    TEXT,
  address       TEXT,
  avg_rating    NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  review_count  INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CONSULTANTS
-- =============================================================================
CREATE TABLE consultants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL,
  agency_id  UUID NOT NULL REFERENCES agencies(id),
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  full_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultants_agency ON consultants(agency_id);

-- =============================================================================
-- APPLICATION STATUS ENUM + APPLICATIONS
-- =============================================================================
CREATE TYPE app_status AS ENUM (
  'lead',
  'pre_evaluation',
  'docs_collection',
  'applied',
  'offer_received',
  'conditional_offer',
  'visa_stage',
  'enrolled',
  'rejected',
  'withdrawn'
);

CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES students(id),
  program_id     UUID NOT NULL REFERENCES programs(id),
  consultant_id  UUID REFERENCES consultants(id),
  agency_id      UUID REFERENCES agencies(id),
  status         app_status NOT NULL DEFAULT 'lead',
  status_history JSONB NOT NULL DEFAULT '[]',
  -- [{status, changed_by, changed_at, note}]
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_student    ON applications(student_id);
CREATE INDEX idx_applications_program    ON applications(program_id);
CREATE INDEX idx_applications_consultant ON applications(consultant_id);
CREATE INDEX idx_applications_agency     ON applications(agency_id);
CREATE INDEX idx_applications_status     ON applications(status);

-- =============================================================================
-- REVIEWS
-- =============================================================================
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES students(id),
  agency_id      UUID NOT NULL REFERENCES agencies(id),
  consultant_id  UUID REFERENCES consultants(id),
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, agency_id)
);

CREATE INDEX idx_reviews_agency ON reviews(agency_id);

-- Trigger: keep agencies.avg_rating in sync
CREATE OR REPLACE FUNCTION update_agency_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE agencies
  SET
    avg_rating   = sub.avg,
    review_count = sub.cnt
  FROM (
    SELECT AVG(rating)::NUMERIC(3,2) AS avg, COUNT(*) AS cnt
    FROM reviews WHERE agency_id = COALESCE(NEW.agency_id, OLD.agency_id)
  ) sub
  WHERE agencies.id = COALESCE(NEW.agency_id, OLD.agency_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reviews_agency_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_agency_rating();

-- =============================================================================
-- DOCUMENTS
-- =============================================================================
CREATE TABLE documents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES students(id),
  doc_type       TEXT NOT NULL CHECK (doc_type IN ('transcript','passport','ielts_cert','toefl_cert','sop','lor','cv','nid','other')),
  storage_url    TEXT NOT NULL,                          -- Cloudflare R2 object key (not full URL)
  application_id UUID REFERENCES applications(id),
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_student     ON documents(student_id);
CREATE INDEX idx_documents_application ON documents(application_id);

-- =============================================================================
-- MATCH CACHE
-- =============================================================================
CREATE TABLE match_cache (
  student_id    UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  match_results JSONB NOT NULL,
  -- [{university_id, program_id, score, breakdown, ai_summary}]
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_settings ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an agency admin?
CREATE OR REPLACE FUNCTION is_agency_admin(target_agency_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM consultants
    WHERE user_id = auth.uid()
      AND agency_id = target_agency_id
      AND role = 'admin'
  );
$$;

-- Helper: which agency does the current consultant belong to?
CREATE OR REPLACE FUNCTION my_agency_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT agency_id FROM consultants WHERE user_id = auth.uid() LIMIT 1;
$$;

-- STUDENTS
CREATE POLICY "students_select_own" ON students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "students_insert_own" ON students FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "students_update_own" ON students FOR UPDATE USING (user_id = auth.uid());

-- Consultants can read students linked to their agency via applications
CREATE POLICY "students_select_consultant" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN consultants c ON c.id = a.consultant_id
    WHERE a.student_id = students.id AND c.user_id = auth.uid()
  )
);

-- APPLICATIONS
CREATE POLICY "applications_select_student" ON applications FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "applications_insert_student" ON applications FOR INSERT
  WITH CHECK (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "applications_select_consultant" ON applications FOR SELECT
  USING (agency_id = my_agency_id());

CREATE POLICY "applications_update_consultant" ON applications FOR UPDATE
  USING (agency_id = my_agency_id());

-- DOCUMENTS
CREATE POLICY "documents_select_own" ON documents FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "documents_insert_own" ON documents FOR INSERT
  WITH CHECK (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "documents_select_consultant" ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN consultants c ON c.id = a.consultant_id
      WHERE a.id = documents.application_id AND c.user_id = auth.uid()
    )
  );

-- MATCH CACHE
CREATE POLICY "match_cache_own" ON match_cache FOR ALL
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- AGENCIES (public read, agency-admin write)
CREATE POLICY "agencies_public_read" ON agencies FOR SELECT USING (true);
CREATE POLICY "agencies_admin_update" ON agencies FOR UPDATE
  USING (is_agency_admin(id));

-- CONSULTANTS (public read, self-update)
CREATE POLICY "consultants_public_read" ON consultants FOR SELECT USING (true);
CREATE POLICY "consultants_self_update" ON consultants FOR UPDATE
  USING (user_id = auth.uid());

-- REVIEWS
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_student" ON reviews FOR INSERT
  WITH CHECK (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- UNIVERSITIES + PROGRAMS (public read, service-role write via backend)
CREATE POLICY "universities_public_read" ON universities FOR SELECT USING (true);
CREATE POLICY "programs_public_read"     ON programs     FOR SELECT USING (true);

-- MATCH SETTINGS (public read so frontend can show weights; service-role write)
CREATE POLICY "match_settings_public_read" ON match_settings FOR SELECT USING (true);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
