-- =============================================================================
-- Find Your University — Migration 006: Expand doc_type allowed values
-- Adds ielts, toefl, gre, gmat to the documents.doc_type check constraint
-- =============================================================================

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check
  CHECK (doc_type IN (
    'transcript', 'passport', 'ielts_cert', 'toefl_cert',
    'sop', 'lor', 'cv', 'nid', 'other',
    'ielts', 'toefl', 'gre', 'gmat'
  ));
