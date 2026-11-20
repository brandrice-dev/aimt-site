/* Fail-closed, cookie-authenticated private course media for native <img>/<audio>.
   Never redirect to a Supabase signed URL or allow arbitrary bucket paths. */
import { hasSupabaseEnv, isEntitled, resolveUser } from '../certification/auth.mjs';

const COOKIE = '__Secure-aimt-paid-media';
export const PAID_MEDIA_COOKIE = COOKIE;
const PREFIXES = ['/assets/images/course/', '/assets/audio/listen/headspa-mastery/'];
const MIME = Object.freeze({
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg'
});
const HEADERS = Object.freeze({
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; sandbox"
});

export function privateMediaPath(pathname) {
  let path;
  try { path = decodeURIComponent(pathname); } catch (_) { return null; }
  if (!PREFIXES.some(prefix => path.startsWith(prefix))) return null;
  // Decode exactly once. Deny traversal, encoded separators, Windows paths,
  // NUL and ambiguous double-encoded filenames before touching Storage.
  if (!/^\/assets\/[a-z0-9A-Z/_-]+(?:\.[a-zA-Z0-9]+)$/.test(path)) return null;
  if (path.includes('//') || path.split('/').some(s => s === '.' || s === '..')) return null;
  if (/%[0-9a-fA-F]{2}/.test(path) || path.includes('\\')) return null;
  const ext = path.split('.').pop().toLowerCase();
  if (!Object.hasOwn(MIME, ext)) return null;
  if (path.startsWith(PREFIXES[1]) && ext !== 'mp3') return null;
  const suffix = path.startsWith(PREFIXES[0]) ? path.slice(PREFIXES[0].length) : path.slice(PREFIXES[1].length);
  if (!suffix || suffix.length > 300) return null;
  return { originalPath: path, storagePath: 'headspa-mastery/media' + path, mime: MIME[ext] };
}

function cookieToken(request) {
  const cookie = request.headers.get('Cookie') || '';
  const pair = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  if (!pair) return '';
  const token = pair.slice(COOKIE.length + 1);
  // Supabase JWT only; never accept an arbitrary opaque/path token.
  return token.length < 4000 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? token : '';
}

function error(status, message) {
  return new Response(message, { status, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } });
}

export async function servePaidMedia({ request, env }) {
  const media = privateMediaPath(new URL(request.url).pathname);
  if (!media) return error(404, 'Not found.');
  if (request.method !== 'GET' && request.method !== 'HEAD') return error(405, 'Method not allowed.');
  if (!hasSupabaseEnv(env) || !/^[a-z0-9][a-z0-9_-]{2,62}$/.test(String(env.PAID_ASSETS_BUCKET || ''))) return error(503, 'Course media unavailable.');
  const token = cookieToken(request);
  if (!token) return error(401, 'Sign in required.');
  let identity, entitled;
  try {
    identity = await resolveUser(env, new Request(request.url, { headers: { Authorization: 'Bearer ' + token } }));
    if (identity.errorResponse) return error(401, 'Sign in required.');
    entitled = await isEntitled(env, identity.user, 'headspa-mastery');
  } catch (_) { return error(503, 'Unable to verify course access.'); }
  if (!entitled) return error(403, 'Enrollment required.');

  const url = env.SUPABASE_URL + '/storage/v1/object/authenticated/' +
    encodeURIComponent(env.PAID_ASSETS_BUCKET) + '/' +
    media.storagePath.split('/').map(encodeURIComponent).join('/');
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
  };
  const range = request.headers.get('Range');
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
  else if (range) return error(416, 'Invalid range.');
  let upstream;
  try { upstream = await fetch(url, { method: request.method, headers }); }
  catch (_) { return error(503, 'Course media unavailable.'); }
  if (upstream.status !== 200 && upstream.status !== 206) return error(503, 'Course media unavailable.');
  const responseHeaders = new Headers(HEADERS);
  responseHeaders.set('Content-Type', media.mime);
  responseHeaders.set('Content-Disposition', 'inline');
  for (const key of ['Content-Range', 'Accept-Ranges', 'Content-Length', 'ETag']) {
    if (upstream.headers.has(key)) responseHeaders.set(key, upstream.headers.get(key));
  }
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}
