-- Restrict browser-side UPDATEs on course_entitlements to the user_id column.
--
-- Why: "course_entitlements_update_own" (20260420) filters which ROWS a
-- signed-in student may update, but Supabase's default table-level grant
-- gave `authenticated` UPDATE on EVERY column. A purchaser could therefore
-- PATCH their own row's course_slug (move a Head Spa purchase to any other
-- course), checkout_session_id (then re-claim the original Stripe session
-- for a second row) or granted_at. Verified 2026-10-20 against the
-- production catalog: table-level UPDATE granted to anon + authenticated.
--
-- The only legitimate client-side UPDATE is the account-linking bind in
-- student-access.html (bindHeadSpaEntitlementsToUser), which writes
-- user_id only. Checkout, the Stripe webhook, claim-course-access, admin
-- grants/revokes and purchase recovery all write with the service role,
-- which is unaffected by these grants and bypasses RLS.
--
-- Additive privilege change only: no table, column, row or policy is
-- dropped or rewritten. RUN MANUALLY in the Supabase SQL editor.

revoke update on table public.course_entitlements from anon, authenticated;
grant update (user_id) on table public.course_entitlements to authenticated;

-- Verify after running (expect exactly one row: authenticated | user_id):
--   select grantee, column_name
--     from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'course_entitlements'
--      and privilege_type = 'UPDATE' and grantee in ('anon', 'authenticated');
