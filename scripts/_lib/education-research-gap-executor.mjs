import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PUBLICATION_CONCEPTS, getPublicationConcept } from '../../functions/_lib/education-ops/education-publication-registry.mjs';
import { selectNextTopic } from '../../functions/_lib/education-ops/education-topic-selector.mjs';
import { fetchTopicEvidenceLive, selectTopicEvidenceFromRows } from '../../functions/_lib/research/publication-readiness-loader.mjs';
import { assessTopicReadiness } from '../../functions/_lib/research/publication-readiness.mjs';
import { fetchPublishedTopicSlugsLive } from '../../functions/_lib/education-ops/education-published-state-loader.mjs';
import { listActiveResearchGaps, upsertEvidenceInsufficiencyGap, markGapResearchReceivedById } from '../../functions/_lib/education-ops/education-research-gap-queue.mjs';
import { processIngestionBatch } from '../../functions/_lib/research/ingest-request.mjs';
import { existingDoiMap } from '../research-feed-ingest.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');
const API = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
// Existing gap lane and canonical importer. No parallel library or model calls.
// Maximum three searches per evidence baseline, two papers per search; records
// contain exact author statements and explicitly retain abstract-only scope.
export function researchAssignment(gap) {
  const concept = getPublicationConcept(gap.item_id);
  if (!concept || !concept.autonomously_selectable || gap.lane !== 'publication_evidence_gap') throw new Error('UNTRUSTED_RESEARCH_ASSIGNMENT');
  const key = digest(JSON.stringify([gap.queue_id, gap.extras?.baseline_candidate_claim_ids || [], gap.extras?.gap_summary]));
  const terms = concept.controlled_topics.map((t) => t.replaceAll('-', ' '));
  return { key, topic: concept.topic_slug, gap_id: gap.queue_id, questions: gap.extras?.gap_summary || gap.notes,
    required_source_types: ['primary study', 'systematic review', 'professional guideline'],
    controlled_topics: concept.controlled_topics,
    query: `(${terms.map((t) => `"${t}"`).join(' OR ')}) AND (TITLE_ABS:scalp OR TITLE_ABS:hair OR TITLE_ABS:shampoo OR TITLE_ABS:cosmetic OR TITLE_ABS:skin) AND SRC:MED AND HAS_ABSTRACT:Y NOT PUB_TYPE:"Retracted Publication"`,
    scope: 'Exact abstract statements only; no invented synthesis, treatment recommendations or institutional approval.' };
}
function abstractText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
export function verifiedAbstractBatch(records, assignment, knownDois = new Map(), now = new Date().toISOString()) {
  const sources = [], claims = [], receipts = [];
  for (const paper of records) {
    if (paper.source !== 'MED' || !/^\d+$/.test(paper.id || '') || !paper.title || !paper.doi || !paper.abstractText
      || !/scalp|hair follicle|hair shaft|hairdress|shampoo|cosmetic|dermatolog|alopec|dandruff|skin barrier/i.test(`${paper.title} ${abstractText(paper.abstractText)}`)
      || paper.isRetracted === 'Y' || (paper.pubTypeList?.pubType || []).some((p) => /retract|editorial|letter|comment/i.test(p))) continue;
    const abstract = abstractText(paper.abstractText), pmid = paper.id;
    const sourceId = knownDois.get(paper.doi.toLowerCase()) || `epmc-med-${pmid}`;
    const types = (paper.pubTypeList?.pubType || []).join(' '), review = /review/i.test(types);
    if (!knownDois.has(paper.doi.toLowerCase())) sources.push({ record_type: 'source', source_id: sourceId, title: abstractText(paper.title),
      authors: (paper.authorList?.author || []).map((a) => a.fullName).filter(Boolean), year: Number(paper.pubYear), doi: paper.doi,
      pmid, url: `https://europepmc.org/article/MED/${pmid}`, topics: assignment.controlled_topics,
      evidence_type: /systematic review/i.test(types) ? 'systematic_review' : /meta.analysis/i.test(types) ? 'meta_analysis' : review ? 'narrative_review' : /randomized controlled/i.test(types) ? 'rct' : 'other',
      source_role: review ? 'synthesis' : 'primary_research', verification_status: 'SOURCE_VERIFIED', verification_depth: paper.verified_limitations ? 'full_text' : 'abstract',
      use_status: 'active', full_text_held: false, verified_on: now, verification_review_status: 'not_reviewed',
      verification_notes: 'PubMed-indexed metadata and complete author abstract retrieved directly from Europe PMC. Any full-text limitation claim is an exact author-titled section with a verified article identity and retrieval digest. No scientific or institutional approval is claimed.',
      body_sections: { abstract, ...(paper.verified_limitations ? {author_limitations:paper.verified_limitations} : {}) }, acquisition: { query: assignment.query, gap_id: assignment.gap_id, abstract_sha256: digest(abstract) } });
    // Entire abstract retained as one scoped author statement, avoiding cherry
    // picking conclusions or dropping population, methods and limitations.
    const id = `epmc-abstract-${pmid}-${digest(abstract).slice(0, 20)}`;
    claims.push({ record_type: 'claim', claim_id: id, source_id: sourceId, claim_type: 'finding', claim_text: abstract,
      claim_text_fidelity: 'verbatim_quote', claim_origin: 'abstract', extraction_basis: 'abstract',
      topics: assignment.controlled_topics, population_or_scope: 'Author abstract as a whole; preserve the stated population, methods, outcomes and limitations. No full-text verification.',
      direction: 'unclear', extraction_confidence: 'high', use_status: 'active', verification_status: 'CLAIM_VERIFIED',
      verified_against_primary_source: !review, verified_on: now, page_or_section_locator: 'Abstract (complete)',
      verification_review_status: 'not_reviewed', reviewed_by: null,
      acquisition: { pmid, doi: paper.doi, query: assignment.query, abstract_sha256: digest(abstract), gap_id: assignment.gap_id,
        verification_method: 'exact complete abstract from PubMed-indexed source record', scientific_review_required: true } });
    if (paper.verified_limitations && paper.fulltext_sha256) {
      const text=paper.verified_limitations, lid=`epmc-limitations-${pmid}-${digest(text).slice(0,20)}`;
      claims.push({...claims[claims.length-1],claim_id:lid,claim_type:'limitation',claim_text:text,
        claim_origin:'primary_text',extraction_basis:'full_text',page_or_section_locator:'Author-titled limitations section',
        acquisition:{...claims[claims.length-1].acquisition,fulltext_sha256:paper.fulltext_sha256,verification_method:'exact complete author-titled limitations section in retrieved open-access full text'}});
    }
    receipts.push({ pmid, doi: paper.doi, abstract_sha256: digest(abstract), claim_id: id });
  }
  return { batch_id: `education-gap-${digest(JSON.stringify([assignment.key, receipts])).slice(0, 32)}`,
    source_system: 'aimt-research-feed', sources, claims, receipts };
}
export async function searchScientificSources(assignment, cursor = '*', fetchFn = fetch) {
  const url = new URL(API);
  url.search = new URLSearchParams({ query: assignment.query, resultType: 'core', format: 'json', pageSize: '2', cursorMark: String(cursor) });
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetchFn(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (response.ok) { const data = await response.json(); return { records: data.resultList?.result || [], nextCursorMark: data.nextCursorMark || cursor }; }
    if (![429, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`RESEARCH_SOURCE_HTTP_${response.status}`);
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
}
async function retrieveAuthorLimitations(paper) {
  if(paper.isOpenAccess!=='Y' || !/^PMC[0-9]+$/.test(paper.pmcid||''))return paper;
  const response=await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${paper.pmcid}/fullTextXML`,{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)return paper;
  const xml=await response.text();if(xml.length>8000000)return paper;
  const text=execFileSync('python3',['-c',`import xml.etree.ElementTree as E,sys,re,json
root=E.fromstring(sys.stdin.read());parts=[]
ids={i.attrib.get('pub-id-type'):''.join(i.itertext()).strip() for i in root.iter('article-id')}
assert ids.get('pmid')==sys.argv[1] and ids.get('doi','').lower()==sys.argv[2].lower()
for sec in root.iter('sec'):
 title=sec.find('title')
 if title is not None and re.fullmatch(r'(?:strengths and )?(?:study )?limitations', ''.join(title.itertext()).strip(),re.I):
  parts += [' '.join(''.join(p.itertext()).split()) for p in sec.findall('p')]
print(' '.join(parts))`,paper.id,paper.doi],{input:xml,encoding:'utf8',maxBuffer:1024*1024}).trim();
  return text && text.length<=6000 ? {...paper,verified_limitations:text,fulltext_sha256:digest(xml)} : paper;
}
export function discoverResearchNeed(pool, published, excluded = [], existingTopics = []) {
  const candidates=selectNextTopic(pool,{publishedTopicSlugs:published}).candidates
    .filter(c=>!c.concept.controlled_topics.some(t=>excluded.includes(t)) && !existingTopics.includes(c.topic_slug)
      && c.concept.autonomously_selectable);
  const coarse=candidates.find(c=>c.v1_result.risk_tier!=='HIGH' && ['NOT_READY_SKIP','EVIDENCE_GAPS_SKIP'].includes(c.ineligible_reason));
  if(coarse)return {...coarse, research_reason:coarse.v1_result.evidence_gaps.join('; ') || 'Insufficient verified candidate claims and sources'};
  // Count verified source roles from actual topic-linked records, not title
  // guesses. Synthesis-only coverage is a concrete primary-evidence gap even
  // when the coarse claim/source count says NEEDS_SYNTHESIS. It never changes
  // readiness or grants publication authority.
  return candidates.map(c=>{
    const evidence=selectTopicEvidenceFromRows(c.concept.controlled_topics,pool);
    const primary=evidence.sources.filter(s=>s.verification_status==='SOURCE_VERIFIED'
      && ['primary_research','preclinical','guideline'].includes(s.source_role)
      && !['excluded','superseded','needs_review'].includes(s.use_status));
    return {...c,primary_source_count:primary.length,research_reason:`Primary-evidence coverage gap: ${primary.length} documented verified primary/preclinical/guideline sources for ${c.topic_slug}; acquire topic-relevant directly sourced evidence, retaining all population and abstract limitations.`};
  }).find(c=>c.primary_source_count===0 && ['product-science','head-spa-techniques','scalp-health','trichology-fundamentals','hair-loss-shedding'].includes(c.cluster));
}
export async function executeResearchGap(env, state, persist, overrides = {}) {
  const io = { fetchEvidence: fetchTopicEvidenceLive, fetchPublished: fetchPublishedTopicSlugsLive,
    verifyPaper: async (paper) => {
      const found = await searchScientificSources({ query: `EXT_ID:${paper.id} AND SRC:MED` });
      const exact = found.records.find((p) => p.id === paper.id && p.doi === paper.doi && abstractText(p.abstractText) === abstractText(paper.abstractText));
      return exact ? retrieveAuthorLimitations(exact) : null;
    },
    listGaps: listActiveResearchGaps, queueGap: upsertEvidenceInsufficiencyGap, ingest: processIngestionBatch,
    markReceived: markGapResearchReceivedById, dois: existingDoiMap, search: searchScientificSources, ...overrides };
  const topics = [...new Set(PUBLICATION_CONCEPTS.flatMap((c) => c.controlled_topics))];
  const pool = await io.fetchEvidence(env, topics), published = await io.fetchPublished(env);
  let gaps = await io.listGaps(env);
  if (!gaps.length) {
    const lacking = discoverResearchNeed(pool,published,overrides.excludedTopics || []);
    if (!lacking) return { state: 'NO_RESEARCH_GAP' };
    const c = lacking.concept;
    await io.queueGap(env, { topicSlug: c.topic_slug, cluster: c.cluster, pageConcept: c.seo_page_concept,
      publicIntent: c.seo_page_concept, inScopeConcepts: c.controlled_topics, controlledTopics: c.controlled_topics,
      gapSummary: lacking.research_reason,
      originatingRunId: env.GITHUB_RUN_ID, originatingPageIntent: null, baselineCandidateClaimIds: lacking.v1_result.candidate_claim_ids });
    gaps = await io.listGaps(env);
  }
  let chosen;
  for (const gap of gaps) {
    const assignment = researchAssignment(gap), record = state[assignment.key];
    if (assignment.controlled_topics.some((t) => (overrides.excludedTopics || []).includes(t))) continue;
    if (gap.status === 'claimed' && gap.extras?.claimed_by !== 'aimt-autonomous-research') continue; // never steal Grok's active work
    if ((record?.searches || 0) < 3 && (!record?.not_before || Date.parse(record.not_before) <= Date.now())) { chosen = { gap, assignment, record }; break; }
  }
  if (!chosen && !overrides.discoveredAlternative) {
    const alternative=discoverResearchNeed(pool,published,overrides.excludedTopics || [],gaps.map(g=>g.item_id));
    if(alternative){
      const c=alternative.concept;
      await io.queueGap(env,{topicSlug:c.topic_slug,cluster:c.cluster,pageConcept:c.seo_page_concept,publicIntent:c.seo_page_concept,
        inScopeConcepts:c.controlled_topics,controlledTopics:c.controlled_topics,gapSummary:alternative.research_reason,
        originatingRunId:env.GITHUB_RUN_ID,originatingPageIntent:null,baselineCandidateClaimIds:alternative.v1_result.candidate_claim_ids});
      return executeResearchGap(env,state,persist,{...overrides,discoveredAlternative:true});
    }
  }
  if (!chosen) return { state: 'RESEARCH_DEFERRED', next_action: 'Wait for new verified evidence or the next permitted search; other topics remain eligible.' };
  const { gap, assignment } = chosen;
  const record = state[assignment.key] ||= { assignment, searches: 0, cursor: '*', receipts: [], pending_batch: null };
  if (!record.pending_batch) {
    record.searches++; record.state = 'SEARCH_RESERVED'; persist(state); // survive request/runner ambiguity
    const searched = await io.search(assignment, record.cursor || '*');
    const papers = searched.records || searched;
    record.cursor = searched.nextCursorMark || record.cursor;
    const verified = [];
    for (const paper of papers) {
      if (paper.source !== 'MED' || !/^\d+$/.test(paper.id || '') || !paper.doi || !paper.title || !paper.abstractText) continue;
      const exact = await io.verifyPaper(paper); if (exact) verified.push(exact);
    }
    const batch = verifiedAbstractBatch(verified, assignment, await io.dois(env));
    const existing = new Set(pool.claims.map((c) => c.claim_id));
    batch.claims = batch.claims.filter((c) => !existing.has(c.claim_id));
    record.pending_batch = batch; persist(state);
  }
  const batch = record.pending_batch;
  let accepted = { sources: 0, claims: 0 };
  if (batch.claims.length) {
    const result = await io.ingest(env, batch, { triggeredBy: 'aimt-autonomous-research' });
    if (!result.ok || result.quarantined?.claims || result.quarantined?.sources) throw new Error('RESEARCH_CANONICAL_INGESTION_REJECTED');
    accepted = result.accepted;
    if (accepted.claims) await io.markReceived(env, gap.queue_id, { researchBatchId: batch.batch_id });
  }
  record.receipts.push(...batch.receipts); record.pending_batch = null; record.state = accepted.claims ? 'RESEARCH_RECEIVED' : 'NO_NEW_VERIFIED_EVIDENCE';
  record.not_before = new Date(Date.now() + 60000).toISOString(); persist(state);
  const fresh = await io.fetchEvidence(env, assignment.controlled_topics), concept = getPublicationConcept(assignment.topic);
  for (const claim of batch.claims) {
    if (accepted.claims && !fresh.claims.some((c) => c.claim_id === claim.claim_id && c.claim_text === claim.claim_text && c.verification_status === 'CLAIM_VERIFIED')) throw new Error('RESEARCH_POST_IMPORT_INTEGRITY_FAILED');
  }
  const initial = assessTopicReadiness({ topic_slug: concept.topic_slug, seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics, ...selectTopicEvidenceFromRows(concept.controlled_topics, pool) });
  const readiness = assessTopicReadiness({ topic_slug: concept.topic_slug, seo_page_concept: concept.seo_page_concept,
    controlled_topics: concept.controlled_topics, ...fresh });
  return { state: record.state, assignment, searches: record.searches, accepted, receipts: batch.receipts,
    initial_readiness: { status: initial.readiness_status, gaps: initial.evidence_gaps, candidate_claim_count: initial.candidate_claim_ids.length },
    verified_read_back: accepted.claims > 0,
    primary_source_coverage: {
      before: selectTopicEvidenceFromRows(concept.controlled_topics,pool).sources.filter(s=>['primary_research','preclinical','guideline'].includes(s.source_role) && s.verification_status==='SOURCE_VERIFIED').length,
      after: fresh.sources.filter(s=>['primary_research','preclinical','guideline'].includes(s.source_role) && s.verification_status==='SOURCE_VERIFIED').length },
    readiness: { status: readiness.readiness_status, gaps: readiness.evidence_gaps, candidate_claim_count: readiness.candidate_claim_ids.length } };
}
