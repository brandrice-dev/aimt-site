const SUPABASE_URL_FALLBACK = 'https://epcnkncyxqgscrejinwr.supabase.co';
const ENTITLEMENTS_TABLE = 'course_entitlements';
const COURSE_SLUG = 'headspa-mastery';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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
    const providedEmail = normalizeEmail(body.email);
    const userId = String(body.userId || '').trim() || null;
    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    const supabaseUrl = env.SUPABASE_URL || SUPABASE_URL_FALLBACK;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!sessionId) return json({ error: 'Missing checkout session.' }, 400);
    if (!stripeSecretKey) return json({ error: 'Stripe is not configured.' }, 500);
    if (!serviceRoleKey) return json({ error: 'Supabase service role is not configured.' }, 500);

    const session = await fetchCheckoutSession(sessionId, stripeSecretKey);
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) {
      return json({ error: 'Checkout session is not completed.' }, 400);
    }

    const sessionEmail = normalizeEmail(
      session.customer_details?.email ||
      session.customer_email ||
      session.customer_email_address
    );
    const purchaserEmail = providedEmail || sessionEmail;

    if (!purchaserEmail) {
      return json({ error: 'No purchaser email found for this checkout session.' }, 400);
    }

    if (providedEmail && sessionEmail && providedEmail !== sessionEmail) {
      return json({ error: 'Use the same email address tied to your enrollment.' }, 400);
    }

    await upsertEntitlement({
      supabaseUrl,
      serviceRoleKey,
      checkoutSessionId: session.id,
      purchaserEmail,
      userId
    });

    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || 'Unable to claim course access.' }, 500);
  }
}
