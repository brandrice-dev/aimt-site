export async function onRequestGet() {
  return new Response('GET route working');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/success.html`,
    cancel_url: `${origin}/headspa-mastery.html?checkout=canceled`,
  });

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const session = await stripeResponse.json();

  if (!stripeResponse.ok || !session.url) {
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
}
