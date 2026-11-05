-- PROPOSED schema, NOT a deployed migration. Requires independent review and
-- migration generation before activation. No live DB changes made by this PR.
-- Only service_role accesses the ledger; identity/entitlement gates live in API.
create table public.founder_review_campaign (
  id text primary key check(id='initial-five'),
  active boolean not null default false,
  activated_at timestamptz,
  capacity integer not null default 5 check(capacity=5)
);
insert into public.founder_review_campaign(id) values ('initial-five');
create table public.founder_review_reservations (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.founder_review_campaign(id),
  slot integer not null check(slot between 1 and 5),
  checkout_session_id text not null unique references public.course_entitlements(checkout_session_id),
  user_id uuid not null references auth.users(id),
  course_slug text not null check(course_slug='headspa-mastery'),
  status text not null default 'reserved' check(status in ('reserved','scheduled','completed','cancelled')),
  appointment_at timestamptz,
  questions text not null default '' check(length(questions)<=1000),
  created_at timestamptz not null default now(),
  unique(campaign_id,slot),
  unique(campaign_id,user_id),
  check(status not in ('scheduled','completed') or appointment_at is not null)
);
alter table public.founder_review_campaign enable row level security;
alter table public.founder_review_reservations enable row level security;
revoke all on public.founder_review_campaign, public.founder_review_reservations from public,anon,authenticated;
grant select,insert,update on public.founder_review_campaign, public.founder_review_reservations to service_role;
-- Proposed private bucket: at most 5 recipients x 3 deterministic object paths
-- x 5 MiB, no anon/authenticated storage policies and no direct signed uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('founder-review-materials','founder-review-materials',false,5242880,array['application/pdf']);
-- Allocation is intentionally NOT wired to checkout here. Before launch:
-- hold capacity at checkout, persist offer terms per purchase, handle webhook
-- retries/late payments/account claims/refunds without exceeding or reusing
-- promised capacity. Do not substitute a frontend counter or manual check.
