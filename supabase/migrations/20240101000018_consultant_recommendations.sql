-- Consultant → Student program recommendations with approval workflow.
-- Approved recommendations auto-create draft applications.

CREATE TABLE consultant_recommendations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  consultant_id  UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  program_id     UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, program_id)
);

CREATE INDEX idx_recommendations_student ON consultant_recommendations(student_id, status);
CREATE INDEX idx_recommendations_consultant ON consultant_recommendations(consultant_id);

-- Row Level Security (defense-in-depth; backend uses SERVICE_ROLE key)
ALTER TABLE consultant_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultants_read_recommendations"
  ON consultant_recommendations FOR SELECT
  TO authenticated
  USING (
    consultant_id IN (
      SELECT c.id FROM consultants c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "consultants_insert_recommendations"
  ON consultant_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    consultant_id IN (
      SELECT c.id FROM consultants c WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "students_read_recommendations"
  ON consultant_recommendations FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "students_update_recommendations"
  ON consultant_recommendations FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );
