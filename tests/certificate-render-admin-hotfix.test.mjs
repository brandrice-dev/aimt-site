// Certificate render + Admin access hotfix — regression coverage.
//
// Root cause of the blank certificate (fixed here): the in-course
// #certOverlay was printed via window.print() with the rule
//   @media print { body > *:not(#certOverlay) { display:none !important } }
// but an unclosed <div class="cadence-note"> inside #m12Complete left
// #module12Wrap open until </body>, so #certOverlay was NOT a child of
// <body> — it lived inside #module12Wrap, which that very print rule hid.
// Every print / "Save as PDF" therefore came out blank.
//
// The fix replaces the overlay with one dedicated renderer (certificate.html
// + assets/js/aimt-certificate.js) that students and Admin share, fed only
// by the authoritative completions row via /api/verify-credential.
//
// Deterministic: no network. Function handlers run against a mocked fetch.
//
// Run: node --test tests/certificate-render-admin-hotfix.test.mjs

import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const certPage = read('certificate.html');
// Code only — the explanatory comments legitimately name the old overlay.
const certPageCode = certPage.replace(/<!--[\s\S]*?-->/g, '');
const stripLineComments = (src) => src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const certJs = read('assets/js/aimt-certificate.js');
const course = read('headspa-mastery.html');
const dashboard = read('my-aimt.html');
const adminHtml = read('admin.html');
const routes = JSON.parse(read('_routes.json'));

function loadRenderer() {
  const sandbox = { window: {} };
  vm.runInNewContext(certJs, sandbox);
  return sandbox.window.AIMTCertificate;
}

const ACTIVE = {
  valid: true,
  credential_id: 'AIMT-HS-2026-ABC234',
  course: 'Head Spa Certification Course',
  student_name: 'Jane Doe',
  completed_at: '2026-09-20T17:00:00Z',
};

// ── Shared Supabase mock ────────────────────────────────────────────────
function matches(row, params) {
  for (const [key, value] of params) {
    if (['select', 'limit', 'order'].includes(key)) continue;
    if (key === 'or') {
      const ok = value.slice(1, -1).split(',').some((clause) => {
        const [col, op, ...rest] = clause.split('.');
        return op === 'eq' && String(row[col]) === rest.join('.');
      });
      if (!ok) return false;
      continue;
    }
    const [op, ...rest] = value.split('.');
    if (op === 'eq' && String(row[key]) !== rest.join('.')) return false;
  }
  return true;
}

function mockFetch({ tables, tokens = {}, authUsers = [], calls = [] }) {
  return async (input, options = {}) => {
    const url = new URL(String(input));
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    calls.push({ path: url.pathname, method });
    const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/user') {
      const token = String(headers.Authorization || '').replace(/^Bearer /, '');
      return tokens[token] ? respond(tokens[token]) : respond({ error: 'bad token' }, 401);
    }
    if (url.pathname === '/auth/v1/admin/users') return respond({ users: authUsers });
    if (url.pathname.startsWith('/auth/v1/admin/users/')) {
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const u = authUsers.find((x) => x.id === id);
      return u ? respond(u) : respond({}, 404);
    }
    const table = url.pathname.replace('/rest/v1/', '');
    const store = tables[table];
    if (!store) throw new Error('unexpected table ' + table);
    if (method === 'GET') {
      let rows = store.filter((r) => matches(r, url.searchParams));
      if (url.searchParams.get('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
      return respond(rows);
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const list = Array.isArray(body) ? body : [body];
      if (table === 'completions' && list.some((n) => store.some((r) => r.user_id === n.user_id && r.course_slug === n.course_slug))) {
        return respond({ error: 'unique_violation' }, 409);
      }
      const inserted = list.map((r) => ({ completed_at: new Date().toISOString(), revoked: false, ...r }));
      store.push(...inserted);
      return respond(inserted, 201);
    }
    throw new Error(`unexpected ${method} ${url.pathname}`);
  };
}

async function withFetch(fn, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  try { return await run(); } finally { globalThis.fetch = original; }
}

const ENV = { SUPABASE_URL: 'https://db.aimt.test', SUPABASE_SERVICE_ROLE_KEY: 'service-role-test' };
const ALL_MODULES_COMPLETE = Object.fromEntries(Array.from({ length: 12 }, (_, m) => [String(m), { complete: true }]));
const STUDENT = { id: 'student-1', email: 'gabby@example.test', user_metadata: { first_name: 'Gabby' } };

// ── Renderer ────────────────────────────────────────────────────────────

test('renderer: overlays exactly the name, date, and credential ID on the fixed template', () => {
  const Cert = loadRenderer();
  const view = Cert.buildCertificateView(ACTIVE);
  assert.equal(view.status, 'active');
  const html = Cert.renderCertificateMarkup(view);
  assert.match(html, /<img class="cert-template" src="\/assets\/certificates\/aimt-head-spa-certificate-template\.png" width="1491" height="1055"/);
  assert.match(html, /data-cert-field="student_name">Jane Doe</);
  assert.match(html, /data-cert-field="credential_id">AIMT-HS-2026-ABC234</);
  assert.match(html, new RegExp(`data-cert-field="completed_at">${Cert.formatDate(ACTIVE.completed_at)}<`));
  const fields = [...html.matchAll(/data-cert-field="([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(fields, ['student_name', 'completed_at', 'credential_id'], 'only these three fields are overlaid');
  // Static wording lives in the artwork and is never re-drawn in HTML.
  const visibleText = html.replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(visibleText, /Head Spa Certification Course|This certifies that|American Institute|Issued by|HeadSpa Mastery|Certificate of Completion/);
});

test('template artwork is the committed production file and overlay boxes sit on its rules', () => {
  const Cert = loadRenderer();
  const png = readFileSync(path.join(ROOT, 'assets/certificates/aimt-head-spa-certificate-template.png'));
  assert.equal(png.readUInt32BE(16), 1491, 'template width');
  assert.equal(png.readUInt32BE(20), 1055, 'template height');
  // Measured blank rules in the artwork (see aimt-certificate.js).
  assert.deepEqual({ ...Cert.FIELD_BOXES.student_name }, { left: 277, right: 1212, rule: 507, gap: 9 });
  assert.equal(Cert.FIELD_BOXES.completed_at.left, 118);
  assert.equal(Cert.FIELD_BOXES.completed_at.rule, 772);
  assert.equal(Cert.FIELD_BOXES.credential_id.left, 449);
  assert.equal(Cert.FIELD_BOXES.credential_id.rule, 772);
  assert.ok(Cert.FIELD_BOXES.credential_id.right < 799, 'ID box stops before the Issued-by rule');
  assert.match(certPage, /aspect-ratio: 1491 \/ 1055;/, 'certificate box keeps the artwork ratio');
  assert.doesNotMatch(certJs, /aimt-badge/, 'the crest is not re-drawn — it is part of the artwork');
});

test('renderer: student-entered name is escaped', () => {
  const Cert = loadRenderer();
  const html = Cert.renderCertificateMarkup(Cert.buildCertificateView({ ...ACTIVE, student_name: '<img src=x onerror=alert(1)>' }));
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test('revocation / unknown / malformed never render as an active certificate', () => {
  const Cert = loadRenderer();
  for (const [record, status] of [
    [{ valid: false, reason: 'revoked' }, 'revoked'],
    [{ valid: false, reason: 'not_found' }, 'not_found'],
    [{ error: 'Lookup failed' }, 'not_found'],
    [null, 'unavailable'],
    [{ ...ACTIVE, credential_id: 'not-an-id' }, 'unavailable'],
    [{ ...ACTIVE, student_name: '' }, 'unavailable'],
  ]) {
    const view = Cert.buildCertificateView(record);
    assert.equal(view.status, status, JSON.stringify(record));
    assert.equal(Cert.renderCertificateMarkup(view), '');
  }
  assert.equal(Cert.normalizeCredentialId(' aimt-hs-2026-abc234 '), 'AIMT-HS-2026-ABC234');
  assert.equal(Cert.normalizeCredentialId('AIMT-HS-2026-<script>'), '');
});

// ── Certificate page / print structure ─────────────────────────────────

test('certificate page reads only the authoritative verify endpoint and never issues', () => {
  assert.match(certPage, /fetch\('\/api\/verify-credential\?id=' \+ encodeURIComponent\(credentialId\)/);
  assert.match(certPage, /src="\/assets\/js\/aimt-certificate\.js"/);
  assert.doesNotMatch(certPage, /issue-certificate|APP_STATE|localStorage|levo_app/);
  assert.match(certPage, /noindex/);
  for (const p of ['/certificate', '/certificate.html', '/certificate/']) assert.ok(routes.exclude.includes(p), `${p} is publicly routed`);
});

test('print stylesheet: one landscape page, controls hidden, certificate is in normal flow', () => {
  const print = certPage.slice(certPage.indexOf('@media print'));
  assert.match(certPage, /@page \{ size: letter landscape; margin: 0\.25in; \}/);
  assert.match(print, /\.toolbar, \.status, \.hint \{ display: none !important; \}/);
  assert.match(print, /\.stage \{ width: 10\.5in;[^}]*overflow: hidden;[^}]*break-inside: avoid/);
  assert.match(print, /body \{[^}]*height: 8in; overflow: hidden;/, 'no spill-over second page');
  assert.match(certPage, /print-color-adjust: exact/);
  assert.doesNotMatch(certPage, /position:\s*fixed/, 'nothing printed is a fixed overlay');
  assert.doesNotMatch(certPageCode, /certOverlay|body > \*:not/, 'no hide-everything-but-X print rule');
  // The stage that holds the certificate is a plain descendant of <main>,
  // never inside an element the print CSS hides.
  assert.match(certPage, /<div data-view="active">\s*<div class="stage" id="certStage"><\/div>/);
  // Print is only enabled after data + fonts + template image are ready,
  // and after a long name has been fitted to its rule.
  assert.match(certPage, /id="printBtn" type="button" disabled/);
  assert.ok(certPage.indexOf('printBtn.disabled = false') > certPage.indexOf('document.fonts.ready'));
  assert.ok(certPage.indexOf('printBtn.disabled = false') > certPage.indexOf('fitName(stage);'));
});

// ── Course (Module 12) ─────────────────────────────────────────────────

test('course: blank-print overlay is gone and Module 12 opens the dedicated view', () => {
  assert.doesNotMatch(course, /id="certOverlay"|body > \*:not\(#certOverlay\)|function downloadCert|function closeCert/);
  assert.match(course, /onclick="showCertificate\(this\)">View Certificate</);
  const fn = stripLineComments(course.slice(course.indexOf('function showCertificate(btn) {'), course.indexOf('// ══ STREAK MOMENT ══')));
  assert.match(fn, /fetch\('\/api\/issue-certificate'/, 'resolves the (idempotent) server credential');
  assert.match(fn, /window\.location\.href = '\/certificate\?id=' \+ encodeURIComponent\(result\.credential_id\)/);
  assert.doesNotMatch(fn, /window\.print/);
  assert.ok(fn.indexOf("r.ok && result.credential_id") < fn.indexOf("window.location.href"), 'only navigates with a real credential ID');
});

// ── Student dashboard ───────────────────────────────────────────────────

test('My AIMT: View Certificate routes to /certificate for the existing credential', () => {
  assert.match(dashboard, /href="\/certificate\?id=' \+ encodeURIComponent\(c\.credential_id\) \+ '">View Certificate/);
  assert.doesNotMatch(dashboard, /issue-certificate/);
});

// ── Credential authority (issue-certificate / verify-credential) ───────

test('existing credential is reused: same ID, no second completions row', async () => {
  const { onRequestPost } = await import('../functions/api/issue-certificate.js');
  const tables = {
    course_entitlements: [{ checkout_session_id: 'cs_1', course_slug: 'headspa-mastery', user_id: STUDENT.id, purchaser_email: STUDENT.email }],
    course_progress: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', progress_score: 1200, state: { progress: ALL_MODULES_COMPLETE } }],
    certification_attempts: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', attempt_number: 3, certification_decision: 'pass' }],
    completions: [{ credential_id: 'AIMT-HS-2026-ABC234', user_id: STUDENT.id, course_slug: 'headspa-mastery', student_name: 'Gabby Example', completed_at: '2026-09-20T17:00:00Z', revoked: false }],
  };
  const calls = [];
  const fetchFn = mockFetch({ tables, tokens: { tok: STUDENT }, calls });
  const call = () => onRequestPost({ env: ENV, request: new Request('https://x.test/api/issue-certificate', { method: 'POST', headers: { Authorization: 'Bearer tok' }, body: JSON.stringify({ student_name: 'Different Name' }) }) });
  const [a, b] = await withFetch(fetchFn, () => Promise.all([call(), call()]));
  const [ba, bb] = [await a.json(), await b.json()];
  assert.equal(ba.credential_id, 'AIMT-HS-2026-ABC234');
  assert.equal(bb.credential_id, 'AIMT-HS-2026-ABC234');
  assert.equal(ba.already_issued, true);
  assert.equal(ba.student_name, 'Gabby Example', 'issued name is not overwritten');
  assert.equal(tables.completions.length, 1);
  assert.ok(!calls.some((c) => c.path === '/rest/v1/completions' && c.method !== 'GET'), 'no write to completions');
});

test('a not-yet-passed attempt still cannot create an official completion', async () => {
  const { onRequestPost } = await import('../functions/api/issue-certificate.js');
  const tables = {
    course_entitlements: [{ checkout_session_id: 'cs_1', course_slug: 'headspa-mastery', user_id: STUDENT.id, purchaser_email: STUDENT.email }],
    course_progress: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', progress_score: 1200, state: { progress: ALL_MODULES_COMPLETE } }],
    certification_attempts: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', attempt_number: 1, certification_decision: 'not_yet_passed' }],
    completions: [],
  };
  const res = await withFetch(mockFetch({ tables, tokens: { tok: STUDENT } }), () =>
    onRequestPost({ env: ENV, request: new Request('https://x.test/api/issue-certificate', { method: 'POST', headers: { Authorization: 'Bearer tok' }, body: '{}' }) }));
  assert.equal(res.status, 409);
  assert.equal(tables.completions.length, 0);
});

test('verify-credential: active row returns certificate fields; revoked row is invalid', async () => {
  const { onRequestGet } = await import('../functions/api/verify-credential.js');
  const tables = { completions: [
    { credential_id: 'AIMT-HS-2026-ABC234', course_slug: 'headspa-mastery', student_name: 'Jane Doe', completed_at: '2026-09-20T17:00:00Z', revoked: false },
    { credential_id: 'AIMT-HS-2026-OLD999', course_slug: 'headspa-mastery', student_name: 'Jane Doe', completed_at: '2026-08-01T00:00:00Z', revoked: true },
  ] };
  const get = (id) => withFetch(mockFetch({ tables }), () => onRequestGet({ env: ENV, request: new Request('https://x.test/api/verify-credential?id=' + id) })).then((r) => r.json());
  const active = await get('AIMT-HS-2026-ABC234');
  assert.equal(active.valid, true);
  assert.equal(loadRenderer().buildCertificateView(active).status, 'active');
  const revoked = await get('AIMT-HS-2026-OLD999');
  assert.deepEqual(revoked, { valid: false, reason: 'revoked' });
  assert.equal(loadRenderer().buildCertificateView(revoked).status, 'revoked');
});

// ── Admin ───────────────────────────────────────────────────────────────

function loadCertificateCard() {
  const start = adminHtml.indexOf('function certificateCard(c,attempts,issuance){');
  const end = adminHtml.indexOf('\nasync function issueCertificate', start);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const fmtDate = (v) => (v ? 'DATE' : '—');
  return (canMutate = true) => new Function('esc', 'fmtDate', 'canMutate', `${adminHtml.slice(start, end)}; return certificateCard;`)(esc, fmtDate, () => canMutate);
}

test('Admin drawer: issued certificate shows ID with View/Print on the shared renderer', () => {
  const card = loadCertificateCard()();
  const html = card({ credential_id: 'AIMT-HS-2026-ABC234', student_name: 'Jane Doe', completed_at: '2026-09-20', revoked: false }, [{ attempt_number: 3, certification_decision: 'pass' }]);
  assert.match(html, /Issued · AIMT-HS-2026-ABC234/);
  assert.match(html, /href="\/certificate\?id=AIMT-HS-2026-ABC234"[^>]*>View Certificate</);
  assert.match(html, /href="\/certificate\?id=AIMT-HS-2026-ABC234&amp;print=1"[^>]*>Print Certificate</);
  assert.doesNotMatch(html, /Not issued/);
});

test('Admin drawer: pass-without-row, no pass, and revoked states', () => {
  const card = loadCertificateCard()();
  const passNoRow = card(null, [{ attempt_number: 3, certification_decision: 'pass' }, { attempt_number: 2, certification_decision: 'not_yet_passed' }], { needed: true, nameResolved: true });
  assert.match(passNoRow, /Pass recorded · credential needs issuance/);
  assert.match(passNoRow, /attempt 3/);
  assert.doesNotMatch(passNoRow, /\/certificate\?id=/);
  const noPass = card(null, [{ attempt_number: 1, certification_decision: 'not_yet_passed' }]);
  assert.match(noPass, />Not issued</);
  assert.doesNotMatch(noPass, /\/certificate\?id=/);
  const revoked = card({ credential_id: 'AIMT-HS-2026-OLD999', revoked: true }, []);
  assert.match(revoked, /Revoked/);
  assert.doesNotMatch(revoked, /\/certificate\?id=|View Certificate/);
  assert.match(adminHtml, /\$\{certificateCard\(completion,d\.attempts,d\.certificateIssuance\)\}/, 'drawer renders the card from the authoritative completion');
});

async function adminGet(view, { entitlementUserId }) {
  const { onRequestGet } = await import('../functions/api/admin/index.js');
  const OWNER = { id: 'owner-1', email: 'owner@example.test' };
  const tables = {
    admin_users: [{ user_id: OWNER.id, role: 'owner', active: true }],
    course_entitlements: [{ checkout_session_id: 'cs_live_1', course_slug: 'headspa-mastery', purchaser_email: STUDENT.email, user_id: entitlementUserId, granted_at: '2026-08-01T00:00:00Z' }],
    course_progress: [{ user_id: STUDENT.id, course_slug: 'headspa-mastery', progress_score: 1300, updated_at: '2026-09-20T00:00:00Z', state: {} }],
    completions: [{ credential_id: 'AIMT-HS-2026-ABC234', user_id: STUDENT.id, course_slug: 'headspa-mastery', student_name: 'Gabby Example', completed_at: '2026-09-20T17:00:00Z', revoked: false }],
    certification_attempts: [{ id: 'a3', user_id: STUDENT.id, course_slug: 'headspa-mastery', attempt_number: 3, status: 'scored', certification_decision: 'pass', updated_at: '2026-09-20T00:00:00Z' }],
    certification_review_requests: [],
    certification_educator_requests: [],
    certification_remediation_assignments: [],
  };
  const fetchFn = mockFetch({ tables, tokens: { owner: OWNER }, authUsers: [OWNER, STUDENT] });
  const res = await withFetch(fetchFn, () => onRequestGet({ env: ENV, request: new Request(`https://x.test/api/admin?${view}`, { headers: { Authorization: 'Bearer owner' } }) }));
  return { res, body: await res.json(), tables };
}

test('Admin student record returns the existing completion (no false "Not issued")', async () => {
  const { res, body, tables } = await adminGet(`view=student&userId=${STUDENT.id}`, { entitlementUserId: STUDENT.id });
  assert.equal(res.status, 200);
  assert.equal(body.completion.credential_id, 'AIMT-HS-2026-ABC234');
  assert.equal(body.completion.revoked, false);
  assert.equal(tables.completions.length, 1, 'viewing never creates a credential');
});

test('Admin list resolves an email-only (user_id null) entitlement to the account and its credential', async () => {
  const { body } = await adminGet('view=students', { entitlementUserId: null });
  assert.equal(body.students.length, 1);
  const s = body.students[0];
  assert.equal(s.userId, STUDENT.id);
  assert.equal(s.certified, true);
  assert.equal(s.credentialId, 'AIMT-HS-2026-ABC234');
});
