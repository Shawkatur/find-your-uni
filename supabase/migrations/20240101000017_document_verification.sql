-- =============================================================================
-- Add verification columns to documents for consultant review queue
-- =============================================================================

CREATE TYPE doc_verification_status AS ENUM ('pending_review', 'verified', 'rejected');

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS verification_status doc_verification_status NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS rejection_reason    TEXT,
  ADD COLUMN IF NOT EXISTS verified_by         UUID,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ;

CREATE INDEX idx_documents_verification ON documents(verification_status);
CREATE INDEX idx_documents_student_verification ON documents(student_id, verification_status);
