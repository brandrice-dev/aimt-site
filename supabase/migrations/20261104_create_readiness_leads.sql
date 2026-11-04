-- AIMT Growth: persist submitted Readiness Profiles separately from anonymous analytics.
-- Apply through Supabase SQL editor before deploying the Pages Function.
-- Personal contact data never belongs in growth_events.
create table if not exists public.readiness_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  score smallint not null check (score between 0 and 100),
  band text not null,
  pillar_scores jsonb not null,
  head_spa_stage text,
  strongest_pillar text not null,
  priority_pillar text not null,
  marketing_consent boolean not null default false,
  marketing_consented_at timestamptz,
  result_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  last_submitted_at timestamptz not null default now(),
  constraint readiness_leads_email_length check (char_length(email) between 3 and 254),
  constraint readiness_leads_first_name_length check (char_length(first_name) between 1 and 80),
  constraint readiness_leads_band check (band in ('Refinement Stage','Strong Foundation','Developing System','Foundation Building')),
  constraint readiness_leads_pillar_size check (pg_column_size(pillar_scores) <= 1024)
);
create index if not exists readiness_leads_submitted_idx on public.readiness_leads (last_submitted_at desc);
create index if not exists readiness_leads_marketing_idx on public.readiness_leads (marketing_consent, last_submitted_at desc);
alter table public.readiness_leads enable row level security;
revoke all on table public.readiness_leads from anon;
revoke all on table public.readiness_leads from authenticated;
-- There are deliberately no client RLS policies. Service-role Pages Functions
-- alone write validated submissions and read them for owner/admin reporting.
