// Contact capture only. Business entries and plan contents never reach this endpoint.
import { supabaseRest } from '../../_lib/certification/auth.mjs';
const TOOLS = new Set(['service-cost', 'first-service-blueprint']);
function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
export function normalizeContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!TOOLS.has(body.tool) || firstName.length < 1 || firstName.length > 80 || /[\x00-\x1f\x7f]/.test(firstName)) return null;
  if (email.length > 254 || !/^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/.test(email)) return null;
  if (typeof body.marketing_consent !== 'boolean') return null;
  return { first_name: firstName, email, tool: body.tool,
    marketing_consent: body.marketing_consent,
    marketing_consented_at: body.marketing_consent ? new Date().toISOString() : null,
    last_submitted_at: new Date().toISOString() };
}
export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply({ error: 'Contact storage unavailable. Please try again.' }, 503);
  const origin = request.headers.get('Origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return reply({ error: 'Origin not allowed.' }, 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return reply({ error: 'JSON required.' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 2048) return reply({ error: 'Request too large.' }, 413);
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2048) return reply({ error: 'Request too large.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: 'Please review your name and email.' }, 400); }
    if (body?.website) return reply({ error: 'Unable to continue. Please try again.' }, 400);
    const row = normalizeContact(body);
    if (!row) return reply({ error: 'Please review your name and email.' }, 400);
    const result = await supabaseRest(env, 'free_tool_leads?on_conflict=email,tool', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    if (!result.ok || !Array.isArray(result.body) || !result.body[0]?.id) return reply({ error: 'Your details could not be saved. Please try again.' }, 503);
    return reply({ saved: true });
  } catch { return reply({ error: 'Your details could not be saved. Please try again.' }, 503); }
}
export async function onRequestGet() { return reply({ error: 'POST required.' }, 405); }
