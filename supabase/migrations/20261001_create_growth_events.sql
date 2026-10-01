-- AIMT Growth — Step 1: first-party measurement + attribution
-- Run manually in the Supabase SQL editor (pushing this file does NOT
-- execute it). Additive only, idempotent, safe to re-run.
--
-- One append-only table of canonical growth events. The canonical taxonomy,
-- validity rules, and attribution model are documented in
-- docs/growth/AIMT-Growth-Measurement.md and enforced in
-- functions/_lib/growth/taxonomy.mjs.
--
-- Only the STORED events are allowed here. course_activated,
-- module_completed, cadence_used and certification_issued are DERIVED at
-- report time from their existing authorities (course_progress,
-- cadence_messages, completions) and are deliberately rejected by the
-- event_name check so nothing can write a second, competing copy of them.
--
-- Privacy boundary (enforced by the writers, documented in the doc above):
-- no email, no name, no IP address, no user agent, no full URL/query
-- string, no checkpoint/assessment/Readiness answers, no Cadence content.
--
-- Security: RLS on, NO client policies, and table privileges revoked from
-- anon/authenticated. Only Pages Functions (service role) read or write.
-- Browser events arrive through /api/growth/collect, which validates and
-- whitelists every field before writing.

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  event_name text not null,
  -- Server-computed idempotency key: a reload, retry, or Stripe webhook
  -- redelivery maps to the same (event_name, dedupe_key) and is ignored.
  dedupe_key text not null,
  -- 'browser' = reported by /api/growth/collect (directional);
  -- 'server'  = written by an authoritative server path (checkout, webhook,
  --             admin Stripe reconciliation).
  origin text not null,
  -- Random first-party IDs minted in the visitor's browser (not derived
  -- from any device/browser characteristic). Null for server-only events.
  visitor_id uuid null,
  session_id uuid null,
  user_id uuid null references auth.users (id) on delete set null,
  checkout_session_id text null,
  -- Staff/owner/test traffic. Reports exclude any visitor or user that is
  -- ever marked internal.
  is_internal boolean not null default false,
  -- Path only (never a query string), e.g. /head-spa-certification
  page_path text null,
  -- Whitelisted attribution snapshots: source, medium, campaign, content,
  -- term, gclid, gbraid, wbraid, referrer_domain, landing_path, at.
  first_touch jsonb not null default '{}'::jsonb,
  last_touch jsonb not null default '{}'::jsonb,
  -- Whitelisted, non-personal event properties (e.g. amount_total for
  -- paid_enrollment, resource slug for resource_used).
  props jsonb not null default '{}'::jsonb,
  constraint growth_events_name_check check (event_name in (
    'site_visit',
    'headspa_sales_view',
    'readiness_audit_start',
    'readiness_audit_complete',
    'lead_created',
    'checkout_start',
    'paid_enrollment',
    'service_timer_used',
    'resource_used'
  )),
  constraint growth_events_origin_check check (origin in ('browser', 'server')),
  constraint growth_events_dedupe_unique unique (event_name, dedupe_key),
  constraint growth_events_dedupe_len check (char_length(dedupe_key) between 1 and 200),
  constraint growth_events_page_path_len check (page_path is null or char_length(page_path) <= 200),
  constraint growth_events_checkout_len check (checkout_session_id is null or char_length(checkout_session_id) <= 255),
  constraint growth_events_first_touch_size check (pg_column_size(first_touch) <= 2048),
  constraint growth_events_last_touch_size check (pg_column_size(last_touch) <= 2048),
  constraint growth_events_props_size check (pg_column_size(props) <= 1024)
);

create index if not exists growth_events_occurred_idx
  on public.growth_events (occurred_at desc);

create index if not exists growth_events_name_occurred_idx
  on public.growth_events (event_name, occurred_at desc);

create index if not exists growth_events_visitor_idx
  on public.growth_events (visitor_id)
  where visitor_id is not null;

create index if not exists growth_events_checkout_idx
  on public.growth_events (checkout_session_id)
  where checkout_session_id is not null;

create index if not exists growth_events_user_idx
  on public.growth_events (user_id)
  where user_id is not null;

alter table public.growth_events enable row level security;

-- No client policies by design. Belt and braces: also remove table
-- privileges from the client roles, so even a future permissive policy
-- added by mistake cannot expose or accept rows from the browser.
revoke all on table public.growth_events from anon;
revoke all on table public.growth_events from authenticated;
