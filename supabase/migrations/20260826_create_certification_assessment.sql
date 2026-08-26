-- Module 12 Final Certification Assessment — server-authoritative schema.
-- Run in Supabase SQL editor. Idempotent; safe to re-run. Additive only —
-- no existing table is dropped, altered destructively, or rewritten.
--
-- Governs: docs/course-audit/00-aimt-certification-assessment-standard.md
--          docs/course-audit/modules/module-12.md
--
-- Trust model (matches the existing `completions` table pattern): students
-- can SELECT their own rows for visibility, but there is NO insert/update
-- policy for the `authenticated` role on any of these tables. All writes
-- happen exclusively through functions/api/certification/*.js using the
-- Supabase service-role key, which bypasses RLS. A student cannot alter an
-- authoritative score, critical-domain result, or certification decision by
-- writing to Supabase directly from the browser.

-- ── 1. certification_attempts: one row per certification attempt ──
create table if not exists public.certification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,

  -- Versioning — historical attempts keep the exact configuration that
  -- governed them, even after a later revision changes these values for new
  -- attempts (standard Section 15).
  assessment_version text not null,
  standard_version text not null,
  bank_version text not null,

  attempt_number integer not null,

  -- in_progress -> part1_locked -> part2_locked -> part3_locked -> scored -> (passed | not_yet_passed)
  status text not null default 'in_progress',

  -- Part I — Knowledge & Retention
  part1_selected_ids jsonb not null default '[]'::jsonb,
  part1_responses jsonb not null default '{}'::jsonb,
  part1_submitted_at timestamptz,
  knowledge_score numeric,

  -- Part II — Applied Practitioner Cases
  part2_selected_ids jsonb not null default '[]'::jsonb,
  part2_case_state jsonb not null default '{}'::jsonb,
  part2_submitted_at timestamptz,
  applied_cases_score numeric,

  -- Part III — Practitioner Conversation with Cadence
  part3_selected_ids jsonb not null default '[]'::jsonb,
  part3_conversation_state jsonb not null default '{}'::jsonb,
  part3_submitted_at timestamptz,
  interview_score numeric,

  -- Final result
  overall_score numeric,
  critical_domain_results jsonb not null default '[]'::jsonb,
  certification_decision text, -- null until scored; then 'pass' | 'not_yet_passed'
  decision_at timestamptz,

  started_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),

  unique (user_id, course_slug, attempt_number)
);

create index if not exists certification_attempts_user_course_idx
  on public.certification_attempts (user_id, course_slug);

create index if not exists certification_attempts_status_idx
  on public.certification_attempts (status);

create or replace function public.certification_attempts_touch_updated()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists certification_attempts_touch_updated_trigger on public.certification_attempts;
create trigger certification_attempts_touch_updated_trigger
  before update on public.certification_attempts
  for each row execute function public.certification_attempts_touch_updated();

alter table public.certification_attempts enable row level security;

drop policy if exists "certification_attempts_select_own" on public.certification_attempts;
create policy "certification_attempts_select_own"
  on public.certification_attempts
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update policy for authenticated/anon — server (service role) only.

-- ── 2. certification_remediation_assignments ──
-- Grouped by competency/domain, never one row per missed question.
create table if not exists public.certification_remediation_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  attempt_id uuid not null references public.certification_attempts (id) on delete cascade,

  competency_area text,
  critical_domain text, -- one of D1-D4, or null for a non-domain competency gap
  module_ref text,
  section_ref text,
  remediation_activity text, -- content pending — description only until remediation content is authored

  required_before_next_attempt boolean not null default true,
  completed boolean not null default false,
  completed_at timestamptz,

  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists certification_remediation_user_course_idx
  on public.certification_remediation_assignments (user_id, course_slug);

alter table public.certification_remediation_assignments enable row level security;

drop policy if exists "certification_remediation_select_own" on public.certification_remediation_assignments;
create policy "certification_remediation_select_own"
  on public.certification_remediation_assignments
  for select
  to authenticated
  using (user_id = auth.uid());

-- ── 3. certification_educator_requests ──
-- MVP per standard Section 8: manual scheduling, educator records authorization.
create table if not exists public.certification_educator_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  attempt_id uuid not null references public.certification_attempts (id) on delete cascade,

  status text not null default 'requested', -- requested | scheduled | completed
  educator_notes text,
  attempt4_authorized boolean not null default false,
  authorized_by text,
  authorized_at timestamptz,

  requested_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists certification_educator_requests_user_course_idx
  on public.certification_educator_requests (user_id, course_slug);

alter table public.certification_educator_requests enable row level security;

drop policy if exists "certification_educator_requests_select_own" on public.certification_educator_requests;
create policy "certification_educator_requests_select_own"
  on public.certification_educator_requests
  for select
  to authenticated
  using (user_id = auth.uid());

-- ── 4. certification_review_requests (human review / appeal) ──
create table if not exists public.certification_review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  attempt_id uuid not null references public.certification_attempts (id) on delete cascade,
  assessment_version text not null,

  disputed_ref jsonb, -- {"part":"partI"|"partII"|"partIII", "itemId": "..."} where applicable
  student_explanation text not null,

  status text not null default 'open', -- open | resolved
  resolution_notes text,
  resolved_at timestamptz,

  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists certification_review_requests_user_course_idx
  on public.certification_review_requests (user_id, course_slug);

alter table public.certification_review_requests enable row level security;

drop policy if exists "certification_review_requests_select_own" on public.certification_review_requests;
create policy "certification_review_requests_select_own"
  on public.certification_review_requests
  for select
  to authenticated
  using (user_id = auth.uid());
