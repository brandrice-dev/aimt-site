// Public deployment surface — only intended website resources are served.
//
// Cloudflare Pages publishes the repository root (no build step). The
// boundary is default-deny: _routes.json excludes an explicit allowlist of
// public paths from Functions (so they are served statically, with
// _redirects/_headers/clean URLs intact); every other path reaches
// Functions, where the specific /api/* and /.well-known/* handlers win and
// everything else hits functions/[[path]].js → real 404.
//
// Structural checks always run. Live checks run when AIMT_SURFACE_BASE_URL
// is set, e.g. against `npx wrangler pages dev . --port 8788` or a
// Cloudflare branch preview:
//   AIMT_SURFACE_BASE_URL=http://localhost:8788 node --test tests/public-deployment-surface.test.mjs
//
// Run: node --test tests/public-deployment-surface.test.mjs

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const routes = JSON.parse(read('_routes.json'));
const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

// Cloudflare _routes.json matching: exact path, or "/prefix/*", which
// matches "/prefix/" and anything below it but NOT bare "/prefix" (verified
// against wrangler's validator: "/about" + "/about/*" is accepted, while
// "/about/" + "/about/*" is rejected as overlapping).
function ruleMatches(rule, p) {
  if (rule === '/*') return true;
  if (rule.endsWith('/*')) return p.startsWith(rule.slice(0, -1));
  return p === rule;
}
const isExcluded = (p) => routes.exclude.some((r) => ruleMatches(r, p));
const reachesFunctions = (p) => routes.include.some((r) => ruleMatches(r, p)) && !isExcluded(p);

const PUBLIC_DIRS = ['about', 'assets', 'education', 'oauth'];
// Root .html files that are owner/dev-only: never served at their clean URL.
// The .html form stays allowlisted only so its _redirects 301 → / applies.
const INTERNAL_ROOT_PAGES = ['cadence-intro-preview'];
const PUBLIC_ROOT_FILES = ['favicon.svg', 'robots.txt', 'sitemap.xml'];
const INTERNAL_PREFIXES = ['docs/', 'tests/', 'scripts/', 'supabase/', '.github/', 'cadence-worker/', 'AIMT-Listen-Mode-Final/', 'functions/', 'research-import/'];

const INTERNAL_SAMPLES = [
  '/CLAUDE.md', '/CODEX_HANDOFF.md', '/DEPLOY-NOTES.md', '/DESIGN-AUDIT.md', '/LAUNCH-READINESS.md', '/.gitignore',
  '/docs/AIMT-AUDIT-RULES.md', '/tests/admin-config-health.test.mjs', '/scripts/build-email-templates.mjs',
  '/supabase/migrations/20260420_create_course_entitlements.sql', '/.github/workflows/aimt-education-operations.yml',
  '/cadence-worker/worker.js', '/AIMT-Listen-Mode-Final/00-Welcome/README.md', '/NEW-INTERNAL-NOTES.md', '/some-new-dir/file.json',
  '/cadence-intro-preview', '/cadence-intro-preview/',
];
const PUBLIC_SAMPLES = [
  '/', '/head-spa-certification', '/enroll', '/student-access', '/my-aimt', '/education', '/education/hair-loss',
  '/about', '/about/standards', '/about/research-standards', '/verify', '/privacy', '/terms', '/refunds',
  '/sitemap.xml', '/robots.txt', '/assets/brand/email/aimt-mark-email.png',
];

// ── _routes.json is valid for Cloudflare ─────────────────────────────────

test('_routes.json: default-deny shape within Cloudflare limits, no overlapping rules', () => {
  assert.equal(routes.version, 1);
  assert.deepEqual(routes.include, ['/*'], 'every request reaches Functions unless explicitly excluded');
  assert.ok(routes.include.length + routes.exclude.length <= 100, 'at most 100 rules');
  for (const r of [...routes.include, ...routes.exclude]) {
    assert.ok(r.length <= 100 && r.startsWith('/'), r);
  }
  assert.equal(new Set(routes.exclude).size, routes.exclude.length, 'no duplicates');
  // Cloudflare rejects a splat rule that overlaps another rule in the same list.
  for (const splat of routes.exclude.filter((r) => r.endsWith('/*'))) {
    for (const other of routes.exclude) {
      if (other !== splat) assert.ok(!ruleMatches(splat, other), `${other} overlaps ${splat}`);
    }
  }
});

test('catch-all returns a real 404 (and 405 for non-GET), and every API function still exists', () => {
  const src = read('functions/[[path]].js');
  assert.match(src, /status: 404/);
  assert.match(src, /status: 405/);
  assert.ok(!existsSync(path.join(ROOT, 'functions/_middleware.js')), 'no middleware wraps the API functions');
  for (const f of ['api/create-checkout-session.js', 'api/stripe-webhook.js', 'api/claim-course-access.js', 'api/admin/index.js',
    'api/cadence/ask.js', 'api/mcp.js', 'api/research-query.js', 'api/verify-credential.js', '.well-known/oauth-protected-resource/api/mcp.js']) {
    assert.ok(existsSync(path.join(ROOT, 'functions', f)), f);
  }
});

// ── Must stay public ──────────────────────────────────────────────────────

test('every public root page is served statically (clean, .html, and trailing-slash forms)', () => {
  const pages = tracked.filter((f) => !f.includes('/') && f.endsWith('.html')).map((f) => f.slice(0, -5));
  for (const page of pages) {
    if (page === 'index') { assert.ok(isExcluded('/') && isExcluded('/index.html')); continue; }
    if (page === '404') continue; // served by the catch-all itself
    if (INTERNAL_ROOT_PAGES.includes(page)) continue; // covered by the internal-page test below
    for (const p of [`/${page}`, `/${page}.html`]) assert.ok(isExcluded(p), `${p} must be in _routes.json exclude`);
    if (!PUBLIC_DIRS.includes(page)) assert.ok(isExcluded(`/${page}/`), `/${page}/ must be in _routes.json exclude`);
  }
  for (const f of PUBLIC_ROOT_FILES) assert.ok(isExcluded(`/${f}`), f);
  for (const d of PUBLIC_DIRS) assert.ok(routes.exclude.includes(`/${d}/*`), `/${d}/*`);
  for (const p of PUBLIC_SAMPLES) assert.ok(isExcluded(p), p);
});

test('every sitemap URL and every _redirects source is served statically', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>https:\/\/aimtrichology\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  assert.ok(locs.length > 5);
  for (const p of locs) assert.ok(isExcluded(p), `sitemap ${p}`);
  const sources = read('_redirects').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]);
  for (const p of sources) assert.ok(isExcluded(p), `_redirects source ${p} (redirects only apply to static requests)`);
});

test('public directories contain only website resources', () => {
  for (const f of tracked.filter((t) => ['about/', 'education/', 'oauth/'].some((d) => t.startsWith(d)))) {
    assert.match(f, /\.html$/, f);
  }
  for (const f of tracked.filter((t) => t.startsWith('assets/'))) {
    assert.doesNotMatch(f, /\.(md|sql|mjs\.map|env|ya?ml)$/i, `${f} looks internal`);
  }
});

// ── Must not be served ────────────────────────────────────────────────────

test('no internal tracked file is on the static allowlist', () => {
  for (const f of tracked) {
    const internal = INTERNAL_PREFIXES.some((p) => f.startsWith(p)) || (!f.includes('/') && !f.endsWith('.html') && !PUBLIC_ROOT_FILES.includes(f));
    if (!internal) continue;
    assert.ok(!isExcluded(`/${f}`), `/${f} must not be served statically`);
  }
  for (const p of INTERNAL_SAMPLES) {
    assert.ok(!isExcluded(p) && reachesFunctions(p), `${p} reaches the Functions default-deny`);
  }
});

test('owner/dev-only root pages are not served at their clean URLs; the .html redirect is kept', () => {
  for (const page of INTERNAL_ROOT_PAGES) {
    assert.ok(tracked.includes(`${page}.html`), `${page}.html stays in the repo for local review`);
    for (const p of [`/${page}`, `/${page}/`]) {
      assert.ok(!isExcluded(p) && reachesFunctions(p), `${p} must hit the default-deny 404`);
    }
    assert.ok(isExcluded(`/${page}.html`), `/${page}.html stays static so its _redirects rule applies`);
  }
  assert.match(read('_redirects'), /^\/cadence-intro-preview\.html \/ 301$/m);
});

// ── Live (opt-in) ─────────────────────────────────────────────────────────

const BASE = process.env.AIMT_SURFACE_BASE_URL;

test('live: internal files return 404 without their contents', { skip: !BASE && 'set AIMT_SURFACE_BASE_URL' }, async () => {
  for (const p of INTERNAL_SAMPLES) {
    const res = await fetch(BASE + p, { redirect: 'manual' });
    const body = await res.text();
    assert.equal(res.status, 404, `${p} → ${res.status}`);
    assert.doesNotMatch(body, /Architecture — respect these rules|node:test|CREATE TABLE|runs-on:|export default \{/i, `${p} leaked source`);
  }
});

test('live: public resources and API routes still respond', { skip: !BASE && 'set AIMT_SURFACE_BASE_URL' }, async () => {
  for (const p of PUBLIC_SAMPLES) {
    const res = await fetch(BASE + p, { redirect: 'manual' });
    assert.equal(res.status, 200, `${p} → ${res.status}`);
  }
  const png = await fetch(BASE + '/assets/brand/email/aimt-mark-email.png');
  assert.equal(png.headers.get('content-type'), 'image/png');
  const cip = await fetch(BASE + '/cadence-intro-preview.html', { redirect: 'manual' });
  assert.equal(cip.status, 301, '/cadence-intro-preview.html keeps its redirect');
  assert.equal(new URL(cip.headers.get('location'), BASE).pathname, '/');
  const hsc = await fetch(BASE + '/head-spa-certification/', { redirect: 'manual' });
  assert.equal(hsc.status, 301, '/head-spa-certification/ keeps its documented 301');
  const get = await fetch(BASE + '/api/create-checkout-session');
  assert.equal(await get.text(), 'GET route working', 'checkout API reached its function');
  const wk = await fetch(BASE + '/.well-known/oauth-protected-resource/api/mcp');
  assert.equal(wk.status, 200);
  const admin = await fetch(BASE + '/api/admin');
  assert.equal(admin.status, 401, 'admin API reached its function (auth required)');
});
