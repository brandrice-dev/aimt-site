/* ═══════════════════════════════════════════════════════════════
   AIMT OAuth consent page — pure decision logic
   ---------------------------------------------------------------
   Used by oauth/consent.html (as a native ES module -- no build step,
   no bundler) AND imported directly by scripts/oauth-consent-logic-
   test.mjs for deterministic, DOM-free testing. Contains no network
   calls, no Supabase client, no DOM access -- only the fail-closed
   gating rules for whether the Approve action may ever be offered.
   ═══════════════════════════════════════════════════════════════ */

/** Reads `authorization_id` from a location.search-style string.
    Returns the trimmed value, or null if absent/blank/unparseable --
    never throws. */
export function getAuthorizationId(search) {
  try {
    const params = new URLSearchParams(search || '');
    const raw = params.get('authorization_id');
    const trimmed = raw ? String(raw).trim() : '';
    return trimmed || null;
  } catch (_) {
    return null;
  }
}

/**
 * The single fail-closed gate this page enforces before Approve is ever
 * shown. `canApprove` is true ONLY when every one of authorizationId,
 * authenticated, and isAdmin holds -- any missing/false input, or an
 * input of the wrong type, resolves to false by construction (there is
 * no default-true branch).
 *
 * @param {{authorizationId: unknown, authenticated: unknown, isAdmin: unknown}} input
 * @returns {{canApprove: boolean, state: string, message: string|null}}
 */
export function evaluateConsentGate({ authorizationId, authenticated, isAdmin } = {}) {
  if (typeof authorizationId !== 'string' || !authorizationId) {
    return {
      canApprove: false,
      state: 'missing_authorization_id',
      message: 'This link is missing a required authorization_id parameter. Ask Grok (or the AIMT Research Harvester connector) to restart the connection from Grok’s side.'
    };
  }
  if (authenticated !== true) {
    return {
      canApprove: false,
      state: 'sign_in_required',
      message: 'Sign in with your AIMT admin account to review this request.'
    };
  }
  if (isAdmin !== true) {
    return {
      canApprove: false,
      state: 'not_admin',
      message: 'This AIMT account is not authorized as an admin. Only an active AIMT owner/admin may approve this connector.'
    };
  }
  return { canApprove: true, state: 'ready', message: null };
}
