-- =============================================================================
-- Add user_id to push_tokens so consultants can also register for push
-- =============================================================================

-- Add nullable user_id column (auth.users FK)
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from students table for existing rows
UPDATE push_tokens pt
SET user_id = s.user_id
FROM students s
WHERE pt.student_id = s.id AND pt.user_id IS NULL;

-- Index and unique constraint for looking up tokens by user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
ALTER TABLE push_tokens ADD CONSTRAINT uq_push_tokens_user_token UNIQUE (user_id, token);

-- Make student_id nullable (consultants won't have one)
ALTER TABLE push_tokens ALTER COLUMN student_id DROP NOT NULL;

-- Allow consultants to manage their own tokens via RLS
CREATE POLICY "push_tokens_own_by_user" ON push_tokens FOR ALL
  USING (user_id = auth.uid());
