import { resolveUser } from '../_lib/certification/auth.mjs';

const SUPABASE_URL_FALLBACK = 'https://epcnkncyxqgscrejinwr.supabase.co';
const ENTITLEMENTS_TABLE = 'course_entitlements';
const COURSE_SLUG = 'headspa-mastery';
const AIMT_LOGS_TABLE = 'aimt_logs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function logAimtEvent(type, payload) {
  const source = String((payload && payload.source) || 'api/claim-course-access');
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

/* Validate the session actually purchased THIS course's price.
   Prevents a checkout session for a cheaper future product from
   granting HeadSpa Mastery access. */
async function sessionMatchesCoursePrice(sessionId, stripeSecretKey, expectedPriceId) {
  if (!expectedPriceId) return true; // no price configured — skip check
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=10`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Unable to verify purchased items.');
  }
  const items = Array.isArray(data.data) ? data.data : [];
  return items.some((item) => item?.price?.id === expectedPriceId);
}

async function fetchCheckoutSession(sessionId, stripeSecretKey) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Unable to verify checkout session.');
  }
  return data;
}

async function upsertEntitlement({ supabaseUrl, serviceRoleKey, checkoutSessionId, purchaserEmail, userId }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${ENTITLEMENTS_TABLE}?on_conflict=checkout_session_id`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        checkout_session_id: checkoutSessionId,
        course_slug: COURSE_SLUG,
        purchaser_email: purchaserEmail,
        user_id: userId || null
      })
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || 'Unable to save course access.');
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.sessionId || '').trim();
    /* Client-reported, unverified -- used only to enrich the log line on
       failures that occur before identity is established below. Never
       used to decide whose entitlement gets written. */
    const clientReportedEmail = normalizeEmail(body.email);
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    const supabaseUrl = env.SUPABASE_URL || SUPABASE_URL_FALLBACK;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!sessionId) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: clientReportedEmail,
        message: 'missing_checkout_session'
      });
      return json({ error: 'Missing checkout session.' }, 400);
    }
    if (!stripeSecretKey) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: clientReportedEmail,
        message: 'stripe_not_configured'
      });
      return json({ error: 'Stripe is not configured.' }, 500);
    }
    if (!serviceRoleKey) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: clientReportedEmail,
        message: 'supabase_service_role_not_configured'
      });
      return json({ error: 'Supabase service role is not configured.' }, 500);
    }

    /* The authorized identity is derived only from a verified Supabase
       session token -- never from a client-supplied userId. See
       resolveUser() (functions/_lib/certification/auth.mjs), the same
       bearer-token verification every other entitlement-gated endpoint
       in this codebase already uses. */
    const { user, errorResponse } = await resolveUser(env, request);
    if (errorResponse) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: clientReportedEmail,
        message: 'unauthenticated_claim_rejected'
      });
      return errorResponse;
    }
    const authenticatedUserId = user.id;
    const authenticatedEmail = normalizeEmail(user.email);

    const session = await fetchCheckoutSession(sessionId, stripeSecretKey);
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: authenticatedEmail,
        user_id: authenticatedUserId,
        message: 'checkout_not_completed'
      });
      return json({ error: 'Checkout session is not completed.' }, 400);
    }

    const priceMatches = await sessionMatchesCoursePrice(
      session.id,
      stripeSecretKey,
      env.STRIPE_PRICE_ID
    );
    if (!priceMatches) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: authenticatedEmail,
        user_id: authenticatedUserId,
        message: 'price_mismatch_for_course'
      });
      return json({ error: 'This purchase does not include this course.' }, 400);
    }

    const sessionEmail = normalizeEmail(
      session.customer_details?.email ||
      session.customer_email ||
      session.customer_email_address
    );

    if (!sessionEmail) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: authenticatedEmail,
        user_id: authenticatedUserId,
        message: 'missing_purchaser_email'
      });
      return json({ error: 'No purchaser email found for this checkout session.' }, 400);
    }

    /* Bind the claim to the purchase: this checkout session's
       Stripe-verified email must belong to the authenticated caller.
       Without this, anyone who merely observes someone else's session
       ID (shared-device browser history, a leaked confirmation link)
       could attach that stranger's paid entitlement to their own
       account -- authentication alone doesn't prevent that, since the
       attacker is a real, logged-in user. */
    if (authenticatedEmail !== sessionEmail) {
      await logAimtEvent('api_claim_course_access_failure', {
        supabaseUrl,
        serviceRoleKey,
        email: authenticatedEmail,
        user_id: authenticatedUserId,
        message: 'authenticated_email_purchase_mismatch'
      });
      return json({ error: 'This checkout session does not belong to your account.' }, 403);
    }

    await upsertEntitlement({
      supabaseUrl,
      serviceRoleKey,
      checkoutSessionId: session.id,
      purchaserEmail: sessionEmail,
      userId: authenticatedUserId
    });

    await logAimtEvent('api_claim_course_access_success', {
      supabaseUrl,
      serviceRoleKey,
      email: sessionEmail,
      user_id: authenticatedUserId,
      message: 'entitlement_upserted'
    });
    return json({ ok: true });
  } catch (error) {
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = env.SUPABASE_URL || SUPABASE_URL_FALLBACK;
    await logAimtEvent('api_claim_course_access_failure', {
      supabaseUrl,
      serviceRoleKey,
      message: error && error.message ? error.message : 'claim_exception'
    });
    return json({ error: error.message || 'Unable to claim course access.' }, 500);
  }
}
