/* AIMT paid-course delivery boundary — dormant until the private asset
   migration is completed and approved. No content is loaded from public
   Pages assets or GitHub. All responses are fail-closed and non-cacheable.
   Required Cloudflare env: PAID_ASSETS_BUCKET (non-public Supabase bucket),
   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (existing).
*/
import { hasSupabaseEnv, isEntitled, resolveUser } from '../_lib/certification/auth.mjs';

const RESOURCES = Object.freeze({
  'course-app': { path: 'headspa-mastery/course-app.html', type: 'text/html; charset=utf-8', disposition: 'inline', filename: 'head-spa-course.html' },
  'module-02-intake': { path: 'headspa-mastery/module-02/module-02-head-spa-intake-service-plan-fillable.pdf', type: 'application/pdf', disposition: 'attachment', filename: 'head-spa-intake-service-plan.pdf' },
  'module-08-core-map': { path: 'headspa-mastery/module-08/module-08-core-format-service-map.png', type: 'image/png', disposition: 'attachment', filename: 'core-service-map.png' },
  'module-08-extended-map': { path: 'headspa-mastery/module-08/module-08-extended-format-service-map.png', type: 'image/png', disposition: 'attachment', filename: 'extended-service-map.png' },
  'module-09-enhancement-guide': { path: 'headspa-mastery/module-09/AIMT-Head-Spa-Enhancement-Strategy-Guide.pdf', type: 'application/pdf', disposition: 'attachment', filename: 'head-spa-enhancement-strategy.pdf' },
  'module-10-reset': { path: 'headspa-mastery/module-10/module-10-between-client-sanitation-reset-checklist-fillable.pdf', type: 'application/pdf', disposition: 'attachment', filename: 'sanitation-reset-checklist.pdf' },
  'module-11-toolkit': { path: 'headspa-mastery/module-11/module-11-aimt-ai-practice-toolkit-fillable.pdf', type: 'application/pdf', disposition: 'attachment', filename: 'aimt-practice-toolkit.pdf' }
});

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};
function denied(message, status) {
  return Response.json({ error: message }, { status, headers: privateHeaders });
}

export async function onRequestGet({ request, env }) {
  if (!hasSupabaseEnv(env) || !/^[a-z0-9][a-z0-9_-]{2,62}$/.test(String(env.PAID_ASSETS_BUCKET || ''))) {
    return denied('Course materials are temporarily unavailable.', 503);
  }
  const key = new URL(request.url).searchParams.get('resource');
  if (!Object.prototype.hasOwnProperty.call(RESOURCES, key || '')) {
    return denied('Material not found.', 404);
  }
  let identity;
  try { identity = await resolveUser(env, request); }
  catch (_) { return denied('Unable to confirm your sign-in.', 503); }
  if (identity.errorResponse) {
    const status = identity.errorResponse.status;
    return denied(status === 401 ? 'Sign in required.' : 'Unable to confirm your sign-in.', status);
  }
  let entitled = false;
  try { entitled = await isEntitled(env, identity.user, 'headspa-mastery'); }
  catch (_) { return denied('Unable to confirm course access.', 503); }
  if (!entitled) return denied('Enrollment required.', 403);

  const resource = RESOURCES[key];
  const encodedPath = resource.path.split('/').map(encodeURIComponent).join('/');
  const url = env.SUPABASE_URL + '/storage/v1/object/authenticated/' + encodeURIComponent(env.PAID_ASSETS_BUCKET) + '/' + encodedPath;
  try {
    const response = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    if (!response.ok) return denied('Material not available.', 503);
    return new Response(response.body, {
      status: 200,
      headers: {
        ...privateHeaders,
        'Content-Type': resource.type,
        'Content-Disposition': resource.disposition + '; filename="' + resource.filename + '"'
      }
    });
  } catch (_) { return denied('Material not available.', 503); }
}
