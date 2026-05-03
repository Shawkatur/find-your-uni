-- =============================================================================
-- Find Your University — Migration 022: Expand student profile fields
-- Adds DOB, gender, personal details, work experience columns
-- =============================================================================

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS personal_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';

ALTER TABLE students
  DROP CONSTRAINT IF EXISTS students_gender_check;
ALTER TABLE students
  ADD CONSTRAINT students_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
