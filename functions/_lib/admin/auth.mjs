import { json, resolveUser, supabaseRest } from '../certification/auth.mjs';

const ADMIN_TABLE = 'admin_users';
const AUDIT_TABLE = 'admin_audit_log';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function readAdminRow(env, userId) {
  const params = new URLSearchParams({
    select: 'user_id,role,active',
    user_id: `eq.${userId}`,
    limit: '1',
  });
  const res = await supabaseRest(env, `${ADMIN_TABLE}?${params}`);
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return null;
  return res.body[0];
}

async function countAdminRows(env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${ADMIN_TABLE}?select=user_id&limit=1`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
    },
  });
  if (!response.ok) return null;
  const range = response.headers.get('content-range') || '';
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function bootstrapOwnerIfAllowed(env, user) {
  const expected = normalizeEmail(env.AIMT_OWNER_EMAIL);
  if (!expected || normalizeEmail(user.email) !== expected) return null;

  const count = await countAdminRows(env);
  if (count !== 0) return null;

  const res = await supabaseRest(env, ADMIN_TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: user.id, role: 'owner', active: true }),
  });
  if (!res.ok || !Array.isArray(res.body) || !res.body.length) return null;
  return res.body[0];
}

export async function resolveAdmin(env, request, allowedRoles = ['owner', 'admin', 'support']) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { errorResponse: json({ error: 'Admin service is not configured.' }, 503) };
  }

  const identity = await resolveUser(env, request);
  if (identity.errorResponse) return identity;
  const user = identity.user;

  let admin = await readAdminRow(env, user.id);
  if (!admin) admin = await bootstrapOwnerIfAllowed(env, user);

  if (!admin || admin.active !== true || !allowedRoles.includes(admin.role)) {
    return { errorResponse: json({ error: 'Admin access required.' }, 403) };
  }

  return { user, admin };
}

export async function writeAdminAudit(env, actor, action, details = {}) {
  const row = {
    actor_user_id: actor.user.id,
    actor_email: normalizeEmail(actor.user.email) || null,
    actor_role: actor.admin.role,
    action: String(action || 'unknown_admin_action'),
    target_user_id: details.targetUserId || null,
    target_email: normalizeEmail(details.targetEmail) || null,
    course_slug: details.courseSlug || null,
    details: details.details || {},
  };

  const res = await supabaseRest(env, AUDIT_TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) console.info('[aimt-admin-audit-fallback]', row);
}

export function requireAdminRole(actor, roles) {
  return roles.includes(actor.admin.role);
}

export function adminJson(data, status = 200) {
  return json(data, status);
}
