-- =============================================================================
-- Add pipeline_status to students for consultant CRM roster tracking
-- =============================================================================

CREATE TYPE pipeline_status AS ENUM (
  'invited',
  'onboarding',
  'gathering_docs',
  'ready_to_apply',
  'applied',
  'enrolled'
);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS pipeline_status pipeline_status NOT NULL DEFAULT 'onboarding';

CREATE INDEX idx_students_pipeline_status ON students(pipeline_status);
