import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicationCostControl} from '../functions/_lib/research/publication-cost-control.mjs';
import {repairRoutinePagePlanViolations} from '../functions/_lib/education-ops/education-page-plan-repair.mjs';
import {verifiedAbstractBatch,researchAssignment,executeResearchGap,discoverResearchNeed} from '../scripts/_lib/education-research-gap-executor.mjs';
import {repairReviewerEvidenceFailures} from '../functions/_lib/education-ops/education-reviewer-framing-repair.mjs';
import {classifyRecovery,runAutonomousCycle} from '../scripts/education-autonomous-cycle.mjs';
import {ensureCandidateHeadTests,verifyCandidateHeadTests,requiresWorkflowApproval,PUBLICATION_TEST_WORKFLOW,PUBLICATION_TEST_JOB} from '../scripts/_lib/education-candidate-checks.mjs';
import {PUBLICATION_CONCEPTS} from '../functions/_lib/education-ops/education-publication-registry.mjs';
const body={model:'claude-sonnet-5',max_tokens:1000};
test('cost reservations survive a crash or new workflow; subscriptions persist before a request',()=>{
 let saved,order=[];
 const first=createPublicationCostControl({persist:s=>{saved=s;order.push('chain');}});
 first.setPersistence(()=>order.push('topic'));first.reserve(body);
 assert.deepEqual(order,['chain','topic']);assert.equal(saved.requests_with_unknown_usage,1);
 const second=createPublicationCostControl({previous:saved});
 assert.equal(second.summary().requests,1);
 for(let i=0;i<5;i++)second.reserve(body);
 assert.throws(()=>second.reserve(body),e=>e.code==='SPEND_LIMIT');
 const third=createPublicationCostControl({previous:second.summary()});
 assert.throws(()=>third.reserve(body),e=>e.code==='SPEND_LIMIT');
 assert.throws(()=>createPublicationCostControl({previous:{requests:0}}),/INVALID_DURABLE/);
});
test('safe duplicate repair removes only an identical grounded section unit, retaining limitations and support',()=>{
 const unit={kind:'VERBATIM',text:'Exact cleared fact.',supporting_claim_ids:['c1'],source_statements:['Exact cleared fact.']};
 const plan={answer_summary:unit,sections:[{section_id:'s',heading:'S',units:[structuredClone(unit),{kind:'FRAMING',text:'Context.',supporting_claim_ids:[],source_statements:[]}]}],limitations:[structuredClone(unit)],key_takeaways:[{...unit,text:'Takeaway'}]};
 const repaired=repairRoutinePagePlanViolations(plan,{},['DUPLICATE_FACTUAL_TEXT:section:s:0==answer_summary']);
 assert.equal(repaired.repairedPlan.sections[0].units.length,1);assert.equal(plan.sections[0].units.length,2);
 assert.deepEqual(repaired.repairedPlan.limitations,plan.limitations);
 const unsupported=structuredClone(plan);unsupported.sections[0].units[0].supporting_claim_ids=['c2'];
 assert.equal(repairRoutinePagePlanViolations(unsupported,{},['DUPLICATE_FACTUAL_TEXT:section:s:0==answer_summary']).repairReport.attempted,false);
 assert.equal(repairRoutinePagePlanViolations(plan,{},['UNKNOWN_CLAIM_ID:c1']).repairReport.attempted,false);
});
const concept=PUBLICATION_CONCEPTS.find(c=>c.autonomously_selectable && c.topic_slug==='hair-biology');
const gap={queue_id:'publication_evidence_gap:hair-biology',lane:'publication_evidence_gap',item_id:'hair-biology',status:'pending',extras:{baseline_candidate_claim_ids:[],gap_summary:'Missing verified sources on follicle biology'}};
const paper={source:'MED',id:'123',title:'Hair follicle study',doi:'10.1/real',abstractText:'In this experimental mouse study, follicle structure was examined. Findings were confined to this model and do not establish clinical effectiveness.',pubYear:'2025',pubTypeList:{pubType:['Journal Article']}};
test('research keeps the complete retrieved abstract and scope, never fabricated claims or institutional approval',()=>{
 const assignment=researchAssignment(gap), batch=verifiedAbstractBatch([paper,{...paper,source:'PPR'},{...paper,id:'124',isRetracted:'Y'}],assignment);
 assert.equal(batch.claims.length,1);assert.equal(batch.claims[0].claim_text,paper.abstractText);
 assert.equal(batch.claims[0].verification_status,'CLAIM_VERIFIED');assert.equal(batch.sources[0].verification_depth,'abstract');
 assert.equal(batch.claims[0].acquisition.scientific_review_required,true);
 assert.equal(verifiedAbstractBatch([paper],assignment).claims[0].claim_id,batch.claims[0].claim_id);
 const known=verifiedAbstractBatch([paper],assignment,new Map([[paper.doi,'existing-curated-source']]));
 assert.equal(known.sources.length,0);assert.equal(known.claims[0].source_id,'existing-curated-source');
 assert.throws(()=>researchAssignment({...gap,lane:'other'}));
});
test('real executor boundary ingests only independently refetched evidence and reassesses the original gap',async()=>{
 let written=0,marked=0,reads=0,saved=[];
 const io={fetchEvidence:async()=>{reads++;return{claims:reads>1?[{claim_id:verifiedAbstractBatch([paper],researchAssignment(gap)).claims[0].claim_id,claim_text:paper.abstractText,verification_status:'CLAIM_VERIFIED',topics:concept.controlled_topics}]:[],sources:[]}},fetchPublished:async()=>[],listGaps:async()=>[gap],
  dois:async()=>new Map(),search:async()=>({records:[paper],nextCursorMark:'next'}),verifyPaper:async p=>p,
  ingest:async(e,b)=>{written++;assert.equal(b.claims[0].claim_text,paper.abstractText);return{ok:true,accepted:{claims:1,sources:1},quarantined:{claims:0,sources:0}}},markReceived:async()=>{marked++;}};
 const state={};const result=await executeResearchGap({},state,s=>saved.push(structuredClone(s)),io);
 assert.equal(result.state,'RESEARCH_RECEIVED');assert.equal(marked,1);assert.equal(written,1);assert.equal(reads,2);
 assert.equal(saved[0][researchAssignment(gap).key].state,'SEARCH_RESERVED');
 const rejected=await executeResearchGap({}, {},()=>{}, {...io,verifyPaper:async()=>null});
 assert.equal(rejected.accepted.claims,0);assert.equal(written,1);
});
test('routine content/provider errors advance, while auth, scientific and spend gates stay explicit',()=>{
 assert.equal(classifyRecovery({final_state:'EDITORIAL_REVIEW',writer_result:{valid:false}}),'REPAIR_WRITER');
 assert.equal(classifyRecovery({final_state:'HUMAN_REVIEW'}),'DEFER_TOPIC');
 assert.equal(classifyRecovery({final_state:'CONFIG_BLOCKED',exception_reason:'Writer call failed: budget_exceeded'}),'BUDGET_PAUSED');
 assert.equal(classifyRecovery({final_state:'CONFIG_BLOCKED',provider_request_diagnostics:{http_status:401}}),'AUTHORIZATION_REQUIRED');
 assert.equal(classifyRecovery({final_state:'INFRA_REVIEW'}),'SAFETY_REVIEW');
});
test('a resumed controller retains cumulative spend and a precise next action instead of starting a new allowance',async()=>{
 const previous=createPublicationCostControl();previous.reserve(body);let checkpoint;
 const state={version:'education-continuation-v1',chain_id:'first',executions:1,cost_control:previous.summary(),deferred:{},research:{},history:[],next_topic:'hair-biology'};
 const report=await runAutonomousCycle({GITHUB_REPOSITORY:'brandrice-dev/aimt-site',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ID:'second',AIMT_EDUCATION_AUTOPUBLISH_ENABLED:'false'},
  {loadBundle:()=>({found:false}),readState:()=>state,writeState:s=>{checkpoint=structuredClone(s)},published:async()=>[],
   run:async(e,o)=>{assert.equal(o.costControl.summary().requests,1);o.costControl.reserve(body);return{final_state:'EDITORIAL_REVIEW',selected_topic:'hair-biology',writer_result:{valid:false}}},
   research:async()=>({state:'NO_RESEARCH_GAP'}),report:()=>{}});
 assert.equal(checkpoint.cost_control.requests,2);assert.equal(report.autonomous_controller.next_action,'REPAIR_WRITER');
 assert.equal(report.autonomous_controller.governed_publication_authorized,false);
});
test('bot CI dispatch is used only when checks are missing and never to evade required approval',async()=>{
 let dispatches=0,read=0;
 const result=await ensureCandidateHeadTests({}, {readFn:()=>++read===1?{ok:false,violations:['CANDIDATE_HEAD_TESTS_MISSING']}:{ok:true,violations:[]},dispatchFn:()=>{dispatches++}});
 assert.equal(result.ok,true);assert.equal(dispatches,1);
 await ensureCandidateHeadTests({}, {readFn:()=>({ok:false,violations:['GITHUB_WORKFLOW_APPROVAL_REQUIRED']}),dispatchFn:()=>{throw new Error('bypass')}});
});
test('dispatch attestation must identify the trusted main workflow, successful job and exact candidate head',()=>{
 const args={repo:'brandrice-dev/aimt-site',headSha:'a'.repeat(40),prNumber:80};
 const run={id:10,path:PUBLICATION_TEST_WORKFLOW,event:'workflow_dispatch',head_branch:'main',head_sha:'b'.repeat(40),repository:{full_name:args.repo},head_repository:{full_name:args.repo},status:'completed',conclusion:'success'};
 const proof={version:'education-head-tests-v1',repository:args.repo,pr_number:80,head_sha:args.headSha,run_id:10,workflow_source_sha:run.head_sha,workflow_ref:`${args.repo}/${PUBLICATION_TEST_WORKFLOW}@refs/heads/main`};
 const jobs=[{name:PUBLICATION_TEST_JOB,run_id:10,status:'completed',conclusion:'success'}];
 assert.equal(verifyCandidateHeadTests(run,jobs,args,proof).ok,true);
 for(const changes of [{head_sha:'c'.repeat(40)},{run_id:11},{workflow_ref:'untrusted'},{pr_number:81}])assert.equal(verifyCandidateHeadTests(run,jobs,args,{...proof,...changes}).ok,false);
 assert.equal(verifyCandidateHeadTests(run,[{...jobs[0],conclusion:'skipped'}],args,proof).ok,false);
});

test('Reviewer failures may be proposed for re-review only using exact uniquely cleared statements',()=>{
 const point={statement:'The follicle is often described as a mini-organ.',supporting_claim_ids:['c1']};
 const plan={answer_summary:{kind:'PARAPHRASE',text:'The follicle is a mini-organ.',supporting_claim_ids:['c1'],source_statements:[point.statement]},
   sections:[{section_id:'s',units:[{kind:'FRAMING',text:'It manages microbial life.',supporting_claim_ids:[],source_statements:[]}]}],limitations:[],key_takeaways:[]};
 const verdict={outcome:'SUBSTANTIVE_FAIL',voice_fail:false,scope_fail:true,failing_paraphrases:[{location:'answer_summary',verdict:'TOO_STRONG'}],failing_framings:[{verdict:'CARRIES_SCIENCE'}]};
 const result=repairReviewerEvidenceFailures(plan,{core_factual_points:[point]},verdict);
 assert.equal(result.eligible,true);assert.equal(result.repairedPlan.answer_summary.kind,'VERBATIM');assert.equal(result.repairedPlan.answer_summary.text,point.statement);
 assert.equal(result.removedUnitCount,1);assert.equal(verdict.scope_fail,true);assert.equal(plan.answer_summary.kind,'PARAPHRASE');
 assert.equal(repairReviewerEvidenceFailures(plan,{core_factual_points:[]},verdict).eligible,false);
 assert.equal(repairReviewerEvidenceFailures(plan,{core_factual_points:[point]}, {...verdict,failing_paraphrases:[{location:'guessed',verdict:'TOO_STRONG'}]}).eligible,false);
});
test('a bounded re-review can fit remaining reservations by reducing output ceiling, without changing the spend or request cap',()=>{
 const c=createPublicationCostControl({previous:{reserved_cost_estimate_usd:1.86674,reported_usage_cost_estimate_usd:.63,requests:5,requests_with_unknown_usage:0}});
 const max=c.maxAffordableOutputTokens(body,16000);assert.ok(max>1024 && max<16000);
 c.reserve({...body,max_tokens:max});assert.ok(c.summary().reserved_cost_estimate_usd<=2);
 assert.throws(()=>c.reserve(body),e=>e.code==='SPEND_LIMIT');
});

test('primary-source scarcity is derived from live record roles, never invented or used to weaken publication risk gates',()=>{
 const target=PUBLICATION_CONCEPTS.find(c=>c.topic_slug==='surfactants');
 const published=PUBLICATION_CONCEPTS.filter(c=>c.topic_slug!==target.topic_slug).map(c=>c.topic_slug);
 const pool={claims:Array.from({length:8},(_,i)=>({claim_id:`c${i}`,source_id:`s${i}`,topics:target.controlled_topics,
   claim_type:i===7?'limitation':'finding',claim_text:'A source-specific surfactant finding.',claim_origin:'primary_text',verification_status:'CLAIM_VERIFIED',use_status:'active'})),
 sources:Array.from({length:8},(_,i)=>({source_id:`s${i}`,title:'Independent surfactant review',year:2025,authors:['Author'],doi:`10.1000/${i}`,url:`https://example.org/${i}`,source_role:'synthesis',evidence_type:'systematic_review',verification_status:'SOURCE_VERIFIED',use_status:'active'}))};
 const missing=discoverResearchNeed(pool,published);
 assert.equal(missing.topic_slug,target.topic_slug);assert.equal(missing.primary_source_count,0);
 assert.match(missing.research_reason,/0 documented verified/);
 pool.sources[0].source_role='primary_research';
 assert.equal(discoverResearchNeed(pool,published),undefined);
});

 test('GitHub completed action-required conclusions halt alternate CI and publication',async()=>{
 const run={id:123,status:'completed',conclusion:'action_required',html_url:'https://github.com/brandrice-dev/aimt-site/actions/runs/123'};
 assert.equal(requiresWorkflowApproval(run),true);
 const gated=verifyCandidateHeadTests(run,[],{});
 assert.deepEqual(gated.violations,['GITHUB_WORKFLOW_APPROVAL_REQUIRED']);
 assert.equal(gated.run_url,run.html_url);
 const result=await ensureCandidateHeadTests({}, {readFn:()=>gated,dispatchFn:()=>{throw Error('approval bypass')}});
 assert.equal(result,gated);
 });
