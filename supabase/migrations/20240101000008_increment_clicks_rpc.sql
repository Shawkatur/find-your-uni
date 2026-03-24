-- Atomic click counter increment to avoid race conditions
CREATE OR REPLACE FUNCTION increment_tracking_clicks(link_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE tracking_links
  SET clicks = clicks + 1
  WHERE id = link_id;
$$;
