// Public Readiness form submission: private storage + transactional result email.
// Never writes PII to growth_events, and never trusts client-provided consent
// or score metadata without validation. No npm/Node dependencies.
import { supabaseRest } from '../../_lib/certification/auth.mjs';
import { renderReadinessHtml, renderReadinessText, READINESS_RESULT_SUBJECT } from '../../_lib/readiness/readiness-profile-email.mjs';

const FIELDS = ['scope', 'assessment', 'service', 'communication', 'business'];
const REPLY_TO = 'support@aimtrichology.com';
const FROM = 'AIMT <no-reply@auth.aimtrichology.com>';

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}

function asText(value, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function validEmail(email) {
  return email.length <= 254 && email.length >= 3 &&
    /^[^\s@<>(),;:]+@[^\s@<>(),;:]+\.[^\s@<>(),;:]+$/.test(email);
}
function bandFor(score) {
  return score >= 85 ? 'Refinement Stage'
    : score >= 70 ? 'Strong Foundation'
    : score >= 50 ? 'Developing System' : 'Foundation Building';
}
export function normalizeSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const email = asText(body.email, 255).toLowerCase();
  const firstName = asText(body.first_name, 81);
  if (!validEmail(email) || firstName.length < 1 || firstName.length > 80) return null;
  const scores = body.pillar_scores;
  if (!scores || typeof scores !== 'object' || Array.isArray(scores) || Object.keys(scores).length !== FIELDS.length) return null;
  if (!FIELDS.every(key => Number.isInteger(scores[key]) && scores[key] >= 0 && scores[key] <= 6)) return null;
  const total = FIELDS.reduce((n,key)=>n+scores[key],0);
  const score = Math.round(total / 30 * 100);
  if (!Number.isInteger(body.score) || body.score !== score) return null;
  const priority = FIELDS.reduce((best,key)=>scores[key] < scores[best] ? key : best, FIELDS[0]);
  const strongest = FIELDS.reduce((best,key)=>scores[key] > scores[best] ? key : best, FIELDS[0]);
  // Consent is an explicit unchecked-by-default form field. False never
  // authorizes future promotional outreach; transactional result delivery is
  // independent of marketing consent.
  const consent = body.marketing_consent === true;
  return {
    email,
    first_name: firstName,
    score,
    band: bandFor(score),
    pillar_scores: Object.fromEntries(FIELDS.map(key => [key, scores[key]])),
    head_spa_stage: asText(body.head_spa_stage, 100) || null,
    strongest_pillar: strongest,
    priority_pillar: priority,
    marketing_consent: consent,
    marketing_consented_at: consent ? new Date().toISOString() : null,
    last_submitted_at: new Date().toISOString(),
  };
}

async function sendResult(env, row) {
  if (!env.RESEND_API_KEY) return { sent: false };
  if (row.result_email_sent_at && Date.now() - Date.parse(row.result_email_sent_at) < 5 * 60 * 1000) return { sent: false, recentlySent: true };
  const copy = { html: renderReadinessHtml(row), text: renderReadinessText(row) };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [row.email], reply_to: REPLY_TO,
        subject: READINESS_RESULT_SUBJECT, ...copy,
      }),
    });
    if (!res.ok) return { sent: false };
    await supabaseRest(env, 'readiness_leads?id=eq.' + encodeURIComponent(row.id), {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ result_email_sent_at: new Date().toISOString() }),
    });
    return { sent: true };
  } catch (_) { return { sent: false }; }
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return response({ error: 'Lead storage unavailable.' }, 503);
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return response({ error: 'Origin not allowed.' }, 403);
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return response({ error: 'Origin not allowed.' }, 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return response({ error: 'JSON required.' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 8192) return response({ error: 'Request too large.' }, 413);
  try {
    const raw = await request.text();
    if (raw.length > 8192) return response({ error: 'Request too large.' }, 413);
    const body = JSON.parse(raw);
    if (body.website || body.company) return response({ saved: true, emailSent: false }); // invisible spam honeypot
    const row = normalizeSubmission(body);
    if (!row) return response({ error: 'Please review the readiness form.' }, 400);
    // A re-send from the Readiness Preview is not a consent update.
    if (body.source === 'my-aimt-readiness-preview') {
      delete row.marketing_consent;
      delete row.marketing_consented_at;
    }
    const result = await supabaseRest(env, 'readiness_leads?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
    if (!result.ok || !Array.isArray(result.body) || !result.body[0]?.id) {
      return response({ error: 'Your profile could not be saved. Please retry.' }, 503);
    }
    const delivery = await sendResult(env, result.body[0]);
    return response({ saved: true, emailSent: delivery.sent, recentlySent: delivery.recentlySent === true });
  } catch (_) {
    return response({ error: 'Your profile could not be saved. Please retry.' }, 503);
  }
}
export async function onRequestGet() { return response({ error: 'POST required.' }, 405); }
