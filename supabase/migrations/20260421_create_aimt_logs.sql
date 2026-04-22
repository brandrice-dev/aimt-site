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

create policy "aimt_logs_insert_anon"
  on public.aimt_logs
  for insert
  to anon
  with check (true);

create policy "aimt_logs_insert_authenticated"
  on public.aimt_logs
  for insert
  to authenticated
  with check (true);
