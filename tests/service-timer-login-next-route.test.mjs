// Service Timer login return path — safe ?next= routing on
// student-access.html.
//
// Closes the SHOULD-FIX item from the pre-launch QA audit: aimt-service-
// timer.html's access gate sends a signed-out visitor to
// student-access.html?next=aimt-service-timer.html, but student-access.html
// previously ignored ?next= entirely and always landed a signed-in student
// on my-aimt.html, so the Timer's return trip was silently dropped.
//
// This is a flat-HTML site with no build step and no DOM test runner (see
// CLAUDE.md) -- the established pattern this repo already uses for
// verifying embedded HTML/inline-script behavior (see
// tests/aimt-dashboard-resources-launch.test.mjs) is to read the real
// shipped source and either (a) regex-verify specific structural markers,
// or (b) execute the real extracted function body against mocked
// dependencies. Both are used here; nothing is re-implemented separately
// from the production code it verifies.
//
// No Anthropic API calls, no network calls. Run:
//   node tests/service-timer-login-next-route.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const studentAccessSrc = readFileSync(path.join(ROOT, 'student-access.html'), 'utf8');
const serviceTimerSrc = readFileSync(path.join(ROOT, 'aimt-service-timer.html'), 'utf8');

/* Extract a top-level `function name(...) { ... }` body verbatim from a
   source file via balanced-brace matching, so tests execute the exact
   shipped code rather than a hand-copied re-implementation. Same helper
   as tests/aimt-dashboard-resources-launch.test.mjs. */
function extractFunctionSource(src, signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error('signature not found: ' + signature);
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces for: ' + signature);
}

function extractConstStatement(src, name) {
  const marker = 'const ' + name + ' =';
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('const not found: ' + name);
  const end = src.indexOf(';', start);
  if (end === -1) throw new Error('unterminated const: ' + name);
  return src.slice(start, end + 1);
}

const defaultRouteConstSrc = extractConstStatement(studentAccessSrc, 'DEFAULT_POST_LOGIN_ROUTE');
const safeRoutesConstSrc = extractConstStatement(studentAccessSrc, 'SAFE_NEXT_ROUTES');
const decodeNextCandidateSrc = extractFunctionSource(studentAccessSrc, 'function decodeNextCandidate(');
const isSafeNextRouteSrc = extractFunctionSource(studentAccessSrc, 'function isSafeNextRoute(');
const getSafeNextRouteSrc = extractFunctionSource(studentAccessSrc, 'function getSafeNextRoute(');
const redirectToCourseSrc = extractFunctionSource(studentAccessSrc, 'function redirectToCourse(');

/* Build a real sandbox executing the actual shipped functions against a
   mocked `window.location.search`, the same way the browser would supply
   it. URLSearchParams is a Node global (same API surface as the browser),
   so no additional mocking is needed for it. */
function buildSandbox(search) {
  const window = { location: { search: search || '' } };
  const body = `
    ${defaultRouteConstSrc}
    ${safeRoutesConstSrc}
    ${decodeNextCandidateSrc}
    ${isSafeNextRouteSrc}
    ${getSafeNextRouteSrc}
    return { getSafeNextRoute, isSafeNextRoute, decodeNextCandidate, DEFAULT_POST_LOGIN_ROUTE, SAFE_NEXT_ROUTES };
  `;
  return new Function('window', body)(window);
}

// ─────────────────────────────────────────────────────────────────────────
// A. THE TIMER'S SENDER FORMAT IS WHAT WE ACTUALLY MATCH AGAINST
// ─────────────────────────────────────────────────────────────────────────

test('aimt-service-timer.html sends the exact ?next= format student-access.html now honors', () => {
  assert.match(
    serviceTimerSrc,
    /window\.location\.href\s*=\s*'student-access\.html\?next=aimt-service-timer\.html'/,
    'the Timer access gate should still redirect to student-access.html?next=aimt-service-timer.html unchanged'
  );
});

// ─────────────────────────────────────────────────────────────────────────
// B. VALID TIMER NEXT ROUTE
// ─────────────────────────────────────────────────────────────────────────

test('valid Timer next route (?next=aimt-service-timer.html) is honored exactly', () => {
  const { getSafeNextRoute } = buildSandbox('?next=aimt-service-timer.html');
  assert.equal(getSafeNextRoute(), 'aimt-service-timer.html');
});

test('a leading slash on an otherwise-valid next route still resolves to the same known route', () => {
  const { getSafeNextRoute } = buildSandbox('?next=%2Faimt-service-timer.html');
  assert.equal(getSafeNextRoute(), 'aimt-service-timer.html');
});

// ─────────────────────────────────────────────────────────────────────────
// C. ORDINARY LOGIN WITH NO NEXT PARAM
// ─────────────────────────────────────────────────────────────────────────

test('ordinary login with no next param falls back to My AIMT (unchanged default)', () => {
  const { getSafeNextRoute, DEFAULT_POST_LOGIN_ROUTE } = buildSandbox('');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
  assert.equal(DEFAULT_POST_LOGIN_ROUTE, 'my-aimt.html');
});

test('an empty ?next= value falls back to My AIMT', () => {
  const { getSafeNextRoute } = buildSandbox('?next=');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

// ─────────────────────────────────────────────────────────────────────────
// D. MALFORMED NEXT
// ─────────────────────────────────────────────────────────────────────────

test('malformed / unrecognized next value falls back to My AIMT', () => {
  const { getSafeNextRoute } = buildSandbox('?next=totally-unknown-route.html');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('a next value with path traversal segments falls back to My AIMT', () => {
  const { getSafeNextRoute } = buildSandbox('?next=' + encodeURIComponent('../admin.html'));
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('a next value pointing at a real but non-allowlisted app file falls back to My AIMT', () => {
  // admin.html is a real route in this repo but is deliberately NOT in
  // SAFE_NEXT_ROUTES -- the allowlist is exact-match only, not "any file
  // that exists".
  const { getSafeNextRoute } = buildSandbox('?next=admin.html');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

// ─────────────────────────────────────────────────────────────────────────
// E. EXTERNAL URL ATTEMPT (unencoded)
// ─────────────────────────────────────────────────────────────────────────

test('unencoded absolute external URL attempt is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=https://evil.com');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('unencoded protocol-relative external URL attempt ("//evil.com") is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=//evil.com');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('javascript: scheme attempt is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=javascript:alert(1)');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('backslash trick ("/\\\\evil.com") is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=' + encodeURIComponent('/\\evil.com'));
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

// ─────────────────────────────────────────────────────────────────────────
// F. ENCODED EXTERNAL URL ATTEMPT
// ─────────────────────────────────────────────────────────────────────────

test('percent-encoded protocol-relative attempt ("%2F%2Fevil.com") is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=%2F%2Fevil.com');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('percent-encoded absolute URL attempt ("https%3A%2F%2Fevil.com") is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=https%3A%2F%2Fevil.com');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('double-encoded protocol-relative attempt ("%252F%252Fevil.com") is rejected', () => {
  const { getSafeNextRoute } = buildSandbox('?next=%252F%252Fevil.com');
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

test('double-encoded absolute URL attempt is rejected', () => {
  const doubleEncoded = encodeURIComponent(encodeURIComponent('https://evil.com'));
  const { getSafeNextRoute } = buildSandbox('?next=' + doubleEncoded);
  assert.equal(getSafeNextRoute(), 'my-aimt.html');
});

// ─────────────────────────────────────────────────────────────────────────
// G. EXISTING STUDENT-ACCESS BEHAVIOR UNAFFECTED
// ─────────────────────────────────────────────────────────────────────────

test('redirectToCourse() still sets the access-flow handoff before navigating', () => {
  assert.match(redirectToCourseSrc, /setAccessFlowHandoff\(/);
});

test('redirectToCourse() now routes through getSafeNextRoute() instead of a hardcoded destination', () => {
  assert.match(redirectToCourseSrc, /window\.location\.href\s*=\s*getSafeNextRoute\(\)/);
  assert.doesNotMatch(redirectToCourseSrc, /window\.location\.href\s*=\s*'my-aimt\.html'/);
});

test('redirectToCourse() call sites are unchanged in count by this patch (existing-session continue, disabled staff-autosignup dead path, post-signin success)', () => {
  // Pre-existing shape, not touched by this change: 3 call sites --
  // the existingAuthorizedSession early return, the always-`if (false)`
  // disabled staff-autosignup path ("staff access now via entitlement
  // rows"), and the real post-signin success path. This test only
  // guards against this patch accidentally adding/removing a call site.
  const calls = studentAccessSrc.match(/redirectToCourse\(\);/g) || [];
  assert.equal(calls.length, 3);
});

test('COURSE_ENTRY_URL (post-checkout entry link) is untouched by this change', () => {
  assert.match(studentAccessSrc, /const COURSE_ENTRY_URL = 'head-spa-certification\?enter=1';/);
});

test('sign-in form submit handler and entitlement check (canAccessCourse) are still present and unchanged in shape', () => {
  assert.match(studentAccessSrc, /form\.addEventListener\('submit', async \(event\) => \{/);
  assert.match(studentAccessSrc, /async function canAccessCourse\(user\) \{/);
});

test('password recovery flow is untouched (still gated by recoveryMode, unrelated to next-route logic)', () => {
  assert.match(studentAccessSrc, /async function initializeRecoveryMode\(\)/);
  assert.match(studentAccessSrc, /recoverySubmitBtn\.addEventListener\('click'/);
});

test('SAFE_NEXT_ROUTES is a minimal, explicit allowlist (not derived from user input or a wildcard)', () => {
  const { SAFE_NEXT_ROUTES } = buildSandbox('');
  assert.ok(SAFE_NEXT_ROUTES instanceof Set);
  assert.ok(SAFE_NEXT_ROUTES.has('aimt-service-timer.html'));
  assert.ok(SAFE_NEXT_ROUTES.has('my-aimt.html'));
  // Nothing else should be silently allowlisted by this change.
  assert.equal(SAFE_NEXT_ROUTES.size, 2);
});
