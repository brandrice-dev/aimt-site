-- AIMT Admin MVP
-- Owner/admin authorization + authoritative admin audit log.
-- Additive only: does not change student entitlements, progress, certification,
-- Stripe, or certificate issuance.

-- ── 1. Admin principals ────────────────────────────────────────────────
-- Server-authoritative. There are intentionally NO client SELECT/INSERT/
-- UPDATE/DELETE policies. Pages Functions access this with the service role.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint admin_users_role_check check (role in ('owner', 'admin', 'support'))
);

create index if not exists admin_users_active_role_idx
  on public.admin_users (active, role);

alter table public.admin_users enable row level security;

create or replace function public.touch_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists admin_users_touch_updated on public.admin_users;
create trigger admin_users_touch_updated
  before update on public.admin_users
  for each row execute function public.touch_admin_users_updated_at();

-- ── 2. Authoritative admin audit log ──────────────────────────────────
-- Separate from aimt_logs. The existing aimt_logs table intentionally accepts
-- client-originated events and therefore is not suitable as an authoritative
-- record of privileged admin actions.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  target_email text,
  course_slug text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log (action);

create index if not exists admin_audit_log_target_user_idx
  on public.admin_audit_log (target_user_id);

alter table public.admin_audit_log enable row level security;

-- No client policies by design. Service-role-only writes and reads.

-- ── Bootstrap note ─────────────────────────────────────────────────────
-- Do not hardcode an owner email in this public repository.
-- The Pages Function admin guard can bootstrap the FIRST owner only when:
--   1) public.admin_users is empty, and
--   2) the authenticated caller's email exactly matches the server-side
--      AIMT_OWNER_EMAIL environment variable.
-- After the first owner row exists, normal admin_users rows are authoritative.
