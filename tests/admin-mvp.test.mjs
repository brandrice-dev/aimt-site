import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const adminHtml = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const adminApi = fs.readFileSync(new URL('../functions/api/admin/index.js', import.meta.url), 'utf8');
const adminAuth = fs.readFileSync(new URL('../functions/_lib/admin/auth.mjs', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../supabase/migrations/20260905_create_admin_mvp.sql', import.meta.url), 'utf8');
const spec = fs.readFileSync(new URL('../docs/admin/AIMT-ADMIN-MVP-SPEC.md', import.meta.url), 'utf8');

test('Admin MVP browser never contains service-role credentials', () => {
  assert.doesNotMatch(adminHtml, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adminHtml, /service_role/i);
});

test('Admin API requires server-side admin resolution for GET and POST', () => {
  const calls = adminApi.match(/resolveAdmin\(env, request\)/g) || [];
  assert.ok(calls.length >= 2, 'GET and POST handlers should both resolve the admin server-side');
  assert.match(adminAuth, /resolveUser\(env, request\)/);
  assert.match(adminAuth, /admin_users/);
});

test('First owner bootstrap is server configured and only permitted on an empty admin table', () => {
  assert.match(adminAuth, /AIMT_OWNER_EMAIL/);
  assert.match(adminAuth, /count !== 0/);
  assert.match(migration, /Do not hardcode an owner email/i);
  assert.doesNotMatch(adminHtml, /AIMT_OWNER_EMAIL/);
});

test('Privileged audit log is separate from general client-originated AIMT logs', () => {
  assert.match(migration, /create table if not exists public\.admin_audit_log/);
  assert.match(migration, /No client policies by design/i);
  assert.match(adminAuth, /writeAdminAudit/);
  assert.match(adminApi, /grant_course_access/);
  assert.match(adminApi, /revoke_manual_course_access/);
});

test('Manual enrollment uses existing course entitlement authority', () => {
  assert.match(adminApi, /course_entitlements/);
  assert.match(adminApi, /admin-grant-/);
  assert.match(adminApi, /headspa-mastery/);
  assert.match(adminApi, /staff/);
  assert.match(adminApi, /complimentary/);
  assert.match(adminApi, /scholarship/);
});

test('Admin MVP protects Stripe entitlements from revoke action', () => {
  assert.match(adminApi, /grantId\.startsWith\(MANUAL_PREFIX\)/);
  assert.match(adminApi, /Paid Stripe entitlements are protected/);
});

test('Enrollment path does not mutate progress, attempts, or completion records', () => {
  const grantStart = adminApi.indexOf('async function grantAccess');
  const revokeStart = adminApi.indexOf('async function revokeManualAccess');
  assert.ok(grantStart >= 0 && revokeStart > grantStart);
  const grantBlock = adminApi.slice(grantStart, revokeStart);
  assert.doesNotMatch(grantBlock, /course_progress/);
  assert.doesNotMatch(grantBlock, /certification_attempts/);
  assert.doesNotMatch(grantBlock, /completions/);
});

test('Admin UI contains core MVP operational surfaces', () => {
  for (const label of [
    'Operations overview',
    'Students',
    'Activity Log',
    'Grant course access',
    'Course access',
    'Certification attempts',
    'Account support',
  ]) {
    assert.ok(adminHtml.includes(label), `missing UI label: ${label}`);
  }
});

test('Specification retains release gate and no-production rule', () => {
  assert.match(spec, /NO MERGE\. NO PRODUCTION DEPLOYMENT\./);
  assert.match(spec, /migration application/i);
  assert.match(spec, /normal-student authorization rejection test/i);
  assert.match(spec, /real staff test-account enrollment flow/i);
});
