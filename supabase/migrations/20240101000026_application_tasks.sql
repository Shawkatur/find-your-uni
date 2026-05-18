-- Application tasks/deadlines: checklist items per application
CREATE TABLE IF NOT EXISTS application_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_tasks_application ON application_tasks(application_id, is_completed, due_date);
CREATE INDEX idx_app_tasks_student_due ON application_tasks(student_id, due_date) WHERE NOT is_completed;

ALTER TABLE application_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own tasks"
  ON application_tasks FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Consultants can manage assigned student tasks"
  ON application_tasks FOR ALL
  USING (application_id IN (
    SELECT id FROM applications WHERE consultant_id IN (
      SELECT id FROM consultants WHERE user_id = auth.uid()
    )
  ));
