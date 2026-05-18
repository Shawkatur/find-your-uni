-- Performance indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_student_status_created
  ON applications(student_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_student_consultant_created
  ON messages(student_id, consultant_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_student_type_status
  ON documents(student_id, doc_type, verification_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_cache_student_created
  ON match_cache(student_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_agency_status
  ON applications(agency_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_student_created
  ON payments(student_id, created_at DESC);
