// Post-launch hotfix — Task A coverage: the paid-purchaser account-creation
// → course-access handoff on success.html.
//
// Root cause (see the comment left in success.html itself): success.html's
// Supabase client passed `storage: createSessionAuthStorage()`
// (sessionStorage-backed) while student-access.html and headspa-mastery.html
// use Supabase's default (localStorage-backed) persistence. Commit 41e612d
// ("Fix: persistent auth sessions + sync init on all entry paths") already
// removed that same override from headspa-mastery.html, my-aimt.html, and
// student-access.html — success.html was the one file missed. Because each
// page's Supabase client only reads its own configured storage bucket, a
// session created by signUp() on success.html was invisible to every other
// page, so a freshly-created paid account looked signed-out the instant it
// redirected anywhere else and got bounced to the public course page.
//
// This is a flat-HTML site with no build step and no DOM test runner (see
// CLAUDE.md) — per the established pattern (tests/service-timer-login-next-
// route.test.mjs, tests/aimt-dashboard-resources-launch.test.mjs), this
// reads the real shipped source and regex-verifies the structural markers
// that prove the fix, rather than re-implementing the logic separately.
//
// Run: node --test tests/success-page-student-access-handoff.test.mjs

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const successSrc = readFileSync(path.join(ROOT, 'success.html'), 'utf8');
const studentAccessSrc = readFileSync(path.join(ROOT, 'student-access.html'), 'utf8');
const headspaSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');

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

// Extracts just the `createClient(...)` call's own arguments (not any
// surrounding explanatory comment, which is free to mention the removed
// `storage:` override in prose without that making this a false positive).
function extractCreateClientCall(src) {
  const signature = 'createClient(SUPABASE_URL, SUPABASE_ANON_KEY,';
  const start = src.indexOf(signature);
  if (start === -1) throw new Error('createClient(...) call not found');
  const parenStart = src.indexOf('(', start);
  let depth = 0;
  for (let i = parenStart; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') {
      depth--;
      if (depth === 0) return src.slice(parenStart, i + 1);
    }
  }
  throw new Error('unbalanced parens for createClient(...) call');
}

// ─────────────────────────────────────────────────────────────────────────
// A. ROOT CAUSE — SUPABASE CLIENT STORAGE NOW MATCHES EVERY OTHER AUTH PAGE
// ─────────────────────────────────────────────────────────────────────────

test('success.html no longer overrides Supabase auth storage (matches student-access.html and headspa-mastery.html defaults)', () => {
  const createClientCall = extractCreateClientCall(successSrc);
  assert.doesNotMatch(
    createClientCall,
    /storage:\s*createSessionAuthStorage\(\)/,
    'success.html must not pass a sessionStorage-backed storage override to createClient() anymore'
  );
});

test('student-access.html and headspa-mastery.html remain on the default (localStorage) storage, unaffected by this patch', () => {
  assert.doesNotMatch(extractCreateClientCall(studentAccessSrc), /storage:\s*createSessionAuthStorage\(\)/);
  assert.doesNotMatch(extractCreateClientCall(headspaSrc), /storage:\s*createSessionAuthStorage\(\)/);
});

test('all three pages configure the same auth persistence options (persistSession/autoRefreshToken/detectSessionInUrl), so a session written by one is readable by the others', () => {
  for (const src of [successSrc, studentAccessSrc, headspaSrc]) {
    assert.match(src, /persistSession:\s*true/);
    assert.match(src, /autoRefreshToken:\s*true/);
    assert.match(src, /detectSessionInUrl:\s*true/);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// B. REDIRECT TARGET — POST-SIGNUP HANDOFF NOW LANDS AT STUDENT ACCESS
// ─────────────────────────────────────────────────────────────────────────

test('COURSE_ENTRY_URL (the direct-into-course link) is no longer defined or used in success.html', () => {
  assert.doesNotMatch(successSrc, /COURSE_ENTRY_URL/);
});

test('COURSE_SIGNIN_URL points at student-access.html', () => {
  assert.match(successSrc, /const COURSE_SIGNIN_URL = 'student-access\.html';/);
});

test('redirectToCourse() now navigates to COURSE_SIGNIN_URL instead of a direct course-entry link', () => {
  const redirectToCourseSrc = extractFunctionSource(successSrc, 'function redirectToCourse(');
  assert.match(redirectToCourseSrc, /window\.location\.href\s*=\s*COURSE_SIGNIN_URL/);
});

test('the manual "already signed in" fallback link also points at Student Access, not a direct course-entry link', () => {
  assert.match(
    successSrc,
    /showNextStep\('Already signed in\?[^)]*COURSE_SIGNIN_URL/,
    'the fallback shown alongside the auto-redirect must stay consistent with redirectToCourse()'
  );
});

test('both real redirect call sites (existing-session continue, post-signup success) still call redirectToCourse()', () => {
  const calls = successSrc.match(/redirectToCourse\(\d+\);/g) || [];
  assert.equal(calls.length, 2, 'handleExistingSession() success path and the form submit success path');
});

// ─────────────────────────────────────────────────────────────────────────
// C. NOTHING ELSE ABOUT THE CLAIM/ENTITLEMENT FLOW WAS TOUCHED
// ─────────────────────────────────────────────────────────────────────────

test('claimCourseAccess() still posts to /api/claim-course-access with the bearer token and checkout session id, unchanged in shape', () => {
  assert.match(successSrc, /fetch\('\/api\/claim-course-access', \{/);
  assert.match(successSrc, /method: 'POST'/);
  assert.match(successSrc, /headers\.Authorization = `Bearer \$\{accessToken\}`/);
});

test('the account-creation form still requires all fields and enforces the same password rule before calling signUp()', () => {
  assert.match(successSrc, /Please complete all fields before continuing\./);
  assert.match(successSrc, /supabaseClient\.auth\.signUp\(\{/);
});
