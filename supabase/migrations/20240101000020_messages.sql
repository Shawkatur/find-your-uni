-- 020_messages.sql — real-time chat between students and consultants
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  consultant_id   UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('student', 'consultant')),
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_student ON messages(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_consultant ON messages(consultant_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Students can read messages where they are the student
CREATE POLICY messages_student_select ON messages
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- Students can insert messages as sender_type = 'student'
CREATE POLICY messages_student_insert ON messages
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND sender_type = 'student'
  );

-- Consultants can read messages where they are the consultant
CREATE POLICY messages_consultant_select ON messages
  FOR SELECT USING (
    consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid())
  );

-- Consultants can insert messages as sender_type = 'consultant'
CREATE POLICY messages_consultant_insert ON messages
  FOR INSERT WITH CHECK (
    consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid())
    AND sender_type = 'consultant'
  );

-- Both parties can mark messages as read
CREATE POLICY messages_update_read ON messages
  FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid())
  ) WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    OR consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid())
  );

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
