import Stripe from 'stripe';

export async function onRequestGet() {
  return new Response('GET route working');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${new URL(request.url).origin}/success.html`,
    cancel_url: `${new URL(request.url).origin}/headspa-mastery.html?checkout=canceled`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
