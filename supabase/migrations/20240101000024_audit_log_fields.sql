-- Add IP address and user agent tracking to admin audit log
ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;
