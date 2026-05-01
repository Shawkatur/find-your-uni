-- 019_shortlist_financial_fields.sql — Add financial tracking and manual entry flag to shortlist
ALTER TABLE student_university_shortlist
  ADD COLUMN IF NOT EXISTS tuition_fee      NUMERIC,
  ADD COLUMN IF NOT EXISTS currency         TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS living_expense   NUMERIC,
  ADD COLUMN IF NOT EXISTS is_manual_entry  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS program_name     TEXT;
