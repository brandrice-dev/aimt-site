/* ═══════════════════════════════════════════════════════════════
   Default-deny for the public deployment surface.

   Cloudflare Pages publishes this repository's root directly (no build
   step), so every tracked file — CLAUDE.md, docs/, tests/, scripts/,
   supabase/migrations/, .github/, cadence-worker/, … — would otherwise be
   downloadable from aimtrichology.com.

   _routes.json sends every request to Functions EXCEPT an explicit
   allowlist of public paths (site pages, /assets/*, /education/*, …),
   which stay ordinary static requests — so _redirects, _headers, clean
   URLs, and free static serving are unchanged for them. Anything not on
   that allowlist reaches Functions; the specific /api/* and /.well-known/*
   functions still win (more specific routes take precedence), and every
   remaining request lands here: a real 404 with the site's 404 page.

   Adding a new public root page? Add "/<page>", "/<page>.html" and
   "/<page>/" to the exclude list in _routes.json — until then it 404s
   (fail closed). tests/public-deployment-surface.test.mjs enforces this.
   ═══════════════════════════════════════════════════════════════ */

const FALLBACK_404 = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Page not found — AIMT</title></head><body><h1>Page not found</h1><p><a href="/">Return to AIMT</a></p></body></html>';

export async function onRequest({ request, env }) {
  /* Same as the static layer this replaces: non-GET/HEAD → 405 (e.g. a
     POST to a GET-only /api/* function falls through to here). */
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  let body = FALLBACK_404;
  try {
    const page = await env.ASSETS.fetch(new URL('/404', request.url));
    if (page.ok) body = await page.text();
  } catch {
    // Fall back to the minimal page; the status is what matters.
  }
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
