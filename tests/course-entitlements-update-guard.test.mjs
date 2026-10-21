// Regression: a signed-in student must not be able to move a purchased
// entitlement to another course (or otherwise rewrite it) through the
// browser-facing Supabase API. See
// supabase/migrations/20261020_restrict_course_entitlement_updates.sql.
//
// Two layers:
//  1. Static checks (always run, zero dependencies).
//  2. Behavioural checks that execute the REAL migrations against real
//     Postgres via PGlite, with a minimal Supabase role/auth shim. PGlite is
//     NOT a repo dependency; these skip unless it can be imported:
//       AIMT_PGLITE_MODULE=/abs/path/node_modules/@electric-sql/pglite/dist/index.js \
//         node --test tests/course-entitlements-update-guard.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const createMigration = read('supabase/migrations/20260420_create_course_entitlements.sql');
const guardMigration = read('supabase/migrations/20261020_restrict_course_entitlement_updates.sql');
const studentAccess = read('student-access.html');

const COURSE = 'headspa-mastery';
const OTHER_COURSE = 'hair-loss-foundations';
const ALICE = '00000000-0000-4000-8000-00000000a11c';
const MALLORY = '00000000-0000-4000-8000-0000000000b0';

// ---- static -------------------------------------------------------------

test('guard migration replaces table-wide UPDATE with a user_id-only column grant', () => {
  assert.match(guardMigration, /revoke update on table public\.course_entitlements from anon, authenticated;/);
  assert.match(guardMigration, /grant update \(user_id\) on table public\.course_entitlements to authenticated;/);
  // Additive only: no drops, no policy rewrites, no row changes.
  assert.doesNotMatch(guardMigration, /^\s*(drop|alter policy|create policy|delete|truncate|update public)/im);
  // Never grant course_slug (or any other column) back to clients.
  const grants = guardMigration.match(/^\s*grant[^;]*;/gim) || [];
  assert.deepEqual(grants.map((g) => g.trim()), ['grant update (user_id) on table public.course_entitlements to authenticated;']);
});

test('the only browser-side entitlement UPDATE writes user_id alone', () => {
  const updates = [...studentAccess.matchAll(/\.update\(\s*\{([^}]*)\}\s*\)/g)].map((m) => m[1].trim());
  assert.deepEqual(updates, ['user_id: user.id'], 'a new client UPDATE on course_entitlements needs a matching column grant review');
});

// ---- behavioural (real Postgres via PGlite) -----------------------------

async function loadPGlite() {
  const specifier = process.env.AIMT_PGLITE_MODULE
    ? pathToFileURL(process.env.AIMT_PGLITE_MODULE).href
    : '@electric-sql/pglite';
  try {
    return (await import(specifier)).PGlite;
  } catch {
    return null;
  }
}

const PGlite = await loadPGlite();
const skip = PGlite ? false : 'PGlite not installed (set AIMT_PGLITE_MODULE to run the behavioural layer)';

// Minimal stand-in for what Supabase provisions before app migrations run:
// API roles with default table privileges, auth.users, auth.uid(), auth.jwt().
const SUPABASE_SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`;

async function freshDb({ withGuard }) {
  const db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  await db.exec(createMigration);
  if (withGuard) await db.exec(guardMigration);
  await db.exec(`
    insert into auth.users values ('${ALICE}', 'alice@example.com'), ('${MALLORY}', 'mallory@example.com');
    insert into public.course_entitlements (checkout_session_id, course_slug, purchaser_email, user_id) values
      ('cs_alice_bound',   '${COURSE}', 'alice@example.com',   '${ALICE}'),
      ('cs_alice_unbound', '${COURSE}', 'Alice@Example.com',   null),
      ('cs_mallory',       '${COURSE}', 'mallory@example.com', null);
  `);
  return db;
}

// Run one statement as a PostgREST request would: SET LOCAL ROLE + JWT claims.
async function as(db, role, claims, sql) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims || {})]);
    await tx.exec(`set local role ${role}`);
    return tx.query(sql);
  });
}
const alice = { sub: ALICE, email: 'alice@example.com', role: 'authenticated' };

async function rowOf(db, id) {
  return (await db.query(`select * from public.course_entitlements where checkout_session_id = $1`, [id])).rows[0];
}

test('baseline (20260420 only): a student CAN move their entitlement to another course', { skip }, async () => {
  // Proves this harness actually detects the vulnerability the guard closes.
  const db = await freshDb({ withGuard: false });
  const res = await as(db, 'authenticated', alice,
    `update public.course_entitlements set course_slug = '${OTHER_COURSE}' where checkout_session_id = 'cs_alice_bound'`);
  assert.equal(res.affectedRows, 1);
  assert.equal((await rowOf(db, 'cs_alice_bound')).course_slug, OTHER_COURSE);
});

test('guarded: cross-course manipulation and other column rewrites are denied', { skip }, async () => {
  const db = await freshDb({ withGuard: true });
  const attacks = [
    `update public.course_entitlements set course_slug = '${OTHER_COURSE}' where checkout_session_id = 'cs_alice_bound'`,
    `update public.course_entitlements set course_slug = '${OTHER_COURSE}', user_id = '${ALICE}' where checkout_session_id = 'cs_alice_unbound'`,
    `update public.course_entitlements set checkout_session_id = 'cs_renamed' where checkout_session_id = 'cs_alice_bound'`,
    `update public.course_entitlements set granted_at = now() + interval '1 year' where checkout_session_id = 'cs_alice_bound'`,
    `update public.course_entitlements set purchaser_email = 'alice@example.com' where checkout_session_id = 'cs_alice_bound'`,
  ];
  for (const sql of attacks) {
    await assert.rejects(as(db, 'authenticated', alice, sql), /permission denied/, sql);
  }
  const row = await rowOf(db, 'cs_alice_bound');
  assert.equal(row.course_slug, COURSE);
});

test('guarded: anon and client INSERT/DELETE cannot create or remove entitlements', { skip }, async () => {
  const db = await freshDb({ withGuard: true });
  await assert.rejects(as(db, 'anon', {}, `update public.course_entitlements set user_id = null`), /permission denied/);
  await assert.rejects(
    as(db, 'authenticated', alice, `insert into public.course_entitlements (checkout_session_id, course_slug, purchaser_email, user_id) values ('cs_forged', '${OTHER_COURSE}', 'alice@example.com', '${ALICE}')`),
    /row-level security/);
  const del = await as(db, 'authenticated', alice, `delete from public.course_entitlements`);
  assert.equal(del.affectedRows, 0);
  assert.equal(await rowOf(db, 'cs_forged'), undefined);
});

test('guarded: account linking still binds the purchaser\'s own unbound row (student-access bind)', { skip }, async () => {
  const db = await freshDb({ withGuard: true });
  // Mirrors bindHeadSpaEntitlementsToUser(): update({user_id}).eq(course_slug).ilike(purchaser_email).is(user_id, null)
  const res = await as(db, 'authenticated', alice,
    `update public.course_entitlements set user_id = '${ALICE}'
       where course_slug = '${COURSE}' and purchaser_email ilike 'alice@example.com' and user_id is null`);
  assert.equal(res.affectedRows, 1);
  assert.equal((await rowOf(db, 'cs_alice_unbound')).user_id, ALICE);
  assert.equal((await rowOf(db, 'cs_mallory')).user_id, null, 'another purchaser\'s row is untouched');
});

test('guarded: a student cannot bind someone else\'s purchase or assign their own row to another user', { skip }, async () => {
  const db = await freshDb({ withGuard: true });
  const steal = await as(db, 'authenticated', alice,
    `update public.course_entitlements set user_id = '${ALICE}' where checkout_session_id = 'cs_mallory'`);
  assert.equal(steal.affectedRows, 0);
  await assert.rejects(
    as(db, 'authenticated', alice, `update public.course_entitlements set user_id = '${MALLORY}' where checkout_session_id = 'cs_alice_bound'`),
    /row-level security/);
});

test('guarded: entitled students still read their own rows; service role (webhook, claim, admin grants) still writes', { skip }, async () => {
  const db = await freshDb({ withGuard: true });
  const own = await as(db, 'authenticated', alice, `select checkout_session_id from public.course_entitlements order by 1`);
  assert.deepEqual(own.rows.map((r) => r.checkout_session_id), ['cs_alice_bound', 'cs_alice_unbound']);

  // stripe-webhook / claim-course-access upsert shape (on_conflict=checkout_session_id, merge-duplicates)
  await as(db, 'service_role', {}, `
    insert into public.course_entitlements (checkout_session_id, course_slug, purchaser_email, user_id)
    values ('cs_alice_unbound', '${COURSE}', 'alice@example.com', '${ALICE}')
    on conflict (checkout_session_id) do update set course_slug = excluded.course_slug,
      purchaser_email = excluded.purchaser_email, user_id = excluded.user_id`);
  assert.equal((await rowOf(db, 'cs_alice_unbound')).user_id, ALICE);
  // admin manual grant + revoke
  await as(db, 'service_role', {}, `insert into public.course_entitlements (checkout_session_id, course_slug, purchaser_email) values ('admin-grant-x', '${COURSE}', 'staff@example.com')`);
  const revoked = await as(db, 'service_role', {}, `delete from public.course_entitlements where checkout_session_id = 'admin-grant-x'`);
  assert.equal(revoked.affectedRows, 1);
});
