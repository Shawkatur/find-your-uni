-- =============================================================================
-- Find Your University — Migration 004: Mobile App Features
-- Run via: supabase db push  (from /supabase directory)
-- =============================================================================

-- =============================================================================
-- EXTEND EXISTING TABLES
-- =============================================================================

-- universities: additional data fields for mobile display
ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS intl_student_pct  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS bd_students_known INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS description       TEXT;

-- students: push notification preferences + onboarding flag
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS push_enabled           BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_status_changes  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_deadlines       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN NOT NULL DEFAULT false;

-- agencies: contact + display fields
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS city       TEXT,
  ADD COLUMN IF NOT EXISTS website    TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp   TEXT,
  ADD COLUMN IF NOT EXISTS logo_url   TEXT;

-- =============================================================================
-- PUSH TOKENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_student ON push_tokens(student_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- =============================================================================
-- SCHOLARSHIPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS scholarships (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  provider         TEXT NOT NULL,
  country          TEXT,                       -- ISO 2 or NULL = international
  degree_levels    TEXT[] NOT NULL DEFAULT '{}',  -- ['master','phd']
  fields           TEXT[] NOT NULL DEFAULT '{}',  -- ['any'] or specific fields
  amount_usd       INT,                        -- NULL = fully funded (non-monetary)
  is_fully_funded  BOOLEAN NOT NULL DEFAULT false,
  deadline         DATE,
  application_url  TEXT,
  bd_eligible      BOOLEAN NOT NULL DEFAULT true,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_country  ON scholarships(country);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships(deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_active   ON scholarships(is_active);

ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholarships_public_read" ON scholarships FOR SELECT USING (true);

-- =============================================================================
-- STUDENT SCHOLARSHIP SAVES (bookmarks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_scholarship_saves (
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, scholarship_id)
);

ALTER TABLE student_scholarship_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholarship_saves_own" ON student_scholarship_saves FOR ALL
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- =============================================================================
-- PAYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id   UUID REFERENCES applications(id),
  amount_bdt       INT NOT NULL,
  product          TEXT NOT NULL,   -- 'match_premium' | 'application_fee' | 'consultation'
  gateway          TEXT NOT NULL DEFAULT 'sslcommerz',
  transaction_id   TEXT UNIQUE,     -- gateway txn ID
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','failed','refunded')),
  gateway_response JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_own_read" ON payments FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "payments_own_insert" ON payments FOR INSERT
  WITH CHECK (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- =============================================================================
-- SEED SCHOLARSHIPS (Chevening, DAAD, Erasmus Mundus, Fulbright)
-- =============================================================================
INSERT INTO scholarships (name, provider, country, degree_levels, fields, amount_usd, is_fully_funded, deadline, application_url, bd_eligible)
VALUES
  (
    'Chevening Scholarship',
    'UK Government / Foreign Commonwealth & Development Office',
    'GB',
    ARRAY['master'],
    ARRAY['any'],
    NULL,
    true,
    '2024-11-05',
    'https://www.chevening.org/scholarships/',
    true
  ),
  (
    'DAAD Scholarship',
    'German Academic Exchange Service (DAAD)',
    'DE',
    ARRAY['master','phd'],
    ARRAY['any'],
    NULL,
    true,
    '2024-11-15',
    'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    true
  ),
  (
    'Erasmus Mundus Joint Masters',
    'European Commission',
    NULL,
    ARRAY['master'],
    ARRAY['any'],
    NULL,
    true,
    '2025-01-15',
    'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus_en',
    true
  ),
  (
    'Fulbright Foreign Student Program',
    'U.S. Department of State',
    'US',
    ARRAY['master','phd'],
    ARRAY['any'],
    NULL,
    true,
    '2024-11-01',
    'https://foreign.fulbrightonline.org/',
    true
  ),
  (
    'Commonwealth Scholarship',
    'Commonwealth Scholarship Commission',
    'GB',
    ARRAY['master','phd'],
    ARRAY['any'],
    NULL,
    true,
    '2024-12-01',
    'https://cscuk.fcdo.gov.uk/scholarships/',
    true
  ),
  (
    'Australian Awards Scholarship',
    'Australian Government - Department of Foreign Affairs and Trade',
    'AU',
    ARRAY['master','phd'],
    ARRAY['any'],
    NULL,
    true,
    '2024-04-30',
    'https://www.dfat.gov.au/people-to-people/australia-awards/',
    true
  ),
  (
    'Swedish Institute Scholarships',
    'Swedish Institute',
    'SE',
    ARRAY['master'],
    ARRAY['any'],
    NULL,
    true,
    '2025-02-10',
    'https://si.se/en/apply/scholarships/',
    true
  ),
  (
    'Gates Cambridge Scholarship',
    'Bill & Melinda Gates Foundation / University of Cambridge',
    'GB',
    ARRAY['master','phd'],
    ARRAY['any'],
    NULL,
    true,
    '2024-12-04',
    'https://www.gatescambridge.org/apply/',
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- UPDATED_AT trigger for payments
-- =============================================================================
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
