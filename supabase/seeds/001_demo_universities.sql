-- =============================================================================
-- Find Your University — Demo Universities & Programs
-- Run directly via: psql $DATABASE_URL -f supabase/seeds/001_demo_universities.sql
-- Or paste into Supabase SQL editor (bypasses RLS — service role runs it)
-- =============================================================================
-- 20 universities across CA, GB, AU, DE, US, SG, NL, SE, NZ, JP
-- 3 programs per university = 60 programs total
-- =============================================================================

DO $$
DECLARE
  u_toronto        UUID; u_ubc         UUID; u_mcgill       UUID; u_waterloo     UUID;
  u_manchester     UUID; u_edinburgh   UUID; u_leeds        UUID;
  u_monash         UUID; u_melbourne   UUID; u_uq           UUID;
  u_tum            UUID; u_rwth        UUID;
  u_mit            UUID; u_stanford    UUID; u_umich        UUID;
  u_nus            UUID; u_tudelft     UUID; u_kth          UUID;
  u_auckland       UUID; u_utokyo      UUID;
BEGIN

-- ── INSERT UNIVERSITIES ────────────────────────────────────────────────────

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Toronto', 'CA', 'Toronto', 25, 18, 32000,
  43.0, 35.0, 6.5, 100, 65, true, 50, 'https://utoronto.ca', 'manual',
  22.0, 450,
  'Canada''s top-ranked university, known for research excellence in CS, medicine, and engineering. One of the largest Bangladeshi student communities in North America.')
RETURNING id INTO u_toronto;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of British Columbia', 'CA', 'Vancouver', 34, 40, 28000,
  52.0, 42.0, 6.5, 90, 60, true, 40, 'https://ubc.ca', 'manual',
  25.0, 380,
  'World-class research university in Vancouver, strong in engineering, business, and environmental sciences. Beautiful campus; high quality of life.')
RETURNING id INTO u_ubc;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('McGill University', 'CA', 'Montreal', 46, 46, 22000,
  38.0, 30.0, 6.5, 90, 65, true, 35, 'https://mcgill.ca', 'manual',
  27.0, 220,
  'Prestigious bilingual university in Montreal; top medical school and strong graduate programs in science and engineering.')
RETURNING id INTO u_mcgill;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Waterloo', 'CA', 'Waterloo', 112, 201, 24000,
  53.0, 45.0, 6.5, 90, 65, true, 30, 'https://uwaterloo.ca', 'manual',
  30.0, 310,
  'World''s largest co-op program; globally recognised for computer science, mathematics, and engineering. Silicon Valley''s top feeder school.')
RETURNING id INTO u_waterloo;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Manchester', 'GB', 'Manchester', 32, 58, 25000,
  55.0, 48.0, 6.5, 90, 55, true, 30, 'https://manchester.ac.uk', 'manual',
  35.0, 600,
  'Russell Group research university; strong in engineering, business, and life sciences. Largest single-campus university in the UK.')
RETURNING id INTO u_manchester;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Edinburgh', 'GB', 'Edinburgh', 22, 30, 26000,
  44.0, 38.0, 6.5, 92, 60, true, 40, 'https://ed.ac.uk', 'manual',
  38.0, 280,
  'Ancient Scottish university ranked in world''s top 25; excellent for informatics, medicine, and arts. Home to many Chevening scholars.')
RETURNING id INTO u_edinburgh;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Leeds', 'GB', 'Leeds', 86, 139, 23000,
  62.0, 55.0, 6.0, 87, 50, true, 25, 'https://leeds.ac.uk', 'manual',
  32.0, 520,
  'Russell Group university popular with Bangladeshi students; strong in business, engineering, and health sciences. Active Bangladeshi student society.')
RETURNING id INTO u_leeds;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('Monash University', 'AU', 'Melbourne', 42, 70, 23000,
  60.0, 55.0, 6.0, 79, 55, true, 35, 'https://monash.edu', 'manual',
  38.0, 420,
  'Australia''s largest university; strong engineering, medicine, and business schools. Multiple campuses across Australia and Malaysia.')
RETURNING id INTO u_monash;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Melbourne', 'AU', 'Melbourne', 14, 33, 27000,
  70.0, 60.0, 6.5, 79, 60, true, 50, 'https://unimelb.edu.au', 'manual',
  40.0, 350,
  'Australia''s #1 ranked university; graduate-model system with globally recognised degrees. Melbourne Research Scholarship covers full fees.')
RETURNING id INTO u_melbourne;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Queensland', 'AU', 'Brisbane', 47, 93, 21000,
  68.0, 60.0, 6.0, 87, 55, true, 30, 'https://uq.edu.au', 'manual',
  30.0, 280,
  'Group of Eight university in Brisbane; excellent research, vibrant campus life, and a growing Bangladeshi community.')
RETURNING id INTO u_uq;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('TU Munich', 'DE', 'Munich', 37, 30, 2000,
  35.0, 28.0, 6.0, 88, 70, true, 100, 'https://tum.de', 'manual',
  28.0, 120,
  'Germany''s top technical university; near-zero tuition, world-leading in engineering and natural sciences. DAAD scholarships widely available.')
RETURNING id INTO u_tum;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('RWTH Aachen University', 'DE', 'Aachen', 106, 155, 1500,
  40.0, 32.0, 6.0, 85, 65, true, 100, 'https://rwth-aachen.de', 'manual',
  20.0, 90,
  'Europe''s leading technical institution; renowned for mechanical and electrical engineering. Strong industry ties with automotive and energy sectors.')
RETURNING id INTO u_rwth;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('Massachusetts Institute of Technology', 'US', 'Cambridge', 1, 5, 57000,
  4.0, 2.0, 7.0, 90, 85, true, 100, 'https://mit.edu', 'manual',
  30.0, 40,
  'World''s #1 university for engineering and technology; need-blind financial aid for all international students. Extraordinary alumni network.')
RETURNING id INTO u_mit;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('Stanford University', 'US', 'Stanford', 5, 3, 56000,
  4.3, 2.5, 7.0, 100, 85, true, 100, 'https://stanford.edu', 'manual',
  22.0, 35,
  'Silicon Valley''s premier research university; powerhouse for CS, AI, business, and entrepreneurship. Knight-Hennessy Scholars offers full funding.')
RETURNING id INTO u_stanford;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Michigan', 'US', 'Ann Arbor', 23, 26, 50000,
  20.0, 15.0, 6.5, 84, 75, true, 50, 'https://umich.edu', 'manual',
  16.0, 180,
  'Top public research university; excellent graduate programs in engineering, business, and public policy. Strong Bangladeshi student association.')
RETURNING id INTO u_umich;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('National University of Singapore', 'SG', 'Singapore', 8, 19, 18000,
  25.0, 20.0, 6.0, 85, 70, true, 100, 'https://nus.edu.sg', 'manual',
  35.0, 150,
  'Asia''s top university; exceptional for CS, engineering, and business. Many full scholarships available for Bangladeshi students; gateway to ASEAN.')
RETURNING id INTO u_nus;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('Delft University of Technology', 'NL', 'Delft', 57, 57, 16000,
  58.0, 45.0, 6.5, 90, 60, true, 50, 'https://tudelft.nl', 'manual',
  26.0, 110,
  'Europe''s best technical university outside Germany–UK; English-taught programs in engineering, architecture, and design. Holland Scholarship available.')
RETURNING id INTO u_tudelft;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('KTH Royal Institute of Technology', 'SE', 'Stockholm', 98, 201, 14000,
  45.0, 38.0, 6.5, 90, 60, true, 75, 'https://kth.se', 'manual',
  22.0, 85,
  'Sweden''s leading technical university; strong in ICT, energy, and sustainable technology. Swedish Institute Scholarship covers full tuition and living costs.')
RETURNING id INTO u_kth;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Auckland', 'NZ', 'Auckland', 87, 201, 19000,
  63.0, 55.0, 6.0, 80, 55, true, 30, 'https://auckland.ac.nz', 'manual',
  25.0, 170,
  'New Zealand''s #1 university; affordable tuition, high quality of life, and a clear PR pathway. Growing Bangladeshi community in Auckland.')
RETURNING id INTO u_auckland;

INSERT INTO universities (name, country, city, ranking_qs, ranking_the, tuition_usd_per_year,
  acceptance_rate_overall, acceptance_rate_bd, min_ielts, min_toefl, min_gpa_percentage,
  scholarships_available, max_scholarship_pct, website, data_source,
  intl_student_pct, bd_students_known, description)
VALUES ('University of Tokyo', 'JP', 'Tokyo', 28, 39, 5000,
  30.0, 22.0, 6.5, 79, 70, true, 100, 'https://u-tokyo.ac.jp', 'manual',
  12.0, 80,
  'Japan''s premier research university; MEXT scholarship covers full tuition and a monthly living stipend. Ideal for research-focused students.')
RETURNING id INTO u_utokyo;

-- ── INSERT PROGRAMS ────────────────────────────────────────────────────────
-- Each university gets 3 representative programs

-- University of Toronto
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_toronto, 'MSc Computer Science',        'master',   'cs',          34000, 1.5, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9,1}'),
  (u_toronto, 'MSc Data Science',             'master',   'cs',          33000, 1.0, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}'),
  (u_toronto, 'MBA',                          'master',   'business',    38000, 2.0, '{"ielts":7.0,"gpa_pct":70}', '2026-01-15', '{9}');

-- University of British Columbia
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_ubc, 'MSc Computer Science',             'master',   'cs',          29000, 1.5, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9,1}'),
  (u_ubc, 'MEng Electrical Engineering',      'master',   'engineering', 30000, 1.5, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_ubc, 'MBA',                              'master',   'business',    32000, 2.0, '{"ielts":7.0,"gpa_pct":65}', '2026-01-15', '{9}');

-- McGill University
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_mcgill, 'MSc Artificial Intelligence',  'master',   'cs',          23000, 1.5, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}'),
  (u_mcgill, 'MSc Biomedical Engineering',   'master',   'health',      24000, 1.5, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}'),
  (u_mcgill, 'BSc Computer Science',         'bachelor', 'cs',          22000, 4.0, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}');

-- University of Waterloo
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_waterloo, 'MSc Computer Science',       'master',   'cs',          25000, 1.5, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9,1}'),
  (u_waterloo, 'MEng Electrical Engineering','master',   'engineering', 26000, 1.5, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}'),
  (u_waterloo, 'MSc Data Science',           'master',   'cs',          24000, 1.0, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{9}');

-- University of Manchester
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_manchester, 'MSc Computer Science',     'master',   'cs',          26000, 1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{9}'),
  (u_manchester, 'MBA',                      'master',   'business',    28000, 1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{9}'),
  (u_manchester, 'MSc Civil Engineering',    'master',   'engineering', 25000, 1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{9}');

-- University of Edinburgh
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_edinburgh, 'MSc Artificial Intelligence','master',  'cs',          27000, 1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_edinburgh, 'MSc Data Science',           'master',  'cs',          26000, 1.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_edinburgh, 'PhD Computer Science',       'phd',     'cs',          26000, 4.0, '{"ielts":7.0,"gpa_pct":65}', '2026-01-15', '{9,1}');

-- University of Leeds
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_leeds, 'MSc Data Science',              'master',   'cs',          23000, 1.0, '{"ielts":6.0,"gpa_pct":50}', '2026-01-15', '{9}'),
  (u_leeds, 'MBA',                           'master',   'business',    24000, 1.0, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{9}'),
  (u_leeds, 'MSc Public Health',             'master',   'health',      22000, 1.0, '{"ielts":6.5,"gpa_pct":50}', '2026-01-15', '{9}');

-- Monash University
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_monash, 'MSc Computer Science',         'master',   'cs',          24000, 1.5, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2,7}'),
  (u_monash, 'MBA',                          'master',   'business',    26000, 2.0, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{2,7}'),
  (u_monash, 'MEng Electrical Engineering',  'master',   'engineering', 25000, 2.0, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2}');

-- University of Melbourne
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_melbourne, 'MSc Computer Science',      'master',   'cs',          28000, 1.5, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{2,7}'),
  (u_melbourne, 'MSc Data Science',          'master',   'cs',          27000, 1.5, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{2}'),
  (u_melbourne, 'PhD Computer Science',      'phd',      'cs',          NULL,  4.0, '{"ielts":6.5,"gpa_pct":65}', '2026-01-15', '{2,7}');

-- University of Queensland
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_uq, 'MSc Computer Science',             'master',   'cs',          22000, 1.5, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2,7}'),
  (u_uq, 'MSc Biomedical Engineering',       'master',   'health',      23000, 1.5, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2}'),
  (u_uq, 'BEng Mechanical Engineering',      'bachelor', 'engineering', 21000, 4.0, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2}');

-- TU Munich
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_tum, 'MSc Computer Science',            'master',   'cs',          2000,  2.0, '{"ielts":6.0,"gpa_pct":70}', '2026-01-15', '{4,10}'),
  (u_tum, 'MEng Electrical Engineering',     'master',   'engineering', 2000,  2.0, '{"ielts":6.0,"gpa_pct":70}', '2026-01-15', '{4,10}'),
  (u_tum, 'MSc Data Engineering',            'master',   'cs',          2000,  2.0, '{"ielts":6.0,"gpa_pct":70}', '2026-01-15', '{4}');

-- RWTH Aachen
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_rwth, 'MSc Mechanical Engineering',     'master',   'engineering', 1500,  2.0, '{"ielts":6.0,"gpa_pct":65}', '2026-01-15', '{4,10}'),
  (u_rwth, 'MEng Electrical Engineering',    'master',   'engineering', 1500,  2.0, '{"ielts":6.0,"gpa_pct":65}', '2026-01-15', '{4,10}'),
  (u_rwth, 'MSc Computer Science',           'master',   'cs',          1500,  2.0, '{"ielts":6.0,"gpa_pct":65}', '2026-01-15', '{4}');

-- MIT
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_mit, 'MSc Computer Science',            'master',   'cs',          57000, 2.0, '{"ielts":7.0,"gpa_pct":85}', '2026-01-15', '{9}'),
  (u_mit, 'MEng Electrical Engineering',     'master',   'engineering', 57000, 2.0, '{"ielts":7.0,"gpa_pct":85}', '2026-01-15', '{9}'),
  (u_mit, 'PhD Computer Science',            'phd',      'cs',          NULL,  5.0, '{"ielts":7.0,"gpa_pct":85}', '2026-01-15', '{9}');

-- Stanford
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_stanford, 'MSc Computer Science',       'master',   'cs',          57000, 1.5, '{"ielts":7.0,"gpa_pct":85}', '2026-01-15', '{9}'),
  (u_stanford, 'MBA',                        'master',   'business',    57000, 2.0, '{"ielts":7.5,"gpa_pct":85}', '2026-01-15', '{9}'),
  (u_stanford, 'MSc Artificial Intelligence','master',   'cs',          57000, 1.5, '{"ielts":7.0,"gpa_pct":85}', '2026-01-15', '{9}');

-- University of Michigan
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_umich, 'MSc Computer Science',          'master',   'cs',          50000, 1.5, '{"ielts":6.5,"gpa_pct":75}', '2026-01-15', '{9}'),
  (u_umich, 'MSc Data Science',              'master',   'cs',          50000, 1.5, '{"ielts":6.5,"gpa_pct":75}', '2026-01-15', '{9}'),
  (u_umich, 'MBA',                           'master',   'business',    55000, 2.0, '{"ielts":7.0,"gpa_pct":80}', '2026-01-15', '{9}');

-- NUS
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_nus, 'MSc Computer Science',            'master',   'cs',          18000, 1.5, '{"ielts":6.0,"gpa_pct":70}', '2026-01-15', '{8}'),
  (u_nus, 'MSc Data Science',                'master',   'cs',          18000, 1.0, '{"ielts":6.0,"gpa_pct":70}', '2026-01-15', '{8}'),
  (u_nus, 'MBA',                             'master',   'business',    20000, 1.5, '{"ielts":6.5,"gpa_pct":70}', '2026-01-15', '{8}');

-- TU Delft
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_tudelft, 'MSc Civil Engineering',       'master',   'engineering', 17000, 2.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_tudelft, 'MEng Electrical Engineering', 'master',   'engineering', 17000, 2.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_tudelft, 'MSc Computer Science',        'master',   'cs',          16000, 2.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}');

-- KTH
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_kth, 'MSc Computer Science',            'master',   'cs',          14000, 2.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_kth, 'MSc Electrical Engineering',      'master',   'engineering', 14000, 2.0, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}'),
  (u_kth, 'MSc Data Science',                'master',   'cs',          13000, 1.5, '{"ielts":6.5,"gpa_pct":60}', '2026-01-15', '{9}');

-- University of Auckland
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_auckland, 'MSc Computer Science',       'master',   'cs',          19000, 1.5, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2,7}'),
  (u_auckland, 'MBA',                        'master',   'business',    20000, 1.5, '{"ielts":6.5,"gpa_pct":55}', '2026-01-15', '{2}'),
  (u_auckland, 'BSc Computer Science',       'bachelor', 'cs',          19000, 4.0, '{"ielts":6.0,"gpa_pct":55}', '2026-01-15', '{2}');

-- University of Tokyo
INSERT INTO programs (university_id, name, degree_level, field, tuition_usd_per_year, duration_years, min_requirements, application_deadline, intake_months)
VALUES
  (u_utokyo, 'MSc Computer Science',         'master',   'cs',          5000,  2.0, '{"ielts":6.5,"gpa_pct":70}', '2026-01-15', '{4,10}'),
  (u_utokyo, 'MEng Electrical Engineering',  'master',   'engineering', 5000,  2.0, '{"ielts":6.5,"gpa_pct":70}', '2026-01-15', '{4,10}'),
  (u_utokyo, 'PhD Computer Science',         'phd',      'cs',          NULL,  4.0, '{"ielts":6.5,"gpa_pct":70}', '2026-01-15', '{4,10}');

RAISE NOTICE 'Demo seed complete: 20 universities, 60 programs.';

END $$;
