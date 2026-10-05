-- AIMT Growth — sales-page Readiness prompt events
-- Run manually in the Supabase SQL editor (pushing this file does NOT
-- execute it). Idempotent, safe to re-run.
--
-- Widens growth_events_name_check to accept three browser events from the
-- Head Spa sales page's Readiness prompt (assets/js/aimt-readiness-prompt.js):
--   readiness_prompt_shown, readiness_prompt_dismissed, readiness_prompt_clicked
-- Each carries no properties and counts once per browsing session.
--
-- Additive in effect: every value the old constraint allowed is still
-- allowed, no table or row is dropped or rewritten, and existing rows are
-- re-validated against a strict superset of the old list. The constraint
-- is recreated (same name) only because Postgres cannot ALTER a CHECK in
-- place. Until this runs, those three inserts are rejected by the old
-- constraint and recordGrowthEvent() drops them silently — nothing on the
-- page or in checkout is affected.

alter table public.growth_events
  drop constraint if exists growth_events_name_check;

alter table public.growth_events
  add constraint growth_events_name_check check (event_name in (
    'site_visit',
    'headspa_sales_view',
    'readiness_audit_start',
    'readiness_audit_complete',
    'lead_created',
    'checkout_start',
    'paid_enrollment',
    'service_timer_used',
    'resource_used',
    'readiness_prompt_shown',
    'readiness_prompt_dismissed',
    'readiness_prompt_clicked'
  ));
