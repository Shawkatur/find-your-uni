-- =============================================================================
-- Find Your University — Migration 021: Expand doc_type for PTE, Duolingo, SAT
-- =============================================================================

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check
  CHECK (doc_type IN (
    'transcript', 'passport', 'ielts_cert', 'toefl_cert',
    'sop', 'lor', 'cv', 'nid', 'other',
    'ielts', 'toefl', 'gre', 'gmat',
    'pte', 'duolingo', 'sat'
  ));
