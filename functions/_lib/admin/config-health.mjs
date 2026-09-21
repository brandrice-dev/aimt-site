// Owner/admin-only runtime configuration visibility for the aimt-site
// Cloudflare Pages Production environment only (see module header on
// functions/api/admin/index.js's config-health view for the auth gate).
//
// This module holds ONE thing: a static manifest of every env var current
// aimt-site Pages Functions code actually reads (audited directly from
// functions/**, not reconstructed from documentation -- see
// docs/admin/AIMT-PRODUCTION-RUNTIME-CONFIG.md for the full multi-target
// writeup this manifest is the machine-checked slice of), plus the pure
// function that turns { manifest, env } into a presence-only report.
//
// Hard rule, enforced by construction: this module never reads or returns
// an env value, a prefix, a suffix, a length, or a hash -- only
// `typeof env[name] === 'string' && env[name].trim().length > 0`. There is
// no code path here that could leak a credential even by accident, because
// no credential value is ever assigned to a variable in this file.
//
// Deliberately excluded from this manifest (and therefore from this
// endpoint): headspa-proxy Worker bindings, the future aimt-research-
// harvester Worker's bindings, and Supabase dashboard-only settings
// (Custom SMTP, Auth Site URL, Redirect URLs, OAuth Server state, OAuth
// clients). None of those are Cloudflare Pages env vars this runtime can
// read, and this endpoint must never imply otherwise -- see the UI-side
// note in admin.html's System Health view.

export const SEVERITY = Object.freeze({ P0: 'P0', P1: 'P1', P2: 'P2' });

export const REQUIREMENT = Object.freeze({
  REQUIRED: 'REQUIRED',
  REQUIRED_FOR_FEATURE: 'REQUIRED_FOR_FEATURE',
  OPTIONAL: 'OPTIONAL',
});

// Order here is the order the UI renders them in, grouped by the
// `feature` groupings admin.html's System Health view uses.
export const CONFIG_MANIFEST = Object.freeze([
  {
    name: 'SUPABASE_URL',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Supabase connectivity',
    description: 'Required by virtually every server-side endpoint for Supabase REST/Auth Admin API calls. Absence fails closed across admin, entitlement, and progress reads/writes.',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Supabase connectivity',
    description: 'Server-side credential for every Supabase REST/Auth Admin call. Absence fails closed on the same surfaces as SUPABASE_URL.',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Cadence chat and checkpoint evaluation',
    description: 'Required by ask-cadence.mjs, checkpoint-evaluation.mjs, scenario-fact-gate.mjs, and cadence-grader.mjs. Each throws a caught, fail-closed error if absent. A separate, differently-bound copy of this same-named variable is also required on the headspa-proxy Worker.',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Stripe checkout and payment verification',
    description: 'Required to create checkout sessions and verify webhook line items. Checkout fails closed (500) without it.',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Stripe checkout and payment verification',
    description: 'Required to verify Stripe webhook signatures. Without it, checkout.session.completed events cannot be trusted and entitlement writing is rejected.',
  },
  {
    name: 'STRIPE_PRICE_ID',
    severity: SEVERITY.P0,
    requirement: REQUIREMENT.REQUIRED,
    feature: 'Stripe checkout and payment verification',
    description: 'Required to create a checkout session and to map a completed session to the correct course. Checkout fails closed without it.',
  },
  {
    name: 'RESEND_API_KEY',
    severity: SEVERITY.P1,
    requirement: REQUIREMENT.REQUIRED_FOR_FEATURE,
    feature: 'Transactional email (manual-grant invite, paid-enrollment welcome)',
    description: 'Missing key degrades safely: the underlying account/entitlement action still completes and a warning is recorded, but no email is sent.',
  },
  {
    name: 'ELEVENLABS_API_KEY',
    severity: SEVERITY.P1,
    requirement: REQUIREMENT.REQUIRED_FOR_FEATURE,
    feature: 'Listen Mode narration',
    description: 'Required by the Cadence text-to-speech path. Throws a caught error if absent, so Listen Mode audio generation fails closed while the rest of the course remains usable.',
  },
  {
    name: 'RESEARCH_INGEST_SECRET',
    severity: SEVERITY.P1,
    requirement: REQUIREMENT.REQUIRED_FOR_FEATURE,
    feature: 'Research library ingestion',
    description: 'Required to authenticate inbound research-library writes. Returns 500 Misconfigured if absent.',
  },
  {
    name: 'RESEARCH_QUERY_SECRET',
    severity: SEVERITY.P1,
    requirement: REQUIREMENT.REQUIRED_FOR_FEATURE,
    feature: 'Research library query',
    description: 'Required to authenticate research-library reads. Returns 500 Misconfigured if absent.',
  },
  {
    name: 'AIMT_OWNER_EMAIL',
    severity: SEVERITY.P2,
    requirement: REQUIREMENT.OPTIONAL,
    feature: 'Owner-account bootstrap',
    description: 'Used only to bootstrap the very first owner row in admin_users. Owner bootstrap is already complete for this project, so current absence has no functional effect -- kept configured only as a safeguard should admin_users ever need re-bootstrapping.',
  },
  {
    name: 'MCP_CONNECTOR_SECRET',
    severity: SEVERITY.P2,
    requirement: REQUIREMENT.OPTIONAL,
    feature: 'MCP connector authentication (static-secret path)',
    description: 'One of two accepted authentication paths for the MCP connector -- Supabase OAuth is the alternate path, so absence alone does not disable the endpoint.',
  },
  {
    name: 'GROK_MCP_OAUTH_CLIENT_ID',
    severity: SEVERITY.P2,
    requirement: REQUIREMENT.OPTIONAL,
    feature: 'MCP OAuth client-binding narrowing',
    description: 'Optional narrowing that restricts accepted OAuth tokens to one registered client. Absence skips that narrowing only -- it does not disable OAuth authentication for the MCP connector.',
  },
  {
    name: 'CADENCE_CHAT_MODEL',
    severity: SEVERITY.P2,
    requirement: REQUIREMENT.OPTIONAL,
    feature: 'Cadence chat model override (controlled testing only)',
    description: 'Read only as an optional override for testing a candidate model. The current model registry already has an approved default for this role, so absence is expected and permanent, not a gap.',
  },
  {
    name: 'CADENCE_GRADING_MODEL',
    severity: SEVERITY.P2,
    requirement: REQUIREMENT.OPTIONAL,
    feature: 'Cadence grading model override (controlled testing only)',
    description: 'Read only as an optional override for testing a candidate model. The current model registry already has an approved default for this role, so absence is expected and permanent, not a gap.',
  },
]);

function isConfigured(env, name) {
  return typeof env[name] === 'string' && env[name].trim().length > 0;
}

/**
 * Presence-only report for the aimt-site Pages Production runtime.
 * Never returns a value, prefix, suffix, length, or hash of any variable
 * -- only its name and a boolean.
 *
 * status rules (P2 entries never affect status, by construction -- only
 * P0/P1 counts are inspected):
 *   critical  - any P0 REQUIRED variable missing
 *   degraded  - all P0 present, at least one P1 REQUIRED_FOR_FEATURE missing
 *   healthy   - all P0 and P1 required variables present
 */
export function computeConfigHealth(env) {
  const checks = CONFIG_MANIFEST.map((entry) => ({
    name: entry.name,
    configured: isConfigured(env, entry.name),
    severity: entry.severity,
    requirement: entry.requirement,
    feature: entry.feature,
    description: entry.description,
  }));

  const p0Missing = checks.filter((c) => c.severity === SEVERITY.P0 && !c.configured).length;
  const p1Missing = checks.filter((c) => c.severity === SEVERITY.P1 && !c.configured).length;

  const status = p0Missing > 0 ? 'critical' : (p1Missing > 0 ? 'degraded' : 'healthy');

  return {
    status,
    p0_missing: p0Missing,
    p1_missing: p1Missing,
    checks,
  };
}
