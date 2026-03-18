-- =============================================================================
-- Find Your University — UK Universities Seed (7 universities, 21 programs)
-- Adds Imperial, UCL, KCL, Birmingham, Nottingham, Sheffield, Southampton
-- Run in Supabase SQL editor or: psql $DATABASE_URL -f supabase/seeds/002_uk_universities.sql
-- =============================================================================

DO $$
DECLARE
  u_imperial     UUID;
  u_ucl          UUID;
  u_kcl          UUID;
  u_birmingham   UUID;
  u_nottingham   UUID;
  u_sheffield    UUID;
  u_southampton  UUID;
BEGIN

-- ── INSERT UNIVERSITIES ────────────────────────────────────────────────────

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('Imperial College London', 'GB', 'London', 8, 11, 32000,
  14.0, 12.0, 6.5, 92, 65, true, 30, 'https://imperial.ac.uk', 'manual',
  60.0, 180,
  'World-leading science and engineering university in London. Ranked #8 globally, exceptional for STEM disciplines. High international student population with strong industry links.')
RETURNING id INTO u_imperial;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University College London', 'GB', 'London', 9, 22, 30000,
  63.0, 50.0, 6.5, 92, 60, true, 25, 'https://ucl.ac.uk', 'manual',
  52.0, 320,
  'One of London''s most prestigious research universities with broad academic range. Strong in computer science, engineering, law, and social sciences. Large Bangladeshi alumni community.')
RETURNING id INTO u_ucl;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('King''s College London', 'GB', 'London', 40, 35, 29000,
  37.0, 30.0, 6.5, 92, 60, true, 25, 'https://kcl.ac.uk', 'manual',
  45.0, 260,
  'Russell Group university in the heart of London. Renowned for health sciences, law, social science, and humanities. Central location excellent for internships and networking.')
RETURNING id INTO u_kcl;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Birmingham', 'GB', 'Birmingham', 84, 159, 22000,
  70.0, 60.0, 6.0, 88, 50, true, 20, 'https://birmingham.ac.uk', 'manual',
  32.0, 580,
  'Russell Group university in the UK''s second-largest city. Strong engineering, business, and computer science programs at lower tuition than London universities. Large South Asian student community.')
RETURNING id INTO u_birmingham;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Nottingham', 'GB', 'Nottingham', 99, 178, 21000,
  72.0, 65.0, 6.0, 85, 50, true, 20, 'https://nottingham.ac.uk', 'manual',
  28.0, 490,
  'Russell Group university with a global campus network (UK, China, Malaysia). Popular among Bangladeshi students for affordable tuition and strong post-study work opportunities.')
RETURNING id INTO u_nottingham;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Sheffield', 'GB', 'Sheffield', 113, 124, 21000,
  68.0, 60.0, 6.0, 85, 50, true, 20, 'https://sheffield.ac.uk', 'manual',
  26.0, 440,
  'Russell Group university known for engineering, materials science, and public health. Consistently ranked among the UK''s best for student experience. Affordable cost of living.')
RETURNING id INTO u_sheffield;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Southampton', 'GB', 'Southampton', 81, 127, 22000,
  67.0, 58.0, 6.5, 88, 55, true, 25, 'https://southampton.ac.uk', 'manual',
  34.0, 380,
  'Russell Group research university in Southampton. Globally recognised for electronics, computer science, and oceanography. Strong industry partnerships and graduate employment rates.')
RETURNING id INTO u_southampton;

-- ── INSERT PROGRAMS ────────────────────────────────────────────────────────

-- Imperial College London
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_imperial, 'MSc Computing', 'master', 'cs', 32000,
   1.0, '{"ielts":6.5,"gpa_pct":65}', '2026-06-30', '{9}', true),
  (u_imperial, 'MEng Electrical and Electronic Engineering', 'master', 'engineering', 33000,
   1.0, '{"ielts":6.5,"gpa_pct":65}', '2026-06-30', '{9}', true),
  (u_imperial, 'MSc Biomedical Engineering', 'master', 'health', 32000,
   1.0, '{"ielts":6.5,"gpa_pct":65}', '2026-06-30', '{9}', true);

-- University College London
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_ucl, 'MSc Computer Science', 'master', 'cs', 30000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true),
  (u_ucl, 'MSc Finance', 'master', 'business', 31000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true),
  (u_ucl, 'MSc Structural Engineering', 'master', 'engineering', 29000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true);

-- King's College London
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_kcl, 'MSc Computer Science', 'master', 'cs', 29000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true),
  (u_kcl, 'MSc International Business', 'master', 'business', 30000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true),
  (u_kcl, 'MSc Biomedical Engineering', 'master', 'health', 28000,
   1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-07-31', '{9}', true);

-- University of Birmingham
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_birmingham, 'MSc Computer Science', 'master', 'cs', 22000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_birmingham, 'MBA', 'master', 'business', 24000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_birmingham, 'MSc Civil Engineering', 'master', 'engineering', 22000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true);

-- University of Nottingham
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_nottingham, 'MSc Advanced Computer Science', 'master', 'cs', 21000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_nottingham, 'MSc Data Science', 'master', 'cs', 21000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_nottingham, 'MBA', 'master', 'business', 23000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true);

-- University of Sheffield
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_sheffield, 'MSc Advanced Computer Science', 'master', 'cs', 21000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_sheffield, 'MSc Mechanical Engineering', 'master', 'engineering', 22000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true),
  (u_sheffield, 'MSc Public Health', 'master', 'health', 20000,
   1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-08-31', '{9}', true);

-- University of Southampton
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year,
  duration_years, min_requirements, application_deadline, intake_months, is_active)
VALUES
  (u_southampton, 'MSc Computer Science', 'master', 'cs', 22000,
   1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-07-31', '{9}', true),
  (u_southampton, 'MSc Electronics and Electrical Engineering', 'master', 'engineering', 22000,
   1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-07-31', '{9}', true),
  (u_southampton, 'MSc Finance', 'master', 'business', 23000,
   1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-07-31', '{9}', true);

END $$;
