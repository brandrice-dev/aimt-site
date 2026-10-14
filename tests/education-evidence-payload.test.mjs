import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildSynthesisEvidenceBundle,encodeEvidenceBundle,decodeEvidenceBundle,EVIDENCE_TABLE_INSTRUCTION} from '../functions/_lib/research/publication-synthesis-evidence.mjs';
import {buildSynthesisRequest,buildPublicationRequestBody,synthesizeTopic} from '../functions/_lib/research/publication-synthesis-client.mjs';
import {createPublicationCostControl,PUBLICATION_INPUT_TOKEN_LIMIT} from '../functions/_lib/research/publication-cost-control.mjs';
import {validateSynthesisOutput} from '../functions/_lib/research/publication-synthesis-validator.mjs';
import {runSynthesisPipeline} from '../functions/_lib/research/publication-synthesis-orchestrator.mjs';
import {classifyRecovery,runAutonomousCycle} from '../scripts/education-autonomous-cycle.mjs';
import {writeTopicIntent,loadTopicIntent,topicAttemptFingerprint} from '../scripts/_lib/education-topic-attempts.mjs';
import {getPublicationConcept} from '../functions/_lib/education-ops/education-publication-registry.mjs';
import {runEvidencePreflight} from '../scripts/education-publication-diagnostic.mjs';

const pageIntent={page_concept:'Trichology: A Practitioner Education Overview',public_intent:'Explain the scope of trichology for practitioners.',in_scope_concepts:['Professional scope and limitations'],out_of_scope_concepts:['Treatment efficacy']};
const bytes=body=>new TextEncoder().encode(JSON.stringify({...body,stream:true})).length;
function fixture(){
 const sources=Array.from({length:101},(_,i)=>({source_id:`scientific-source-${i}`,title:`Scientific investigation of follicular biology and scalp health, study ${i}`,authors:['Author A','Author B'],year:2025,doi:`10.1000/fixture-${i}`,pmid:String(100000+i),url:`https://pubmed.ncbi.nlm.nih.gov/${100000+i}/`,evidence_type:'rct',source_role:'primary_research',verification_status:'SOURCE_VERIFIED',use_status:'active'}));
 const claims=Array.from({length:401},(_,i)=>({claim_id:`verified-claim-${i}`,source_id:sources[i%101].source_id,claim_type:i%10===0?'limitation':'finding',
 claim_text:i%10===0?'The observed findings were limited to this adult study population and cannot establish causation or treatment efficacy.':i%2===0?'The controlled study reported no statistically significant effect; this conflicts with the favorable finding in the comparison study.':'The comparison study reported a favorable association, with population and methods distinct from the controlled study.',
 direction:i%2===0?'no_effect':'supports_effect',population_or_scope:'Adult study population; findings do not establish treatment efficacy.',page_or_section_locator:`Results and limitations, paragraph ${i+1}`,claim_origin:'primary_text',verification_status:'CLAIM_VERIFIED',use_status:'active'}));
 const packet={candidate_claim_ids:claims.map(c=>c.claim_id),candidate_source_ids:sources.map(s=>s.source_id),synthesis_required_flags:['POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS']};
 let bundle=buildSynthesisEvidenceBundle(packet,{claims,sources});
 const rawBody=()=>{const request=buildSynthesisRequest({}, {topic_slug:'trichology',evidenceBundle:bundle,pageIntent});return buildPublicationRequestBody({}, {...request,system:request.system.replace(EVIDENCE_TABLE_INSTRUCTION,''),userContent:JSON.stringify({topic_slug:'trichology',page_concept:pageIntent.page_concept,evidence_bundle:bundle})});};
 // Match the actual failed wire size exactly using unescaped author-text
 // padding distributed over 401 records, rather than one artificial huge row.
 const needed=299239-bytes(rawBody());assert.ok(needed>0);
 for(let i=0;i<401;i++){const size=Math.floor(needed/401)+(i<needed%401?1:0);bundle.claims[i].claim_text+=' Study-specific methods and follow-up limit external validity.'.repeat(Math.ceil(size/60)).slice(0,size);}
 assert.equal(bytes(rawBody()),299239);
 return {bundle,packet,raw:rawBody(),body:buildPublicationRequestBody({},buildSynthesisRequest({}, {topic_slug:'trichology',evidenceBundle:bundle,pageIntent}))};
}
function proposal(bundle){return {topic_slug:'trichology',page_concept:pageIntent.page_concept,recommended_disposition:'AUTO_READY',confidence:'high',page_scope:{include:['Professional scope'],exclude:['Treatment efficacy']},selected_claims:bundle.claims.map(c=>({claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'core_finding',reason:'Retain the exact source-specific evidence and uncertainty.'})),excluded_claims:[],resolved_synthesis_signals:[{signal:'POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS',resolution:'Describe both source-specific findings and their methodological limits.',claim_ids:['verified-claim-1','verified-claim-2']}],unresolved_issues:[],human_review_justification:{reason_code:'NOT_APPLICABLE',reason:'Not applicable',related_claim_ids:[]},public_framing:{core_points:[{statement:'Source-specific findings differ.',supporting_claim_ids:['verified-claim-1','verified-claim-2']}],limitations:[{statement:'These results are limited to the study population.',supporting_claim_ids:['verified-claim-0']}],scope_note:'No treatment recommendation.'}};}

test('401 eligible claims / 101 sources / 299239-byte regression fits unchanged limits with exact round-trip accounting',()=>{
 const {bundle,body,raw}=fixture();assert.ok(bytes(raw)+1024>PUBLICATION_INPUT_TOKEN_LIMIT);
 assert.ok(bytes(body)+1024<PUBLICATION_INPUT_TOKEN_LIMIT);
 assert.deepEqual(decodeEvidenceBundle(JSON.parse(JSON.stringify(encodeEvidenceBundle(bundle)))),bundle);
 assert.equal(JSON.parse(body.messages[0].content).evidence_bundle.claims.rows.length,401);
 assert.equal(JSON.parse(body.messages[0].content).evidence_bundle.sources.rows.length,101);
 const budget=createPublicationCostControl();assert.throws(()=>budget.reserve({...raw,stream:true}),e=>e.code==='TOKEN_LIMIT');
 assert.equal(budget.summary().requests,0);budget.reserve({...body,stream:true});assert.equal(budget.summary().requests,1);
 console.log('Synthetic request bytes:',bytes(body),'(original 299239)');
});
test('null, absent, Unicode, quotations and nested provenance are retained without mutating original evidence',()=>{
 const bundle={claims:[{claim_id:'a',claim_text:'é "quoted"\n完整',source_id:'s',provenance:{doi:'10.1/a',limitations:['unchanged']}},{claim_id:'b',claim_text:null,source_id:'s'}],sources:[{source_id:'s',authors:['A'],verification_status:'SOURCE_VERIFIED'}]};
 const before=structuredClone(bundle);assert.deepEqual(decodeEvidenceBundle(encodeEvidenceBundle(bundle)),bundle);assert.deepEqual(bundle,before);
});
test('complete streamed proposal over compact evidence is validated against all 401 original records',async()=>{
 const {bundle,packet}=fixture(),output=proposal(bundle),originalFetch=globalThis.fetch;
 const budget=createPublicationCostControl({previous:{reserved_cost_estimate_usd:.144914,reported_usage_cost_estimate_usd:.03,requests:1,requests_with_unknown_usage:0}});
 let calls=0;
 globalThis.fetch=async(url,init)=>{
  calls++;assert.equal(url,'https://api.anthropic.com/v1/messages');
  const body=JSON.parse(init.body);assert.ok(bytes(body)+1024<PUBLICATION_INPUT_TOKEN_LIMIT);
  assert.deepEqual(decodeEvidenceBundle(JSON.parse(body.messages[0].content).evidence_bundle),bundle);
  const events=[{type:'message_start',message:{usage:{input_tokens:1000,output_tokens:1}}},
   {type:'content_block_start',index:0,content_block:{type:'text',text:JSON.stringify(output)}},
   {type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:1000}},
   {type:'message_stop'}];
  return new Response(events.map(e=>`data: ${JSON.stringify(e)}\n\n`).join(''),{headers:{'Content-Type':'text/event-stream'}});
 };
 try{const result=await runSynthesisPipeline({ANTHROPIC_PUBLICATION_EDITOR_API_KEY:'fixture',publicationCostControl:budget},
  {topic_slug:'trichology',v1Result:{topic_slug:'trichology',risk_tier:'LOWER',readiness_status:'NEEDS_SYNTHESIS',synthesis_packet:packet},evidenceBundle:bundle,pageIntent});
  assert.equal(result.status,'AUTO_READY');assert.equal(result.finalOutput.selected_claims.length,401);
  assert.equal(calls,1);assert.equal(result.metrics.model_calls,1);assert.equal(budget.summary().requests,2);
 }finally{globalThis.fetch=originalFetch;}
});
test('full original evidence remains validator authority; missing disposition, lost limitation and one-sided conflict block readiness',()=>{
 const {bundle,packet}=fixture(),v1={topic_slug:'trichology',risk_tier:'LOWER',readiness_status:'NEEDS_SYNTHESIS',synthesis_packet:packet};
 const output=proposal(bundle);const result=validateSynthesisOutput({v1Result:v1,evidenceBundle:bundle,aiOutput:output});assert.equal(result.valid,true,JSON.stringify(result));
 const incomplete=structuredClone(output);incomplete.selected_claims.pop();assert.ok(validateSynthesisOutput({v1Result:v1,evidenceBundle:bundle,aiOutput:incomplete}).violations.includes('CLAIM_MISSING_DISPOSITION:verified-claim-400'));
 const noLimit=structuredClone(output);noLimit.public_framing.limitations=[];assert.ok(validateSynthesisOutput({v1Result:v1,evidenceBundle:bundle,aiOutput:noLimit}).violations.includes('LIMITATIONS_NOT_PRESERVED'));
 const oneSided=structuredClone(output);oneSided.selected_claims=oneSided.selected_claims.filter(c=>c.claim_id!=='verified-claim-1');oneSided.excluded_claims=[{claim_id:'verified-claim-1',reason_code:'UNRESOLVED_NON_CORE_CONFLICT',reason:'The exact related comparison cannot be scientifically resolved here.',related_conflict_claim_ids:['verified-claim-2']}];
 assert.ok(validateSynthesisOutput({v1Result:v1,evidenceBundle:bundle,aiOutput:oneSided}).violations.some(v=>v.startsWith('NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION')));
 assert.throws(()=>buildSynthesisEvidenceBundle(packet,{claims:bundle.claims.slice(1),sources:bundle.sources}),/EVIDENCE_ACCOUNTING_MISMATCH/);
});
test('saved intent and cumulative reservations survive resumption; compaction creates no additional allowance',()=>{
 const {body}=fixture(),root=mkdtempSync(path.join(tmpdir(),'aimt-size-resume-'));
 try{writeTopicIntent(root,'trichology','a'.repeat(64),pageIntent);assert.deepEqual(loadTopicIntent(root,'trichology','a'.repeat(64)),pageIntent);assert.equal(loadTopicIntent(root,'trichology','b'.repeat(64)),null);
 const saved=createPublicationCostControl({previous:{reserved_cost_estimate_usd:.144914,reported_usage_cost_estimate_usd:.03,requests:1,requests_with_unknown_usage:0}});
 saved.reserve({...body,stream:true});const checkpoint=saved.summary();const resumed=createPublicationCostControl({previous:JSON.parse(JSON.stringify(checkpoint))});assert.deepEqual(resumed.summary(),checkpoint);
 assert.throws(()=>resumed.reserve({...body,stream:true}),e=>e.code==='SPEND_LIMIT');assert.deepEqual(resumed.summary(),checkpoint);
 const small={model:'claude-sonnet-5',max_tokens:100};for(let i=0;i<4;i++)resumed.reserve(small);assert.throws(()=>resumed.reserve(small),e=>e.code==='SPEND_LIMIT');
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('real diagnostic path reads every record and exact saved intent without calling models or mutating the durable budget',async()=>{
 const {bundle}=fixture(),concept=getPublicationConcept('trichology');
 const evidence={claims:bundle.claims.map(c=>({...c,topics:concept.controlled_topics})),sources:bundle.sources};
 const root=mkdtempSync(path.join(tmpdir(),'aimt-live-preflight-')),cwd=process.cwd(),originalFetch=globalThis.fetch;
 const candidateRoot=path.join(root,'research-import/education-ops/candidates');mkdirSync(candidateRoot,{recursive:true});
 const budget={reserved_cost_estimate_usd:.144914,reported_usage_cost_estimate_usd:.03,requests:1,requests_with_unknown_usage:0};
 const stateFile=path.join(candidateRoot,'continuation.json'),state=JSON.stringify({cost_control:budget});writeFileSync(stateFile,state);
 writeTopicIntent(candidateRoot,'trichology',topicAttemptFingerprint(concept,evidence),pageIntent);
 let reads=0;globalThis.fetch=async(url,init)=>{
  reads++;assert.equal(init.method,'GET');const parsed=new URL(url);assert.equal(parsed.hostname,'fixture.supabase.test');
  if(parsed.pathname.endsWith('/research_claims'))return Response.json(evidence.claims);
  assert.ok(parsed.pathname.endsWith('/research_sources'));const ids=parsed.searchParams.get('source_id');
  return Response.json(evidence.sources.filter(s=>ids.includes(JSON.stringify(s.source_id))));
 };
 try{process.chdir(root);const report=await runEvidencePreflight({GITHUB_REPOSITORY:'brandrice-dev/aimt-site',SUPABASE_URL:'https://fixture.supabase.test',SUPABASE_SERVICE_ROLE_KEY:'fixture'});
  assert.equal(report.evidence_preflight.claim_count,401);assert.equal(report.evidence_preflight.source_count,101);
  assert.equal(report.evidence_preflight.actual_model_calls,0);assert.equal(report.evidence_preflight.production_writes,0);
  assert.equal(report.evidence_preflight.intent_reused,true);assert.equal(report.evidence_preflight.all_evidence_round_trip,true);
  assert.deepEqual(report.evidence_preflight.saved_cost_control,budget);assert.equal(readFileSync(stateFile,'utf8'),state);
  assert.ok(reads>=2);assert.ok(report.evidence_preflight.request_bytes+1024<PUBLICATION_INPUT_TOKEN_LIMIT);
 }finally{process.chdir(cwd);globalThis.fetch=originalFetch;rmSync(root,{recursive:true,force:true});}
 const workflow=readFileSync('.github/workflows/aimt-education-operations.yml','utf8');
 assert.match(workflow,/inputs\.evidence_preflight != true/); // probe cannot replace production checkpoints
});
test('technical size failures are distinct from financial, provider, validation and scientific failures',async()=>{
 const {bundle}=fixture(),budget=createPublicationCostControl();bundle.claims[0].claim_text='x'.repeat(300000);
 const result=await synthesizeTopic({ANTHROPIC_PUBLICATION_EDITOR_API_KEY:'fixture',publicationCostControl:budget},{topic_slug:'trichology',evidenceBundle:bundle,pageIntent});
 assert.equal(result.reason,'token_limit');assert.equal(result.diagnostics.code,'TOKEN_LIMIT');assert.equal(result.diagnostics.attempts,0);assert.equal(budget.summary().requests,0);
 assert.equal(classifyRecovery({final_state:'SYNTHESIS_FAILED',exception_reason:result.reason,publication_editor_result:{diagnostics:result.diagnostics}}),'EVIDENCE_SIZE_BLOCKED');
 assert.equal(classifyRecovery({final_state:'CONFIG_BLOCKED',exception_reason:'budget_exceeded',provider_request_diagnostics:{code:'TOKEN_LIMIT'}}),'EVIDENCE_SIZE_BLOCKED');
 assert.equal(classifyRecovery({final_state:'CONFIG_BLOCKED',publication_editor_result:{diagnostics:{code:'SPEND_LIMIT'}}}),'BUDGET_PAUSED');
 assert.equal(classifyRecovery({final_state:'PROVIDER_FAILED',exception_reason:'request_failed'}),'RETRY_PROVIDER');
 assert.equal(classifyRecovery({final_state:'INVALID_RESPONSE'}),'SAFETY_REVIEW');
 assert.equal(classifyRecovery({final_state:'HUMAN_REVIEW'}),'DEFER_TOPIC');
});
test('technical blocking preserves the saved topic, research and remaining window budget without declaring readiness or financial exhaustion',async()=>{
 const cost=createPublicationCostControl({previous:{reserved_cost_estimate_usd:.144914,reported_usage_cost_estimate_usd:.03909,requests:1,requests_with_unknown_usage:0}}).summary();
 let checkpoint;
 const state={version:'education-continuation-v1',chain_id:'scheduled',budget_window:'2026-10-14T14:00:00.000Z',executions:1,cost_control:cost,
  history:[],deferred:{},research:{preserved:{searches:1}},next_topic:'trichology'};
 const report=await runAutonomousCycle({GITHUB_REPOSITORY:'brandrice-dev/aimt-site',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ID:'continuation',GITHUB_EVENT_NAME:'workflow_dispatch'},
  {readState:()=>state,writeState:s=>{checkpoint=structuredClone(s)},loadBundle:()=>({found:false}),published:async()=>[],
   learningGaps:async()=>({}),research:async()=>({state:'NO_RESEARCH_GAP'}),report:()=>{},
   run:async()=>({final_state:'SYNTHESIS_FAILED',selected_topic:'trichology',exception_reason:'token_limit',publication_editor_result:{diagnostics:{code:'TOKEN_LIMIT',attempts:0}}})});
 assert.equal(report.autonomous_controller.next_action,'EVIDENCE_SIZE_BLOCKED');assert.equal(checkpoint.next_topic,'trichology');
 assert.deepEqual(checkpoint.cost_control,cost);assert.deepEqual(checkpoint.research,{preserved:{searches:1}});
 assert.equal(checkpoint.budget_window,state.budget_window);assert.equal(report.final_state,'SYNTHESIS_FAILED');
});
