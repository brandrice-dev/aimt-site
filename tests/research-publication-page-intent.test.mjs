// AIMT Publication Editor v2 — deterministic tests for the fail-closed
// page synthesis intent resolver (functions/_lib/research/
// publication-page-intent.mjs#resolvePageSynthesisIntent). PURE, no
// network, no model call. This is the DYNAMIC-INTENT BRIDGE fix: a
// topic with no hand-authored PAGE_SYNTHESIS_INTENT registry entry
// (e.g. an AIMT Education Operations topic) can supply ONE explicit,
// deterministically-validated intent instead -- without ever touching
// or falling back to the registry.
//
// Run: node tests/research-publication-page-intent.test.mjs

import {
  PAGE_SYNTHESIS_INTENT, getPageSynthesisIntent, resolvePageSynthesisIntent, PageSynthesisIntentError,
} from '../functions/_lib/research/publication-page-intent.mjs';

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

function validIntent(overrides = {}) {
  return {
    page_concept: 'Alopecia Areata: A Practitioner Education Overview',
    public_intent: 'Explain alopecia areata clearly and accurately for beauty/scalp-care professionals.',
    in_scope_concepts: ['what alopecia areata is', 'typical presentation'],
    out_of_scope_concepts: ['diagnosis of an individual case', 'treatment or medication protocols'],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// A. LEGACY FALLBACK -- historical behavior completely unchanged.
// ─────────────────────────────────────────────────────────────────────────
(function testNoExplicitIntentResolvesRegistryForHairCycle() {
  const resolved = resolvePageSynthesisIntent('hair-cycle');
  check('LEGACY_FALLBACK', 'resolves the real registry entry', resolved.page_concept === PAGE_SYNTHESIS_INTENT['hair-cycle'].page_concept);
  check('LEGACY_FALLBACK', 'identical to getPageSynthesisIntent() directly', JSON.stringify(resolved) === JSON.stringify(getPageSynthesisIntent('hair-cycle')));
})();

(function testNoExplicitIntentResolvesRegistryForTelogenEffluvium() {
  const resolved = resolvePageSynthesisIntent('telogen-effluvium');
  check('LEGACY_FALLBACK', 'resolves the real registry entry', resolved.page_concept === PAGE_SYNTHESIS_INTENT['telogen-effluvium'].page_concept);
})();

(function testExplicitNullIsTreatedAsAbsent() {
  const resolved = resolvePageSynthesisIntent('hair-cycle', null);
  check('LEGACY_FALLBACK', 'explicit null still resolves the registry', resolved.page_concept === PAGE_SYNTHESIS_INTENT['hair-cycle'].page_concept);
})();

(function testUnregisteredTopicWithNoExplicitIntentStillThrowsTheOriginalError() {
  // The ORIGINAL registry gap error must still fire for a topic that
  // truly has neither a registry entry NOR an explicit override --
  // this resolver never silently invents a fallback.
  let threw = false;
  let message = '';
  try {
    resolvePageSynthesisIntent('alopecia-areata');
  } catch (e) {
    threw = true;
    message = e.message;
  }
  check('LEGACY_FALLBACK', 'throws for an unregistered topic with no explicit intent', threw);
  check('LEGACY_FALLBACK', 'the original registry-gap message is preserved', message.includes('No page synthesis intent registered for "alopecia-areata"'), message);
})();

// ─────────────────────────────────────────────────────────────────────────
// B. NEW TOPIC -- succeeds with a valid explicit intent, no registry entry.
// ─────────────────────────────────────────────────────────────────────────
(function testValidExplicitIntentForUnregisteredTopicSucceeds() {
  const resolved = resolvePageSynthesisIntent('alopecia-areata', validIntent());
  check('NEW_TOPIC', 'resolves without throwing', resolved.page_concept === validIntent().page_concept);
  check('NEW_TOPIC', 'in_scope_concepts preserved', JSON.stringify(resolved.in_scope_concepts) === JSON.stringify(validIntent().in_scope_concepts));
  check('NEW_TOPIC', 'never added to the registry as a side effect', !PAGE_SYNTHESIS_INTENT['alopecia-areata']);
})();

(function testEmptyOutOfScopeArrayIsAllowed() {
  // The spec requires out_of_scope_concepts to be an array of non-empty
  // strings -- not necessarily a NON-EMPTY array (unlike in_scope_concepts).
  let threw = false;
  try {
    resolvePageSynthesisIntent('alopecia-areata', validIntent({ out_of_scope_concepts: [] }));
  } catch (e) {
    threw = true;
  }
  check('NEW_TOPIC', 'an empty out_of_scope_concepts array does not itself fail validation', !threw);
})();

// ─────────────────────────────────────────────────────────────────────────
// C. MALFORMED OVERRIDE -- fails before any model call (this module makes
//    no network call at all, so "before any model call" is structural).
// ─────────────────────────────────────────────────────────────────────────
(function testMissingPageConceptRejected() {
  let threw = false, message = '';
  try { resolvePageSynthesisIntent('alopecia-areata', validIntent({ page_concept: '' })); } catch (e) { threw = true; message = e.message; }
  check('MALFORMED_OVERRIDE', 'rejected', threw);
  check('MALFORMED_OVERRIDE', 'is a PageSynthesisIntentError', threw && message.includes('page_concept'));
})();

(function testMissingPublicIntentRejected() {
  let threw = false;
  try { resolvePageSynthesisIntent('alopecia-areata', validIntent({ public_intent: undefined })); } catch (e) { threw = true; }
  check('MALFORMED_OVERRIDE', 'missing public_intent rejected', threw);
})();

(function testEmptyInScopeConceptsRejected() {
  let threw = false, message = '';
  try { resolvePageSynthesisIntent('alopecia-areata', validIntent({ in_scope_concepts: [] })); } catch (e) { threw = true; message = e.message; }
  check('MALFORMED_OVERRIDE', 'empty in_scope_concepts rejected (must be non-empty)', threw);
  check('MALFORMED_OVERRIDE', 'names in_scope_concepts', message.includes('in_scope_concepts'));
})();

(function testInScopeConceptsWithBlankStringRejected() {
  let threw = false;
  try { resolvePageSynthesisIntent('alopecia-areata', validIntent({ in_scope_concepts: ['real concept', '   '] })); } catch (e) { threw = true; }
  check('MALFORMED_OVERRIDE', 'a blank string inside in_scope_concepts is rejected', threw);
})();

(function testOutOfScopeConceptsNotAnArrayRejected() {
  let threw = false;
  try { resolvePageSynthesisIntent('alopecia-areata', validIntent({ out_of_scope_concepts: 'not an array' })); } catch (e) { threw = true; }
  check('MALFORMED_OVERRIDE', 'out_of_scope_concepts must be an array', threw);
})();

(function testNonObjectExplicitIntentRejected() {
  let threw = false;
  try { resolvePageSynthesisIntent('alopecia-areata', 'not an object'); } catch (e) { threw = true; }
  check('MALFORMED_OVERRIDE', 'a non-object explicit intent is rejected', threw);
})();

(function testMalformedOverrideIsATypedError() {
  let caught = null;
  try { resolvePageSynthesisIntent('alopecia-areata', {}); } catch (e) { caught = e; }
  check('MALFORMED_OVERRIDE', 'throws PageSynthesisIntentError specifically', caught instanceof PageSynthesisIntentError, caught && caught.constructor.name);
})();

(function testMalformedOverrideNeverConsultsOrMutatesRegistry() {
  const before = JSON.stringify(PAGE_SYNTHESIS_INTENT);
  try { resolvePageSynthesisIntent('hair-cycle', { page_concept: '' }); } catch (_e) { /* expected */ }
  const after = JSON.stringify(PAGE_SYNTHESIS_INTENT);
  check('MALFORMED_OVERRIDE', 'a malformed override for a topic that DOES have a registry entry still fails (never silently falls back)', before === after);
})();

// ─────────────────────────────────────────────────────────────────────────
// Normalized defensive copy: the resolver never returns the caller's own
// mutable object, and mutating the caller's copy afterward has no effect.
// ─────────────────────────────────────────────────────────────────────────
(function testReturnsAFrozenDefensiveCopyNotTheOriginal() {
  const original = validIntent();
  const resolved = resolvePageSynthesisIntent('alopecia-areata', original);
  check('DEFENSIVE_COPY', 'not the same object reference', resolved !== original);
  check('DEFENSIVE_COPY', 'the returned object is frozen', Object.isFrozen(resolved));
  check('DEFENSIVE_COPY', 'in_scope_concepts array is frozen too', Object.isFrozen(resolved.in_scope_concepts));

  original.page_concept = 'MUTATED AFTER THE FACT';
  original.in_scope_concepts.push('an injected concept');
  check('DEFENSIVE_COPY', 'mutating the callers original object after the fact does not affect the resolved copy', resolved.page_concept === validIntent().page_concept && resolved.in_scope_concepts.length === validIntent().in_scope_concepts.length);
})();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
