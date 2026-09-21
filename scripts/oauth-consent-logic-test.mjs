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

import { getAuthorizationId, evaluateConsentGate } from '../assets/js/oauth-consent-logic.mjs';

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

async function main() {
  testGetAuthorizationId();
  testGateMissingAuthorizationId();
  testGateRequiresAuthentication();
  testGateRequiresAdmin();
  testGateReadyOnlyWhenAllThreeHold();
  testGateMessagesAreHumanReadable();

  console.log(`\n=== ${failures === 0 ? 'ALL PASSED' : `${failures} ASSERTION(S) FAILED`} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
