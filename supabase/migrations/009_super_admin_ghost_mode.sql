-- =============================================================================
-- Migration 009: Super Admin Ghost Mode
-- Adds: super_admin RLS bypass, ghost audit columns, assignment tracking
-- =============================================================================

-- 1. Helper function: check if current JWT has super_admin role
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

-- 2. RLS bypass policies for super_admin on all RLS-enabled tables
CREATE POLICY "super_admin_full_access" ON students FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON applications FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON documents FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON match_cache FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON agencies FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON consultants FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON reviews FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON universities FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON programs FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON match_settings FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON admin_audit_log FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_full_access" ON tracking_links FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 3. Ghost audit columns on admin_audit_log
ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_label TEXT DEFAULT 'admin';

-- 4. Assignment tracking on applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS assigned_by UUID,
  ADD COLUMN IF NOT EXISTS assigned_source TEXT DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_applications_assigned_source ON applications(assigned_source);
