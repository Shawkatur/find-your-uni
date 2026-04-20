-- Add admin_notes column and expand status check to include 'rejected' and 'banned'
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Drop old check constraint and add expanded one
ALTER TABLE consultants DROP CONSTRAINT IF EXISTS consultants_status_check;
ALTER TABLE consultants ADD CONSTRAINT consultants_status_check
  CHECK (status IN ('pending', 'active', 'rejected', 'banned', 'suspended'));
