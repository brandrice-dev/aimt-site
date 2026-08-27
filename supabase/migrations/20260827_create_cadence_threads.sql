-- Durable Cadence conversation schema — Phase 1 of the Cadence launch sweep.
-- Run in Supabase SQL editor. Idempotent; safe to re-run. Additive only —
-- no existing table is dropped, altered destructively, or rewritten.
--
-- ⚠ THIS MIGRATION IS COMMITTED FOR RECORD-KEEPING ONLY — IT HAS NOT BEEN
-- RUN. Per CLAUDE.md, it must be executed manually in the Supabase SQL
-- editor (or applied by a later, separately authorized task) before any
-- endpoint depends on these tables existing. Nothing in this repository
-- reads from or writes to cadence_threads/cadence_messages yet — wiring
-- Cloudflare Function endpoints to them is deliberately separate,
-- dependent follow-up work (build contract Section 8/14, Phase 1
-- continuation or Phase 2), not bundled into this schema-only commit.
--
-- Governs: docs/course-audit/00-cadence-launch-sweep-build-contract.md
--          Section 2 ("one visible thread per module"), Section 8 ("one
--          visible conversation, different internal modes"), Section 11.
--
-- SCOPE — three modes only, NOT certification:
-- mode ∈ {'checkpoint', 'ask_cadence', 'remediation'}. Module 12's
-- Practitioner Conversation (Part III) is deliberately NOT stored here —
-- it remains exclusively in the existing, already-verified, RLS-locked
-- certification_attempts.part3_conversation_state (see
-- supabase/migrations/20260826_create_certification_assessment.sql). This
-- schema must never become a second, competing source of truth for
-- certification transcripts; the stop-loss principle in the build
-- contract (Section 15) is explicit that the certification state machine
-- is not to be weakened or duplicated to fit a shared shell.
--
-- AUTHORITY BOUNDARY — these tables are a TRANSCRIPT, never a decision
-- record. A checkpoint's pass/fail state continues to live exclusively in
-- course_progress (synced from assets/js/headspa-state.js's APP_STATE),
-- exactly as today. cadence_messages.grading_metadata is diagnostic only
-- (which model graded this turn, for the same reason Module 12 records
-- lastGradedWith) — it is never read to decide progress, gating, or
-- certification. Nothing here should ever be treated as authoritative for
-- competency.
--
-- Trust model (matches every other Cadence-adjacent table in this repo):
-- students can SELECT their own rows for visibility; there is NO
-- insert/update policy for the `authenticated` role on either table. All
-- writes happen exclusively through future Cloudflare Pages Functions
-- using the Supabase service-role key, which bypasses RLS — including
-- ungraded Ask Cadence messages, which carry no competency risk but are
-- still kept behind the same server-authoritative write path as every
-- other table here, rather than inventing a second, weaker trust model
-- for convenience.

-- ── 1. cadence_threads: one row per (student, course, module) ──
-- "One visible thread per module" — returning to a module reopens this
-- same thread; a new module begins a new one (00-global-decisions.md's
-- "Module-specific Cadence threads" decision, now implemented).
create table if not exists public.cadence_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  module_id text not null, -- matches course_progress.state.progress's string keys ('0'..'12')

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  unique (user_id, course_slug, module_id)
);

create or replace function public.cadence_threads_touch_updated()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists cadence_threads_touch_updated_trigger on public.cadence_threads;
create trigger cadence_threads_touch_updated_trigger
  before update on public.cadence_threads
  for each row execute function public.cadence_threads_touch_updated();

alter table public.cadence_threads enable row level security;

drop policy if exists "cadence_threads_select_own" on public.cadence_threads;
create policy "cadence_threads_select_own"
  on public.cadence_threads
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update policy for authenticated/anon — server (service role) only.

-- ── 2. cadence_messages: one row per message within a thread ──
create table if not exists public.cadence_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.cadence_threads (id) on delete cascade,

  -- Denormalized for a simple, index-friendly RLS policy — same pattern
  -- certification_remediation_assignments already uses (both a parent FK
  -- and its own user_id/course_slug columns).
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,

  role text not null check (role in ('user', 'assistant')),
  mode text not null check (mode in ('checkpoint', 'ask_cadence', 'remediation')),
  content text not null,

  -- Populated only when mode = 'checkpoint'; which checkpoint this message
  -- relates to (e.g. 'm1cp1'), for display/filtering only — never a
  -- decision field. The authoritative pass/fail state stays in
  -- course_progress, not here.
  checkpoint_id text,

  -- Diagnostic only — {provider, modelName, status, registryVersion} for
  -- an assistant message that involved a model call. Null for a student
  -- message or a message that didn't require one. Never read to decide
  -- anything; see the authority-boundary note above.
  grading_metadata jsonb,

  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists cadence_messages_thread_created_idx
  on public.cadence_messages (thread_id, created_at);

create index if not exists cadence_messages_user_course_idx
  on public.cadence_messages (user_id, course_slug);

alter table public.cadence_messages enable row level security;

drop policy if exists "cadence_messages_select_own" on public.cadence_messages;
create policy "cadence_messages_select_own"
  on public.cadence_messages
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update policy for authenticated/anon — server (service role)
-- only, including ungraded Ask Cadence messages (see trust-model note above).
