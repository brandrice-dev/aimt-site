import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {
  splitSynthesisEvidence,validateBatchDecisions,assembleBatchSynthesis,
  BATCH_SYNTHESIS_THRESHOLD,BATCH_CLAIMS,BATCH_MAX_CALLS_PER_RUN,
  runBatchedSynthesisPipeline,
} from '../functions/_lib/research/publication-synthesis-batches.mjs';
import {buildPublicationRequestBody,buildEvidenceBatchRequest,buildGlobalEvidenceRequest,buildSynthesisRequest} from '../functions/_lib/research/publication-synthesis-client.mjs';
import {createPublicationCostControl,PUBLICATION_INPUT_TOKEN_LIMIT} from '../functions/_lib/research/publication-cost-control.mjs';
import {createSynthesisProgressIo} from '../scripts/_lib/education-synthesis-progress.mjs';
import {runDecisionPipeline} from '../scripts/education-operations-cycle.mjs';
import {getPublicationConcept} from '../functions/_lib/education-ops/education-publication-registry.mjs';
import {selectTopicEvidenceFromRows} from '../functions/_lib/research/publication-readiness-loader.mjs';
import {topicAttemptFingerprint} from '../scripts/_lib/education-topic-attempts.mjs';

const flag='POTENTIAL_CONFLICT_REQUIRES_SYNTHESIS';
const pageIntent={
 page_concept:'Trichology: A Practitioner Education Overview',
 public_intent:'Explain what the field may observe and what it cannot establish.',
 in_scope_concepts:['Scientific observation and scope'],
 out_of_scope_concepts:['Diagnosis and treatment prescribing'],
};
const v1Topic='trichology';
function fixture(){
 const sources=Array.from({length:101},(_,i)=>({source_id:'src-'+i,title:'Scientific study '+i,
  authors:['Researcher A','Researcher B'],year:2025,source_venue:'Professional Journal',
  doi:'10.1000/aimt-'+i,verification_status:'SOURCE_VERIFIED',use_status:'active'}));
 const claims=Array.from({length:401},(_,i)=>({
  claim_id:'claim-'+String(i).padStart(3,'0'),
  claim_text:(i%10===0?'The study results cannot prove causality and may not generalize to other populations. ':
    'The scientific observations differ between study populations and cannot justify unsupported clinical claims. ')
    +'Methods and cohort limitations were recorded explicitly. '.repeat(4),
  claim_type:i%10===0?'limitation':'finding',
  direction:i%2===0?'supports_effect':'no_effect',
  source_id:sources[i%101].source_id,verification_status:'CLAIM_VERIFIED',use_status:'active',
  population_or_scope:'Adults in a limited study population',claim_origin:'primary_text',
  page_or_section_locator:'Results section',
 }));
 const packet={controlled_topics:[v1Topic],candidate_claim_ids:claims.map(c=>c.claim_id),
  candidate_source_ids:sources.map(s=>s.source_id),
  supports_effect_claim_ids:['claim-000'],no_effect_claim_ids:['claim-001'],
  synthesis_required_flags:[flag],safety_claim_ids:[]};
 const evidenceBundle={claims,sources,claim_count:401,source_count:101};
 const v1Result={topic_slug:v1Topic,risk_tier:'LOWER',readiness_status:'NEEDS_SYNTHESIS',
  evidence_gaps:[],synthesis_packet:packet};
 return {topic_slug:v1Topic,v1Result,evidenceBundle,pageIntent};
}
function mockGlobal(){
 return {
  recommended_disposition:'AUTO_READY',confidence:'medium',
  page_scope:{include:['Scientific observation'],exclude:['Clinical diagnosis and treatment']},
  resolved_synthesis_signals:[{signal:flag,
    resolution:'The studies address different populations and endpoints and do not establish comparable treatment efficacy.',
    claim_ids:['claim-000','claim-001']}],
  unresolved_issues:[],human_review_justification:{
    reason_code:'NOT_APPLICABLE',reason:'Not applicable',related_claim_ids:[],
  },
  public_framing:{
    core_points:[{statement:'Observational findings vary with studied population.',supporting_claim_ids:['claim-001']}],
    limitations:[{statement:'These data cannot establish causation.',supporting_claim_ids:['claim-000']}],
    scope_note:'Educational material only; no diagnostic or prescriptive advice.',
  },
  disposition_adjustments:[],
 };
}
function createFakeProviders(){
 const calls=[];
 const call=(env,shape,output)=>{
  const c=env.publicationCostControl;
  const body=buildPublicationRequestBody(env,shape);
  try{c.reserve({...body,stream:true});}
  catch(e){return {ok:false,reason:e.code==='SPEND_LIMIT'?'budget_exceeded':'token_limit',
    diagnostics:{attempts:0,code:e.code}};}
  c.recordUsage({input_tokens:800,output_tokens:300});
  calls.push({bytes:JSON.stringify({...body,stream:true}).length});
  return {ok:true,output,modelInfo:{modelName:'claude-sonnet-5'},diagnostics:{attempts:1},
    usage:{input_tokens:800,output_tokens:300}};
 };
 return {calls,fns:{
   chunkFn:async(env,args)=>{
     const output={selected_claims:args.chunk.evidence.claims.map(c=>({
       claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'supporting_context',
       reason:'Relevant original finding, its source population and uncertainty retained.',
     })),excluded_claims:[]};
     return call(env,buildEvidenceBatchRequest(args),output);
   },
   globalFn:async(env,args)=>call(env,buildGlobalEvidenceRequest(args),mockGlobal()),
 }};
}
function makeIo() {
 let state=null, saves=0;
 return {fingerprint:()=> 'a'.repeat(64),
   load:async()=>state===null?null:structuredClone(state),
   save:async({progress})=>{state=structuredClone(progress);saves++;},
   get state(){return structuredClone(state);},
   get saves(){return saves;},
 };
}
test('401 original verified claims partition into exact disjoint source-grounded batches',()=>{
 const f=fixture();const chunks=splitSynthesisEvidence(f.evidenceBundle);
 assert.equal(BATCH_SYNTHESIS_THRESHOLD,160);
 assert.equal(BATCH_CLAIMS,40);
 assert.equal(BATCH_MAX_CALLS_PER_RUN,2);
 assert.equal(chunks.length,11);
 assert.equal(chunks.reduce((n,x)=>n+x.claim_ids.length,0),401);
 assert.equal(new Set(chunks.flatMap(c=>c.claim_ids)).size,401);
 assert.ok(chunks.every(c=>c.evidence.claims.every(row=>c.evidence.sources.some(s=>s.source_id===row.source_id))));
 const good={selected_claims:chunks[0].evidence.claims.map(c=>({claim_id:c.claim_id,role:'supporting_context',reason:'Evidence relevant to the topic.'})),excluded_claims:[]};
 assert.equal(validateBatchDecisions(good,chunks[0]).valid,true);
 assert.equal(validateBatchDecisions({...good,selected_claims:good.selected_claims.slice(1)},chunks[0]).valid,false);
 assert.equal(validateBatchDecisions({...good,excluded_claims:[{claim_id:'invented',reason_code:'OTHER',reason:'Untrusted',related_conflict_claim_ids:[]}]},chunks[0]).valid,false);
});

test('full 401 claim analysis resumes over budget windows; never restarts finished batches',async()=>{
 const f=fixture(),batchIo=makeIo(),{calls,fns}=createFakeProviders();
 let cost=createPublicationCostControl();let steps=0,passes=0,final;
 while(steps<20){
  const result=await runBatchedSynthesisPipeline({publicationCostControl:cost},{...f,batchIo,fns});
  steps++;assert.ok(result.metrics.model_calls<=2);
  if(result.status==='AUTO_READY'){final=result;passes++;break;}
  assert.equal(result.status,'SYNTHESIS_IN_PROGRESS',JSON.stringify(result));
  if(result.reason==='budget_pause' || cost.summary().requests>=6) {
    // Simulation of the ONLY permitted new budget authority: a later
    // trusted weekday scheduled window, never a same-window retry.
    cost=createPublicationCostControl();
  }
 }
 assert.equal(passes,1);
 assert.equal(final.finalOutput.selected_claims.length,401);
 assert.equal(final.finalOutput.excluded_claims.length,0);
 assert.equal(new Set(final.finalOutput.selected_claims.map(x=>x.claim_id)).size,401);
 assert.equal(final.progress.completed,11);
 assert.equal(batchIo.state.completed.length,11);
 assert.equal(calls.length,12); // 11 batches + 1 cross-batch global review.
 assert.ok(batchIo.saves>=12);
 const previous=calls.length;
 const again=await runBatchedSynthesisPipeline({publicationCostControl:cost},{...f,batchIo,fns});
 assert.equal(again.status,'AUTO_READY');
 assert.equal(calls.length,previous); // NO paid repeats, even after crash/restart.
});

test('the global model receives ALL original science while emitting only concise framing',()=>{
 const f=fixture(),chunks=splitSynthesisEvidence(f.evidenceBundle);
 const completed=chunks.map(chunk=>({index:chunk.index,claim_ids:chunk.claim_ids,
  output:{selected_claims:chunk.evidence.claims.map(c=>({
    claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'supporting_context',
    reason:'Source evidence within documented study boundaries.',
  })),excluded_claims:[]}}));
 const req=buildGlobalEvidenceRequest({...f,completed,schema:{type:'object',properties:{},required:[]}});
 const body=buildPublicationRequestBody({},req);
 const wire=new TextEncoder().encode(JSON.stringify({...body,stream:true})).length;
 assert.ok(wire+1024<PUBLICATION_INPUT_TOKEN_LIMIT,'Global cross-batch request cannot exceed fixed input guard');
 const data=JSON.parse(req.userContent);
 assert.equal(data.original_evidence_bundle.claims.rows.length,401);
 assert.equal(data.original_evidence_bundle.sources.rows.length,101);
 assert.equal(data.prior_selected_claim_ids.length,401);
 assert.deepEqual(data.required_synthesis_flags,[flag]);
 assert.match(req.system,/cross-batch contradictions/i);
 assert.match(req.system,/HUMAN_REVIEW/);
 const result=assembleBatchSynthesis({topic_slug:f.topic_slug,pageIntent:f.pageIntent,v1Result:f.v1Result,
  evidenceBundle:f.evidenceBundle,chunks,completed,globalOutput:mockGlobal()});
 assert.equal(result.validation.valid,true,JSON.stringify(result.validation.violations));
});

test('global cross-batch conflict cannot be hidden by excluding only one opposing claim',()=>{
 const f=fixture(),chunks=splitSynthesisEvidence(f.evidenceBundle);
 const completed=chunks.map(chunk=>({index:chunk.index,claim_ids:chunk.claim_ids,
  output:{selected_claims:chunk.evidence.claims.map(c=>({
    claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'supporting_context',
    reason:'Source evidence assessed with limitations.',
  })),excluded_claims:[]}}));
 const unsafe=mockGlobal();
 unsafe.disposition_adjustments=[{claim_id:'claim-000',disposition:'EXCLUDED',role:'NOT_APPLICABLE',
  reason_code:'UNRESOLVED_NON_CORE_CONFLICT',
  reason:'Conflicts with a finding with the same population and question.',
  related_conflict_claim_ids:['claim-001']}];
 const result=assembleBatchSynthesis({...f,chunks,completed,globalOutput:unsafe});
 assert.equal(result.validation.valid,false);
 assert.ok(result.validation.violations.some(s=>s.startsWith('NON_CORE_CONFLICT_ONE_SIDED_EXCLUSION')));
});

test('a malformed saved checkpoint fails closed without starting any model request',async()=>{
 const f=fixture(),io=makeIo();const fake=createFakeProviders();let bad=0;
 const first=await runBatchedSynthesisPipeline({publicationCostControl:createPublicationCostControl()},{
  ...f,batchIo:io,fns:fake.fns});
 assert.equal(first.status,'SYNTHESIS_IN_PROGRESS');
 const snapshot=io.state;
 const corrupted={...snapshot,completed:[{...snapshot.completed[0],claim_ids:['invented']}]};
 const brokenIo={...io,load:async()=>corrupted};
 await assert.rejects(
  runBatchedSynthesisPipeline({publicationCostControl:createPublicationCostControl()},{
    ...f,batchIo:brokenIo,fns:{chunkFn:async()=>{bad++;throw Error('must not spend')}}}),
  /INVALID_BATCH_CHECKPOINT/);
 assert.equal(bad,0);
});

test('durable checksum protects source revision and detects corrupted on-disk progress',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'aimt-batched-'));
 try{
  const io=createSynthesisProgressIo(root),f=fixture();
  const fingerprint=io.fingerprint(f);
  const state={version:'publication-batches-v1',fingerprint,total:11,completed:[],failures:{},global:null};
  await io.save({topic_slug:f.topic_slug,fingerprint,progress:state});
  assert.deepEqual(await io.load({topic_slug:f.topic_slug,fingerprint}),state);
  await assert.rejects(io.load({topic_slug:f.topic_slug,fingerprint:'0'.repeat(64)}),/STALE_BATCH_EVIDENCE/);
  const file=path.join(root,f.topic_slug,'synthesis-progress.json'),doc=JSON.parse(readFileSync(file,'utf8'));
  doc.total=10;writeFileSync(file,JSON.stringify(doc));
  await assert.rejects(io.load({topic_slug:f.topic_slug,fingerprint}),/INVALID_BATCH_CHECKPOINT/);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('failed batch calls are capped; a preflight financial block consumes zero attempts',async()=>{
 const f=fixture(),io=makeIo(),noCost={};
 let sent=0;
 const badFn=async()=>{sent++;return {ok:false,reason:'invalid_response',diagnostics:{attempts:1}};};
 for(let i=0;i<2;i++){
  const r=await runBatchedSynthesisPipeline(noCost,{...f,batchIo:io,fns:{chunkFn:badFn}});
  assert.equal(r.status,'SYNTHESIS_FAILED');
 }
 const final=await runBatchedSynthesisPipeline(noCost,{...f,batchIo:io,fns:{chunkFn:badFn}});
 assert.equal(final.reason,'batch_retry_ceiling');
 assert.equal(sent,2);
 const fresh=makeIo();
 const preflight=await runBatchedSynthesisPipeline(noCost,{...f,batchIo:fresh,fns:{
  chunkFn:async()=>({ok:false,reason:'budget_exceeded',diagnostics:{code:'SPEND_LIMIT',attempts:0}}),
 }});
 assert.equal(preflight.status,'SYNTHESIS_IN_PROGRESS');
 assert.equal(preflight.reason,'budget_pause');
 assert.equal(fresh.state.failures['0'],0);
});

test('production orchestration migrates failed 401-claim attempt and resumes checkpoint without new planner calls',async()=>{
 const f=fixture();
 const pool={claims:f.evidenceBundle.claims.map(c=>({...c,topics:[v1Topic]})),sources:f.evidenceBundle.sources};
 const concept=getPublicationConcept(v1Topic);
 const fingerprint=topicAttemptFingerprint(concept,selectTopicEvidenceFromRows(concept.controlled_topics,pool));
 let savedAttempt={version:'education-topic-attempt-v1',fingerprint,attempts:2,
   state:'INVALID_RESPONSE',cooldown_until:'2030-01-01T00:00:00.000Z'};
 const batchIo=makeIo();
 const intent={topic_slug:v1Topic,page_concept:pageIntent.page_concept,
   public_intent:pageIntent.public_intent,route_slug:concept.route_slug,
   in_scope_concepts:pageIntent.in_scope_concepts,
   out_of_scope_concepts:['diagnosis of an individual case','treatment or medication protocols'],
   practitioner_relevance:'Scientific knowledge for professional observation.',
   cluster:concept.cluster,risk_context:'LOWER risk, education only.'};
 let chunkCalls=0,plannerCalls=0;
 const opts={topicSlug:v1Topic,publishedTopicSlugs:[],pagesPublishedThisWeek:0,
   mode:'autonomous',continuation:true,budgetWindow:'2026-10-20T14:00:00.000Z',fns:{
     checkFreshnessFn:async()=>[],
     fetchEvidenceFn:async()=>pool,
     loadTopicAttemptFn:()=>savedAttempt,
     writeTopicAttemptFn:(_slug,doc)=>{savedAttempt=structuredClone(doc)},
     loadTopicIntentFn:()=>intent,
     loadCandidateBundleFn:()=>({found:false,bundle:null}),
     writeCandidateBundleFn:()=>{},
     hasSynthesisProgressFn:()=>!!batchIo.state,
     createSynthesisProgressIoFn:()=>batchIo,
     planIntentFn:async()=>{plannerCalls++;throw Error('validated saved intent must be reused')},
     chunkFn:async(_env,{chunk})=>{
       chunkCalls++;
       return {ok:true,modelInfo:{modelName:'claude-sonnet-5'},diagnostics:{attempts:1},
         usage:{input_tokens:1000,output_tokens:300},
         output:{selected_claims:chunk.evidence.claims.map(c=>({
           claim_id:c.claim_id,role:c.claim_type==='limitation'?'limitation':'supporting_context',
           reason:'Original evidence reviewed, source and uncertainty retained.'})),excluded_claims:[]}};
     },
   }};
 const env={ANTHROPIC_EDUCATION_WRITER_API_KEY:'fake-model',ANTHROPIC_PUBLICATION_EDITOR_API_KEY:'fake-model',
   SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake'};
 const run1=await runDecisionPipeline(env,opts);
 assert.equal(run1.final_state,'SYNTHESIS_IN_PROGRESS',JSON.stringify({
   state:run1.final_state,reason:run1.exception_reason,selection:run1.selection_reason,
   candidates:run1.candidate_topics.slice(0,3)
 }));
 assert.equal(run1.publication_editor_result.progress.completed,2);
 assert.equal(savedAttempt.attempts,1,'legacy 2 failures migrate just once, not a perpetual allowance');
 assert.equal(savedAttempt.batch_protocol,'publication-batches-v1');
 assert.equal(savedAttempt.state,'SYNTHESIS_IN_PROGRESS');
 assert.equal(chunkCalls,2);
 assert.equal(plannerCalls,0);
 const run2=await runDecisionPipeline(env,{...opts,budgetWindow:'2026-10-21T14:00:00.000Z'});
 assert.equal(run2.final_state,'SYNTHESIS_IN_PROGRESS');
 assert.equal(run2.publication_editor_result.progress.completed,4);
 assert.equal(savedAttempt.attempts,1);
 assert.equal(chunkCalls,4);
 assert.equal(batchIo.state.completed.length,4);
 assert.equal(new Set(batchIo.state.completed.flatMap(x=>x.claim_ids)).size,160);
});

test('global review fits original input ceiling at actual 217386-byte Trichology evidence scale',()=>{
 const f=fixture(),encode=()=>buildPublicationRequestBody({},buildSynthesisRequest({},{
  topic_slug:f.topic_slug,pageIntent:f.pageIntent,evidenceBundle:f.evidenceBundle,
  synthesisRequiredFlags:[flag],
 }));
 const wire=body=>new TextEncoder().encode(JSON.stringify({...body,stream:true})).length;
 const originalSize=wire(encode()),target=217386;
 const padding=Math.max(0,target-originalSize);
 for(let i=0;i<f.evidenceBundle.claims.length;i++){
  const amount=Math.floor(padding/401)+(i<padding%401?1:0);
  f.evidenceBundle.claims[i].claim_text+='x'.repeat(amount);
 }
 assert.ok(wire(encode())>=target);
 const chunks=splitSynthesisEvidence(f.evidenceBundle);
 const completed=chunks.map(chunk=>({index:chunk.index,claim_ids:chunk.claim_ids,
  output:{selected_claims:chunk.evidence.claims.map(c=>({claim_id:c.claim_id,
   role:c.claim_type==='limitation'?'limitation':'supporting_context',
   reason:'Study source, population and uncertainty preserved.'})),excluded_claims:[]}}));
 const global=buildPublicationRequestBody({},buildGlobalEvidenceRequest({
  ...f,completed,schema:{type:'object',properties:{},required:[]},
 }));
 const bytes=wire(global);
 assert.ok(bytes+1024<PUBLICATION_INPUT_TOKEN_LIMIT,
   'The original complete global evidence request must fit unchanged preflight, got '+bytes);
 const budget=createPublicationCostControl();
 budget.reserve({...global,stream:true});
 assert.equal(budget.summary().requests,1);
 console.log('Full-corpus global analysis input bytes at real evidence scale: '+bytes);
});
