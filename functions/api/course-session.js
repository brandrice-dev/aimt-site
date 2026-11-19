/* Establish a short-lived, restricted HttpOnly cookie for native paid media.
   Caller supplies the normal Supabase bearer token. No new student data is written. */
import { hasSupabaseEnv, isEntitled, resolveUser } from '../_lib/certification/auth.mjs';
import { PAID_MEDIA_COOKIE } from '../_lib/paid-content/media.mjs';
const NO_STORE = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
function failure(status, message) { return Response.json({ error: message }, { status, headers: NO_STORE }); }
function remainingLifetime(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Math.max(0, Math.min(1200, Math.floor(Number(payload.exp) - Date.now() / 1000 - 30)));
  } catch (_) { return 0; }
}
export async function onRequestPost({ request, env }) {
  if (!hasSupabaseEnv(env)) return failure(503, 'Course access unavailable.');
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return failure(403, 'Invalid origin.');
  const authorization = request.headers.get('Authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  if (!match || match[1].length > 4000) return failure(401, 'Sign in required.');
  let identity, entitled;
  try {
    identity = await resolveUser(env, request);
    if (identity.errorResponse) return failure(401, 'Sign in required.');
    entitled = await isEntitled(env, identity.user, 'headspa-mastery');
  } catch (_) { return failure(503, 'Unable to confirm enrollment.'); }
  if (!entitled) return failure(403, 'Enrollment required.');
  const ttl = remainingLifetime(match[1]);
  if (ttl < 30) return failure(401, 'Refresh your session and try again.');
  const headers = new Headers(NO_STORE);
  for (const path of ['/assets/images/course/', '/assets/audio/listen/headspa-mastery/']) {
    headers.append('Set-Cookie', PAID_MEDIA_COOKIE + '=' + match[1] +
      '; Path=' + path + '; Max-Age=' + ttl + '; Secure; HttpOnly; SameSite=Strict');
  }
  return Response.json({ ok: true, expiresInSeconds: ttl }, { headers });
}
