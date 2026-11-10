-- Private contact capture for standalone free tools; never fabricate Readiness scores.
create table public.free_tool_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  first_name text not null check (char_length(first_name) between 1 and 80),
  tool text not null check (tool in ('service-cost','first-service-blueprint')),
  marketing_consent boolean not null default false,
  marketing_consented_at timestamptz,
  created_at timestamptz not null default now(),
  last_submitted_at timestamptz not null default now(),
  unique (email, tool)
);
create index free_tool_leads_submitted_idx on public.free_tool_leads (last_submitted_at desc);
alter table public.free_tool_leads enable row level security;
revoke all on table public.free_tool_leads from public, anon, authenticated;
grant select, insert, update, delete on table public.free_tool_leads to service_role;
-- No browser policies. Only server-side service-role storage and owner/admin inbox.
