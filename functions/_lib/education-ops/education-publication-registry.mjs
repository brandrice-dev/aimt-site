/* ═══════════════════════════════════════════════════════════════
   AIMT Education Operations — authoritative publication registry
   ---------------------------------------------------------------
   PURE, STATIC CONFIGURATION. Zero I/O, zero model calls. This is the
   ONE place that defines AIMT's public Education universe:

     - which public CLUSTERS exist (label, route prefix, hub file), and
     - which PUBLICATION CONCEPTS exist (topic_slug, page-concept title
       seed, controlled research topics, cluster, deterministic route
       slug, mapping type/rationale, autonomous selectability).

   Everything downstream derives from this file -- the topic selector's
   candidate set, cluster-aware cannibalization, route generation, hub
   routing, the generated-diff allowlist's education/ paths, the
   freshness monitor's concept lookup, and the backwards-compatible
   PILOT_TOPIC_CONCEPTS export (publication-readiness-loader.mjs), which
   is now a filtered projection of this registry, never an independent
   list that could drift.

   GOVERNANCE INVARIANTS (enforced by validatePublicationRegistry() at
   module load -- an invalid registry throws, failing closed):
     1. Controlled research vocabulary is NOT redefined here. Every
        controlled_topics value must be a member of CONTROLLED_TOPICS
        (functions/_lib/research/schema.mjs), the single authority.
     2. Every CONTROLLED_TOPICS value is deliberately accounted for by at
        least one registered concept (possibly a non-selectable one) --
        the registry never silently ignores part of the controlled
        universe.
     3. A model never decides membership. No model call, and no research
        packet, can add a cluster, a concept, a route, or a public
        section. The Intent Planner may plan page SCOPE for a concept
        that is already registered here (see
        education-intent-planner-validator.mjs), nothing more.
     4. RESEARCH PACKETS ARE EVIDENCE, NOT PAGE COMMANDS. A packet that
        enters the Research Library contributes claims/sources tagged
        with controlled topics. Those claims become candidate evidence
        for every registered concept whose controlled_topics they match
        (publication-readiness-loader.mjs#selectTopicEvidenceFromRows).
        The packet's own title/topic string is never read here and can
        never become a topic_slug, a page title, or a URL.
     5. Registration is not permission. A registered concept still has
        to pass the existing readiness/risk engine
        (publication-readiness.mjs), cannibalization, research-gap holds,
        Publication Editor, Writer, Reviewer and every publisher gate.
        HIGH-risk concepts are registered so the universe is accounted
        for, and are then excluded by the unchanged risk rules.
     6. Routes are deterministic: `${cluster.route_prefix}/${route_slug}`,
        both values from this file. Existing published routes are
        preserved exactly (hair-cycle -> hair-growth-cycle, etc.).
   ═══════════════════════════════════════════════════════════════ */

import { CONTROLLED_TOPICS } from '../research/schema.mjs';

export class PublicationRegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PublicationRegistryError';
  }
}

/* ── Public clusters ──────────────────────────────────────────────────
   route_prefix is the cluster hub's own public route; hub_file is the
   repo-relative HTML file that serves it (Cloudflare Pages pretty URLs:
   education/scalp-health.html -> /education/scalp-health). Article
   files live under the same-named directory:
   /education/scalp-health/<route_slug> -> education/scalp-health/<route_slug>.html */
export const PUBLICATION_CLUSTERS = Object.freeze({
  'trichology-fundamentals': Object.freeze({
    key: 'trichology-fundamentals',
    label: 'Trichology Fundamentals',
    route_prefix: '/education/trichology',
    hub_file: 'education/trichology.html',
    summary: 'The science of hair and scalp as a discipline: hair fiber and follicle biology, and the foundations every other topic builds on.',
  }),
  'hair-loss-shedding': Object.freeze({
    key: 'hair-loss-shedding',
    label: 'Hair Loss & Shedding',
    route_prefix: '/education/hair-loss',
    hub_file: 'education/hair-loss.html',
    summary: 'The normal hair growth cycle, shedding, and the practitioner-relevant distinctions that come with it.',
  }),
  'scalp-health': Object.freeze({
    key: 'scalp-health',
    label: 'Scalp Health & Conditions',
    route_prefix: '/education/scalp-health',
    hub_file: 'education/scalp-health.html',
    summary: 'The scalp as skin: its barrier, its microbiome, and the common scalp conditions a practitioner should be able to recognize and refer.',
  }),
  'product-science': Object.freeze({
    key: 'product-science',
    label: 'Product Science',
    route_prefix: '/education/product-science',
    hub_file: 'education/product-science.html',
    summary: 'What is in the products practitioners use: surfactants, conditioning agents, botanicals, and other cosmetic ingredients.',
  }),
  'head-spa-techniques': Object.freeze({
    key: 'head-spa-techniques',
    label: 'Head Spa Techniques',
    route_prefix: '/education/head-spa-techniques',
    hub_file: 'education/head-spa-techniques.html',
    summary: 'The evidence behind head spa service techniques, including scalp massage and treatment modalities.',
  }),
  'practitioner-safety': Object.freeze({
    key: 'practitioner-safety',
    label: 'Practitioner Safety & Scope',
    route_prefix: '/education/safety',
    hub_file: 'education/safety.html',
    summary: 'Safe practice, infection control, contraindications, and where a practitioner\'s scope ends.',
  }),
});

/* ── Publication concepts ─────────────────────────────────────────────
   mapping_type:
     'direct'  -- the concept IS one controlled topic (controlled_topics
                  has exactly that one value, equal to topic_slug).
     anything else ('constructed_*') -- built from several controlled
                  topics; mapping_rationale is REQUIRED and must say why
                  exactly those topics and not others (same discipline as
                  the original PILOT_TOPIC_CONCEPTS entries, preserved
                  verbatim below).
   autonomously_selectable: false means "registered so the controlled
   universe is deliberately accounted for, but never offered to the
   autonomous selector" -- an owner decision is required before it can
   become a page. true still means every existing gate applies. */
const HAIR_LOSS_CONCEPTS = [
  {
    topic_slug: 'hair-loss',
    seo_page_concept: 'Hair Loss: A Practitioner Education Overview',
    controlled_topics: ['androgenetic-alopecia', 'telogen-effluvium', 'alopecia-areata'],
    cluster: 'hair-loss-shedding',
    route_slug: 'hair-loss-overview',
    mapping_type: 'constructed_multi_topic_umbrella',
    mapping_rationale: '"hair-loss" is not itself a value in CONTROLLED_TOPICS. Constructed as the union '
      + 'of the three controlled topics that are literally named hair-loss conditions '
      + '(androgenetic-alopecia, telogen-effluvium, alopecia-areata). hair-cycle/hair-biology '
      + '(general physiology, LOWER risk) are deliberately NOT folded in here -- they are their own '
      + 'concept (#6, hair-cycle) below -- so this umbrella is not diluted toward a lower risk tier '
      + "than its condition-specific content actually warrants.",
    autonomously_selectable: true,
  },
  {
    topic_slug: 'shedding-vs-hair-loss',
    seo_page_concept: 'Shedding vs. Hair Loss: A Practitioner Differential Framing',
    controlled_topics: ['telogen-effluvium', 'hair-cycle'],
    cluster: 'hair-loss-shedding',
    route_slug: 'shedding-vs-hair-loss',
    mapping_type: 'constructed_differential_framing',
    mapping_rationale: '"shedding-vs-hair-loss" is not a literal CONTROLLED_TOPICS value. Constructed '
      + 'conservatively from telogen-effluvium (the shedding-pattern condition) plus hair-cycle (the '
      + 'normal-shedding physiological baseline the differential depends on) -- a "shedding vs. hair '
      + 'loss" explainer is inherently a look-alike/differential-framing concept per the originating '
      + "request's own MODERATE-risk examples. androgenetic-alopecia is intentionally NOT included, "
      + 'even though it is the other side of many real differentials in practice, so this concept\'s '
      + 'candidate evidence set stays exactly what a "shedding vs. hair loss" page is built from; a page '
      + 'that also wants to rule in/out androgenetic-alopecia should compose with concept #3 rather than '
      + 'this concept silently absorbing it.',
    autonomously_selectable: true,
  },
  {
    topic_slug: 'androgenetic-alopecia',
    seo_page_concept: 'Androgenetic Alopecia: A Practitioner Education Overview',
    controlled_topics: ['androgenetic-alopecia'],
    cluster: 'hair-loss-shedding',
    route_slug: 'androgenetic-alopecia',
    mapping_type: 'direct',
    autonomously_selectable: true,
  },
  {
    topic_slug: 'telogen-effluvium',
    seo_page_concept: 'Telogen Effluvium: A Practitioner Education Overview',
    controlled_topics: ['telogen-effluvium'],
    cluster: 'hair-loss-shedding',
    route_slug: 'telogen-effluvium', // existing live route -- unchanged
    mapping_type: 'direct',
    autonomously_selectable: true,
  },
  {
    topic_slug: 'alopecia-areata',
    seo_page_concept: 'Alopecia Areata: A Practitioner Education Overview',
    controlled_topics: ['alopecia-areata'],
    cluster: 'hair-loss-shedding',
    route_slug: 'alopecia-areata', // existing live route -- unchanged
    mapping_type: 'direct',
    autonomously_selectable: true,
  },
  {
    topic_slug: 'hair-cycle',
    seo_page_concept: 'The Hair Growth Cycle: A Practitioner Education Overview',
    controlled_topics: ['hair-cycle'],
    // Stays in Hair Loss & Shedding: its live page already exists at
    // /education/hair-loss/hair-growth-cycle and must never move. The
    // Trichology Fundamentals hub links to it statically instead.
    cluster: 'hair-loss-shedding',
    route_slug: 'hair-growth-cycle', // existing live route -- unchanged
    mapping_type: 'direct',
    autonomously_selectable: true,
  },
];

function direct(topic, cluster, seoPageConcept, extra = {}) {
  return {
    topic_slug: topic,
    seo_page_concept: seoPageConcept,
    controlled_topics: [topic],
    cluster,
    route_slug: extra.route_slug || topic,
    mapping_type: 'direct',
    autonomously_selectable: extra.autonomously_selectable !== false,
    ...(extra.selectability_note ? { selectability_note: extra.selectability_note } : {}),
  };
}

const MULTI_CLUSTER_CONCEPTS = [
  // A. Trichology Fundamentals
  direct('trichology', 'trichology-fundamentals', 'Trichology: A Practitioner Education Overview', { route_slug: 'what-is-trichology' }),
  direct('hair-biology', 'trichology-fundamentals', 'Hair Biology: A Practitioner Education Overview'),

  // C. Scalp Health & Conditions
  direct('scalp-health', 'scalp-health', 'Scalp Health: A Practitioner Education Overview', { route_slug: 'scalp-health-overview' }),
  direct('scalp-microbiome', 'scalp-health', 'The Scalp Microbiome: A Practitioner Education Overview'),
  direct('seborrheic-dermatitis', 'scalp-health', 'Seborrheic Dermatitis: A Practitioner Education Overview'),
  direct('dandruff', 'scalp-health', 'Dandruff: A Practitioner Education Overview'),
  direct('psoriasis-scalp', 'scalp-health', 'Scalp Psoriasis: A Practitioner Education Overview', { route_slug: 'scalp-psoriasis' }),
  direct('folliculitis', 'scalp-health', 'Folliculitis: A Practitioner Education Overview'),
  direct('adjacent-dermatology', 'scalp-health', 'Dermatology-Adjacent Scalp Topics: A Practitioner Education Overview', {
    autonomously_selectable: false,
    selectability_note: 'Registered so the controlled universe is fully accounted for. "adjacent-dermatology" '
      + 'is a catch-all research tag, not one coherent public page intent, and it sits closest to '
      + 'diagnosis/treatment scope of anything in the vocabulary (HIGH baseline in publication-readiness.mjs). '
      + 'Its evidence still contributes to any other concept whose controlled_topics it shares; it is '
      + 'never offered to the autonomous selector as a page of its own without an explicit owner decision.',
  }),
  {
    topic_slug: 'scalp-barrier-ph',
    seo_page_concept: 'Scalp Barrier and pH: A Practitioner Education Overview',
    controlled_topics: ['scalp-health', 'cosmetic-ingredients', 'surfactants'],
    cluster: 'scalp-health',
    route_slug: 'scalp-barrier-ph',
    mapping_type: 'constructed_cross_topic_practitioner_concept',
    mapping_rationale: '"scalp-barrier-ph" is not a literal CONTROLLED_TOPICS value. Constructed from exactly '
      + 'the three controlled topics a scalp barrier / acid mantle / surface pH / cleanser chemistry page '
      + 'is built from: scalp-health (barrier and surface physiology of the scalp as skin), '
      + 'cosmetic-ingredients (formulation pH and ingredient behavior on the skin surface), and surfactants '
      + '(cleanser chemistry -- the main way a service alters the barrier). practitioner-safety is '
      + 'deliberately NOT included: it carries a HIGH risk baseline, and because a concept\'s risk is the '
      + 'most severe of its constituents, including it would make this concept permanently ineligible for '
      + 'autonomous publication; claims that carry the practitioner-safety tag still contribute here when '
      + 'they are also tagged with one of the three topics above. scalp-microbiome, seborrheic-dermatitis '
      + 'and dandruff are also deliberately excluded -- they are their own direct concepts, and folding '
      + 'them in would turn a barrier/pH explainer into a scalp-conditions page. Research packets on the '
      + 'scalp barrier (e.g. AIMT-RF-2026-10-03-BARRIER) contribute evidence here only through these tags; '
      + 'the packet itself never requests or names this page.',
    autonomously_selectable: true,
  },

  // D. Product Science
  direct('cosmetic-ingredients', 'product-science', 'Cosmetic Ingredients: A Practitioner Education Overview'),
  direct('surfactants', 'product-science', 'Surfactants and Cleansers: A Practitioner Education Overview'),
  direct('conditioning-agents', 'product-science', 'Conditioning Agents: A Practitioner Education Overview'),
  direct('essential-oils-botanicals', 'product-science', 'Essential Oils and Botanicals: A Practitioner Education Overview'),
  direct('actives-other', 'product-science', 'Scalp Care Actives: A Practitioner Education Overview', { route_slug: 'scalp-care-actives' }),
  direct('actives-minoxidil', 'product-science', 'Minoxidil: A Practitioner Education Overview', { route_slug: 'minoxidil' }),

  // E. Head Spa Techniques
  direct('treatment-modalities', 'head-spa-techniques', 'Head Spa Treatment Modalities: A Practitioner Education Overview'),
  direct('massage-circulation', 'head-spa-techniques', 'Scalp Massage and Circulation: A Practitioner Education Overview'),

  // F. Practitioner Safety & Scope
  direct('practitioner-safety', 'practitioner-safety', 'Practitioner Safety: A Practitioner Education Overview'),
  direct('infection-control', 'practitioner-safety', 'Infection Control for Scalp Services: A Practitioner Education Overview'),
  direct('contraindications', 'practitioner-safety', 'Contraindications for Scalp Services: A Practitioner Education Overview'),
];

function freezeConcept(c) {
  return Object.freeze({ ...c, controlled_topics: Object.freeze([...c.controlled_topics]) });
}

export const PUBLICATION_CONCEPTS = Object.freeze([...HAIR_LOSS_CONCEPTS, ...MULTI_CLUSTER_CONCEPTS].map(freezeConcept));

const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * PURE. Validates a registry (defaults to the real one). Returns every
 * violation rather than stopping at the first, so a bad edit is fully
 * diagnosable. The real registry is validated at module load below.
 */
export function validatePublicationRegistry(concepts = PUBLICATION_CONCEPTS, clusters = PUBLICATION_CLUSTERS, controlledTopics = CONTROLLED_TOPICS) {
  const violations = [];
  const slugs = new Set();
  const routes = new Set();

  for (const [key, cluster] of Object.entries(clusters)) {
    if (cluster.key !== key) violations.push(`CLUSTER_KEY_MISMATCH:${key}`);
    if (!/^\/education\/[a-z0-9-]+$/.test(cluster.route_prefix)) violations.push(`CLUSTER_ROUTE_PREFIX_INVALID:${key}`);
    if (cluster.hub_file !== `${cluster.route_prefix.slice(1)}.html`) violations.push(`CLUSTER_HUB_FILE_INVALID:${key}`);
  }
  const prefixes = Object.values(clusters).map((c) => c.route_prefix);
  if (new Set(prefixes).size !== prefixes.length) violations.push('DUPLICATE_CLUSTER_ROUTE_PREFIX');

  for (const c of concepts) {
    const id = c.topic_slug;
    if (slugs.has(id)) violations.push(`DUPLICATE_TOPIC_SLUG:${id}`);
    slugs.add(id);
    if (!clusters[c.cluster]) violations.push(`UNKNOWN_CLUSTER:${id}:${c.cluster}`);
    if (!Array.isArray(c.controlled_topics) || c.controlled_topics.length === 0) violations.push(`NO_CONTROLLED_TOPICS:${id}`);
    for (const t of c.controlled_topics || []) {
      if (!controlledTopics.includes(t)) violations.push(`UNCONTROLLED_TOPIC:${id}:${t}`);
    }
    if (!ROUTE_SLUG_PATTERN.test(c.route_slug || '')) violations.push(`ROUTE_SLUG_INVALID:${id}`);
    if (typeof c.seo_page_concept !== 'string' || !c.seo_page_concept.trim()) violations.push(`MISSING_PAGE_CONCEPT:${id}`);
    if (typeof c.autonomously_selectable !== 'boolean') violations.push(`MISSING_SELECTABILITY:${id}`);
    if (c.mapping_type === 'direct') {
      if (c.controlled_topics.length !== 1 || c.controlled_topics[0] !== id) violations.push(`DIRECT_MAPPING_NOT_SINGLE_SELF_TOPIC:${id}`);
    } else if (typeof c.mapping_rationale !== 'string' || !c.mapping_rationale.trim()) {
      violations.push(`CONSTRUCTED_MAPPING_WITHOUT_RATIONALE:${id}`);
    }
    if (clusters[c.cluster]) {
      const route = `${clusters[c.cluster].route_prefix}/${c.route_slug}`;
      if (routes.has(route)) violations.push(`DUPLICATE_ROUTE:${route}`);
      routes.add(route);
    }
  }

  // Two concepts built from the identical controlled-topic set would be
  // the same page intent registered twice.
  for (let i = 0; i < concepts.length; i += 1) {
    for (let j = i + 1; j < concepts.length; j += 1) {
      if (sameSet(concepts[i].controlled_topics, concepts[j].controlled_topics)) {
        violations.push(`IDENTICAL_CONTROLLED_TOPIC_SET:${concepts[i].topic_slug},${concepts[j].topic_slug}`);
      }
    }
  }

  // Every controlled topic must be deliberately accounted for.
  const covered = new Set(concepts.flatMap((c) => c.controlled_topics));
  for (const t of controlledTopics) {
    if (!covered.has(t)) violations.push(`CONTROLLED_TOPIC_UNACCOUNTED:${t}`);
  }

  return { valid: violations.length === 0, violations };
}

const registryValidation = validatePublicationRegistry();
if (!registryValidation.valid) {
  throw new PublicationRegistryError(`Publication registry is invalid: ${registryValidation.violations.join(', ')}`);
}

/** Controlled topic -> registered concept topic_slugs that use it as evidence. */
export const CONTROLLED_TOPIC_ACCOUNTING = Object.freeze(Object.fromEntries(
  CONTROLLED_TOPICS.map((t) => [t, Object.freeze(PUBLICATION_CONCEPTS.filter((c) => c.controlled_topics.includes(t)).map((c) => c.topic_slug))]),
));

export function getPublicationConcept(topicSlug) {
  return PUBLICATION_CONCEPTS.find((c) => c.topic_slug === topicSlug) || null;
}

export function isRegisteredPublicationConcept(topicSlug) {
  return getPublicationConcept(topicSlug) !== null;
}

export function getPublicationCluster(clusterKey) {
  return Object.prototype.hasOwnProperty.call(PUBLICATION_CLUSTERS, clusterKey) ? PUBLICATION_CLUSTERS[clusterKey] : null;
}

/** Throws (fails closed) for an unregistered topic. */
export function requirePublicationConcept(topicSlug) {
  const concept = getPublicationConcept(topicSlug);
  if (!concept) throw new PublicationRegistryError(`"${topicSlug}" is not a registered publication concept.`);
  return concept;
}

export function conceptsForCluster(clusterKey, concepts = PUBLICATION_CONCEPTS) {
  return concepts.filter((c) => c.cluster === clusterKey);
}

/** The cluster a concept belongs to (throws for an unregistered topic). */
export function clusterForTopic(topicSlug) {
  return PUBLICATION_CLUSTERS[requirePublicationConcept(topicSlug).cluster];
}

/**
 * Deterministic public route for a registered concept:
 * `${cluster.route_prefix}/${route_slug}`. Throws for an unregistered
 * topic -- a route is never computed for something the registry does
 * not know about.
 */
export function publicationRouteFor(topicSlug) {
  const concept = requirePublicationConcept(topicSlug);
  return `${PUBLICATION_CLUSTERS[concept.cluster].route_prefix}/${concept.route_slug}`;
}

/** The registered cluster whose route prefix DIRECTLY contains this
    article route (exactly one URL-safe segment below the prefix), or
    null -- never a guess. */
export function clusterForRoute(route) {
  if (typeof route !== 'string') return null;
  return Object.values(PUBLICATION_CLUSTERS).find((c) => {
    if (!route.startsWith(`${c.route_prefix}/`)) return false;
    return ROUTE_SLUG_PATTERN.test(route.slice(c.route_prefix.length + 1));
  }) || null;
}

/** Every controlled topic used by the given concepts (deduplicated,
    deterministic order) -- the evidence-fetch scope for a run. */
export function controlledTopicsForConcepts(concepts = PUBLICATION_CONCEPTS) {
  return [...new Set(concepts.flatMap((c) => c.controlled_topics))].sort();
}
