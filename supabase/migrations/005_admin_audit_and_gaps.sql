-- =============================================================================
-- Find Your University — Migration 005: Admin Audit Log & Access Control Gaps
-- Run via: supabase db push  (from /supabase directory)
-- =============================================================================

-- =============================================================================
-- ADMIN AUDIT LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID        NOT NULL,
  action        TEXT        NOT NULL,        -- e.g. 'approve_consultant', 'ban_consultant', 'reassign_application'
  resource_type TEXT        NOT NULL,        -- 'consultant', 'application', 'match_settings'
  resource_id   UUID,
  old_value     JSONB,
  new_value     JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins may read audit logs; writes come from the service role (backend)
CREATE POLICY "admin_audit_read" ON admin_audit_log
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- =============================================================================
-- EXTEND match_settings WITH TRACKING COLUMNS
-- =============================================================================

ALTER TABLE match_settings
  ADD COLUMN IF NOT EXISTS updated_by  UUID,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT now();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action        ON admin_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource_type ON admin_audit_log (resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at    ON admin_audit_log (created_at DESC);
