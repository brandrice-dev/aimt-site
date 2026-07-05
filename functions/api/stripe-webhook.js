/* ═══════════════════════════════════════════════════════════════
   Stripe Webhook — server-side entitlement writes
   ---------------------------------------------------------------
   Handles: checkout.session.completed
   Makes purchase → access unconditional: even if the buyer never
   reaches success.html, the entitlement row is written here.

   Cloudflare Pages env vars required:
     STRIPE_SECRET_KEY          (existing)
     STRIPE_WEBHOOK_SECRET      (new — from Stripe dashboard webhook)
     STRIPE_PRICE_ID            (existing — validated against purchase)
     SUPABASE_URL               (existing)
     SUPABASE_SERVICE_ROLE_KEY  (existing)

   Stripe dashboard setup:
     Developers → Webhooks → Add endpoint
     URL: https://YOUR-DOMAIN/api/stripe-webhook
     Event: checkout.session.completed
     Copy the signing secret → STRIPE_WEBHOOK_SECRET
   ═══════════════════════════════════════════════════════════════ */

const ENTITLEMENTS_TABLE = 'course_entitlements';
const AIMT_LOGS_TABLE = 'aimt_logs';
const SIGNATURE_TOLERANCE_SECONDS = 300; // 5 minutes

/* Map Stripe price IDs → course slugs. Add rows as courses launch. */
function courseSlugForPrice(priceId, env) {
  if (priceId && env.STRIPE_PRICE_ID && priceId === env.STRIPE_PRICE_ID) {
    return 'headspa-mastery';
  }
  return null;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function logEvent(env, type, payload) {
  const row = {
    event_type: String(type || 'unknown_event'),
    source: 'api/stripe-webhook',
    email: normalizeEmail(payload && payload.email) || null,
    user_id: null,
    message: payload && payload.message ? String(payload.message) : null
  };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.info('[stripe-webhook]', row);
    return;
  }
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/${AIMT_LOGS_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });
  } catch (e) {
    console.info('[stripe-webhook-log-fail]', row, e && e.message);
  }
}

/* ── Stripe signature verification (Web Crypto, no npm) ── */
async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  const parts = {};
  for (const pair of sigHeader.split(',')) {
    const [k, v] = pair.split('=');
    if (k && v) (parts[k.trim()] = parts[k.trim()] || []).push(v.trim());
  }
  const timestamp = parts.t && parts.t[0];
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC', key, encoder.encode(`${timestamp}.${payload}`)
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  /* constant-time compare */
  return signatures.some((sig) => {
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

/* ── Fetch line items to validate what was actually purchased ── */
async function fetchLineItems(sessionId, stripeSecretKey) {
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=10`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || 'line_items_fetch_failed');
  return Array.isArray(data.data) ? data.data : [];
}

async function upsertEntitlement(env, { checkoutSessionId, courseSlug, purchaserEmail }) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/${ENTITLEMENTS_TABLE}?on_conflict=checkout_session_id`,
    {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        checkout_session_id: checkoutSessionId,
        course_slug: courseSlug,
        purchaser_email: purchaserEmail
        /* user_id stays null here — success.html's claim flow links
           the account. Access-by-email works meanwhile via existing
           RLS (purchaser_email match). */
      })
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || `entitlement_upsert_http_${res.status}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY ||
      !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    await logEvent(env, 'webhook_misconfigured', { message: 'missing_env_vars' });
    return new Response('Misconfigured', { status: 500 });
  }

  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    await logEvent(env, 'webhook_bad_signature', { message: 'signature_verification_failed' });
    return new Response('Bad signature', { status: 400 });
  }

  let event;
  try { event = JSON.parse(payload); } catch (_) {
    return new Response('Bad payload', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = event.data && event.data.object;
  if (!session || !session.id) return new Response('No session', { status: 400 });

  const paid = session.payment_status === 'paid' || session.status === 'complete';
  if (!paid) {
    await logEvent(env, 'webhook_session_unpaid', {
      message: `session_${session.id}_status_${session.payment_status}`
    });
    return new Response(JSON.stringify({ received: true, skipped: 'unpaid' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    /* Validate the purchased price maps to a known course */
    const items = await fetchLineItems(session.id, env.STRIPE_SECRET_KEY);
    let courseSlug = null;
    for (const item of items) {
      const priceId = item?.price?.id;
      const slug = courseSlugForPrice(priceId, env);
      if (slug) { courseSlug = slug; break; }
    }
    if (!courseSlug) {
      await logEvent(env, 'webhook_unknown_price', {
        message: `session_${session.id}_no_matching_course_price`
      });
      /* 200 so Stripe doesn't retry forever; logged for review */
      return new Response(JSON.stringify({ received: true, skipped: 'unknown_price' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const purchaserEmail = normalizeEmail(
      session.customer_details?.email || session.customer_email
    );
    if (!purchaserEmail) {
      await logEvent(env, 'webhook_missing_email', { message: `session_${session.id}` });
      return new Response(JSON.stringify({ received: true, skipped: 'no_email' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await upsertEntitlement(env, {
      checkoutSessionId: session.id,
      courseSlug,
      purchaserEmail
    });

    await logEvent(env, 'webhook_entitlement_written', {
      email: purchaserEmail,
      message: `session_${session.id}_course_${courseSlug}`
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    await logEvent(env, 'webhook_processing_failure', {
      message: error && error.message ? error.message : 'unknown_error'
    });
    /* 500 → Stripe retries with backoff, which is what we want */
    return new Response('Processing error', { status: 500 });
  }
}
