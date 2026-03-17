-- ─── Migration 003: RBAC Extensions ──────────────────────────────────────────
-- Adds: consultant.status, nullable program_id, tracking_links, referral_source

-- 1. Consultant approval workflow
ALTER TABLE consultants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'active', 'banned'));

CREATE INDEX IF NOT EXISTS idx_consultants_status ON consultants(status);

-- 2. Nullable program_id — lead-stage applications have no program yet
ALTER TABLE applications
  ALTER COLUMN program_id DROP NOT NULL;

-- 3. Tracking links table
CREATE TABLE IF NOT EXISTS tracking_links (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT,
  clicks        INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_links_consultant ON tracking_links(consultant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_code ON tracking_links(code);

-- 4. Referral audit field on students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS referral_source TEXT;
