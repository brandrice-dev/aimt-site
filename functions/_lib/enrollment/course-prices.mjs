// Exact historical price for this course, retained for paid claims and webhook retries.
// Never accept a price merely because its amount or product metadata matches.
const HISTORICAL_HEADSPA_PRICE_ID = 'price_1Tq2DoKjvZ2g2Oyxwy9RXgF6';

export function isHeadspaCoursePrice(priceId, env) {
  if (typeof priceId !== 'string' || !env.STRIPE_PRICE_ID) return false;
  return priceId === env.STRIPE_PRICE_ID || priceId === HISTORICAL_HEADSPA_PRICE_ID;
}
