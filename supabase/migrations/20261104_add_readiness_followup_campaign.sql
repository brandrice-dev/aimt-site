-- AIMT Readiness marketing follow-ups v1.
-- Additive, private. Install BEFORE deploying the Pages handler.
-- Live sending starts DISABLED. A valid sender postal address, explicit
-- campaign-wide and daily caps, and an activation timestamp are mandatory.
-- Only leads created ON/AFTER activation may be enrolled in this sequence.
alter table public.readiness_leads
  add column if not exists marketing_unsubscribed_at timestamptz;

create table if not exists public.readiness_followup_config (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  activated_at timestamptz,
  postal_address text,
  max_daily_emails integer not null default 0 check (max_daily_emails between 0 and 100),
  max_total_emails integer not null default 0 check (max_total_emails between 0 and 10000),
  total_reserved integer not null default 0 check (total_reserved >= 0),
  updated_at timestamptz not null default now(),
  constraint readiness_followup_config_safe_activation check (
    not enabled or (
      activated_at is not null
      and postal_address is not null
      and char_length(trim(postal_address)) between 12 and 400
      and max_daily_emails >= 1
      and max_total_emails >= 1
      and total_reserved < max_total_emails
    )
  )
);
insert into public.readiness_followup_config (id) values (true) on conflict (id) do nothing;

create table if not exists public.readiness_followup_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.readiness_leads(id) on delete cascade,
  stage smallint not null check (stage in (1,2)),
  status text not null default 'reserved' check (status in ('reserved','sent','failed','uncertain','suppressed')),
  reserved_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_id text,
  failure_category text,
  unique(lead_id,stage)
);
create index if not exists readiness_followup_sends_recent_idx
 on public.readiness_followup_sends(reserved_at desc);
create index if not exists readiness_followup_sends_status_idx
 on public.readiness_followup_sends(status,reserved_at desc);

alter table public.readiness_followup_config enable row level security;
alter table public.readiness_followup_sends enable row level security;
revoke all on public.readiness_followup_config from anon, authenticated;
revoke all on public.readiness_followup_sends from anon, authenticated;
grant select, insert, update on public.readiness_followup_config to service_role;
grant select, insert, update on public.readiness_followup_sends to service_role;

-- One atomic reservation per recipient/stage, with locked global budget.
-- This is the server-side enforcement boundary for spending. Failed/
-- uncertain reservations still consume the cap: manual review is safer
-- than accidentally emailing a subscriber twice on a network retry.
-- Restrict EXECUTE to service_role. Never call this from browser code.
create or replace function public.claim_readiness_followup(
  p_lead_id uuid, p_stage smallint
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.readiness_followup_config%rowtype;
  lead public.readiness_leads%rowtype;
  prev_sent timestamptz;
  claim_id uuid;
  utc_day_start timestamptz := date_trunc('day', now());
begin
  if p_stage not in (1,2) then return null; end if;
  select * into cfg from public.readiness_followup_config
    where id = true for update;
  if not found or not cfg.enabled
    or cfg.activated_at is null
    or cfg.total_reserved >= cfg.max_total_emails
    or cfg.max_daily_emails < 1
    or cfg.postal_address is null
    or char_length(trim(cfg.postal_address)) < 12
  then return null; end if;

  if (select count(*) from public.readiness_followup_sends
      where reserved_at >= utc_day_start) >= cfg.max_daily_emails
  then return null; end if;

  select * into lead from public.readiness_leads
    where id=p_lead_id for update;
  if not found
    or lead.marketing_consent is not true
    or lead.marketing_consented_at is null
    or lead.marketing_unsubscribed_at is not null
    or lead.result_email_sent_at is null
    or lead.created_at < cfg.activated_at
    or now() > lead.created_at + interval '14 days'
  then return null; end if;

  if exists (
    select 1 from public.course_entitlements ent
    where ent.course_slug='headspa-mastery'
      and lower(ent.purchaser_email) = lower(lead.email)
  ) then return null; end if;

  if p_stage = 1 then
    if now() < lead.created_at + interval '48 hours' then return null; end if;
  else
    select sent_at into prev_sent from public.readiness_followup_sends
      where lead_id=p_lead_id and stage=1 and status='sent';
    if prev_sent is null or now() < prev_sent + interval '5 days'
    then return null; end if;
  end if;

  insert into public.readiness_followup_sends(lead_id,stage)
    values (p_lead_id,p_stage)
    on conflict (lead_id,stage) do nothing
    returning id into claim_id;
  if claim_id is null then return null; end if;

  update public.readiness_followup_config
    set total_reserved=total_reserved+1,updated_at=now()
    where id=true;
  return claim_id;
end;
$$;
revoke all on function public.claim_readiness_followup(uuid,smallint)
  from public, anon, authenticated;
grant execute on function public.claim_readiness_followup(uuid,smallint)
  to service_role;
