/* Public Meta Pixel ID only; access token stays a Cloudflare server secret.
   Disable branch previews by default to avoid polluting live ad data. */
export function onRequestGet({ request, env }) {
  const host = new URL(request.url).hostname.toLowerCase();
  const permittedHost = host === 'aimtrichology.com' ||
    (env.META_PREVIEW_TRACKING_ENABLED === 'true' && host.endsWith('.aimt-site.pages.dev'));
  const id = String(env.META_PIXEL_ID || '').trim();
  return Response.json(
    { pixelId: permittedHost && /^\d{6,25}$/.test(id) ? id : null },
    { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }
  );
}
