-- Reconciliation migration: public.aimt_logs was never applied to
-- production despite supabase/migrations/20260421_create_aimt_logs.sql
-- being committed to the repo since April (see CLAUDE.md: migration
-- files are committed for record-keeping but must be run manually --
-- this one never was). Confirmed absent via live schema introspection
-- during the 2026-09-21 password-reset incident audit: every insert from
-- student-access.html's/success.html's/headspa-mastery.html's
-- logAimtEvent() and every server-side write from functions/api/*
-- (stripe-webhook.js, claim-course-access.js, create-checkout-session.js,
-- functions/_lib/research/ingest-request.mjs) has been failing with
-- PostgREST 404 the whole time -- all of it caught and swallowed by
-- design (each caller logs a local fallback and never throws), so this
-- has been a silent observability gap, not a functional one.
--
-- This does NOT edit or replay 20260421_create_aimt_logs.sql -- that
-- migration stays exactly as committed, untracked as ever applied. This
-- is a new, independently-dated migration that reproduces the identical
-- intended schema, made safely re-runnable (IF NOT EXISTS / a pg_policies
-- guard) so it can never fail or duplicate objects if run more than once.
--
-- Schema, indexes, and policies are copied verbatim from the 20260421
-- migration -- no columns added, renamed, or retyped, no SELECT/UPDATE/
-- DELETE policy added (every current read of this table is a service-role
-- call, which bypasses RLS entirely; no anon/authenticated read path
-- exists or is needed).

create table if not exists public.aimt_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  event_type text not null,
  source text not null,
  email text null,
  user_id text null,
  message text null
);

create index if not exists aimt_logs_created_at_idx
  on public.aimt_logs (created_at desc);

create index if not exists aimt_logs_event_type_idx
  on public.aimt_logs (event_type);

alter table public.aimt_logs enable row level security;

-- CREATE POLICY has no IF NOT EXISTS form, so idempotency is enforced
-- explicitly via pg_policies before each create.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'aimt_logs'
      and policyname = 'aimt_logs_insert_anon'
  ) then
    create policy "aimt_logs_insert_anon"
      on public.aimt_logs
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'aimt_logs'
      and policyname = 'aimt_logs_insert_authenticated'
  ) then
    create policy "aimt_logs_insert_authenticated"
      on public.aimt_logs
      for insert
      to authenticated
      with check (true);
  end if;
end $$;
