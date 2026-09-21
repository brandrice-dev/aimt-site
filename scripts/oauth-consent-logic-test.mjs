#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   AIMT OAuth consent page — decision-logic test harness
   ---------------------------------------------------------------
   Exercises assets/js/oauth-consent-logic.mjs directly -- the pure,
   DOM-free, network-free gate that oauth/consent.html uses to decide
   whether Approve may ever be shown. No browser, no Supabase call, no
   network of any kind.

   Exit code 0 = all assertions passed, nonzero = failure (with detail).
   ═══════════════════════════════════════════════════════════════ */

import { getAuthorizationId, evaluateConsentGate, isApprovingRole, classifyAuthorizationDetailsResponse } from '../assets/js/oauth-consent-logic.mjs';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error(`FAIL: ${msg}`); }
  else console.log(`ok: ${msg}`);
}

/* ══════════════ getAuthorizationId ══════════════ */
function testGetAuthorizationId() {
  console.log('\n--- getAuthorizationId: parses ?authorization_id= safely ---');
  assert(getAuthorizationId('?authorization_id=abc-123') === 'abc-123', 'reads authorization_id from a leading-? query string');
  assert(getAuthorizationId('authorization_id=abc-123') === 'abc-123', 'reads authorization_id without a leading ?');
  assert(getAuthorizationId('?other=1') === null, 'missing authorization_id -> null');
  assert(getAuthorizationId('') === null, 'empty search string -> null');
  assert(getAuthorizationId(null) === null, 'null search string -> null (never throws)');
  assert(getAuthorizationId(undefined) === null, 'undefined search string -> null (never throws)');
  assert(getAuthorizationId('?authorization_id=   ') === null, 'whitespace-only value -> null (trimmed)');
  assert(getAuthorizationId('?authorization_id=%20abc%20') === 'abc', 'value is trimmed after URL-decoding');
  assert(getAuthorizationId('?authorization_id=abc&other=1') === 'abc', 'extracts authorization_id alongside other params');
}

/* ══════════════ evaluateConsentGate: fail-closed by construction ══════════════ */
function testGateMissingAuthorizationId() {
  console.log('\n--- consent gate: missing authorization_id blocks approval regardless of auth state ---');
  const r1 = evaluateConsentGate({ authorizationId: null, authenticated: true, isAdmin: true });
  assert(r1.canApprove === false, 'null authorization_id -> canApprove false even for an authenticated admin');
  assert(r1.state === 'missing_authorization_id', `state is missing_authorization_id (got ${r1.state})`);

  const r2 = evaluateConsentGate({ authorizationId: '', authenticated: true, isAdmin: true });
  assert(r2.canApprove === false && r2.state === 'missing_authorization_id', 'empty-string authorization_id also blocks approval');

  const r3 = evaluateConsentGate({ authorizationId: 42, authenticated: true, isAdmin: true });
  assert(r3.canApprove === false && r3.state === 'missing_authorization_id', 'non-string authorization_id (wrong type) blocks approval, not just falsy values');

  const r4 = evaluateConsentGate({});
  assert(r4.canApprove === false && r4.state === 'missing_authorization_id', 'calling with no input at all fails closed rather than throwing');
}

function testGateRequiresAuthentication() {
  console.log('\n--- consent gate: requires authentication before admin is even checked ---');
  const r1 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: false, isAdmin: true });
  assert(r1.canApprove === false, 'unauthenticated -> canApprove false even if isAdmin is (incorrectly) true');
  assert(r1.state === 'sign_in_required', `state is sign_in_required (got ${r1.state})`);

  const r2 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: undefined, isAdmin: true });
  assert(r2.canApprove === false && r2.state === 'sign_in_required', 'authenticated must be strictly true -- undefined is treated as not authenticated');

  const r3 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: 'yes', isAdmin: true });
  assert(r3.canApprove === false && r3.state === 'sign_in_required', 'authenticated must be strictly === true, not just truthy -- fails closed on a truthy non-boolean');
}

function testGateRequiresAdmin() {
  console.log('\n--- consent gate: authenticated non-admin is rejected (403-equivalent), never approved ---');
  const r1 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: true, isAdmin: false });
  assert(r1.canApprove === false, 'authenticated non-admin -> canApprove false');
  assert(r1.state === 'not_admin', `state is not_admin (got ${r1.state})`);

  const r2 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: true, isAdmin: undefined });
  assert(r2.canApprove === false && r2.state === 'not_admin', 'isAdmin must be strictly true -- undefined is treated as not-admin');

  const r3 = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: true, isAdmin: 1 });
  assert(r3.canApprove === false && r3.state === 'not_admin', 'isAdmin must be strictly === true, not just truthy');
}

function testGateReadyOnlyWhenAllThreeHold() {
  console.log('\n--- consent gate: canApprove true ONLY when id present + authenticated + admin, all strictly true ---');
  const ready = evaluateConsentGate({ authorizationId: 'auth-1', authenticated: true, isAdmin: true });
  assert(ready.canApprove === true, 'authorization_id present + authenticated + admin -> canApprove true');
  assert(ready.state === 'ready', `state is ready (got ${ready.state})`);
  assert(ready.message === null, 'no blocking message when ready');
}

function testGateMessagesAreHumanReadable() {
  console.log('\n--- consent gate: every blocked state carries a non-empty explanatory message ---');
  const states = [
    evaluateConsentGate({ authorizationId: null, authenticated: false, isAdmin: false }),
    evaluateConsentGate({ authorizationId: 'x', authenticated: false, isAdmin: false }),
    evaluateConsentGate({ authorizationId: 'x', authenticated: true, isAdmin: false })
  ];
  for (const s of states) {
    assert(typeof s.message === 'string' && s.message.length > 0, `blocked state '${s.state}' has a non-empty message`);
  }
}

/* ══════════════ isApprovingRole: owner/admin only, support/unknown fail closed ══════════════
   Regression test for the external-review finding: consent.html's
   checkAdmin() must not treat a 'support' actor.role (permitted by
   /api/admin?view=me's general resolveAdmin() role set) as eligible to
   approve an OAuth connector. */
function testIsApprovingRole() {
  console.log('\n--- isApprovingRole: only owner/admin may approve; support/unknown/missing fail closed ---');
  assert(isApprovingRole('owner') === true, "role 'owner' -> can approve");
  assert(isApprovingRole('admin') === true, "role 'admin' -> can approve");
  assert(isApprovingRole('support') === false, "role 'support' -> CANNOT approve (the regression this fixes)");
  assert(isApprovingRole('some-unknown-role') === false, 'unrecognized role string -> cannot approve');
  assert(isApprovingRole(undefined) === false, 'missing role (undefined) -> cannot approve');
  assert(isApprovingRole(null) === false, 'missing role (null) -> cannot approve');
  assert(isApprovingRole('') === false, 'empty-string role -> cannot approve');
  assert(isApprovingRole('Owner') === false, "role casing must match exactly -- 'Owner' is not 'owner'");
}

/* ══════════════ classifyAuthorizationDetailsResponse: OAuthAuthorizationDetails vs OAuthRedirect ══════════════
   Regression test for the external-review finding: getAuthorizationDetails()
   can return either shape depending on whether the user already consented
   to this exact authorization_id; consent.html must handle both and fail
   closed on neither. */
function testClassifyAuthorizationDetailsResponse() {
  console.log('\n--- classifyAuthorizationDetailsResponse: consent-details vs already-consented redirect vs malformed ---');

  const consentDetails = classifyAuthorizationDetailsResponse({
    authorization_id: 'auth-abc-123',
    client: { name: 'Grok / AIMT Research Harvester' },
    scope: 'research.submit',
    redirect_uri: 'https://grok.example.com/oauth/callback'
  });
  assert(consentDetails.kind === 'consent_details', `response carrying authorization_id -> 'consent_details' (got ${consentDetails.kind})`);
  assert(consentDetails.data.client.name === 'Grok / AIMT Research Harvester', 'consent_details classification preserves the original response data for rendering');

  const alreadyConsented = classifyAuthorizationDetailsResponse({
    redirect_url: 'https://grok.example.com/oauth/callback?code=xyz'
  });
  assert(alreadyConsented.kind === 'already_consented_redirect', `response carrying only redirect_url -> 'already_consented_redirect' (got ${alreadyConsented.kind})`);
  assert(alreadyConsented.redirectUrl === 'https://grok.example.com/oauth/callback?code=xyz', 'already_consented_redirect classification exposes the exact redirect_url to navigate to');

  const malformedCases = [
    null,
    undefined,
    {},
    { authorization_id: '' },
    { authorization_id: 42 },
    { redirect_url: '' },
    { redirect_url: 12345 },
    { some_other_field: 'nothing recognizable' },
    'a plain string, not an object'
  ];
  for (const bad of malformedCases) {
    const result = classifyAuthorizationDetailsResponse(bad);
    assert(result.kind === 'invalid', `malformed response ${JSON.stringify(bad)} -> 'invalid' (fail closed, got ${result.kind})`);
  }

  // Both fields present (shouldn't happen per the two documented response
  // shapes, but if it did): a pending consent request takes precedence --
  // approveAuthorization()/denyAuthorization() are the only calls allowed
  // to mint a fresh redirect_url for an authorization still awaiting consent.
  const bothPresent = classifyAuthorizationDetailsResponse({
    authorization_id: 'auth-xyz',
    redirect_url: 'https://grok.example.com/oauth/callback?code=already'
  });
  assert(bothPresent.kind === 'consent_details', 'if both fields are somehow present, the pending-consent shape takes precedence over the redirect shape');
}

async function main() {
  testGetAuthorizationId();
  testGateMissingAuthorizationId();
  testGateRequiresAuthentication();
  testGateRequiresAdmin();
  testGateReadyOnlyWhenAllThreeHold();
  testGateMessagesAreHumanReadable();
  testIsApprovingRole();
  testClassifyAuthorizationDetailsResponse();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
