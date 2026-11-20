-- AIMT paid-course content bucket — manual execution after Brandon approves PR.
-- Additive only; no production change is made by committing this file.
-- No public read/write policy is created. Server-only service-role requests
-- perform authentication + course-entitlement checks before proxying content.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'aimt-paid-content' AND public IS DISTINCT FROM false
  ) THEN
    RAISE EXCEPTION 'Refusing to use public AIMT paid-content bucket';
  END IF;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('aimt-paid-content', 'aimt-paid-content', false)
  ON CONFLICT (id) DO NOTHING;
END
$$;

-- Verify after manual execution, before transferring any course assets:
-- SELECT id, public FROM storage.buckets WHERE id = 'aimt-paid-content';
-- Expect exactly one row with public = false.
-- Cloudflare Pages secret/variable: PAID_ASSETS_BUCKET=aimt-paid-content
-- Never configure public Supabase Storage GET rules for this bucket.
