// Ask Cadence — Research Library retrieval layer (SHADOW STAGE ONLY).
//
// STATUS: NOT WIRED. Nothing in the live Ask Cadence path
// (functions/api/cadence/ask.js, functions/_lib/cadence/ask-cadence.mjs)
// imports this module, and nothing it returns reaches a model prompt.
// It is exercised only by tests/cadence-research-context.test.mjs and
// scripts/cadence-research-shadow-eval.mjs, to measure retrieval quality
// before research is ever allowed to influence a student-facing answer.
// tests/cadence-research-context.test.mjs enforces that import boundary.
//
// Pipeline (future Stage 2 contract, built and measured here):
//   student question
//     -> decideResearchRetrieval()   eligible? (checkpoint / Module 12)
//                                    useful?   (deterministic heuristics)
//     -> planResearchQuery()         fixed lexicon -> topics + search terms
//     -> queryResearchClaims()       the ONE shared Research Library query
//                                    (functions/_lib/research/query.mjs)
//     -> selectEvidence()            trust re-check, answer-usefulness
//                                    gate (focus / intent / methods /
//                                    off-question treatment), answer-value
//                                    ranking, dedupe, per-source cap, keep
//                                    mixed evidence, cap 3-6 claims
//     -> structured, bounded context (never free text, never a verdict)
//
// AUTHORITY BOUNDARY: this module decides nothing about checkpoints,
// grading, certification, progression, unlocks or entitlement. It only
// READS course-independent research rows (PostgREST GET) and returns
// plain data. It consumes the caller's already-server-verified checkpoint
// / Module 12 status as input; it never fetches or writes that state.
//
// FAIL-OPEN FOR TUTORING: retrieveCadenceResearchContext() never throws
// and never blocks for longer than its timeout. Any failure yields
// status 'error' | 'timeout' | 'empty' with zero claims, which a future
// caller must treat exactly like "no research" and answer from course
// context as today.
//
// INJECTION RESISTANCE: the student's text is never sent to the database.
// Search terms and topics come only from the fixed lexicon in
// research-lexicon.mjs, and the trust threshold is a module constant, not
// a parameter.

import { queryResearchClaims, STATUS_RANK } from '../research/query.mjs';
import {
  RESEARCH_CONCEPTS, QUESTION_INTENTS, CLAIM_FACETS, INTENT_FACETS, CRUX_INTENTS,
  RE_METHODS_DESIGN, RE_METHODS_OUTCOME, RE_DRUG_TREATMENT, RE_ENUMERATION,
  RE_EXCLUSION_CUE, ALTERNATIVE_JOINERS, RE_TRIAL_ARM,
} from './research-lexicon.mjs';

/* ── Policy constants ─────────────────────────────────────────────── */

/* The Research Library's own threshold for synthesis use (same as the
   /api/research-query default and Publication Editor candidacy). Not
   caller-overridable. */
export const CADENCE_RESEARCH_MIN_STATUS = 'CLAIM_VERIFIED';
const ALLOWED_STATUSES = Object.freeze(
  Object.keys(STATUS_RANK).filter((s) => STATUS_RANK[s] >= STATUS_RANK[CADENCE_RESEARCH_MIN_STATUS])
);

/* use_status values withheld from Cadence. excluded/superseded mirror
   publication-readiness.mjs NON_CANDIDATE_USE_STATUSES ("AIMT's own
   workflow already said don't use this one"). needs_review is ALSO
   withheld here: the Publication Editor routes it to human review rather
   than synthesis, and a student-facing tutor is at least as conservative. */
export const CADENCE_EXCLUDED_USE_STATUSES = Object.freeze(['excluded', 'superseded', 'needs_review']);

/* A human reviewer found the claim unsupported by its source. */
export const CADENCE_EXCLUDED_REVIEW_STATUSES = Object.freeze(['reviewed_unsupported']);

export const RESEARCH_CONTEXT_LIMITS = Object.freeze({
  MAX_CLAIMS: 5,          // default selection size
  HARD_MAX_CLAIMS: 6,     // absolute ceiling regardless of caller option
  CANDIDATE_POOL: 100,    // rows requested from the shared query (= its MAX_LIMIT)
  MAX_PER_SOURCE: 2,      // avoid one paper dominating the set
  MAX_QUERIES: 3,         // parallel per-focus-unit queries (one round trip each)
  MAX_QUESTION_CHARS: 2000,
  TIMEOUT_MS: 2500,
});

export const RESEARCH_EVIDENCE_NOTICE =
  'Research Library evidence (CLAIM_VERIFIED or higher). This is published evidence, not AIMT policy, ' +
  'not clinical consensus, and not a diagnosis. Direction and verification metadata must be preserved; ' +
  'mixed or conflicting findings must be presented as such.';

/* ── Text helpers (deterministic, dependency-free) ────────────────── */

const STOPWORDS = new Set((
  'a an and are as at be been but by can could did do does doing for from had has have how i if in into is it its ' +
  'just me my of on or our should so than that the their them then there these they this to too was we were what ' +
  'when where which who why will with would you your about any some more most very also really much many other ' +
  'get got make made use used using like want know tell say says said aimt cadence please thanks thank'
).split(' '));

export function stem(word) {
  let w = String(word).toLowerCase().replace(/'s$/, '');
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (/(s|x|z|ch|sh)es$/.test(w) && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) w = w.slice(0, -1);
  if (w.endsWith('y') && w.length > 4) w = w.slice(0, -1);
  if (w.endsWith('e') && w.length > 4) w = w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
}

function stemmedTokens(text) {
  return tokenize(text).map(stem);
}

function contentStems(text) {
  return new Set(tokenize(text).filter((t) => !STOPWORDS.has(t) && t.length > 2).map(stem));
}

/** True if `term` (one word or a phrase) occurs in `stemmedText` (a
    space-joined stemmed token string, padded with spaces). */
function termOccurs(term, paddedStemmedText) {
  const needle = ' ' + stemmedTokens(term).join(' ') + ' ';
  return needle.trim().length > 0 && paddedStemmedText.includes(needle);
}

/* ── Vocabulary ───────────────────────────────────────────────────── */
/* Concepts, intents and claim facets live in research-lexicon.mjs (pure
   data). Re-exported so callers/tests have one import surface. */
export { RESEARCH_CONCEPTS } from './research-lexicon.mjs';

/* ── Retrieval decision ───────────────────────────────────────────── */

const ACK_PHRASE = "(thanks?( you)?( so much)?|ty|ok(ay)?|got it|cool|great|awesome|perfect|nice|makes sense|that makes sense|that helps?|that'?s helpful|yes|no|yep|nope|sure|hi|hello|hey|good (morning|afternoon|evening))";
const RE_ACK = new RegExp(`^\\s*(${ACK_PHRASE}[\\s!.,]*)+$`, 'i');
const RE_NAV_ADMIN = /\b(where (do|can|should) i (find|go|click|see)|how do i (find|get to|access|unlock|download|reset|log ?in|sign ?in|start|open)|certificate|log ?in|sign ?in|password|refund|payment|billing|invoice|receipt|next module|unlock\w*|progress bar|my progress|button|won'?t (load|play)|can'?t (see|find|open|load)|my account|enroll\w*|due date|deadline)\b/i;
const RE_RESTATE = /\b((explain|say|put) (that|this|it)( again| differently| another way| more simply| simpler)?|in (simpler|plain|other|easier) (terms|words|language)|rephrase|summari[sz]e (this|the|that) (lesson|module|section|paragraph)|what did (the|this) (lesson|module|section) (say|mean)|i don'?t (get|understand) (this|that|the) (paragraph|section|part|lesson|sentence)|can you simplify|eli5|remind me( what| of| how)?|like the (lesson|module|section) (did|said|explained)|recap)\b|\b(explain|go over|walk me through|repeat|review)\b.*\b(again|more simply|simpler|differently|another way)\b/i;
const RE_COURSE_HOWTO = /^\s*(how (do|should|can|would) (i|we)|what (should|do) (i|we) do|walk me through|show me how)\b/i;
const RE_DEFINITION = /^\s*(what('?s| is| are| does)|define|meaning of|what do you mean by)\b[^?]{0,48}\??\s*$/i;
/* Explicit request for evidence -- goes beyond what the course says, so
   it is never suppressed by module-context coverage. */
const RE_RESEARCH_CUE = /\b(research|stud(y|ies)|evidence|science|scientific(ally)?|proven|clinical(ly)?|trials?|literature|data|efficacy|effective(ness)?|actually work|really work)\b/i;
/* Mechanism / safety / causal depth. Third-person "how does X ..." only:
   "how do I ..." / "how do we ..." is a course how-to, not a research
   question. */
const RE_DEPTH = /\b(safe(ty|ly)?|risks?|harm(ful)?|mechanism|why (does|do|is|are|would|can|might)|how (does|do|can|would|might|much|many|long|often|strong)\b(?! (i|we|you)\b)|caus(e|es|ed|ing)|linked|associated|associations?|contraindicat\w*|interact\w*|compared?|versus|\bvs\.?|difference between|differ from|what happens|contribut\w*|work(s)? better|better than|as effective|helps?\b(?! me| you)|reduc(e|es)|improv(e|es)|regrow\w*|allergen\w*|irritant|sensiti[sz]er|toxic|come(s)? back|recur\w*|lead to|connected|work(s)? for|does .{1,40}\bwork)\b/i;
const RE_HIGH_STAKES = /\b(diagnos\w*|do i have|does (she|he|my client|the client|my guest|they) have|is (this|it) (cancer|serious|contagious|infect\w*)|prescri\w*|dosage|dose|mg\b|stop taking|should (i|she|he|they) (take|stop)|bleed\w*|lump|lesion|open wound|infect\w*|urgent|emergency)\b/i;
const RE_INJECTION = /\b(ignore (all |any |the |your |previous |prior |aimt)|disregard|unverified|discovered claims?|raw (research|data|claims?)|all (the )?research|every claim|system prompt|jailbreak|developer mode|bypass|show me everything)\b/i;

/** Pure: which lexicon concepts the question matches. */
export function matchConcepts(question) {
  const text = String(question || '');
  return RESEARCH_CONCEPTS.filter((c) => c.patterns.some((re) => re.test(text)));
}

/**
 * Pure, deterministic decision: may research augment THIS turn, and would
 * it help? Never fetches anything; checkpoint/Module 12 status must be the
 * caller's already-server-verified values (same ones ask.js computes).
 *
 * @param {string} question
 * @param {object} [ctx]
 * @param {string|number} [ctx.moduleId]
 * @param {string|null} [ctx.activeCheckpointId]         client-declared active checkpoint
 * @param {'passed'|'unresolved'|'unknown'|null} [ctx.verifiedCheckpointStatus]
 *        server-verified status from getVerifiedCheckpointStatus()
 * @param {boolean} [ctx.module12AssessmentActive]      from isModule12AssessmentActive()
 * @param {string} [ctx.moduleContextText]              optional module text already supplied to Cadence
 */
export function decideResearchRetrieval(question, ctx = {}) {
  const q = typeof question === 'string' ? question.trim() : '';
  const concepts = matchConcepts(q);
  const conceptIds = concepts.map((c) => c.id);
  const signals = {
    high_stakes: RE_HIGH_STAKES.test(q),
    injection_suspected: RE_INJECTION.test(q),
    research_cue: RE_RESEARCH_CUE.test(q),
    depth_cue: RE_RESEARCH_CUE.test(q) || RE_DEPTH.test(q),
  };
  const intents = detectIntents(q);
  const out = (eligible, useful, reason) => ({
    eligible, useful, retrieve: eligible && useful, reason, concepts: conceptIds, intents, signals,
  });

  // ── Eligibility (hard policy; evaluated first, never overridden) ──
  if (ctx.module12AssessmentActive === true) return out(false, false, 'module12_active_assessment');
  if (String(ctx.moduleId) === '12' && ctx.module12AssessmentActive !== false) {
    // Unknown Module 12 state: fail closed for augmentation (Ask Cadence
    // itself remains governed by ask.js's own existing block).
    return out(false, false, 'module12_assessment_state_unverified');
  }
  if (ctx.activeCheckpointId && ctx.verifiedCheckpointStatus !== 'passed') {
    // Mirrors ask.js exactly: any client-declared checkpoint that the
    // server did not verify as 'passed' ('unresolved' OR 'unknown')
    // counts as open.
    return out(false, false, 'checkpoint_open');
  }
  if (!q) return out(false, false, 'empty_question');
  if (q.length > RESEARCH_CONTEXT_LIMITS.MAX_QUESTION_CHARS) return out(false, false, 'question_too_long');

  // ── Usefulness (heuristic; conservative toward "no") ──
  if (RE_ACK.test(q)) return out(true, false, 'acknowledgment');
  if (RE_NAV_ADMIN.test(q) && !signals.research_cue) return out(true, false, 'navigation_or_admin');
  if (!concepts.length || concepts.every((c) => c.role === 'outcome')) return out(true, false, 'no_library_concept');
  if (RE_RESTATE.test(q) && !signals.research_cue) return out(true, false, 'course_restatement');
  if (RE_COURSE_HOWTO.test(q) && !signals.research_cue && !signals.high_stakes) return out(true, false, 'course_how_to');
  if (RE_DEFINITION.test(q) && !signals.depth_cue) return out(true, false, 'terminology_clarification');
  if (!signals.research_cue && typeof ctx.moduleContextText === 'string' && ctx.moduleContextText.trim()) {
    const moduleStems = ' ' + stemmedTokens(ctx.moduleContextText).join(' ') + ' ';
    const qStems = [...contentStems(q)];
    const covered = qStems.filter((s) => moduleStems.includes(' ' + s + ' ')).length;
    if (qStems.length && covered / qStems.length >= 0.8) return out(true, false, 'answered_by_module_context');
  }
  if (signals.depth_cue) return out(true, true, 'depth_question_with_library_concept');
  const words = tokenize(q).length;
  if (words >= 8) return out(true, true, 'substantive_question_with_library_concept');
  return out(true, false, 'short_question_without_depth_cue');
}

/* ── Query planning ───────────────────────────────────────────────── */

const CONCEPT_BY_ID = new Map(RESEARCH_CONCEPTS.map((c) => [c.id, c]));

/** Pure: which QUESTION_INTENTS the question expresses. */
export function detectIntents(question) {
  const q = String(question || '');
  return QUESTION_INTENTS.filter(([, re]) => re.test(q)).map(([id]) => id);
}

/**
 * Longest-match anchoring. Every lexicon term of every matched concept is
 * located in the (stemmed) question; longer terms consume their token span
 * first, so "telogen effluvium" anchors the shedding group and does not
 * also anchor hair-cycle's bare "telogen". Groups anchored by the SAME span
 * form one FOCUS UNIT ("rosemary" anchors both the rosemary group and the
 * generic essential-oil group -- that is still one thing the student named).
 */
function anchorFocusUnits(question, concepts) {
  const rawTokens = tokenize(question);
  const qTokens = rawTokens.map(stem);
  const groups = [];
  for (const c of concepts) {
    c.groups.forEach((terms, i) => groups.push({ key: `${c.id}#${i}`, concept: c.id, role: c.role, terms, spans: [] }));
  }
  const candidates = [];
  for (const g of groups) {
    for (const t of g.terms) {
      const tt = stemmedTokens(t);
      if (!tt.length) continue;
      for (let i = 0; i + tt.length <= qTokens.length; i++) {
        let ok = true;
        for (let j = 0; j < tt.length; j++) if (qTokens[i + j] !== tt[j]) { ok = false; break; }
        if (ok) candidates.push({ g, start: i, len: tt.length });
      }
    }
  }
  candidates.sort((a, b) => b.len - a.len || a.start - b.start);
  const owner = new Array(qTokens.length).fill(null); // span id "start:len" owning each token
  for (const cand of candidates) {
    const id = `${cand.start}:${cand.len}`;
    let free = true;
    for (let k = cand.start; k < cand.start + cand.len; k++) if (owner[k] !== null && owner[k] !== id) { free = false; break; }
    if (!free) continue;
    for (let k = cand.start; k < cand.start + cand.len; k++) owner[k] = id;
    if (!cand.g.spans.includes(id)) cand.g.spans.push(id);
  }
  // Union groups that share a span into focus units.
  const anchored = groups.filter((g) => g.spans.length);
  const parent = new Map(anchored.map((g) => [g.key, g.key]));
  const find = (k) => (parent.get(k) === k ? k : find(parent.get(k)));
  const union = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  // Each span is represented by its MOST SPECIFIC group; spans whose most
  // specific group is the same ("shedding" ... "telogen effluvium") are one
  // focus, while "hair cycle" and "telogen" stay two separate foci.
  const bySpan = new Map();
  for (const g of anchored) for (const sp of g.spans) {
    const cur = bySpan.get(sp);
    if (!cur || g.terms.length < cur.terms.length) bySpan.set(sp, g);
  }
  const byGroup = new Map();
  for (const [sp, g] of bySpan) {
    if (byGroup.has(g.key)) union(g.key, byGroup.get(g.key)); else byGroup.set(g.key, g.key);
  }
  // Alternatives joined by "or" ("ketoconazole or antifungal shampoo") are
  // ONE focus: either satisfies it. So are adjacent words of the same
  // concept ("allergic reactions", "scalp psoriasis").
  const spanList = [...bySpan.keys()].map((sp) => { const [st, ln] = sp.split(':').map(Number); return { sp, st, en: st + ln }; })
    .sort((a, b) => a.st - b.st);
  for (let i = 0; i + 1 < spanList.length; i++) {
    const a = spanList[i]; const b = spanList[i + 1];
    const between = rawTokens.slice(a.en, b.st);
    const ga = bySpan.get(a.sp); const gb = bySpan.get(b.sp);
    if ((between.length === 1 && ALTERNATIVE_JOINERS.includes(between[0]))
      || (between.length === 0 && ga.concept === gb.concept)) union(ga.key, gb.key);
  }
  // A unit's evidence terms come from the MOST SPECIFIC group anchored by
  // each of its spans: "rosemary" anchors both the rosemary group and the
  // generic essential-oil group, but a claim only covers that unit if it
  // mentions rosemary -- not any oil.
  const representative = new Set([...bySpan.values()].map((g) => g.key));
  const unitsByRoot = new Map();
  for (const g of anchored) {
    if (!representative.has(g.key)) continue;
    const r = find(g.key);
    if (!unitsByRoot.has(r)) unitsByRoot.set(r, { groups: [], roles: new Set(), concepts: new Set(), spans: new Set() });
    const u = unitsByRoot.get(r);
    u.groups.push(g); u.roles.add(g.role); u.concepts.add(g.concept);
    for (const sp of g.spans) if (bySpan.get(sp) === g) u.spans.add(sp);
  }
  const rawUnits = [...unitsByRoot.values()];
  const unitTerms = rawUnits.map((u) => {
    // Within one unit, drop a generic group when a more specific group of
    // the same unit is a subset of it ("allergic reactions" -> allergy).
    const reps = [...new Set([...u.spans].map((sp) => bySpan.get(sp)))];
    const kept = reps.filter((g) => !reps.some((h) => h !== g && h.terms.length < g.terms.length && h.terms.every((t) => g.terms.includes(t))));
    return new Set(kept.flatMap((g) => g.terms));
  });
  // A generic unit ("hair cycle") must not be satisfiable by another
  // unit's specific term ("telogen") alone.
  unitTerms.forEach((terms, i) => {
    const others = new Set(unitTerms.filter((_, j) => j !== i).flatMap((t) => [...t]));
    const pruned = [...terms].filter((t) => !others.has(t));
    if (pruned.length) unitTerms[i] = new Set(pruned);
  });
  const units = rawUnits.map((u, i) => {
    const terms = unitTerms[i];
    // "besides dandruff": the student is looking PAST this focus.
    const firstStart = Math.min(...[...u.spans].map((sp) => Number(sp.split(':')[0])));
    const excluded = RE_EXCLUSION_CUE.test(rawTokens.slice(0, firstStart).join(' '));
    return {
      id: `u${i}`,
      excluded,
      topics: [...new Set([...u.concepts].flatMap((cid) => CONCEPT_BY_ID.get(cid).topics))],
      role: u.roles.has('population') ? 'population' : u.roles.has('treatment') ? 'treatment' : u.roles.has('subject') ? 'subject' : 'outcome',
      concepts: [...u.concepts],
      terms: [...terms],
      anchored: true,
      soft: u.groups.every((g) => CONCEPT_BY_ID.get(g.concept).soft === true),
      conflicts: u.groups.map((g) => CONCEPT_BY_ID.get(g.concept).conflicts).find(Boolean) || null,
      confirms: u.groups.map((g) => CONCEPT_BY_ID.get(g.concept).confirms).find(Boolean) || null,
    };
  });
  return { groups, units };
}

/**
 * Pure: turns a question into a governed query plan. `q` is
 * websearch_to_tsquery syntax built ONLY from lexicon terms, never from
 * student text. It searches the ANCHORED focus terms (what the student
 * named), falling back to every matched concept's terms when nothing was
 * named literally; outcome-only vocabulary ("hair", "density") is never
 * searched on its own because it would flood the candidate pool.
 */
export function planResearchQuery(question) {
  const concepts = matchConcepts(question);
  const intents = detectIntents(question);
  const { groups, units: anchoredUnits } = anchorFocusUnits(question, concepts);
  // Concepts matched by phrasing but with no literal term anchored
  // ("hair on my pillow" -> shedding) become implicit units.
  // Only when the student named NO subject/treatment term literally.
  const namedSubject = anchoredUnits.some((u) => (u.role === 'subject' || u.role === 'treatment') && !u.excluded);
  const implicitUnits = namedSubject ? [] : concepts
    .filter((c) => c.role === 'subject' || c.role === 'treatment')
    .map((c, i) => ({ id: `i${i}`, role: c.role, concepts: [c.id], topics: c.topics, terms: c.terms, anchored: false, excluded: false }));
  const units = [...anchoredUnits, ...implicitUnits];
  // One query per focus unit (subject/treatment first; outcome/population
  // only if nothing else), run in parallel. A single OR-query over every
  // term truncates at the pool limit and loses claims that pair a rare term
  // with a common one. Population/outcome vocabulary ("women", "growth")
  // is never searched when a subject exists: it would flood the pool.
  const searchable = (u) => !u.excluded && (u.role === 'subject' || u.role === 'treatment');
  let searchUnits = units.filter(searchable);
  if (!searchUnits.length) searchUnits = units.filter((u) => !u.excluded);
  searchUnits = searchUnits
    .slice()
    .sort((a, b) => (a.role === 'treatment' ? 0 : 1) - (b.role === 'treatment' ? 0 : 1) || a.terms.length - b.terms.length)
    .slice(0, RESEARCH_CONTEXT_LIMITS.MAX_QUERIES);
  const ftsTerms = (terms) => terms.filter((t) => t.length > 2 || /^[A-Z]{2,}$/.test(t));
  const toQ = (terms) => ftsTerms(terms).map((t) => (/[\s-]/.test(t) ? `"${t}"` : t)).join(' or ');
  const queries = searchUnits
    .map((u) => ({ unit: u.id, q: toQ(u.terms), topics: u.topics && u.topics.length ? u.topics : [...new Set(concepts.flatMap((c) => c.topics))] }))
    .filter((qq) => qq.q && qq.topics.length);
  const searchTerms = [...new Set(searchUnits.flatMap((u) => ftsTerms(u.terms)))];
  return {
    concepts: concepts.map((c) => c.id),
    intents,
    topics: [...new Set(queries.flatMap((qq) => qq.topics))],
    terms: searchTerms,
    anchors: anchoredUnits.flatMap((u) => u.terms),
    units,
    groups: groups.map((g) => ({ concept: g.concept, terms: g.terms, anchored: g.spans.length > 0 })),
    queries,
    q: queries.map((qq) => qq.q).join(' || '),
  };
}

/* ── Evidence selection ───────────────────────────────────────────── */

const DIRECTION_GROUP = {
  supports_effect: 'positive', association: 'positive',
  no_effect: 'null_or_negative',
  precaution: 'caution', safety: 'caution',
  unclear: 'uncertain', limitation: 'uncertain', qualifies: 'uncertain',
  descriptive: 'descriptive', recommendation: 'descriptive',
};
const EVIDENCE_WEIGHT = {
  meta_analysis: 1, systematic_review: 1, clinical_guideline: 1, rct: 0.75, observational: 0.25,
  professional_org: 0.5, technical_report: 0.25, narrative_review: 0, textbook_chapter: 0, other: 0,
};

function isGovernedClaim(c) {
  return !!c && typeof c === 'object'
    && typeof c.claim_id === 'string' && c.claim_id
    && typeof c.claim_text === 'string' && c.claim_text.trim()
    && ALLOWED_STATUSES.includes(c.verification_status)
    && !CADENCE_EXCLUDED_USE_STATUSES.includes(c.use_status)
    && !CADENCE_EXCLUDED_REVIEW_STATUSES.includes(c.verification_review_status)
    && !!c.source && typeof c.source === 'object' && typeof c.source.source_id === 'string';
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/* Multi-word lexicon terms, used to stop a shorter term from matching
   inside a longer one that belongs to a different focus ("telogen" inside
   "telogen effluvium", "blood" inside "blood flow"). */
const MULTIWORD_TERMS = [...new Set(RESEARCH_CONCEPTS.flatMap((c) => c.terms))]
  .map((t) => ({ t, st: stemmedTokens(t) })).filter((x) => x.st.length > 1);

function unitCovered(unit, claimTokens) {
  const own = new Set(unit.terms);
  for (const term of unit.terms) {
    const tt = stemmedTokens(term);
    if (!tt.length) continue;
    for (let i = 0; i + tt.length <= claimTokens.length; i++) {
      let ok = true;
      for (let j = 0; j < tt.length; j++) if (claimTokens[i + j] !== tt[j]) { ok = false; break; }
      if (!ok) continue;
      const masked = MULTIWORD_TERMS.some(({ t, st }) => {
        if (own.has(t) || st.length <= tt.length) return false;
        for (let k = 0; k + tt.length <= st.length; k++) {
          const s0 = i - k;
          if (s0 < 0 || s0 + st.length > claimTokens.length) continue;
          let m = true;
          for (let j = 0; j < st.length; j++) if (claimTokens[s0 + j] !== st[j]) { m = false; break; }
          if (m) return true;
        }
        return false;
      });
      if (!masked) return true;
    }
  }
  return false;
}

const TREATMENT_TERMS = [...new Set(RESEARCH_CONCEPTS.filter((c) => c.role === 'treatment').flatMap((c) => c.terms))];

/** Pure: what kinds of statement a claim makes. */
export function claimFacets(claim) {
  const text = String(claim.claim_text || '');
  const out = new Set();
  for (const [id, re, meta = {}] of CLAIM_FACETS) {
    if (re.test(text) || (meta.directions || []).includes(claim.direction) || (meta.claimTypes || []).includes(claim.claim_type)) out.add(id);
  }
  return out;
}

function isMethodsOnly(text) {
  return RE_METHODS_DESIGN.test(text) && !RE_METHODS_OUTCOME.test(text.replace(RE_METHODS_DESIGN, ' '));
}

function projectClaim(c, scoreInfo) {
  const s = c.source || {};
  return {
    claim_id: c.claim_id,
    claim_text: c.claim_text,
    claim_type: c.claim_type ?? null,
    topics: Array.isArray(c.topics) ? c.topics.slice() : [],
    direction: c.direction ?? null,
    direction_group: DIRECTION_GROUP[c.direction] || 'unspecified',
    verification_status: c.verification_status,
    verification_review_status: c.verification_review_status ?? null,
    use_status: c.use_status ?? null,
    claim_origin: c.claim_origin ?? null,
    page_or_section_locator: c.page_or_section_locator ?? null,
    source: {
      source_id: s.source_id,
      title: s.title ?? null,
      authors: Array.isArray(s.authors) ? s.authors.slice() : null,
      year: s.year ?? null,
      doi: s.doi ?? null,
      url: s.url ?? null,
      source_venue: s.source_venue ?? null,
      evidence_type: s.evidence_type ?? null,
      source_role: s.source_role ?? null,
    },
    relevance: scoreInfo,
  };
}

/**
 * Pure: trust re-check, then the ANSWER-USEFULNESS GATE, then ranking,
 * dedupe, per-source cap, bound, and mixed-evidence preservation.
 *
 * Gate (all must hold; failing claims are dropped, and if none survive the
 * result is empty -- no research is preferred over topical noise):
 *   1. focus coverage   every anchored population unit (e.g. "women",
 *                       "pregnancy"), plus min(2, units) of the other
 *                       focus units; for comparisons, every compared
 *                       subject/treatment unit
 *   2. not methods-only a claim that only describes study design/scope
 *   3. intent match     when the question has an intent (why / does it
 *                       work / is it safe / how often ...), the claim must
 *                       make a matching kind of statement
 *   4. on-question      specific drug-treatment claims are dropped unless
 *                       the student asked about treatment or named one
 *
 * @returns {{claims: object[], dropped: object, candidate_count: number, relevant_count: number, evidence_profile: object}}
 */
export function selectEvidence(rows, plan, question, { maxClaims = RESEARCH_CONTEXT_LIMITS.MAX_CLAIMS } = {}) {
  const cap = Math.max(1, Math.min(RESEARCH_CONTEXT_LIMITS.HARD_MAX_CLAIMS, Math.floor(maxClaims) || RESEARCH_CONTEXT_LIMITS.MAX_CLAIMS));
  const dropped = {
    malformed_or_ungoverned: 0, focus_incomplete: 0, methods_only: 0, intent_mismatch: 0,
    off_question_treatment: 0, duplicate: 0, per_source_cap: 0,
  };
  const safePlan = plan && typeof plan === 'object' ? plan : {};
  const qStems = contentStems(question);
  const intents = Array.isArray(safePlan.intents) ? safePlan.intents : [];
  let units = Array.isArray(safePlan.units) ? safePlan.units : [];
  if (!units.length && Array.isArray(safePlan.terms) && safePlan.terms.length) {
    units = [{ id: 'terms', role: 'subject', terms: safePlan.terms, anchored: false }];
  }
  const active = units.filter((u) => !u.excluded);
  const populationUnits = active.filter((u) => u.role === 'population');
  const subjectUnits = active.filter((u) => u.role === 'subject' || u.role === 'treatment');
  const outcomeUnits = active.filter((u) => u.role === 'outcome');
  const isComparison = intents.includes('comparison') && subjectUnits.length >= 2;
  const allowedFacets = new Set(intents.flatMap((i) => INTENT_FACETS[i] || []));
  const cruxFacets = intents.filter((i) => CRUX_INTENTS.includes(i)).flatMap((i) => INTENT_FACETS[i] || []);
  const askedTreatment = intents.includes('treatment') || intents.includes('efficacy') || intents.includes('reversibility')
    || subjectUnits.some((u) => u.role === 'treatment');
  // Focus requirement:
  //   comparison of 2+ subjects   -> every compared subject
  //   2+ subjects                 -> any 2 of them
  //   exactly 1 subject           -> it, plus one outcome/context unit if the
  //                                  question named one ("... in a head spa")
  //   no subject                  -> up to 2 outcome/context units
  //   hard population units       -> always required
  const focusOk = (hitIds) => {
    const sHits = subjectUnits.filter((u) => hitIds.has(u.id)).length;
    const oHits = outcomeUnits.filter((u) => hitIds.has(u.id)).length;
    if (isComparison) return sHits === subjectUnits.length;
    if (subjectUnits.length >= 2) return sHits >= 2;
    if (subjectUnits.length === 1) return sHits === 1 && (outcomeUnits.length === 0 || oHits >= 1);
    return outcomeUnits.length > 0 && oHits >= Math.min(2, outcomeUnits.length);
  };

  const gated = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isGovernedClaim(row)) { dropped.malformed_or_ungoverned++; continue; }
    const text = row.claim_text;
    const claimTokens = stemmedTokens(text);
    const hitUnits = active.filter((u) => unitCovered(u, claimTokens));
    const hitIds = new Set(hitUnits.map((u) => u.id));
    // 1. focus coverage
    const popOk = populationUnits.every((u) => hitIds.has(u.id)
      || (u.soft && !(u.conflicts && u.conflicts.test(text) && !(u.confirms && u.confirms.test(text)))));
    if (!active.length || !popOk || !focusOk(hitIds)) { dropped.focus_incomplete++; continue; }
    // 2. methods-only
    if (isMethodsOnly(text)) { dropped.methods_only++; continue; }
    // 3. intent match (crux intents are mandatory)
    const facets = claimFacets(row);
    const matchedFacets = [...facets].filter((f) => allowedFacets.has(f));
    if (allowedFacets.size && !matchedFacets.length) { dropped.intent_mismatch++; continue; }
    if (cruxFacets.length && !cruxFacets.some((f) => facets.has(f))) { dropped.intent_mismatch++; continue; }
    // 4. off-question treatment: a claim about a drug, or about an
    //    intervention the student did not name, answers a different
    //    question unless the student asked about treatment/efficacy.
    const namedTreatmentHit = hitUnits.some((u) => u.role === 'treatment');
    const drugTreatment = RE_DRUG_TREATMENT.test(text) || RE_TRIAL_ARM.test(text)
      || TREATMENT_TERMS.some((t) => termOccurs(t, ' ' + claimTokens.join(' ') + ' '));
    if (drugTreatment && !askedTreatment && !namedTreatmentHit) { dropped.off_question_treatment++; continue; }
    gated.push({ row, text, hitUnits, facets, drugTreatment, namedTreatmentHit, claimStems: contentStems(text) });
  }

  // IDF over the gated pool: question words that are rare among the
  // surviving claims carry the answer ("phase", "last", "catagen").
  const df = new Map();
  for (const g of gated) for (const st of g.claimStems) if (qStems.has(st)) df.set(st, (df.get(st) || 0) + 1);
  const idf = (st) => Math.log(1 + gated.length / (df.get(st) || gated.length || 1));
  const idfTotal = [...qStems].filter((st) => df.has(st)).reduce((n, st) => n + idf(st), 0) || 1;

  const scored = [];
  for (const g of gated) {
    const { row, text, hitUnits, facets, drugTreatment, namedTreatmentHit, claimStems } = g;
    let overlap = 0;
    let idfHit = 0;
    for (const st of qStems) if (claimStems.has(st)) { overlap++; idfHit += idf(st); }
    const intentsSatisfied = intents.filter((i) => (INTENT_FACETS[i] || []).some((f) => facets.has(f))).length;
    const specific = /\d/.test(text) ? 0.75 : 0;
    const stats = /\b(CI|p ?[<=]|OR|SMD|RR|MD|n ?=)\b/.test(text) ? 0.5 : 0;
    const enumeration = (text.match(/,/g) || []).length >= 4 && RE_ENUMERATION.test(text) ? -2 : 0;
    let evidence = EVIDENCE_WEIGHT[row.source.evidence_type] ?? 0;
    if (intents.includes('safety') && ['regulator_safety', 'regulatory_standard'].includes(row.source.source_role)) evidence += 0.75;
    if (intents.includes('practice') && ['guideline', 'practice_guidance', 'regulatory_standard'].includes(row.source.source_role)) evidence += 0.75;
    if (row.source.source_role === 'preclinical') evidence -= 0.5;
    const offTreatmentPenalty = drugTreatment && !namedTreatmentHit && !intents.includes('treatment') ? -1.5 : 0;
    const populationBonus = hitUnits.some((u) => u.soft) ? 3 : 0;
    const skepticalBonus = intents.includes('skeptical') && facets.has('null') ? 3 : 0;
    const score = 4 * hitUnits.filter((u) => !u.soft).length + populationBonus + 2.5 * Math.min(intentsSatisfied, 2)
      + 4 * (idfHit / idfTotal) + specific + stats + evidence + enumeration + offTreatmentPenalty + skepticalBonus
      + (row.direction ? 0.25 : 0) + (row.verification_status === 'AIMT_APPROVED' ? 0.25 : 0);
    const padded = ' ' + stemmedTokens(text).join(' ') + ' ';
    scored.push({
      row, claimStems, score: Math.round(score * 100) / 100,
      matchedTerms: [...new Set(hitUnits.flatMap((u) => u.terms.filter((t) => termOccurs(t, padded))))],
      facets: [...facets], overlap,
    });
  }
  scored.sort((a, b) => (b.score - a.score) || (a.row.claim_id < b.row.claim_id ? -1 : a.row.claim_id > b.row.claim_id ? 1 : 0));
  // Soft population ("in women"): when at least two claims are explicitly
  // about that population, prefer them over population-agnostic claims.
  const softUnits = populationUnits.filter((u) => u.soft && u.confirms);
  if (softUnits.length) {
    const confirming = scored.filter((c) => softUnits.every((u) => u.confirms.test(c.row.claim_text)));
    if (confirming.length >= 2) {
      dropped.population_nonspecific = scored.length - confirming.length;
      scored.splice(0, scored.length, ...confirming);
    }
  }

  // Dedupe (exact + near-duplicate) and per-source cap, in rank order.
  const kept = [];
  const perSource = new Map();
  const relevant = [];
  for (const cand of scored) {
    if (relevant.some((k) => jaccard(k.claimStems, cand.claimStems) >= 0.6)) { dropped.duplicate++; continue; }
    relevant.push(cand);
  }
  for (const cand of relevant) {
    if (kept.length >= cap) break;
    const sid = cand.row.source.source_id;
    if ((perSource.get(sid) || 0) >= RESEARCH_CONTEXT_LIMITS.MAX_PER_SOURCE) { dropped.per_source_cap++; continue; }
    perSource.set(sid, (perSource.get(sid) || 0) + 1);
    kept.push(cand);
  }

  // Preserve disagreement: if gated, on-question evidence points in a
  // direction the selection doesn't represent (positive vs null/negative
  // vs uncertain), swap the lowest-ranked claim of an over-represented
  // direction for the best such claim rather than presenting one side.
  const groupOf = (c) => DIRECTION_GROUP[c.row.direction]
    || (c.facets.includes('null') ? 'uncertain' : 'unspecified');
  const CONTESTED = ['positive', 'null_or_negative', 'uncertain'];
  const selectedGroups = new Set(kept.map(groupOf));
  if (kept.length >= 2 && [...selectedGroups].some((g) => CONTESTED.includes(g))) {
    for (const g of CONTESTED) {
      if (selectedGroups.has(g)) continue;
      const alt = relevant.find((c) => groupOf(c) === g && !kept.includes(c) && c.score >= 0.6 * kept[0].score
        && (perSource.get(c.row.source.source_id) || 0) < RESEARCH_CONTEXT_LIMITS.MAX_PER_SOURCE);
      if (!alt) continue;
      for (let i = kept.length - 1; i >= 0; i--) {
        const grp = groupOf(kept[i]);
        if (kept.filter((k) => groupOf(k) === grp).length > 1) {
          const out = kept[i];
          perSource.set(out.row.source.source_id, perSource.get(out.row.source.source_id) - 1);
          perSource.set(alt.row.source.source_id, (perSource.get(alt.row.source.source_id) || 0) + 1);
          kept.splice(i, 1, alt);
          selectedGroups.add(g);
          break;
        }
      }
    }
  }

  const claims = kept.map((c) => projectClaim(c.row, { score: c.score, matched_terms: c.matchedTerms, facets: c.facets, question_overlap: c.overlap }));
  for (let i = 0; i < claims.length; i++) {
    if (claims[i].direction_group === 'unspecified' && kept[i].facets.includes('null')) claims[i].direction_group = 'uncertain';
  }
  const directionCounts = {};
  for (const c of claims) directionCounts[c.direction_group] = (directionCounts[c.direction_group] || 0) + 1;
  const relevantGroups = new Set(relevant.map(groupOf));
  const evidence_profile = {
    direction_counts: directionCounts,
    mixed_in_selection: CONTESTED.filter((g) => directionCounts[g]).length >= 2,
    mixed_in_relevant_pool: CONTESTED.filter((g) => relevantGroups.has(g)).length >= 2,
    has_caution: !!directionCounts.caution || claims.some((c) => c.claim_type === 'safety_conclusion'),
    distinct_sources: new Set(claims.map((c) => c.source.source_id)).size,
  };
  return { claims, dropped, candidate_count: Array.isArray(rows) ? rows.length : 0, relevant_count: relevant.length, evidence_profile };
}

/* ── Orchestration (fail-open) ────────────────────────────────────── */

function withTimeout(promise, ms, controller) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try { controller && controller.abort(); } catch { /* ignore */ }
      reject(Object.assign(new Error('research_timeout'), { code: 'timeout' }));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Retrieves bounded, governed research context for one Ask Cadence turn.
 * NEVER throws. SHADOW STAGE: returned data must not be passed to any
 * model prompt until Stage 2 is explicitly approved.
 *
 * @param {object} args
 * @param {string} args.question
 * @param {object} args.env                      SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * @param {object} [args.decisionContext]        see decideResearchRetrieval ctx
 * @param {boolean} [args.force]                 eval only: retrieve even if not "useful"
 *                                               (eligibility is NEVER bypassed)
 * @param {number} [args.maxClaims]
 * @param {number} [args.timeoutMs]
 * @param {typeof fetch} [args.fetchImpl]
 * @param {Function} [args.queryImpl]            test seam, defaults to queryResearchClaims
 */
export async function retrieveCadenceResearchContext({
  question, env, decisionContext = {}, force = false, maxClaims, timeoutMs, fetchImpl, queryImpl,
} = {}) {
  const started = Date.now();
  const base = (status, extra = {}) => ({
    status,
    notice: RESEARCH_EVIDENCE_NOTICE,
    min_status: CADENCE_RESEARCH_MIN_STATUS,
    claims: [],
    ...extra,
    elapsed_ms: Date.now() - started,
  });

  let decision;
  try {
    decision = decideResearchRetrieval(question, decisionContext);
  } catch {
    return base('error', { error_code: 'decision_failed' });
  }
  if (!decision.eligible) return base('skipped', { decision });
  if (!decision.retrieve && !force) return base('skipped', { decision });

  const plan = planResearchQuery(question);
  if (!plan.terms.length || !plan.topics.length || !(plan.queries || []).length) return base('empty', { decision, plan, gate: 'no_search_terms' });
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return base('error', { decision, plan, error_code: 'research_unconfigured' });
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let result;
  try {
    const doQuery = queryImpl || queryResearchClaims;
    const queries = (Array.isArray(plan.queries) && plan.queries.length ? plan.queries : [{ q: plan.q, topics: plan.topics }])
      .slice(0, RESEARCH_CONTEXT_LIMITS.MAX_QUERIES);
    const results = await withTimeout(
      Promise.all(queries.map((qq) => Promise.resolve().then(() => doQuery(env, {
        q: qq.q,
        topics: qq.topics,
        minStatus: CADENCE_RESEARCH_MIN_STATUS,
        limit: RESEARCH_CONTEXT_LIMITS.CANDIDATE_POOL,
      }, { fetchImpl, signal: controller ? controller.signal : undefined })))),
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : RESEARCH_CONTEXT_LIMITS.TIMEOUT_MS,
      controller,
    );
    // All-or-nothing: a partial pool could silently drop one side of a
    // relationship or disagreement, so any failed query fails the turn open.
    const bad = results.find((r) => !r || typeof r !== 'object' || r.ok !== true || !Array.isArray(r.claims));
    if (bad) {
      result = bad;
    } else {
      const seen = new Set();
      const merged = [];
      for (const r of results) for (const c of r.claims) {
        const id = c && typeof c === 'object' ? c.claim_id : undefined;
        if (typeof id === 'string' && seen.has(id)) continue;
        if (typeof id === 'string') seen.add(id);
        merged.push(c);
      }
      result = { ok: true, claims: merged };
    }
  } catch (e) {
    return base(e && e.code === 'timeout' ? 'timeout' : 'error', { decision, plan, error_code: e && e.code === 'timeout' ? 'timeout' : 'query_threw' });
  }

  if (!result || typeof result !== 'object' || result.ok !== true || !Array.isArray(result.claims)) {
    const code = result && result.ok === false ? String(result.error || 'query_failed') : 'malformed_response';
    return base('error', { decision, plan, error_code: code });
  }

  let selection;
  try {
    selection = selectEvidence(result.claims, plan, question, { maxClaims });
  } catch {
    return base('error', { decision, plan, error_code: 'selection_failed' });
  }
  return base(selection.claims.length ? 'ok' : 'empty', {
    decision,
    plan,
    gate: selection.claims.length ? null
      : (selection.candidate_count ? 'no_answer_useful_evidence' : 'no_matching_claims'),
    claims: selection.claims,
    evidence_profile: selection.evidence_profile,
    diagnostics: { candidate_count: selection.candidate_count, relevant_count: selection.relevant_count, dropped: selection.dropped },
  });
}
