-- =============================================================================
-- Find Your University — Demo Students & Applications
-- 8 demo students with varied profiles + 8 applications covering all statuses
-- REQUIRES: agencies and consultants to exist (run seed_sample_data.py first)
-- REQUIRES: universities + programs from 001_demo_universities.sql and 002_uk_universities.sql
--
-- Run in Supabase SQL editor (service role bypasses RLS)
-- =============================================================================

-- Bypass FK check to auth.users so demo students can be seeded without real auth accounts
SET session_replication_role = 'replica';

DO $$
DECLARE
  v_agency_id     UUID;
  v_consultant_id UUID;

  -- Student IDs
  s1 UUID; s2 UUID; s3 UUID; s4 UUID;
  s5 UUID; s6 UUID; s7 UUID; s8 UUID;

  -- Program IDs (UK universities from seeds 001 + 002)
  p_imperial_cs     UUID;
  p_ucl_cs          UUID;
  p_kcl_business    UUID;
  p_birmingham_cs   UUID;
  p_nottingham_cs   UUID;
  p_sheffield_cs    UUID;
  p_southampton_cs  UUID;
  p_manchester_cs   UUID;
BEGIN

  -- ── Resolve agency & consultant ───────────────────────────────────────────
  SELECT id INTO v_agency_id FROM agencies WHERE is_active = true ORDER BY created_at LIMIT 1;
  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'No agency found. Run backend/scripts/seed_sample_data.py first.';
  END IF;
  SELECT id INTO v_consultant_id FROM consultants
    WHERE agency_id = v_agency_id AND status = 'active' ORDER BY created_at LIMIT 1;
  IF v_consultant_id IS NULL THEN
    -- Fall back to any consultant in the agency
    SELECT id INTO v_consultant_id FROM consultants WHERE agency_id = v_agency_id ORDER BY created_at LIMIT 1;
  END IF;

  -- ── Resolve program IDs ───────────────────────────────────────────────────
  SELECT p.id INTO p_imperial_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'Imperial College London' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_ucl_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University College London' AND p.field = 'cs' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_kcl_business FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'King''s College London' AND p.field = 'business' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_birmingham_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University of Birmingham' AND p.field = 'cs' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_nottingham_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University of Nottingham' AND p.field = 'cs' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_sheffield_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University of Sheffield' AND p.field = 'cs' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_southampton_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University of Southampton' AND p.field = 'cs' AND p.degree_level = 'master' LIMIT 1;

  SELECT p.id INTO p_manchester_cs FROM programs p
    JOIN universities u ON u.id = p.university_id
    WHERE u.name = 'University of Manchester' AND p.degree_level = 'master' LIMIT 1;

  -- Fallback: if a specific program is still null, use any active UK master's program
  IF p_imperial_cs IS NULL THEN
    SELECT p.id INTO p_imperial_cs FROM programs p
      JOIN universities u ON u.id = p.university_id
      WHERE u.country = 'GB' AND p.degree_level = 'master' LIMIT 1;
  END IF;
  IF p_ucl_cs        IS NULL THEN p_ucl_cs        := p_imperial_cs; END IF;
  IF p_kcl_business  IS NULL THEN p_kcl_business  := p_imperial_cs; END IF;
  IF p_birmingham_cs IS NULL THEN p_birmingham_cs := p_imperial_cs; END IF;
  IF p_nottingham_cs IS NULL THEN p_nottingham_cs := p_imperial_cs; END IF;
  IF p_sheffield_cs  IS NULL THEN p_sheffield_cs  := p_imperial_cs; END IF;
  IF p_southampton_cs IS NULL THEN p_southampton_cs := p_imperial_cs; END IF;
  IF p_manchester_cs IS NULL THEN p_manchester_cs := p_imperial_cs; END IF;

  -- ── Insert demo students ──────────────────────────────────────────────────

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Fariha Sultana', '8801711234001',
    '{"ssc_gpa":5.0,"hsc_gpa":5.0,"bachelor_cgpa":3.75,"bachelor_subject":"CSE","gpa_percentage":78}',
    '{"ielts":7.0,"toefl":100,"gre":318}',
    30000, ARRAY['GB','CA'], 'master', ARRAY['cs','engineering'],
    true, true, true, true
  ) RETURNING id INTO s1;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Mahbubur Rahman', '8801812345002',
    '{"ssc_gpa":4.8,"hsc_gpa":4.5,"bachelor_cgpa":3.4,"bachelor_subject":"EEE","gpa_percentage":68}',
    '{"ielts":6.5,"toefl":88}',
    25000, ARRAY['GB','AU'], 'master', ARRAY['engineering'],
    true, true, true, true
  ) RETURNING id INTO s2;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Nusrat Jahan', '8801912345003',
    '{"ssc_gpa":5.0,"hsc_gpa":5.0,"bachelor_cgpa":3.9,"bachelor_subject":"BBA","gpa_percentage":82}',
    '{"ielts":7.5,"gmat":680}',
    35000, ARRAY['GB','US'], 'master', ARRAY['business'],
    true, true, true, true
  ) RETURNING id INTO s3;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Tanvir Ahmed', '8801611234004',
    '{"ssc_gpa":4.5,"hsc_gpa":4.0,"bachelor_cgpa":3.1,"bachelor_subject":"CSE","gpa_percentage":60}',
    '{"ielts":6.0}',
    20000, ARRAY['GB','DE'], 'master', ARRAY['cs'],
    true, true, true, true
  ) RETURNING id INTO s4;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Rabeya Khatun', '8801714325005',
    '{"ssc_gpa":5.0,"hsc_gpa":4.8,"bachelor_cgpa":3.6,"bachelor_subject":"Pharmacy","gpa_percentage":72}',
    '{"ielts":6.5,"toefl":91}',
    25000, ARRAY['GB','CA','AU'], 'master', ARRAY['health'],
    true, true, true, true
  ) RETURNING id INTO s5;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Imranul Haque', '8801811234006',
    '{"ssc_gpa":4.5,"hsc_gpa":4.2,"bachelor_cgpa":3.0,"bachelor_subject":"Civil","gpa_percentage":57}',
    '{"ielts":6.0}',
    21000, ARRAY['GB'], 'master', ARRAY['engineering'],
    true, true, true, true
  ) RETURNING id INTO s6;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Sharmin Akter', '8801911234007',
    '{"ssc_gpa":5.0,"hsc_gpa":5.0,"bachelor_cgpa":3.85,"bachelor_subject":"Finance","gpa_percentage":79}',
    '{"ielts":7.0,"gmat":640}',
    29000, ARRAY['GB','SG'], 'master', ARRAY['business','cs'],
    true, true, true, true
  ) RETURNING id INTO s7;

  INSERT INTO students (user_id, full_name, phone, academic_history, test_scores,
    budget_usd_per_year, preferred_countries, preferred_degree, preferred_fields,
    push_enabled, notify_status_changes, notify_deadlines, onboarding_completed)
  VALUES (
    uuid_generate_v4(), 'Sadman Sakib', '8801612234008',
    '{"ssc_gpa":4.5,"hsc_gpa":4.2,"bachelor_cgpa":3.2,"bachelor_subject":"ME","gpa_percentage":62}',
    '{"ielts":6.5,"toefl":85}',
    22000, ARRAY['GB','NL'], 'master', ARRAY['engineering'],
    true, true, true, true
  ) RETURNING id INTO s8;

  -- ── Insert applications (one per status to fill the consultant pipeline) ──

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s1, p_imperial_cs, v_consultant_id, v_agency_id,
    'lead',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-03-01T09:00:00Z","note":"New lead from website"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s2, p_ucl_cs, v_consultant_id, v_agency_id,
    'pre_evaluation',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-02-20T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2026-02-22T10:00:00Z","note":"Profile reviewed"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s3, p_kcl_business, v_consultant_id, v_agency_id,
    'docs_collection',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-02-15T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2026-02-17T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2026-02-20T09:00:00Z","note":"Documents requested"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s4, p_birmingham_cs, v_consultant_id, v_agency_id,
    'applied',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-02-01T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2026-02-03T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2026-02-08T09:00:00Z","note":"Seeded"},
      {"status":"applied","changed_by":"seed","changed_at":"2026-02-14T09:00:00Z","note":"Application submitted to university"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s5, p_sheffield_cs, v_consultant_id, v_agency_id,
    'offer_received',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-01-10T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2026-01-12T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2026-01-15T09:00:00Z","note":"Seeded"},
      {"status":"applied","changed_by":"seed","changed_at":"2026-01-22T09:00:00Z","note":"Seeded"},
      {"status":"offer_received","changed_by":"seed","changed_at":"2026-02-05T09:00:00Z","note":"Conditional offer received from Sheffield"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s6, p_nottingham_cs, v_consultant_id, v_agency_id,
    'visa_stage',
    '[{"status":"lead","changed_by":"seed","changed_at":"2025-12-01T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2025-12-03T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2025-12-08T09:00:00Z","note":"Seeded"},
      {"status":"applied","changed_by":"seed","changed_at":"2025-12-15T09:00:00Z","note":"Seeded"},
      {"status":"offer_received","changed_by":"seed","changed_at":"2026-01-05T09:00:00Z","note":"Seeded"},
      {"status":"visa_stage","changed_by":"seed","changed_at":"2026-01-20T09:00:00Z","note":"CAS issued, visa application in progress"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s7, p_southampton_cs, v_consultant_id, v_agency_id,
    'enrolled',
    '[{"status":"lead","changed_by":"seed","changed_at":"2025-10-01T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2025-10-03T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2025-10-08T09:00:00Z","note":"Seeded"},
      {"status":"applied","changed_by":"seed","changed_at":"2025-10-15T09:00:00Z","note":"Seeded"},
      {"status":"offer_received","changed_by":"seed","changed_at":"2025-11-01T09:00:00Z","note":"Seeded"},
      {"status":"visa_stage","changed_by":"seed","changed_at":"2025-11-15T09:00:00Z","note":"Seeded"},
      {"status":"enrolled","changed_by":"seed","changed_at":"2025-12-10T09:00:00Z","note":"Student enrolled and arrived in Southampton"}]'::jsonb
  );

  INSERT INTO applications (student_id, program_id, consultant_id, agency_id, status, status_history)
  VALUES (
    s8, p_manchester_cs, v_consultant_id, v_agency_id,
    'rejected',
    '[{"status":"lead","changed_by":"seed","changed_at":"2026-01-05T09:00:00Z","note":"Seeded"},
      {"status":"pre_evaluation","changed_by":"seed","changed_at":"2026-01-07T09:00:00Z","note":"Seeded"},
      {"status":"docs_collection","changed_by":"seed","changed_at":"2026-01-10T09:00:00Z","note":"Seeded"},
      {"status":"applied","changed_by":"seed","changed_at":"2026-01-18T09:00:00Z","note":"Seeded"},
      {"status":"rejected","changed_by":"seed","changed_at":"2026-02-10T09:00:00Z","note":"Application unsuccessful — GPA below threshold"}]'::jsonb
  );

END $$;

-- Restore normal FK enforcement
RESET session_replication_role;
