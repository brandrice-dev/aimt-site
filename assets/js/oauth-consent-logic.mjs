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

/**
 * Whether an AIMT admin_users role may approve an OAuth consent request.
 * /api/admin?view=me's resolveAdmin() default role set also permits
 * 'support' (read-only elsewhere in AIMT Admin) -- OAuth approval is a
 * grant of standing API access, not a read, so this page holds it to a
 * stricter bar than the general admin endpoint. Anything other than
 * exactly 'owner' or 'admin' -- including 'support', an unknown string,
 * or a missing/non-string role -- fails closed.
 *
 * @param {unknown} role
 * @returns {boolean}
 */
export function isApprovingRole(role) {
  return role === 'owner' || role === 'admin';
}

/**
 * Classifies a supabase.auth.oauth.getAuthorizationDetails(...) response.
 * Per Supabase's OAuth 2.1 server, a successful call can return either:
 *   A) OAuthAuthorizationDetails -- `authorization_id` present, consent
 *      is still needed -- render the consent UI.
 *   B) OAuthRedirect -- the user already consented; `redirect_url` is
 *      present instead -- navigate there directly, and never call
 *      approveAuthorization() again for it.
 * Anything matching neither shape (missing/wrong-typed fields, null,
 * non-object) classifies as 'invalid' so the caller fails closed into
 * an error state rather than guessing.
 *
 * @param {unknown} data
 * @returns {{kind: 'consent_details', data: object} | {kind: 'already_consented_redirect', redirectUrl: string} | {kind: 'invalid'}}
 */
export function classifyAuthorizationDetailsResponse(data) {
  if (data && typeof data === 'object' && typeof data.authorization_id === 'string' && data.authorization_id) {
    return { kind: 'consent_details', data };
  }
  if (data && typeof data === 'object' && typeof data.redirect_url === 'string' && data.redirect_url) {
    return { kind: 'already_consented_redirect', redirectUrl: data.redirect_url };
  }
  return { kind: 'invalid' };
}
