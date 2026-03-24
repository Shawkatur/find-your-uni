-- =============================================================================
-- pgvector RPC function for semantic university search
-- Called via: supabase.rpc("match_universities", {...})
-- =============================================================================

CREATE OR REPLACE FUNCTION match_universities(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.70,
  match_count     INT   DEFAULT 10
)
RETURNS TABLE (
  id                    UUID,
  name                  TEXT,
  country               TEXT,
  city                  TEXT,
  ranking_qs            INT,
  tuition_usd_per_year  INT,
  acceptance_rate_bd    NUMERIC,
  scholarships_available BOOLEAN,
  website               TEXT,
  similarity            FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.country,
    u.city,
    u.ranking_qs,
    u.tuition_usd_per_year,
    u.acceptance_rate_bd,
    u.scholarships_available,
    u.website,
    1 - (u.embedding <=> query_embedding) AS similarity
  FROM universities u
  WHERE u.embedding IS NOT NULL
    AND 1 - (u.embedding <=> query_embedding) >= match_threshold
  ORDER BY u.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
