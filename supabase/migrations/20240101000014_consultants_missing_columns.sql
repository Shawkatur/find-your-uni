-- Add missing columns to consultants table that the backend expects
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS role_title TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'active', 'suspended'));
ALTER TABLE consultants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
