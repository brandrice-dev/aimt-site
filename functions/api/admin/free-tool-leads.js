// Owner/admin-only free-tool contact inbox. Contact PII never enters growth analytics.
import { resolveAdmin } from '../../_lib/admin/auth.mjs';
import { supabaseRest } from '../../_lib/certification/auth.mjs';

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Vary': 'Authorization',
    'X-Content-Type-Options': 'nosniff',
  } });
}
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return reply({ error: 'GET required.' }, 405);
  const actor = await resolveAdmin(env, request, ['owner', 'admin'], { bootstrap: false });
  if (actor.errorResponse) return actor.errorResponse;
  try {
    const params = new URLSearchParams({
      select: 'id,first_name,email,tool,marketing_consent,marketing_consented_at,created_at,last_submitted_at',
      order: 'last_submitted_at.desc',
      limit: '100',
    });
    const res = await supabaseRest(env, 'free_tool_leads?' + params);
    if (!res.ok || !Array.isArray(res.body)) return reply({
      error: 'Free-tool contact storage is not available. Check the Supabase migration.',
    }, 503);
    return reply({
      leads: res.body,
      count: res.body.length,
      withMarketingConsent: res.body.filter(lead => lead.marketing_consent === true).length,
      limitedTo: 100,
    });
  } catch (_) { return reply({ error: 'Unable to load free-tool contacts.' }, 503); }
}
