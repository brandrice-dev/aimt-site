// The source stays monolithic for the existing course app. Only its explicit
// public prefix is sent anonymously; the full document requires the shared
// server-validated identity and course-specific entitlement gate.
import { hasSupabaseEnv, resolveUser, isEntitled } from '../certification/auth.mjs';

export const COURSE_PATHS = new Set([
  '/head-spa-certification', '/head-spa-certification/', '/head-spa-certification.html',
  '/headspa-mastery', '/headspa-mastery/', '/headspa-mastery.html',
]);
const BOUNDARY = '<!-- AIMT PRIVATE COURSE BOUNDARY -->';
const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Vary': 'Authorization',
  'X-Content-Type-Options': 'nosniff',
};

export function publicCoursePage(source) {
  const boundary = source.indexOf(BOUNDARY);
  if (boundary < 0 || source.indexOf(BOUNDARY, boundary + 1) !== -1) throw new Error('Missing/ambiguous course boundary');
  const prefix = source.slice(0, boundary);
  // These public browser credentials already ship in student-access and other
  // public pages. Read from the same source rather than introduce config drift.
  const url = source.match(/^const SUPABASE_URL = ('[^'\n]+');$/m);
  const key = source.match(/^const SUPABASE_ANON_KEY = ('[^'\n]+');$/m);
  if (!url || !key || !prefix.includes('id="landingPage"') || prefix.includes('id="lessonView"')) throw new Error('Invalid public course shell');
  return prefix
    .replace('class="app-loading"', 'class="app-ready"')
    .replace(/<div id="reviewModeBanner"[\s\S]*?<\/div>/, '') +
    `<script>window.AIMT_COURSE_PUBLIC_CONFIG={url:${url[1]},key:${key[1]}};</script>\n` +
    '<script src="/assets/js/aimt-course-entry.js"></script>\n' +
    '<script src="/assets/js/aimt-growth.js" defer></script>\n' +
    '<script src="/assets/js/aimt-readiness-prompt.js" defer></script>\n' +
    '<script src="/assets/js/aimt-founder-offer.js" defer></script>\n</body>\n</html>';
}

export async function deliverCoursePage({ request, env }) {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { ...HEADERS, Allow: 'GET, HEAD' } });
  }
  if (url.pathname !== '/head-spa-certification') {
    url.pathname = '/head-spa-certification';
    return new Response(null, { status: 301, headers: { ...HEADERS, Location: url.href } });
  }
  const authenticatedRequest = request.headers.has('Authorization');
  try {
    if (authenticatedRequest) {
      if (!hasSupabaseEnv(env)) return new Response('Course access temporarily unavailable.', { status: 503, headers: HEADERS });
      const identity = await resolveUser(env, request);
      if (identity.errorResponse) return new Response('Sign in required.', { status: 401, headers: HEADERS });
      if (!await isEntitled(env, identity.user, 'headspa-mastery')) {
        return new Response('Course enrollment required.', { status: 403, headers: HEADERS });
      }
    }
    // ASSETS is the internal static binding, never a public subrequest. The
    // legacy URL is routed through Functions for ALL external requests.
    const asset = await env.ASSETS.fetch(new URL('/headspa-mastery', request.url));
    if (!asset.ok || asset.redirected || asset.status !== 200) throw new Error('Course source unavailable');
    const source = await asset.text();
    const html = authenticatedRequest ? source : publicCoursePage(source);
    return new Response(request.method === 'HEAD' ? null : html, {
      headers: { ...HEADERS, ...(authenticatedRequest ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) },
    });
  } catch {
    return new Response('Course temporarily unavailable. Please try again.', { status: 503, headers: HEADERS });
  }
}
