import { recordGrowthEventInBackground } from '../_lib/growth/record.mjs';

const SUPABASE_URL_FALLBACK = 'https://epcnkncyxqgscrejinwr.supabase.co';
const AIMT_LOGS_TABLE = 'aimt_logs';
const GENERIC_CHECKOUT_ERROR = 'Unable to create checkout session';

/* ── Embedded Checkout (enroll.html) ──
   enroll.html POSTs { ui: 'embedded' } and mounts Stripe Embedded Checkout
   inside AIMT instead of redirecting to checkout.stripe.com. Everything
   downstream is unchanged: same price, same mode, same session id handed to
   success.html (via return_url instead of success_url), same
   checkout.session.completed webhook.

   The API version is pinned on this one request because Stripe renamed the
   ui_mode enum in 2026-03-25.dahlia ('embedded' → 'embedded_page'); pinning
   keeps this independent of the account's default API version. It only
   shapes this request/response — webhook event payloads keep the account's
   own version.

   Requires STRIPE_PUBLISHABLE_KEY (pk_live_… / pk_test_…, same mode as
   STRIPE_SECRET_KEY). Publishable keys are designed to be public; it is
   returned to the browser only so Stripe.js can mount the session. If it is
   missing or mismatched, this falls back to the hosted redirect session so
   enrollment never goes down on a config gap (logged for the owner). */
const EMBEDDED_STRIPE_API_VERSION = '2026-03-25.dahlia';
const EMBEDDED_BRANDING = {
  'branding_settings[background_color]': '#ffffff',
  'branding_settings[button_color]': '#262626',
  'branding_settings[border_style]': 'rounded',
  'branding_settings[font_family]': 'montserrat'
};

function stripeKeyMode(key) {
  const match = /^(?:sk|rk|pk)_(live|test)_/.exec(String(key || ''));
  return match ? match[1] : null;
}

function embeddedPublishableKey(env) {
  const publishableKey = String(env.STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!publishableKey) return { key: null, reason: 'stripe_publishable_key_not_configured' };
  if (!publishableKey.startsWith('pk_')) return { key: null, reason: 'stripe_publishable_key_invalid' };
  if (stripeKeyMode(publishableKey) !== stripeKeyMode(env.STRIPE_SECRET_KEY)) {
    return { key: null, reason: 'stripe_publishable_key_mode_mismatch' };
  }
  return { key: publishableKey, reason: null };
}

async function createStripeSession(stripeSecretKey, params, stripeVersion) {
  const headers = {
    Authorization: `Bearer ${stripeSecretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (stripeVersion) headers['Stripe-Version'] = stripeVersion;
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers,
    body: new URLSearchParams(params),
  });
  const session = await response.json().catch(() => ({}));
  return { response, session };
}

async function createEmbeddedSession(stripeSecretKey, stripePriceId, origin) {
  const params = {
    mode: 'payment',
    ui_mode: 'embedded_page',
    'line_items[0][price]': stripePriceId,
    'line_items[0][quantity]': '1',
    return_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
  };
  let result = await createStripeSession(
    stripeSecretKey, { ...params, ...EMBEDDED_BRANDING }, EMBEDDED_STRIPE_API_VERSION
  );
  /* Branding is presentation only — if Stripe rejects it, retry once
     without it rather than blocking enrollment. */
  const rejectedParam = String(result.session?.error?.param || '');
  if (!result.response.ok && rejectedParam.startsWith('branding_settings')) {
    result = await createStripeSession(stripeSecretKey, params, EMBEDDED_STRIPE_API_VERSION);
  }
  return result;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function logAimtEvent(type, payload) {
  const source = String((payload && payload.source) || 'api/create-checkout-session');
  const row = {
    event_type: String(type || 'unknown_event'),
    source,
    email: normalizeEmail(payload && payload.email) || null,
    user_id: payload && payload.user_id ? String(payload.user_id) : null,
    message: payload && payload.message ? String(payload.message) : null
  };
  const timestamp = new Date().toISOString();
  const supabaseUrl = payload && payload.supabaseUrl;
  const serviceRoleKey = payload && payload.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    console.info('[aimt-log-fallback]', { timestamp, ...row, fallback_error: 'missing_supabase_config' });
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${AIMT_LOGS_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || data?.error || `http_${response.status}`);
    }
  } catch (error) {
    console.info('[aimt-log-fallback]', {
      timestamp,
      ...row,
      fallback_error: error && error.message ? error.message : 'insert_failed'
    });
  }
}

/* AIMT Growth: record `checkout_start` once a Stripe Checkout Session
   really exists (keyed by its id, so a reload that creates a new session is
   a new start, and a retry of the same session is not). The browser's
   optional `growth` object only carries its first-party visitor/session ids
   and attribution snapshot; it is sanitized by recordGrowthEvent and has no
   influence on the Stripe request, the price, or the response. Runs in the
   background and never throws. */
function recordCheckoutStart(context, requestBody, sessionId, ui, stripeSecretKey) {
  const growth = requestBody && typeof requestBody.growth === 'object' && requestBody.growth ? requestBody.growth : {};
  return recordGrowthEventInBackground(context, {
    eventName: 'checkout_start',
    origin: 'server',
    checkoutSessionId: sessionId,
    visitorId: growth.visitor_id,
    sessionId: growth.session_id,
    isInternal: growth.internal === true,
    pagePath: growth.path,
    firstTouch: growth.first_touch,
    lastTouch: growth.last_touch,
    props: { ui, livemode: stripeKeyMode(stripeSecretKey) === 'live' },
  }).catch(() => {});
}

export async function onRequestGet() {
  return new Response('GET route working');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  const supabaseUrl = env.SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const stripePriceId = env.STRIPE_PRICE_ID;

  if (!stripeSecretKey || !stripePriceId) {
    await logAimtEvent('api_create_checkout_session_failure', {
      supabaseUrl,
      serviceRoleKey,
      message: !stripeSecretKey && !stripePriceId
        ? 'stripe_secret_and_price_not_configured'
        : (!stripeSecretKey ? 'stripe_secret_not_configured' : 'stripe_price_not_configured')
    });
    return new Response(
      JSON.stringify({ error: 'Checkout is temporarily unavailable.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const requestBody = await request.clone().json().catch(() => ({}));
  const wantsEmbedded = !!requestBody && requestBody.ui === 'embedded';

  if (wantsEmbedded) {
    const { key: publishableKey, reason } = embeddedPublishableKey(env);
    if (publishableKey) {
      try {
        const { response, session } = await createEmbeddedSession(stripeSecretKey, stripePriceId, origin);
        if (!response.ok || !session.client_secret) {
          await logAimtEvent('api_create_checkout_session_failure', {
            supabaseUrl,
            serviceRoleKey,
            message: `embedded: ${session?.error?.message || `stripe_http_${response.status || 500}`}`
          });
          return new Response(JSON.stringify({ error: GENERIC_CHECKOUT_ERROR }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        await recordCheckoutStart(context, requestBody, session.id, 'embedded', stripeSecretKey);
        /* Only what Stripe.js needs to mount — never the secret key or
           any other server-side value. */
        return new Response(JSON.stringify({ clientSecret: session.client_secret, publishableKey }), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      } catch (error) {
        await logAimtEvent('api_create_checkout_session_failure', {
          supabaseUrl,
          serviceRoleKey,
          message: `embedded: ${error && error.message ? error.message : 'checkout_session_exception'}`
        });
        return new Response(JSON.stringify({ error: GENERIC_CHECKOUT_ERROR }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    /* Config gap → hosted fallback below, flagged for the owner. */
    await logAimtEvent('api_create_checkout_session_embedded_fallback', {
      supabaseUrl,
      serviceRoleKey,
      message: reason
    });
  }

  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': stripePriceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/courses.html?checkout=canceled`,
  });

  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok || !session.url) {
      await logAimtEvent('api_create_checkout_session_failure', {
        supabaseUrl,
        serviceRoleKey,
        message: session?.error?.message || `stripe_http_${stripeResponse.status || 500}`
      });
      return new Response(
        JSON.stringify({ error: GENERIC_CHECKOUT_ERROR }),
        {
          status: stripeResponse.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await recordCheckoutStart(context, requestBody, session.id, 'hosted', stripeSecretKey);
    return new Response(JSON.stringify(wantsEmbedded ? { url: session.url, fallback: 'hosted' } : { url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await logAimtEvent('api_create_checkout_session_failure', {
      supabaseUrl,
      serviceRoleKey,
      message: error && error.message ? error.message : 'checkout_session_exception'
    });
    return new Response(
      JSON.stringify({ error: 'Unable to create checkout session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
