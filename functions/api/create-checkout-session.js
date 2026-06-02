const SUPABASE_URL_FALLBACK = 'https://epcnkncyxqgscrejinwr.supabase.co';
const AIMT_LOGS_TABLE = 'aimt_logs';

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
        JSON.stringify({ error: session?.error?.message || 'Unable to create checkout session' }),
        {
          status: stripeResponse.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
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
