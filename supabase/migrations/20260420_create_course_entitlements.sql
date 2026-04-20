create table if not exists public.course_entitlements (
  checkout_session_id text primary key,
  course_slug text not null,
  purchaser_email text not null,
  user_id uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists course_entitlements_course_email_idx
  on public.course_entitlements (course_slug, purchaser_email);

create index if not exists course_entitlements_course_user_idx
  on public.course_entitlements (course_slug, user_id);

alter table public.course_entitlements enable row level security;

create policy "course_entitlements_select_own"
  on public.course_entitlements
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(purchaser_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "course_entitlements_update_own"
  on public.course_entitlements
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or lower(purchaser_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    user_id = auth.uid()
    and lower(purchaser_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
