-- Cross-device course progress + Cadence memory sync
-- Run in Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists public.course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  state jsonb not null,
  progress_score integer not null default 0,
  client_saved_at timestamptz null,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, course_slug)
);

create index if not exists course_progress_updated_idx
  on public.course_progress (updated_at desc);

alter table public.course_progress enable row level security;

drop policy if exists "course_progress_select_own" on public.course_progress;
create policy "course_progress_select_own"
  on public.course_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "course_progress_insert_own" on public.course_progress;
create policy "course_progress_insert_own"
  on public.course_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "course_progress_update_own" on public.course_progress;
create policy "course_progress_update_own"
  on public.course_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep updated_at fresh on every write, server-side (client clocks can't be trusted)
create or replace function public.touch_course_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists course_progress_touch_updated on public.course_progress;
create trigger course_progress_touch_updated
  before insert or update on public.course_progress
  for each row execute function public.touch_course_progress_updated_at();
