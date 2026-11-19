/* AIMT Meta Conversions API. Server-only; never import this into a public page.
   Only sends consented, Stripe-verified paid purchases with course access granted.
   Meta's event_id exactly matches the browser eventID (Stripe Session ID). */

const FBC = /^fb\.1\.\d{10,13}\.[A-Za-z0-9_.-]{1,255}$/;
const FBP = /^fb\.1\.\d{10,13}\.[A-Za-z0-9_.-]{1,255}$/;

export function buildMetaPurchase(session, env, now = Date.now()) {
  const m = session && session.metadata || {};
  const pixel = String(env && env.META_PIXEL_ID || '').trim();
  const amount = Number(session && session.amount_total);
  const currency = String(session && session.currency || '').toUpperCase();
  const agent = String(m.aimt_meta_user_agent || '').slice(0, 500);
  if (!/^\d{6,25}$/.test(pixel) || !env.META_ACCESS_TOKEN) return null;
  if (m.aimt_meta_consent !== '1' || !session || !session.id || !/^cs_(?:live|test)_[A-Za-z0-9_]+$/.test(session.id)) return null;
  if (!(session.payment_status === 'paid' && Number.isInteger(amount) && amount > 0)) return null;
  if (!/^[A-Z]{3}$/.test(currency) || !agent) return null;
  const userData = { client_user_agent: agent };
  if (FBC.test(String(m.aimt_meta_fbc || ''))) userData.fbc = m.aimt_meta_fbc;
  if (FBP.test(String(m.aimt_meta_fbp || ''))) userData.fbp = m.aimt_meta_fbp;
  // A Meta click/browser identifier is required, not an email or student detail.
  if (!userData.fbc && !userData.fbp) return null;

  return {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(now / 1000),
      event_id: session.id,
      action_source: 'website',
      event_source_url: 'https://aimtrichology.com/success',
      user_data: userData,
      custom_data: { currency, value: amount / 100, content_name: 'Head Spa Certification', content_type: 'product' }
    }],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {})
  };
}

export async function sendMetaPurchase(env, session) {
  const event = buildMetaPurchase(session, env);
  if (!event) return { sent: false, reason: 'not_configured_or_not_consented' };
  const url = 'https://graph.facebook.com/v26.0/' + encodeURIComponent(env.META_PIXEL_ID) + '/events';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, access_token: env.META_ACCESS_TOKEN })
  });
  if (!response.ok) throw new Error('meta_http_' + response.status);
  return { sent: true, eventId: session.id };
}
