-- Additive, inactive by default. Apply only after isolated DB tests and review.
create table public.founder_review_campaign (
 id text primary key check(id='initial-five'), active boolean not null default false,
 activated_at timestamptz, capacity integer not null default 5 check(capacity=5)
);
insert into public.founder_review_campaign(id) values ('initial-five');
create table public.founder_review_reservations (
 id uuid primary key, campaign_id text not null references public.founder_review_campaign(id),
 slot integer not null check(slot between 1 and 5),
 checkout_session_id text unique, user_id uuid references auth.users(id), purchaser_email text,
 course_slug text not null default 'headspa-mastery' check(course_slug='headspa-mastery'),
 status text not null default 'held' check(status in ('held','reserved','scheduled','completed','cancelled')),
 appointment_at timestamptz, appointment_ends_at timestamptz, google_event_id text unique, questions text not null default '' check(length(questions)<=1000),
 created_at timestamptz not null default now(), paid_at timestamptz, completed_at timestamptz,
 materials_delete_after timestamptz,
 unique(campaign_id,slot),
 check(status='held' or (checkout_session_id is not null and purchaser_email is not null and paid_at is not null)),
 check(status not in ('scheduled','completed') or (appointment_at is not null and appointment_ends_at is not null and extract(epoch from appointment_ends_at-appointment_at)=2700)),
 exclude using gist(tstzrange(appointment_at,appointment_ends_at,'[)') with &&) where (status in ('scheduled','completed'))
);
alter table public.founder_review_campaign enable row level security;
alter table public.founder_review_reservations enable row level security;
revoke all on public.founder_review_campaign,public.founder_review_reservations from public,anon,authenticated;
grant select,insert,update,delete on public.founder_review_campaign,public.founder_review_reservations to service_role;
create function public.founder_review_hold(p_id uuid)
returns setof public.founder_review_reservations language plpgsql security invoker set search_path=pg_catalog,public as $$
declare chosen integer;
begin
 perform 1 from public.founder_review_campaign where id='initial-five' and active=true for update;
 if not found then return; end if;
 -- Serialize all allocations on the single campaign row. No time-based release.
 if exists(select 1 from public.founder_review_reservations where id=p_id) then
   return query select * from public.founder_review_reservations where id=p_id; return;
 end if;
 select n into chosen from generate_series(1,5) as n where not exists
 (select 1 from public.founder_review_reservations r where r.campaign_id='initial-five' and r.slot=n) order by n limit 1;
 if chosen is null then return; end if;
 return query insert into public.founder_review_reservations(id,campaign_id,slot) values(p_id,'initial-five',chosen) returning *;
end $$;
create function public.founder_review_bind(p_id uuid,p_session text)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 update public.founder_review_reservations set checkout_session_id=p_session
 where id=p_id and status='held' and (checkout_session_id is null or checkout_session_id=p_session);
 return found;
end $$;
create function public.founder_review_release(p_id uuid,p_session text)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 -- Caller MUST verify Stripe expiration or definitive create rejection first.
 -- Never recycle a paid/refunded/completed promise.
 delete from public.founder_review_reservations where id=p_id and status='held'
 and (checkout_session_id is null or checkout_session_id=p_session);
 return found;
end $$;
create function public.founder_review_paid(p_id uuid,p_session text,p_email text)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
declare ent public.course_entitlements%rowtype;
begin
 select * into ent from public.course_entitlements where checkout_session_id=p_session
 and course_slug='headspa-mastery' and lower(purchaser_email)=lower(p_email);
 if not found then raise exception 'Verified purchase required'; end if;
 update public.founder_review_reservations set checkout_session_id=p_session,
 purchaser_email=lower(p_email),user_id=coalesce(user_id,ent.user_id),
 paid_at=coalesce(paid_at,now()),status=case when status='held' then 'reserved' else status end
 where id=p_id and (checkout_session_id is null or checkout_session_id=p_session)
 and (purchaser_email is null or purchaser_email=lower(p_email));
 return found;
end $$;
revoke all on function public.founder_review_hold(uuid),public.founder_review_bind(uuid,text),public.founder_review_release(uuid,text),public.founder_review_paid(uuid,text,text) from public,anon,authenticated;
grant execute on function public.founder_review_hold(uuid),public.founder_review_bind(uuid,text),public.founder_review_release(uuid,text),public.founder_review_paid(uuid,text,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('founder-review-materials','founder-review-materials',false,5242880,array['application/pdf']);
-- No client storage policies. All reads/writes pass authenticated API gates.
-- Attach a paid promise when the purchaser later creates/signs into an account.
-- Server passes identity resolved from Supabase Auth; do not expose this RPC.
create function public.founder_review_link(p_user uuid,p_email text)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 update public.founder_review_reservations r set user_id=p_user
 where r.user_id is null and r.purchaser_email=lower(p_email) and r.status<>'held'
 and exists(select 1 from public.course_entitlements e where e.checkout_session_id=r.checkout_session_id
 and e.course_slug='headspa-mastery' and lower(e.purchaser_email)=lower(p_email)
 and (e.user_id is null or e.user_id=p_user));
 return found;
end $$;
revoke all on function public.founder_review_link(uuid,text) from public,anon,authenticated;
grant execute on function public.founder_review_link(uuid,text) to service_role;
