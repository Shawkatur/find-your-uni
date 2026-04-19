-- =============================================================================
-- Migration 012: Fix RLS Infinite Recursion
-- Problem: students_select_consultant queries applications, whose
--          applications_select_student queries students → infinite loop.
-- Fix: Use SECURITY DEFINER helper functions for cross-table lookups
--       so the subqueries bypass RLS and avoid the circular dependency.
-- =============================================================================

-- Helper: get the current user's student ID without triggering students RLS
CREATE OR REPLACE FUNCTION my_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper: get application student IDs for the current consultant (bypasses RLS)
CREATE OR REPLACE FUNCTION my_consultant_student_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT a.student_id
  FROM applications a
  JOIN consultants c ON c.id = a.consultant_id
  WHERE c.user_id = auth.uid();
$$;

-- =============================================================================
-- Fix STUDENTS policies — remove cross-table SELECT that causes recursion
-- =============================================================================
DROP POLICY IF EXISTS "students_select_consultant" ON students;
CREATE POLICY "students_select_consultant" ON students FOR SELECT
  USING (id IN (SELECT my_consultant_student_ids()));

-- =============================================================================
-- Fix APPLICATIONS policies — use helper function instead of inline subquery
-- =============================================================================
DROP POLICY IF EXISTS "applications_select_student" ON applications;
CREATE POLICY "applications_select_student" ON applications FOR SELECT
  USING (student_id = my_student_id());

DROP POLICY IF EXISTS "applications_insert_student" ON applications;
CREATE POLICY "applications_insert_student" ON applications FOR INSERT
  WITH CHECK (student_id = my_student_id());

-- =============================================================================
-- Fix DOCUMENTS policies — same pattern
-- =============================================================================
DROP POLICY IF EXISTS "documents_select_own" ON documents;
CREATE POLICY "documents_select_own" ON documents FOR SELECT
  USING (student_id = my_student_id());

DROP POLICY IF EXISTS "documents_insert_own" ON documents;
CREATE POLICY "documents_insert_own" ON documents FOR INSERT
  WITH CHECK (student_id = my_student_id());

DROP POLICY IF EXISTS "documents_select_consultant" ON documents;
CREATE POLICY "documents_select_consultant" ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN consultants c ON c.id = a.consultant_id
      WHERE a.id = documents.application_id AND c.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Fix MATCH CACHE policy
-- =============================================================================
DROP POLICY IF EXISTS "match_cache_select_own" ON match_cache;
CREATE POLICY "match_cache_select_own" ON match_cache FOR SELECT
  USING (student_id = my_student_id());
