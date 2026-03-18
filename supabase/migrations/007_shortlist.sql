-- 007_shortlist.sql  — student/consultant shared shortlist
CREATE TABLE IF NOT EXISTS student_university_shortlist (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  added_by_role TEXT NOT NULL DEFAULT 'student'
                CHECK (added_by_role IN ('student', 'consultant')),
  note          TEXT,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlist_student ON student_university_shortlist(student_id);

ALTER TABLE student_university_shortlist ENABLE ROW LEVEL SECURITY;

-- Students manage own shortlist
CREATE POLICY shortlist_student_all ON student_university_shortlist
  FOR ALL USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Consultants can read for students in their agency
CREATE POLICY shortlist_consultant_select ON student_university_shortlist
  FOR SELECT USING (
    student_id IN (
      SELECT a.student_id FROM applications a
      JOIN consultants c ON c.agency_id = a.agency_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Consultants can insert for students in their agency
CREATE POLICY shortlist_consultant_insert ON student_university_shortlist
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT a.student_id FROM applications a
      JOIN consultants c ON c.agency_id = a.agency_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Consultants can delete for students in their agency
CREATE POLICY shortlist_consultant_delete ON student_university_shortlist
  FOR DELETE USING (
    student_id IN (
      SELECT a.student_id FROM applications a
      JOIN consultants c ON c.agency_id = a.agency_id
      WHERE c.user_id = auth.uid()
    )
  );
