/* ═══════════════════════════════════════════════════════════════
   Certificate issuance — the ONE server-side credential authority.
   ---------------------------------------------------------------
   Every path that can create a `completions` credential calls
   ensureCertificateIssued():
     - functions/api/certification/finalize-assessment.js
         automatic issuance on an authoritative PASS (every idempotent path)
     - functions/api/issue-certificate.js
         student retrieval / safe retry fallback
     - functions/api/admin/index.js (action: issue_certificate)
         owner/admin recovery

   Order of checks (none trust the browser):
     1. An active credential already exists → return it unchanged, no write.
     2. A revoked credential exists → never silently replaced.
     3. Active entitlement for the course.
     4. Server-synced course completion: every Module 0–11 individually
        marked complete (hasCompletedInstructionalModules — the same gate
        that unlocks the Module 12 assessment). The numeric progress_score
        is NOT used: it also counts checkpoint and intro points, so it can
        reach 1200 with a module still incomplete.
     5. Authoritative certification_attempts row with decision = 'pass'
        (written only by finalize-assessment.js; client scores never read).
     6. Official name resolved server-side (never the email address).
   Then insert. unique(user_id, course_slug) in the database makes
   concurrent callers converge on one row: the loser of the insert race
   re-reads and returns the winner's credential.

   Returns { ok, status, credential?, message? } — never throws for an
   expected outcome; infrastructure errors propagate to the caller, which
   decides how to degrade (finalize keeps the PASS and reports "pending").
   ═══════════════════════════════════════════════════════════════ */

import { COURSE_SLUG, hasCompletedInstructionalModules, isEntitled, supabaseRest } from './auth.mjs';

export const CREDENTIAL_PREFIX = 'AIMT-HS';
/* Unambiguous alphabet: no 0/O, 1/I/L */
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const MAX_NAME_LENGTH = 120;
/* Placeholders the course UI has historically used for a missing name. */
const PLACEHOLDER_NAMES = new Set(['graduate', 'student', 'learner', 'name', 'your name']);

export function generateCredentialId() {
  const year = new Date().getUTCFullYear();
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) suffix += ID_ALPHABET[b % ID_ALPHABET.length];
  return `${CREDENTIAL_PREFIX}-${year}-${suffix}`;
}

function usableName(value) {
  const name = String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  if (!name) return '';
  if (name.includes('@')) return ''; // never print an email address
  if (PLACEHOLDER_NAMES.has(name.toLowerCase())) return '';
  return name;
}

/**
 * Official certificate name, resolved server-side:
 *   1. auth user_metadata first_name + last_name
 *   2. auth user_metadata full_name, then name
 *   3. server-synced course_progress.state.student.name
 * Returns '' when nothing usable exists (caller reports name_required).
 */
export function resolveCertificateName(user, progressState) {
  const meta = (user && user.user_metadata) || {};
  const first = String(meta.first_name || '').trim();
  const last = String(meta.last_name || '').trim();
  return usableName(first && last ? `${first} ${last}` : '')
    || usableName(meta.full_name)
    || usableName(meta.name)
    || usableName(progressState && progressState.student && progressState.student.name)
    || '';
}

function credentialFromRow(row) {
  return { credential_id: row.credential_id, student_name: row.student_name, completed_at: row.completed_at };
}

async function readCompletions(env, userId, courseSlug) {
  const params = new URLSearchParams({
    select: 'credential_id,student_name,completed_at,revoked',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
  });
  const res = await supabaseRest(env, `completions?${params}`);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Unable to read completions.');
  return res.body;
}

async function findActiveCredential(env, userId, courseSlug) {
  const params = new URLSearchParams({
    select: 'credential_id,student_name,completed_at',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    revoked: 'eq.false',
    limit: '1',
  });
  const res = await supabaseRest(env, `completions?${params}`);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Unable to read completions.');
  return res.body[0] || null;
}

async function hasAuthoritativePass(env, userId, courseSlug) {
  const params = new URLSearchParams({
    select: 'certification_decision',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    certification_decision: 'eq.pass',
    limit: '1',
  });
  const res = await supabaseRest(env, `certification_attempts?${params}`);
  if (!res.ok || !Array.isArray(res.body)) throw new Error('Unable to read certification attempts.');
  return res.body.length > 0;
}

/* Synced course state — read ONLY for the official-name fallback
   (state.student.name). Never used to decide eligibility. */
async function readProgressState(env, userId, courseSlug) {
  const params = new URLSearchParams({
    select: 'state',
    user_id: `eq.${userId}`,
    course_slug: `eq.${courseSlug}`,
    limit: '1',
  });
  const res = await supabaseRest(env, `course_progress?${params}`);
  return res.ok && Array.isArray(res.body) && res.body.length ? res.body[0].state || null : null;
}

/**
 * Ensures exactly one active credential exists for user + course, if and
 * only if every trust gate passes. `user` must be a server-resolved
 * Supabase Auth user ({ id, email, user_metadata }).
 *
 * status: 'already_issued' | 'issued'          (ok: true, credential set)
 *         'revoked' | 'not_entitled' | 'incomplete' | 'not_passed'
 *         | 'name_required' | 'error'           (ok: false)
 */
export async function ensureCertificateIssued(env, user, { courseSlug = COURSE_SLUG } = {}) {
  if (!user || !user.id) return { ok: false, status: 'error', message: 'Unknown student.' };

  /* 1–2. Existing credential always wins; a revoked one is never replaced. */
  const rows = await readCompletions(env, user.id, courseSlug);
  const active = rows.find((r) => r.revoked === false);
  if (active) return { ok: true, status: 'already_issued', credential: credentialFromRow(active) };
  if (rows.some((r) => r.revoked === true)) {
    return { ok: false, status: 'revoked', message: 'This credential was revoked. Contact AIMT.' };
  }

  /* 3. Entitlement. */
  if (!(await isEntitled(env, user, courseSlug))) {
    return { ok: false, status: 'not_entitled', message: 'No active enrollment found.' };
  }

  /* 4. Server-synced course completion: Modules 0–11 each complete. The
     Module 12 local course state is deliberately not required — the
     authoritative PASS below is what Module 12 requires. */
  if (!(await hasCompletedInstructionalModules(env, user.id, courseSlug))) {
    return { ok: false, status: 'incomplete', message: 'Course not yet complete. Finish all modules, let your progress sync, then try again.' };
  }

  /* 5. Authoritative Module 12 PASS. Course completion is a prerequisite
     for attempting certification, never a substitute for passing it — see
     docs/course-audit/00-aimt-certification-assessment-standard.md §16. */
  if (!(await hasAuthoritativePass(env, user.id, courseSlug))) {
    return { ok: false, status: 'not_passed', message: 'The Module 12 final certification assessment has not been passed yet.' };
  }

  /* 6. Official name — never the email, never a placeholder. */
  const studentName = resolveCertificateName(user, await readProgressState(env, user.id, courseSlug));
  if (!studentName) {
    return { ok: false, status: 'name_required', message: 'A full name is required on the student account before the certificate can be issued.' };
  }

  /* Issue. Retry on the (astronomically unlikely) ID collision; on the
     unique(user_id, course_slug) race, return the winner's credential. */
  for (let attempt = 0; attempt < 3; attempt++) {
    const insert = await supabaseRest(env, 'completions', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        credential_id: generateCredentialId(),
        user_id: user.id,
        course_slug: courseSlug,
        student_name: studentName,
      }),
    });
    if (insert.ok && Array.isArray(insert.body) && insert.body.length) {
      return { ok: true, status: 'issued', credential: credentialFromRow(insert.body[0]) };
    }
    const winner = await findActiveCredential(env, user.id, courseSlug);
    if (winner) return { ok: true, status: 'already_issued', credential: credentialFromRow(winner) };
  }
  return { ok: false, status: 'error', message: 'Could not issue certificate — please try again.' };
}
