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
//     -> selectEvidence()            trust re-check, relevance floor,
//                                    dedupe, per-source cap, keep mixed
//                                    evidence, cap 3-6 claims
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
// Search terms and topics come only from the fixed lexicon below, and the
// trust threshold is a module constant, not a parameter.

import { queryResearchClaims, STATUS_RANK } from '../research/query.mjs';

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

/* ── Concept lexicon ──────────────────────────────────────────────── */
/* Each concept maps student phrasing (patterns) to the Research Library's
   CONTROLLED_TOPICS (functions/_lib/research/schema.mjs) and a small set
   of search terms, organized as synonym GROUPS. Terms are what the
   database is searched for; the student's own words never are.

   A group is an "anchor" for a question when the student literally used
   one of its terms (after stemming). Anchored groups carry most of the
   relevance weight, so "rosemary vs minoxidil" ranks rosemary/minoxidil
   claims above generic essential-oil claims the same concept also finds. */
const concept = (id, patterns, topics, groups) => Object.freeze({
  id, patterns, topics, groups, terms: groups.flat(),
});

export const RESEARCH_CONCEPTS = Object.freeze([
  concept('scalp-dysesthesia',
    [/trichodyni/i, /dysesth/i, /paresthesi/i, /\bscalp (pain|burn\w*|tingl\w*|sore\w*|hurts?|ache\w*)/i, /\b(burning|tingling|painful|sore|tender) scalp/i, /\bhair (hurts?|roots? hurts?|pain)/i, /\broots? (hurt|ache)/i],
    ['scalp-health', 'adjacent-dermatology', 'trichology', 'telogen-effluvium'],
    [['trichodynia', 'dysesthesia', 'paresthesia', 'scalp pain'], ['burning', 'tingling']]),
  concept('scalp-itch', [/\bitch\w*/i, /prurit/i],
    ['scalp-health', 'dandruff', 'seborrheic-dermatitis', 'scalp-microbiome', 'psoriasis-scalp', 'adjacent-dermatology'],
    [['itch', 'itching', 'pruritus']]),
  concept('contact-sensitivity',
    [/contact (dermatitis|allerg\w*|sensitiv\w*)/i, /\ballerg\w*/i, /\birritat\w*/i, /sensiti[sz]\w*/i, /patch test/i, /\breaction to\b/i, /\b(rash|hives|redness)\b/i],
    ['cosmetic-ingredients', 'practitioner-safety', 'contraindications', 'surfactants', 'conditioning-agents', 'essential-oils-botanicals', 'adjacent-dermatology'],
    [['allergic', 'allergy', 'contact dermatitis'], ['irritant', 'irritation'], ['sensitizer', 'sensitization', 'HRIPT']]),
  concept('shedding',
    [/\bshed\w*/i, /telogen effluvium/i, /\beffluvium\b/i, /hair (is )?(falling|fall(s)?) out/i, /losing (a lot of |so much )?hair/i, /hair in the (drain|shower|brush)/i],
    ['telogen-effluvium', 'hair-cycle'],
    [['shedding', 'effluvium'], ['telogen']]),
  concept('hair-cycle',
    [/hair (growth )?cycle/i, /\banagen\b/i, /\bcatagen\b/i, /\btelogen\b/i, /growth phase/i, /how (fast|long|quickly) (does )?hair grow/i],
    ['hair-cycle', 'hair-biology'],
    [['anagen'], ['catagen'], ['telogen'], ['hair cycle', 'cycling']]),
  concept('follicle-biology', [/\bfollic(le|ular)\b/i, /dermal papilla/i, /stem cells?/i, /\bbulge\b/i],
    ['hair-biology', 'hair-cycle'],
    [['follicle'], ['papilla'], ['stem cell'], ['bulge']]),
  concept('dandruff-seb-derm', [/dandruff/i, /\bflak\w*/i, /seborrh/i, /malassezia/i, /\byeast\b/i],
    ['dandruff', 'seborrheic-dermatitis', 'scalp-microbiome'],
    [['dandruff', 'flaking'], ['seborrheic'], ['malassezia']]),
  concept('scalp-microbiome', [/microbiom/i, /\bbacteri\w*/i, /\bmicrob\w*/i, /\bflora\b/i, /cutibacterium/i],
    ['scalp-microbiome'],
    [['microbiome', 'microbial', 'bacterial'], ['malassezia'], ['cutibacterium'], ['staphylococcus']]),
  concept('psoriasis', [/psoria/i], ['psoriasis-scalp'], [['psoriasis']]),
  concept('folliculitis', [/folliculitis/i, /\bpustul\w*/i, /\bbumps? on (my |the |their )?scalp/i],
    ['folliculitis', 'infection-control'], [['folliculitis'], ['pustule']]),
  concept('androgenetic-alopecia',
    [/androgen\w*/i, /pattern (hair loss|baldness)/i, /\bdht\b/i, /finasteride/i, /receding/i, /thinning (at|on) the (crown|top)/i],
    ['androgenetic-alopecia'],
    [['androgenetic', 'androgen', 'pattern hair loss', 'AGA', 'FPHL'], ['DHT'], ['finasteride']]),
  concept('alopecia-areata', [/alopecia areata/i, /\bpatchy (hair )?loss/i, /bald (spot|patch)\w*/i],
    ['alopecia-areata'], [['areata']]),
  concept('minoxidil', [/minoxidil/i, /rogaine/i], ['actives-minoxidil'], [['minoxidil']]),
  concept('antifungals', [/ketoconazole/i, /antifungal/i, /pyrithione/i, /selenium sulfide/i, /ciclopirox/i],
    ['dandruff', 'seborrheic-dermatitis', 'androgenetic-alopecia', 'actives-other'],
    [['ketoconazole'], ['antifungal'], ['pyrithione'], ['selenium sulfide'], ['ciclopirox']]),
  concept('massage-circulation', [/massag\w*/i, /circulation/i, /blood flow/i, /scalp stimulat\w*/i],
    ['massage-circulation', 'treatment-modalities'],
    [['massage'], ['circulation', 'blood flow', 'perfusion']]),
  concept('essential-oils', [/essential oils?/i, /rosemary/i, /tea tree/i, /peppermint/i, /lavender/i, /botanical/i],
    ['essential-oils-botanicals', 'cosmetic-ingredients', 'actives-other'],
    [['rosemary'], ['tea tree'], ['peppermint'], ['lavender'], ['essential oil', 'botanical']]),
  concept('surfactants', [/sulfate/i, /\bsl[e]?s\b/i, /surfactant/i, /\bclarifying\b/i, /\bcleanser/i],
    ['surfactants', 'cosmetic-ingredients'],
    [['sulfate', 'laureth', 'lauryl'], ['surfactant', 'glucoside']]),
  concept('conditioning-agents', [/silicone/i, /dimethicone/i, /conditioning agent/i, /\bconditioners?\b/i],
    ['conditioning-agents'],
    [['dimethicone', 'silicone', 'siloxane'], ['conditioning', 'cationic', 'polyquaternium']]),
  concept('infection-control',
    [/disinfect\w*/i, /sanitiz\w*/i, /sterili[sz]\w*/i, /\bhygiene\b/i, /cross.?contaminat\w*/i, /clean(ing)? (my |the )?(tools|combs|brushes|equipment)/i],
    ['infection-control', 'practitioner-safety'],
    [['disinfect', 'disinfection', 'disinfectant', 'sterilization'], ['hygiene'], ['contaminated']]),
  concept('contraindications',
    [/pregnan\w*/i, /contraindicat\w*/i, /breastfeed\w*/i, /blood thinner/i, /chemotherapy|\bchemo\b/i, /open (wound|sore)/i, /recent surgery/i],
    ['contraindications', 'practitioner-safety'],
    [['pregnancy', 'pregnant', 'lactation', 'breastfeeding'], ['contraindicated', 'contraindication']]),
  concept('procedures-devices', [/\bprp\b/i, /platelet/i, /microneedl\w*/i, /\blasers?\b/i, /\blllt\b/i, /\b(red|led) light/i, /photobiomodulation/i],
    ['treatment-modalities'],
    [['PRP', 'platelet'], ['microneedling'], ['laser', 'LLLT', 'photobiomodulation']]),
  concept('nutrition-stress', [/\bstress\w*/i, /\biron\b/i, /ferritin/i, /vitamin/i, /biotin/i, /nutrition\w*/i, /supplement\w*/i],
    ['telogen-effluvium', 'hair-biology', 'actives-other'],
    [['stress'], ['iron', 'ferritin'], ['vitamin'], ['biotin'], ['nutritional', 'supplement']]),
  concept('sebum', [/\bsebum\b/i, /sebaceous/i, /oily scalp/i, /greasy/i, /oil production/i],
    ['scalp-health', 'seborrheic-dermatitis'], [['sebum', 'sebaceous']]),
  concept('tinea', [/\btinea\b/i, /ringworm/i, /fungal infection/i],
    ['infection-control', 'adjacent-dermatology'], [['tinea', 'dermatophyte']]),
  concept('traction', [/\btraction\b/i, /tight (braids|ponytails?|hairstyles?)/i, /extensions/i],
    ['trichology', 'adjacent-dermatology'], [['traction']]),
  concept('scalp-barrier', [/skin barrier|scalp barrier/i, /\btewl\b/i, /transepidermal/i],
    ['scalp-health'], [['barrier'], ['TEWL', 'transepidermal']]),
]);

/* ── Retrieval decision ───────────────────────────────────────────── */

const ACK_PHRASE = "(thanks?( you)?( so much)?|ty|ok(ay)?|got it|cool|great|awesome|perfect|nice|makes sense|that makes sense|that helps?|that'?s helpful|yes|no|yep|nope|sure|hi|hello|hey|good (morning|afternoon|evening))";
const RE_ACK = new RegExp(`^\\s*(${ACK_PHRASE}[\\s!.,]*)+$`, 'i');
const RE_NAV_ADMIN = /\b(where (do|can|should) i (find|go|click|see)|how do i (find|get to|access|unlock|download|reset|log ?in|sign ?in|start|open)|certificate|log ?in|sign ?in|password|refund|payment|billing|invoice|receipt|next module|unlock\w*|progress bar|my progress|button|won'?t (load|play)|can'?t (see|find|open|load)|my account|enroll\w*|due date|deadline)\b/i;
const RE_RESTATE = /\b((explain|say|put) (that|this|it)( again| differently| another way| more simply| simpler)?|in (simpler|plain|other|easier) (terms|words|language)|rephrase|summari[sz]e (this|the|that) (lesson|module|section|paragraph)|what did (the|this) (lesson|module|section) (say|mean)|i don'?t (get|understand) (this|that|the) (paragraph|section|part|lesson|sentence)|can you simplify|eli5)\b|\b(explain|go over|walk me through|repeat|review)\b.*\b(again|more simply|simpler|differently|another way)\b/i;
const RE_COURSE_HOWTO = /^\s*(how (do|should|can|would) (i|we)|what (should|do) (i|we) do|walk me through|show me how)\b/i;
const RE_DEFINITION = /^\s*(what('?s| is| are| does)|define|meaning of|what do you mean by)\b[^?]{0,48}\??\s*$/i;
/* Explicit request for evidence -- goes beyond what the course says, so
   it is never suppressed by module-context coverage. */
const RE_RESEARCH_CUE = /\b(research|stud(y|ies)|evidence|science|scientific(ally)?|proven|clinical(ly)?|trials?|literature|data|efficacy|effective(ness)?|actually work|really work)\b/i;
/* Mechanism / safety / causal depth. Third-person "how does X ..." only:
   "how do I ..." / "how do we ..." is a course how-to, not a research
   question. */
const RE_DEPTH = /\b(safe(ty|ly)?|risks?|harm(ful)?|mechanism|why (does|do|is|are|would|can)|how (does|do|can|would|might|much|many|long)\b(?! (i|we|you)\b)|caus(e|es|ed|ing)|linked|associated|associations?|contraindicat\w*|interact\w*|compared?|versus|\bvs\.?|difference between|what happens|contribut\w*)\b/i;
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
  const out = (eligible, useful, reason) => ({
    eligible, useful, retrieve: eligible && useful, reason, concepts: conceptIds, signals,
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
  if (!concepts.length) return out(true, false, 'no_library_concept');
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

/**
 * Pure: turns a question into topics + lexicon search terms. The returned
 * `q` is websearch_to_tsquery syntax built ONLY from lexicon terms
 * ("a or b or \"two words\""), never from student text.
 */
export function planResearchQuery(question) {
  const concepts = matchConcepts(question);
  const paddedQuestion = ' ' + stemmedTokens(question).join(' ') + ' ';
  const topics = [...new Set(concepts.flatMap((c) => c.topics))];
  const terms = [...new Set(concepts.flatMap((c) => c.terms))];
  const groups = concepts.flatMap((c) => c.groups.map((g) => ({
    concept: c.id,
    terms: g,
    anchored: g.some((t) => termOccurs(t, paddedQuestion)),
  })));
  const q = terms.map((t) => (t.includes(' ') ? `"${t}"` : t)).join(' or ');
  return {
    concepts: concepts.map((c) => c.id),
    topics,
    terms,
    anchors: groups.filter((g) => g.anchored).flatMap((g) => g.terms),
    groups,
    q,
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
const SYNTHESIS_EVIDENCE = new Set(['systematic_review', 'meta_analysis', 'clinical_guideline']);

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
 * Pure: filters, ranks, dedupes and bounds raw query rows.
 * @returns {{claims: object[], dropped: object, candidate_count: number, relevant_count: number, evidence_profile: object}}
 */
export function selectEvidence(rows, plan, question, { maxClaims = RESEARCH_CONTEXT_LIMITS.MAX_CLAIMS } = {}) {
  const cap = Math.max(1, Math.min(RESEARCH_CONTEXT_LIMITS.HARD_MAX_CLAIMS, Math.floor(maxClaims) || RESEARCH_CONTEXT_LIMITS.MAX_CLAIMS));
  const dropped = { malformed_or_ungoverned: 0, below_relevance_floor: 0, duplicate: 0, per_source_cap: 0 };
  const qStems = contentStems(question);
  const planTopics = new Set(plan.topics || []);
  const groups = Array.isArray(plan.groups) && plan.groups.length
    ? plan.groups
    : (plan.terms || []).map((t) => ({ concept: 'terms', terms: [t], anchored: false }));
  const planHasAnchors = groups.some((g) => g.anchored);

  const scored = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isGovernedClaim(row)) { dropped.malformed_or_ungoverned++; continue; }
    const padded = ' ' + stemmedTokens(row.claim_text).join(' ') + ' ';
    const hitGroups = groups.filter((g) => g.terms.some((t) => termOccurs(t, padded)));
    const matchedTerms = [...new Set(hitGroups.flatMap((g) => g.terms.filter((t) => termOccurs(t, padded))))];
    const anchorHits = hitGroups.filter((g) => g.anchored).length;
    const otherHits = hitGroups.length - anchorHits;
    const conceptsHit = new Set(hitGroups.map((g) => g.concept)).size;
    // Relevance floor, judged on the claim text itself (the DB match may
    // have come from body_markdown only, which Cadence would never see or
    // be able to cite precisely):
    //   - it hits a group the student actually named (anchor), or
    //   - it bridges two of the question's concepts, or
    //   - the student named no lexicon term at all and it hits any group.
    const passes = anchorHits >= 1 || conceptsHit >= 2 || (!planHasAnchors && hitGroups.length >= 1);
    if (!passes) { dropped.below_relevance_floor++; continue; }
    const claimStems = contentStems(row.claim_text);
    let overlap = 0;
    for (const s of qStems) if (claimStems.has(s)) overlap++;
    const topicOverlap = (row.topics || []).filter((t) => planTopics.has(t)).length;
    let score = 4 * anchorHits + 1.5 * otherHits + 2 * Math.max(0, conceptsHit - 1) + overlap + 0.5 * Math.min(topicOverlap, 3);
    if (['finding', 'safety_conclusion', 'recommendation'].includes(row.claim_type)) score += 0.5;
    if (row.claim_type === 'method_note' || row.claim_type === 'method') score -= 1;
    if (SYNTHESIS_EVIDENCE.has(row.source.evidence_type)) score += 0.5;
    if (row.verification_status === 'AIMT_APPROVED') score += 0.5;
    scored.push({ row, claimStems, score: Math.round(score * 100) / 100, matchedTerms, overlap });
  }
  scored.sort((a, b) => (b.score - a.score) || (a.row.claim_id < b.row.claim_id ? -1 : a.row.claim_id > b.row.claim_id ? 1 : 0));

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

  // Preserve disagreement: if relevant evidence points in a direction the
  // selection doesn't represent (positive vs null/negative vs uncertain),
  // swap the lowest-ranked selected claim for the best such claim rather
  // than silently presenting one side.
  const groupOf = (c) => DIRECTION_GROUP[c.row.direction] || 'unspecified';
  const CONTESTED = ['positive', 'null_or_negative', 'uncertain'];
  const selectedGroups = new Set(kept.map(groupOf));
  if (kept.length >= 2 && [...selectedGroups].some((g) => CONTESTED.includes(g))) {
    for (const g of CONTESTED) {
      if (selectedGroups.has(g)) continue;
      // Only genuinely on-topic disagreement: at least 60% of the top
      // claim's relevance, so a tangential null finding isn't promoted
      // just to manufacture "balance".
      const alt = relevant.find((c) => groupOf(c) === g && !kept.includes(c) && c.score >= 0.6 * kept[0].score);
      if (!alt) continue;
      // replace the lowest-ranked claim whose group is over-represented
      for (let i = kept.length - 1; i >= 0; i--) {
        const grp = groupOf(kept[i]);
        if (kept.filter((k) => groupOf(k) === grp).length > 1) {
          kept.splice(i, 1, alt);
          selectedGroups.add(g);
          break;
        }
      }
    }
  }

  const claims = kept.map((c) => projectClaim(c.row, { score: c.score, matched_terms: c.matchedTerms, question_overlap: c.overlap }));
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
  if (!plan.terms.length || !plan.topics.length) return base('empty', { decision, plan });
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return base('error', { decision, plan, error_code: 'research_unconfigured' });
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let result;
  try {
    const doQuery = queryImpl || queryResearchClaims;
    result = await withTimeout(
      Promise.resolve().then(() => doQuery(env, {
        q: plan.q,
        topics: plan.topics,
        minStatus: CADENCE_RESEARCH_MIN_STATUS,
        limit: RESEARCH_CONTEXT_LIMITS.CANDIDATE_POOL,
      }, { fetchImpl, signal: controller ? controller.signal : undefined })),
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : RESEARCH_CONTEXT_LIMITS.TIMEOUT_MS,
      controller,
    );
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
    claims: selection.claims,
    evidence_profile: selection.evidence_profile,
    diagnostics: { candidate_count: selection.candidate_count, relevant_count: selection.relevant_count, dropped: selection.dropped },
  });
}
