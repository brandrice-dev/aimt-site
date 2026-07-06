-- Session 2: verifiable completions + staff entitlements
-- Run in Supabase SQL editor. Idempotent; safe to re-run.

-- ── 1. Completions: the server-side record that someone finished ──
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  credential_id text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  student_name text not null,
  completed_at timestamptz not null default timezone('utc'::text, now()),
  revoked boolean not null default false,
  unique (user_id, course_slug)
);

create index if not exists completions_credential_idx
  on public.completions (credential_id);

alter table public.completions enable row level security;

-- Students can see their own completion. Nobody can write from the
-- client — certificates are issued ONLY by the server (service role)
-- after verifying real progress. That's what makes them credible.
drop policy if exists "completions_select_own" on public.completions;
create policy "completions_select_own"
  on public.completions
  for select
  to authenticated
  using (user_id = auth.uid());

-- ── 2. Staff access via entitlement rows ──
-- Replaces the STAFF_EMAIL_ALLOWLIST hardcoded in public HTML.
-- Staff now pass the same entitlement check as students.
insert into public.course_entitlements
  (checkout_session_id, course_slug, purchaser_email)
values
  ('staff-grant-brandmrice',  'headspa-mastery', 'brandmrice@gmail.com'),
  ('staff-grant-cadyb03',     'headspa-mastery', 'cadyb03@gmail.com'),
  ('staff-grant-atriumlanc',  'headspa-mastery', 'atriumlanc@gmail.com')
on conflict (checkout_session_id) do nothing;
