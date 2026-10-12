import { resolveAdmin } from '../../_lib/admin/auth.mjs';
import { buildOfficeSnapshot } from '../../_lib/office/snapshot.mjs';

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json', 'Cache-Control': 'private, no-store',
    'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff',
  } });
}
export async function onRequest(context) {
  if (context.request.method !== 'GET') return response({ error: 'Read-only Office. GET required.' }, 405);
  try {
    // Reuse Admin identity and active-role checks; Office never bootstraps a row.
    const actor = await resolveAdmin(context.env, context.request, ['owner'], { bootstrap: false });
    if (actor.errorResponse) return response(await actor.errorResponse.json(), actor.errorResponse.status);
    return response(await buildOfficeSnapshot(context.env));
  } catch {
    return response({ error: 'Office activity unavailable. Retry after checking your session.' }, 503);
  }
}
