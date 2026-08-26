/* ═══════════════════════════════════════════════════════════════
   Issue Certificate — server-verified, forgery-proof
   ---------------------------------------------------------------
   POST /api/issue-certificate
   Headers: Authorization: Bearer <supabase access token>
   Body: { "student_name": "Jane Doe" }

   Verifies (server-side, none of this trusts the browser):
     1. Valid signed-in user
     2. Active entitlement for the course
     3. Real progress in course_progress (modules 0–11 complete)
   Then issues a unique credential ID (AIMT-HSM-2026-XXXXXX) or
   returns the existing one (idempotent — one credential per student).

   Uses existing env vars only: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
   ═══════════════════════════════════════════════════════════════ */

const COURSE_SLUG = 'headspa-mastery';
const CREDENTIAL_PREFIX = 'AIMT-HS';
/* Module 11 → 12 structural relocation (course-audit-build): the
   Course Completion & Certification screen now lives at technical slot
   12, so the prerequisite is one module further than before — modules
   0–11 complete = 12 x 100 in the progress score. See
   docs/course-audit/modules/module-11.md and headspa-mastery.html's
   showCertificate(), which enforces the same 0–11 requirement client-side. */
const REQUIRED_SCORE = 1200;
/* Unambiguous alphabet: no 0/O, 1/I/L */
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateCredentialId() {
  const year = new Date().getUTCFullYear();
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) suffix += ID_ALPHABET[b % ID_ALPHABET.length];
  return `${CREDENTIAL_PREFIX}-${year}-${suffix}`;
}

async function supabaseRest(env, path, options = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Misconfigured' }, 500);
  }

  /* 1. Who is asking? */
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json({ error: 'Sign in required.' }, 401);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!userRes.ok) return json({ error: 'Session expired — sign in again.' }, 401);
  const user = await userRes.json().catch(() => null);
  if (!user || !user.id) return json({ error: 'Session expired — sign in again.' }, 401);

  const email = String(user.email || '').trim().toLowerCase();

  /* 2. Are they entitled to this course? */
  const entParams = new URLSearchParams({
    select: 'checkout_session_id',
    course_slug: `eq.${COURSE_SLUG}`,
    or: `(user_id.eq.${user.id},purchaser_email.eq.${email})`,
    limit: '1'
  });
  const ent = await supabaseRest(env, `course_entitlements?${entParams}`);
  if (!ent.ok || !Array.isArray(ent.body) || !ent.body.length) {
    return json({ error: 'No active enrollment found.' }, 403);
  }

  /* 3. Idempotency: already issued? Return the existing credential. */
  const existingParams = new URLSearchParams({
    select: 'credential_id,student_name,completed_at',
    user_id: `eq.${user.id}`,
    course_slug: `eq.${COURSE_SLUG}`,
    revoked: 'eq.false',
    limit: '1'
  });
  const existing = await supabaseRest(env, `completions?${existingParams}`);
  if (existing.ok && Array.isArray(existing.body) && existing.body.length) {
    const row = existing.body[0];
    return json({
      credential_id: row.credential_id,
      student_name: row.student_name,
      completed_at: row.completed_at,
      already_issued: true
    });
  }

  /* 4. Did they actually finish? Check the server-synced progress. */
  const progParams = new URLSearchParams({
    select: 'progress_score',
    user_id: `eq.${user.id}`,
    course_slug: `eq.${COURSE_SLUG}`,
    limit: '1'
  });
  const prog = await supabaseRest(env, `course_progress?${progParams}`);
  const score = prog.ok && Array.isArray(prog.body) && prog.body.length
    ? Number(prog.body[0].progress_score) || 0
    : 0;
  if (score < REQUIRED_SCORE) {
    return json({
      error: 'Course not yet complete. Finish all modules, let your progress sync, then try again.'
    }, 409);
  }

  /* 5. Issue. Retry on the (astronomically unlikely) ID collision. */
  let studentName = '';
  try {
    const body = await request.json();
    studentName = String(body && body.student_name || '').trim().slice(0, 120);
  } catch (_) {}
  if (!studentName) studentName = email;

  for (let attempt = 0; attempt < 3; attempt++) {
    const credentialId = generateCredentialId();
    const insert = await supabaseRest(env, 'completions', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        credential_id: credentialId,
        user_id: user.id,
        course_slug: COURSE_SLUG,
        student_name: studentName
      })
    });
    if (insert.ok && Array.isArray(insert.body) && insert.body.length) {
      const row = insert.body[0];
      return json({
        credential_id: row.credential_id,
        student_name: row.student_name,
        completed_at: row.completed_at,
        already_issued: false
      });
    }
    /* unique(user_id, course_slug) race: someone double-clicked — fetch existing */
    const retry = await supabaseRest(env, `completions?${existingParams}`);
    if (retry.ok && Array.isArray(retry.body) && retry.body.length) {
      const row = retry.body[0];
      return json({
        credential_id: row.credential_id,
        student_name: row.student_name,
        completed_at: row.completed_at,
        already_issued: true
      });
    }
  }
  return json({ error: 'Could not issue certificate — please try again.' }, 500);
}
