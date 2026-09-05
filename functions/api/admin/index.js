import { supabaseRest } from '../../_lib/certification/auth.mjs';
import { adminJson, requireAdminRole, resolveAdmin, writeAdminAudit } from '../../_lib/admin/auth.mjs';

const COURSE_SLUG = 'headspa-mastery';
const MANUAL_PREFIX = 'admin-grant-';
const ALLOWED_GRANT_SOURCES = new Set(['staff', 'complimentary', 'scholarship', 'manual']);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function authHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function listAuthUsers(env, perPage = 200) {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=${perPage}`, {
    headers: authHeaders(env),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.msg || body?.message || 'Unable to read AIMT accounts.');
  return Array.isArray(body?.users) ? body.users : (Array.isArray(body) ? body : []);
}

async function getAuthUser(env, userId) {
  if (!userId) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: authHeaders(env),
  });
  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

async function findAuthUserByEmail(env, email) {
  const normalized = normalizeEmail(email);
  const users = await listAuthUsers(env, 1000);
  return users.find((u) => normalizeEmail(u.email) === normalized) || null;
}

async function ensureAuthUser(env, email, firstName = '', lastName = '') {
  const existing = await findAuthUserByEmail(env, email);
  if (existing) return { user: existing, created: false };

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify({
      email: normalizeEmail(email),
      email_confirm: true,
      user_metadata: {
        first_name: String(firstName || '').trim(),
        last_name: String(lastName || '').trim(),
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.id) {
    throw new Error(body?.msg || body?.message || 'Unable to create AIMT account.');
  }
  return { user: body, created: true };
}

function displayName(user) {
  const meta = user?.user_metadata || {};
  const full = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim();
  return full || meta.full_name || meta.name || '';
}

async function readRows(env, table, query) {
  const res = await supabaseRest(env, `${table}?${query}`);
  if (!res.ok) throw new Error(`Unable to read ${table}.`);
  return Array.isArray(res.body) ? res.body : [];
}

async function readAllCoreData(env) {
  const [users, entitlements, progress, completions, attempts, reviews, educatorRequests] = await Promise.all([
    listAuthUsers(env, 1000),
    readRows(env, 'course_entitlements', new URLSearchParams({ select: 'checkout_session_id,course_slug,purchaser_email,user_id,granted_at', course_slug: `eq.${COURSE_SLUG}`, order: 'granted_at.desc', limit: '2000' })),
    readRows(env, 'course_progress', new URLSearchParams({ select: 'user_id,course_slug,progress_score,updated_at,state', course_slug: `eq.${COURSE_SLUG}`, limit: '2000' })),
    readRows(env, 'completions', new URLSearchParams({ select: 'credential_id,user_id,course_slug,student_name,completed_at,revoked', course_slug: `eq.${COURSE_SLUG}`, limit: '2000' })),
    readRows(env, 'certification_attempts', new URLSearchParams({ select: 'id,user_id,course_slug,attempt_number,status,knowledge_score,applied_cases_score,interview_score,overall_score,certification_decision,decision_at,updated_at', course_slug: `eq.${COURSE_SLUG}`, order: 'updated_at.desc', limit: '2000' })),
    readRows(env, 'certification_review_requests', new URLSearchParams({ select: 'id,user_id,course_slug,attempt_id,status,created_at,resolved_at', course_slug: `eq.${COURSE_SLUG}`, order: 'created_at.desc', limit: '1000' })),
    readRows(env, 'certification_educator_requests', new URLSearchParams({ select: 'id,user_id,course_slug,attempt_id,status,attempt4_authorized,requested_at', course_slug: `eq.${COURSE_SLUG}`, order: 'requested_at.desc', limit: '1000' })),
  ]);
  return { users, entitlements, progress, completions, attempts, reviews, educatorRequests };
}

function buildStudentSummaries(data) {
  const usersById = new Map(data.users.map((u) => [u.id, u]));
  const progressById = new Map(data.progress.map((r) => [r.user_id, r]));
  const completionById = new Map(data.completions.map((r) => [r.user_id, r]));
  const attemptsById = new Map();
  data.attempts.forEach((r) => {
    if (!attemptsById.has(r.user_id)) attemptsById.set(r.user_id, []);
    attemptsById.get(r.user_id).push(r);
  });

  const byIdentity = new Map();
  for (const entitlement of data.entitlements) {
    const user = entitlement.user_id ? usersById.get(entitlement.user_id) : null;
    const email = normalizeEmail(user?.email || entitlement.purchaser_email);
    if (!email) continue;
    const key = user?.id || `email:${email}`;
    if (!byIdentity.has(key)) {
      const progress = user ? progressById.get(user.id) : null;
      const completion = user ? completionById.get(user.id) : null;
      const attempts = user ? (attemptsById.get(user.id) || []) : [];
      byIdentity.set(key, {
        userId: user?.id || null,
        email,
        name: user ? displayName(user) : '',
        accountCreated: !!user,
        entitlementIds: [],
        sources: [],
        grantedAt: entitlement.granted_at || null,
        progressScore: progress?.progress_score ?? 0,
        lastActivity: progress?.updated_at || null,
        certified: !!completion && completion.revoked !== true,
        credentialId: completion?.credential_id || null,
        certificationDecision: attempts[0]?.certification_decision || null,
        certificationStatus: attempts[0]?.status || null,
        attemptNumber: attempts[0]?.attempt_number || null,
      });
    }
    const summary = byIdentity.get(key);
    summary.entitlementIds.push(entitlement.checkout_session_id);
    summary.sources.push(entitlement.checkout_session_id.startsWith(MANUAL_PREFIX) ? 'manual' : 'stripe');
    if (entitlement.granted_at && (!summary.grantedAt || entitlement.granted_at > summary.grantedAt)) summary.grantedAt = entitlement.granted_at;
  }
  return [...byIdentity.values()];
}

async function handleDashboard(env, actor) {
  const data = await readAllCoreData(env);
  const students = buildStudentSummaries(data);
  const activeCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
  return adminJson({
    actor: { email: actor.user.email, role: actor.admin.role },
    metrics: {
      enrolled: students.length,
      active30d: students.filter((s) => s.lastActivity && Date.parse(s.lastActivity) >= activeCutoff).length,
      certified: students.filter((s) => s.certified).length,
      openReviews: data.reviews.filter((r) => r.status === 'open').length,
      educatorRequests: data.educatorRequests.filter((r) => r.status !== 'completed').length,
    },
    recentStudents: students.sort((a, b) => String(b.lastActivity || b.grantedAt || '').localeCompare(String(a.lastActivity || a.grantedAt || ''))).slice(0, 8),
  });
}

async function handleStudents(env, searchTerm) {
  const data = await readAllCoreData(env);
  const q = String(searchTerm || '').trim().toLowerCase();
  let students = buildStudentSummaries(data);
  if (q) students = students.filter((s) => s.email.includes(q) || s.name.toLowerCase().includes(q));
  students.sort((a, b) => String(b.lastActivity || b.grantedAt || '').localeCompare(String(a.lastActivity || a.grantedAt || '')));
  return adminJson({ students: students.slice(0, 100) });
}

async function handleStudent(env, userId, email) {
  const normalizedEmail = normalizeEmail(email);
  const user = userId ? await getAuthUser(env, userId) : await findAuthUserByEmail(env, normalizedEmail);
  const identityEmail = normalizeEmail(user?.email || normalizedEmail);
  const filters = user?.id
    ? `or=(user_id.eq.${user.id},purchaser_email.eq.${encodeURIComponent(identityEmail)})`
    : `purchaser_email=eq.${encodeURIComponent(identityEmail)}`;

  const entRes = await supabaseRest(env, `course_entitlements?select=checkout_session_id,course_slug,purchaser_email,user_id,granted_at&course_slug=eq.${COURSE_SLUG}&${filters}&order=granted_at.desc`);
  const entitlements = entRes.ok && Array.isArray(entRes.body) ? entRes.body : [];

  let progress = [], completions = [], attempts = [], remediation = [], reviews = [], educatorRequests = [];
  if (user?.id) {
    const uid = encodeURIComponent(user.id);
    [progress, completions, attempts, remediation, reviews, educatorRequests] = await Promise.all([
      readRows(env, 'course_progress', `select=course_slug,progress_score,updated_at,state&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}`),
      readRows(env, 'completions', `select=credential_id,student_name,completed_at,revoked&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}`),
      readRows(env, 'certification_attempts', `select=id,attempt_number,status,knowledge_score,applied_cases_score,interview_score,overall_score,critical_domain_results,certification_decision,decision_at,updated_at&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}&order=attempt_number.desc`),
      readRows(env, 'certification_remediation_assignments', `select=id,attempt_id,competency_area,critical_domain,module_ref,section_ref,remediation_activity,required_before_next_attempt,completed,completed_at,created_at&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}&order=created_at.desc`),
      readRows(env, 'certification_review_requests', `select=id,attempt_id,disputed_ref,student_explanation,status,resolution_notes,resolved_at,created_at&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}&order=created_at.desc`),
      readRows(env, 'certification_educator_requests', `select=id,attempt_id,status,educator_notes,attempt4_authorized,authorized_by,authorized_at,requested_at&user_id=eq.${uid}&course_slug=eq.${COURSE_SLUG}&order=requested_at.desc`),
    ]);
  }

  return adminJson({
    student: {
      userId: user?.id || null,
      email: identityEmail,
      name: user ? displayName(user) : '',
      accountCreated: !!user,
      createdAt: user?.created_at || null,
      lastSignInAt: user?.last_sign_in_at || null,
    },
    entitlements: entitlements.map((e) => ({ ...e, source: e.checkout_session_id.startsWith(MANUAL_PREFIX) ? 'manual' : 'stripe' })),
    progress: progress[0] || null,
    completion: completions[0] || null,
    attempts,
    remediation,
    reviews,
    educatorRequests,
  });
}

async function handleAudit(env) {
  const rows = await readRows(env, 'admin_audit_log', 'select=id,created_at,actor_email,actor_role,action,target_email,course_slug,details&order=created_at.desc&limit=100');
  return adminJson({ audit: rows });
}

async function grantAccess(env, actor, body) {
  if (!requireAdminRole(actor, ['owner', 'admin'])) return adminJson({ error: 'Owner or admin access required.' }, 403);
  const email = normalizeEmail(body.email);
  const source = String(body.source || 'manual').trim().toLowerCase();
  if (!email || !email.includes('@')) return adminJson({ error: 'A valid email is required.' }, 400);
  if (!ALLOWED_GRANT_SOURCES.has(source)) return adminJson({ error: 'Invalid enrollment source.' }, 400);

  const account = await ensureAuthUser(env, email, body.firstName, body.lastName);
  const grantId = `${MANUAL_PREFIX}${source}-${crypto.randomUUID()}`;
  const entitlement = {
    checkout_session_id: grantId,
    course_slug: COURSE_SLUG,
    purchaser_email: email,
    user_id: account.user.id,
  };
  const res = await supabaseRest(env, 'course_entitlements', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(entitlement),
  });
  if (!res.ok) return adminJson({ error: 'Unable to grant course access.' }, 500);

  await writeAdminAudit(env, actor, 'grant_course_access', {
    targetUserId: account.user.id,
    targetEmail: email,
    courseSlug: COURSE_SLUG,
    details: { source, grantId, accountCreated: account.created },
  });

  return adminJson({
    ok: true,
    userId: account.user.id,
    accountCreated: account.created,
    grantId,
    setupInstruction: account.created
      ? 'Account created. Have the student open Student Access and use “Forgot your password?” to set their password, then sign in normally.'
      : 'Access granted to the existing AIMT account. The student can sign in normally.',
  });
}

async function revokeManualAccess(env, actor, body) {
  if (!requireAdminRole(actor, ['owner', 'admin'])) return adminJson({ error: 'Owner or admin access required.' }, 403);
  const grantId = String(body.grantId || '').trim();
  if (!grantId.startsWith(MANUAL_PREFIX)) {
    return adminJson({ error: 'Admin MVP can revoke only manually granted access. Paid Stripe entitlements are protected.' }, 400);
  }

  const lookup = await readRows(env, 'course_entitlements', `select=checkout_session_id,purchaser_email,user_id,course_slug&checkout_session_id=eq.${encodeURIComponent(grantId)}&limit=1`);
  if (!lookup.length) return adminJson({ error: 'Manual entitlement not found.' }, 404);
  const row = lookup[0];
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/course_entitlements?checkout_session_id=eq.${encodeURIComponent(grantId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders(env), Prefer: 'return=minimal' },
  });
  if (!response.ok) return adminJson({ error: 'Unable to revoke course access.' }, 500);

  await writeAdminAudit(env, actor, 'revoke_manual_course_access', {
    targetUserId: row.user_id,
    targetEmail: row.purchaser_email,
    courseSlug: row.course_slug,
    details: { grantId },
  });
  return adminJson({ ok: true });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const actor = await resolveAdmin(env, request);
  if (actor.errorResponse) return actor.errorResponse;

  try {
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'dashboard';
    if (view === 'me') return adminJson({ actor: { email: actor.user.email, role: actor.admin.role } });
    if (view === 'dashboard') return await handleDashboard(env, actor);
    if (view === 'students') return await handleStudents(env, url.searchParams.get('q'));
    if (view === 'student') return await handleStudent(env, url.searchParams.get('userId'), url.searchParams.get('email'));
    if (view === 'audit') return await handleAudit(env);
    return adminJson({ error: 'Unknown admin view.' }, 400);
  } catch (error) {
    return adminJson({ error: error?.message || 'Unable to load AIMT admin data.' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const actor = await resolveAdmin(env, request);
  if (actor.errorResponse) return actor.errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    if (action === 'grant_access') return await grantAccess(env, actor, body);
    if (action === 'revoke_manual_access') return await revokeManualAccess(env, actor, body);
    return adminJson({ error: 'Unknown admin action.' }, 400);
  } catch (error) {
    return adminJson({ error: error?.message || 'Unable to complete AIMT admin action.' }, 500);
  }
}
