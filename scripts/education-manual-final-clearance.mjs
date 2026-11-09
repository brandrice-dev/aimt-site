import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {gunzipSync} from 'node:zlib';
import {createManualReviewAllowance} from './_lib/education-manual-review-allowance.mjs';
import {buildSynthesisRequest,buildPublicationRequestBody} from '../functions/_lib/research/publication-synthesis-client.mjs';
import {fetchPublicationMessages} from '../functions/_lib/research/publication-anthropic-transport.mjs';
import {extractAnthropicTextSafe} from '../functions/_lib/cadence/anthropic-response.mjs';
import {validateSynthesisOutput,determineShadowDisposition} from '../functions/_lib/research/publication-synthesis-validator.mjs';
import {buildPageEvidenceBrief} from '../functions/_lib/research/publication-synthesis-evidence.mjs';
import {buildEvidenceFingerprintArtifact} from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import {buildAutoReadyClearanceRecord} from '../functions/_lib/research/publication-clearance.mjs';
import {validateEducationPagePlan} from '../functions/_lib/education-ops/education-page-plan-validator.mjs';
import {collectAllProseUnits} from '../functions/_lib/education-ops/education-page-plan-schema.mjs';
import {REVIEWER_OUTPUT_JSON_SCHEMA,buildReviewerInstruction} from '../functions/_lib/education-ops/education-reviewer-schema.mjs';
import {aggregateReviewOutcome} from '../functions/_lib/education-ops/education-reviewer-validator.mjs';
import {callEducationOpsModel} from '../functions/_lib/education-ops/education-ops-client-base.mjs';
import {EDUCATION_OPS_ROLES} from '../functions/_lib/education-ops/education-ops-model-config.mjs';
const e=process.env,dir='research-import/manual-final-clearance',hash=x=>createHash('sha256').update(x).digest('hex');
if(e.APPROVE_REVIEW!=='true'||e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.GITHUB_REPOSITORY!=='brandrice-dev/aimt-site'||e.CANDIDATE_HEAD!=='d6e2a4d8f5190eddd8748fd6f2cebf9ed0ff4220')throw Error('APPROVAL_MISMATCH');
const api=p=>JSON.parse(execFileSync('gh',['api','repos/brandrice-dev/aimt-site/'+p],{maxBuffer:8e6}));if(api('pulls/154').head.sha!==e.CANDIDATE_HEAD)throw Error('STALE_CANDIDATE');
if(api('actions/artifacts?name=manual-final-clearance-2026-11-09&per_page=100').artifacts.length)throw Error('FINAL_TASK_ALREADY_ATTEMPTED');
const prior=api('actions/artifacts/13692581510');if(prior.workflow_run.id!==42656743128)throw Error('COST_ARCHIVE_IDENTITY');
const zip=execFileSync('gh',['api','repos/brandrice-dev/aimt-site/actions/artifacts/13692581510/zip'],{maxBuffer:2e6});if(hash(zip)!=='9d6b558ce1459b7d7761512345768821346858413c464ea103e4d9a6cba505e7')throw Error('COST_ARCHIVE_DIGEST');
const previous=JSON.parse(execFileSync('python3',['-c',"import zipfile,io,sys;sys.stdout.buffer.write(zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())).read('cost.json'))"],{input:zip}));
mkdirSync(dir,{recursive:true});const save=(n,o)=>writeFileSync(dir+'/'+n+'.json',JSON.stringify(o,null,2));const ledger=createManualReviewAllowance({previous,persist:s=>save('cost',s)});save('cost',ledger.summary());
const packet=Buffer.from(readFileSync('private-review/reviews/manual-final-clearance-2026-11-09.packet.b64','utf8').trim(),'base64');if(hash(packet)!==e.PACKET_SHA256)throw Error('INPUT_PACKET_DIGEST');const inputs=JSON.parse(gunzipSync(packet));
const prepared=[];
for(const b of inputs){
 const req=buildSynthesisRequest(e,{topic_slug:b.plan.topic_slug,evidenceBundle:b.evidenceBundle,pageIntent:b.intent,synthesisRequiredFlags:b.v1.synthesis_packet.synthesis_required_flags});
 req.system+='\nThe evidence bundle includes a proposed Page Plan, not approved science. Verify every scientific teaching statement against verified claim text and the supplied original primary excerpts. Include every entailed factual prose unit from the proposed plan as a separate core_point using its exact text when scientifically supportable; include verified limitations separately. Do not copy unsupported text. Preserve all claim dispositions and required signals. This request is bounded to the page-specific evidence supplied, not a whole-topic corpus.';
 const body=buildPublicationRequestBody(e,{...req,maxTokens:16000});
 const {data,diagnostics}=await fetchPublicationMessages({apiKey:e.ANTHROPIC_PUBLICATION_EDITOR_API_KEY,costControl:ledger,body});
 if(data.stop_reason==='max_tokens')throw Error('SYNTHESIS_TRUNCATED_STOP');const output=JSON.parse(extractAnthropicTextSafe(data));
 const validation=validateSynthesisOutput({v1Result:b.v1,evidenceBundle:b.evidenceBundle,aiOutput:output});const disposition=determineShadowDisposition({v1Result:b.v1,callFailed:false,aiOutput:output,validation});
 save(b.plan.topic_slug+'-synthesis',{input_packet_sha256:hash(packet),candidate_head:e.CANDIDATE_HEAD,output,validation,disposition,usage:data.usage,diagnostics});console.log(JSON.stringify({topic:b.plan.topic_slug,stage:'synthesis',status:disposition.status,violations:validation.violations,usage:data.usage}));
 if(disposition.status!=='AUTO_READY')continue;
 const brief=buildPageEvidenceBrief({v1Result:b.v1,pageIntent:b.intent,evidenceBundle:b.evidenceBundle,aiOutput:output,modelInfo:{provider:'anthropic',modelName:body.model},validatorVersion:'publication-synthesis-v1'});
 const fingerprint=await buildEvidenceFingerprintArtifact(b.plan.topic_slug,brief);const clearance=buildAutoReadyClearanceRecord({topicSlug:b.plan.topic_slug,controlledTopic:b.plan.topic_slug,v1Result:b.v1,pipelineStatus:disposition.status,pageEvidenceBrief:brief,fingerprintArtifact:fingerprint});
 const plan=structuredClone(b.plan),points=[...brief.core_factual_points,...brief.limitations];
 const overlap=(a,b)=>{const aa=new Set(a.toLowerCase().match(/[a-z]+/g)||[]),bb=new Set(b.toLowerCase().match(/[a-z]+/g)||[]);return [...aa].filter(x=>bb.has(x)).length/(aa.size+bb.size||1);};
 for(const {unit} of collectAllProseUnits(plan)){
  if(unit.kind==='FRAMING')continue;
  const matches=points.filter(p=>p.supporting_claim_ids.some(id=>unit.supporting_claim_ids.includes(id)));if(!matches.length)continue;
  matches.sort((a,b)=>overlap(unit.text,b.statement)-overlap(unit.text,a.statement));
  unit.source_statements=matches.map(p=>p.statement);
  if(unit.kind==='VERBATIM'){unit.text=matches[0].statement;unit.supporting_claim_ids=[...matches[0].supporting_claim_ids];unit.source_statements=[unit.text];}
 }
 plan.scope_note=brief.scope_language.scope_note;plan.limitations=brief.limitations.map(p=>({kind:'VERBATIM',text:p.statement,supporting_claim_ids:p.supporting_claim_ids,source_statements:[p.statement]}));
 const actual=validateEducationPagePlan(plan,fingerprint.input,{expectedTopicSlug:plan.topic_slug,expectedCluster:plan.cluster,expectedRoute:plan.route});save(plan.topic_slug+'-prepared',{plan,brief,fingerprint,clearance,validation:actual,input_packet_sha256:hash(packet)});console.log(JSON.stringify({topic:plan.topic_slug,stage:'plan_validation',valid:actual.valid,violations:actual.violations}));if(actual.valid)prepared.push({plan,brief,fingerprint,clearance,intent:b.intent});
}
if(!prepared.length)throw Error('NO_CANDIDATE_PASSED_SCIENCE_AND_PLAN_GATES');
const schema={type:'object',properties:{reviews:{type:'array',items:{type:'object',properties:{topic_slug:{type:'string'},...REVIEWER_OUTPUT_JSON_SCHEMA.properties},required:['topic_slug',...REVIEWER_OUTPUT_JSON_SCHEMA.required],additionalProperties:false}}},required:['reviews'],additionalProperties:false};
const system=prepared.map(x=>buildReviewerInstruction({plan:x.plan,clearedSnapshot:x.fingerprint.input,intentPlan:x.intent})).join('\n\nNEXT INDEPENDENT ARTICLE:\n')+'\nReturn exactly one review for each supplied topic. Return exactly one verdict per PARAPHRASE/FRAMING location; never omit or duplicate a location. You did not author these articles. These are exact evidence-cleared proposals, not prior rejected drafts.';
const result=await callEducationOpsModel({...e,publicationCostControl:ledger},{role:EDUCATION_OPS_ROLES.REVIEWER,system,userContent:JSON.stringify(prepared.map(x=>({topic_slug:x.plan.topic_slug,locations:collectAllProseUnits(x.plan).filter(x=>['PARAPHRASE','FRAMING'].includes(x.unit.kind)).map(x=>({location:x.location,kind:x.unit.kind}))}))),schema,maxTokens:16000,effort:'medium',callLabel:'ManualFinalBatchReviewer'});
save('editorial-review',result);if(!result.ok)throw Error('EDITORIAL_REVIEW_FAILED_STOP');if(result.output.reviews.length!==prepared.length)throw Error('REVIEW_TOPIC_COVERAGE');
for(const b of prepared){const reviews=result.output.reviews.filter(x=>x.topic_slug===b.plan.topic_slug);if(reviews.length!==1)throw Error('REVIEW_TOPIC_DUPLICATE');const out=reviews[0];for(const [kind,field] of [['PARAPHRASE','paraphrase_reviews'],['FRAMING','framing_reviews']]){const expected=collectAllProseUnits(b.plan).filter(x=>x.unit.kind===kind).map(x=>x.location).sort(),actual=out[field].map(x=>x.location).sort();if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('REVIEW_UNIT_COVERAGE');}const verdict=aggregateReviewOutcome(out);save(b.plan.topic_slug+'-final',{...b,review:out,verdict,reviewed_plan_sha256:hash(JSON.stringify(b.plan)),run_id:e.GITHUB_RUN_ID,cost:ledger.summary(),candidate_head:e.CANDIDATE_HEAD,input_packet_sha256:hash(packet)});console.log(JSON.stringify({topic:b.plan.topic_slug,stage:'editorial',verdict}));}
