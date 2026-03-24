-- =============================================================================
-- Migration 011: Security Fixes
-- Fixes: tracking_links RLS, payments INSERT policy, match_cache policy,
--        increment_tracking_clicks auth, payments status constraint,
--        consultant status check in application policies
-- =============================================================================

-- =============================================================================
-- 1. TRACKING LINKS — Enable RLS + add proper policies
-- =============================================================================
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;

-- Consultants can manage their own tracking links
CREATE POLICY "tracking_links_select_own" ON tracking_links FOR SELECT
  USING (consultant_id = (SELECT id FROM consultants WHERE user_id = auth.uid()));

CREATE POLICY "tracking_links_insert_own" ON tracking_links FOR INSERT
  WITH CHECK (consultant_id = (SELECT id FROM consultants WHERE user_id = auth.uid()));

CREATE POLICY "tracking_links_update_own" ON tracking_links FOR UPDATE
  USING (consultant_id = (SELECT id FROM consultants WHERE user_id = auth.uid()));

CREATE POLICY "tracking_links_delete_own" ON tracking_links FOR DELETE
  USING (consultant_id = (SELECT id FROM consultants WHERE user_id = auth.uid()));

-- Public can read tracking links (needed for intake/referral pages)
CREATE POLICY "tracking_links_public_read" ON tracking_links FOR SELECT
  USING (true);

-- =============================================================================
-- 2. PAYMENTS — Remove dangerous INSERT policy, restrict to service role only
--    Students should NOT be able to insert payment records directly.
--    Payments are created by the backend using the service role key.
-- =============================================================================
DROP POLICY IF EXISTS "payments_own_insert" ON payments;

-- Add pending_validation to the status constraint (used by verify endpoint)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'pending_validation', 'paid', 'failed', 'refunded'));

-- =============================================================================
-- 3. MATCH CACHE — Restrict to SELECT only (students should not modify cache)
-- =============================================================================
DROP POLICY IF EXISTS "match_cache_own" ON match_cache;

CREATE POLICY "match_cache_select_own" ON match_cache FOR SELECT
  USING (student_id = (SELECT id FROM students WHERE user_id = auth.uid()));

-- =============================================================================
-- 4. INCREMENT TRACKING CLICKS — Add basic auth check
--    Replace the function with one that validates the link exists
--    and is being called by an authenticated user or from the backend.
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_tracking_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only increment if the link actually exists
  UPDATE tracking_links
  SET clicks = clicks + 1
  WHERE id = link_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tracking link not found: %', link_id;
  END IF;
END;
$$;

-- Revoke direct execute from anon role to prevent unauthenticated abuse
-- The backend calls this via the service role key which bypasses this
REVOKE EXECUTE ON FUNCTION increment_tracking_clicks(uuid) FROM anon;

-- =============================================================================
-- 5. APPLICATION POLICIES — Check consultant is active
--    Drop and recreate consultant policies to enforce status = 'active'
-- =============================================================================

-- Helper: which agency does the current ACTIVE consultant belong to?
CREATE OR REPLACE FUNCTION my_active_agency_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT agency_id FROM consultants
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "applications_select_consultant" ON applications;
CREATE POLICY "applications_select_consultant" ON applications FOR SELECT
  USING (agency_id = my_active_agency_id());

DROP POLICY IF EXISTS "applications_update_consultant" ON applications;
CREATE POLICY "applications_update_consultant" ON applications FOR UPDATE
  USING (agency_id = my_active_agency_id());
