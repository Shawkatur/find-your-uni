-- Consultant availability slots and student bookings
CREATE TABLE IF NOT EXISTS consultant_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_consultant ON consultant_availability(consultant_id, day_of_week) WHERE is_active;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_consultant ON bookings(consultant_id, scheduled_at) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_student ON bookings(student_id, scheduled_at DESC);

ALTER TABLE consultant_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants manage own availability"
  ON consultant_availability FOR ALL
  USING (consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid()));

CREATE POLICY "Students can view consultant availability"
  ON consultant_availability FOR SELECT
  USING (is_active = true);

CREATE POLICY "Students can manage own bookings"
  ON bookings FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Consultants can view and update their bookings"
  ON bookings FOR ALL
  USING (consultant_id IN (SELECT id FROM consultants WHERE user_id = auth.uid()));
