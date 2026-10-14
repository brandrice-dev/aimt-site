// Explicitly approved diagnostic of the EXISTING decision pipeline. No issue
// surfacing, production publication lane, PR generation, or database writes.
import { pathToFileURL } from 'node:url';
import { runDecisionPipeline, persistRunReport } from './education-operations-cycle.mjs';
import { runExitCode } from '../functions/_lib/education-ops/education-run-ledger.mjs';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {getPublicationConcept} from '../functions/_lib/education-ops/education-publication-registry.mjs';
import {fetchTopicEvidenceLive} from '../functions/_lib/research/publication-readiness-loader.mjs';
import {assessTopicReadiness} from '../functions/_lib/research/publication-readiness.mjs';
import {buildSynthesisEvidenceBundle,encodeEvidenceBundle,decodeEvidenceBundle} from '../functions/_lib/research/publication-synthesis-evidence.mjs';
import {buildSynthesisRequest,buildPublicationRequestBody} from '../functions/_lib/research/publication-synthesis-client.mjs';
import {createPublicationCostControl} from '../functions/_lib/research/publication-cost-control.mjs';
import {topicAttemptFingerprint,loadTopicIntent} from './_lib/education-topic-attempts.mjs';

// Read-only proof of the October 14 blocker using the current library and
// exact saved intent. No provider call, allowance renewal or production write.
export async function runEvidencePreflight(env) {
  if(env.GITHUB_REPOSITORY!=='brandrice-dev/aimt-site')throw new Error('UNTRUSTED_PREFLIGHT_REPOSITORY');
  const concept=getPublicationConcept('trichology');
  const evidence=await fetchTopicEvidenceLive(env,concept.controlled_topics);
  const fingerprint=topicAttemptFingerprint(concept,evidence);
  const root='research-import/education-ops/candidates';
  const intent=loadTopicIntent(root,concept.topic_slug,fingerprint);
  if(!intent)throw new Error('EXACT_SAVED_INTENT_REQUIRED');
  const state=JSON.parse(readFileSync(root+'/continuation.json','utf8'));
  if(!state.cost_control)throw new Error('SAVED_BUDGET_REQUIRED');
  const v1=assessTopicReadiness({topic_slug:concept.topic_slug,seo_page_concept:concept.seo_page_concept,
    controlled_topics:concept.controlled_topics,...evidence});
  const bundle=buildSynthesisEvidenceBundle(v1.synthesis_packet,evidence);
  const decoded=decodeEvidenceBundle(JSON.parse(JSON.stringify(encodeEvidenceBundle(bundle))));
  if(!isDeepStrictEqual(bundle,decoded))throw new Error('EVIDENCE_ROUND_TRIP_FAILED');
  const pageIntent={page_concept:intent.page_concept,public_intent:intent.public_intent,
    in_scope_concepts:intent.in_scope_concepts,out_of_scope_concepts:intent.out_of_scope_concepts};
  const body=buildPublicationRequestBody(env,buildSynthesisRequest(env,{topic_slug:concept.topic_slug,evidenceBundle:bundle,pageIntent}));
  const simulated=createPublicationCostControl({previous:state.cost_control});
  simulated.reserve({...body,stream:true}); // local simulation only, never persisted as spend
  return {final_state:'NO_OP_SUCCESS',selected_topic:concept.topic_slug,evidence_preflight:{
    claim_count:bundle.claims.length,source_count:bundle.sources.length,
    request_bytes:new TextEncoder().encode(JSON.stringify({...body,stream:true})).length,
    all_evidence_round_trip:true,intent_reused:true,actual_model_calls:0,
    saved_cost_control:state.cost_control,simulated_cost_control:simulated.summary(),
    production_writes:0,new_sources:0,new_claims:0,publication_completed:false}};
}

export function runDiagnosticCycle(env, options = {}) {
  return runDecisionPipeline({ ...env,
    AIMT_EDUCATION_AUTOPUBLISH_ENABLED: 'false',
    AIMT_RESEARCH_GAP_LOOP_ENABLED: 'false',
  }, { ...options, mode: 'shadow' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const topic = argv.find((a) => a.startsWith('--topic='))?.slice(8) || 'scalp-microbiome';
  if(argv.length===1 && argv[0]==='--evidence-preflight'){
    const report=await runEvidencePreflight(process.env);
    mkdirSync('research-import/education-ops/runs',{recursive:true});
    writeFileSync('research-import/education-ops/runs/evidence-preflight.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } else if (!argv.includes('--allow-model-calls') || argv.some((a) => a !== '--allow-model-calls' && !a.startsWith('--topic='))) {
    console.error('Requires explicit --allow-model-calls approval. Up to 6 HTTP requests, $2 estimated spend reservation, existing token ceilings, 8-minute Publication Editor request deadline; run in the 30-minute workflow.');
    process.exitCode = 1;
  } else {
    const report = await runDiagnosticCycle(process.env, { topicSlug: topic });
    persistRunReport(report);
    console.log(JSON.stringify({ ...report, __internal: undefined }, null, 2));
    process.exitCode = runExitCode(report);
  }
}
