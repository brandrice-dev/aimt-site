import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {callEducationOpsModel} from '../functions/_lib/education-ops/education-ops-client-base.mjs';
import {EDUCATION_OPS_ROLES} from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import {createPublicationCostControl} from '../functions/_lib/research/publication-cost-control.mjs';
const e=process.env, task='manual-article-batch-2026-11-09',dir='research-import/manual-batch-review';
if(e.APPROVE_REVIEW!=='true'||e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.GITHUB_REPOSITORY!=='brandrice-dev/aimt-site'||e.CANDIDATE_HEAD!=='7310ec23204b6dd1e2229ec62fb4fc1785c056fa')throw Error('APPROVAL_OR_CANDIDATE_MISMATCH');
const data=Buffer.from(readFileSync('private-review/reviews/manual-article-batch-2026-11-09.packet.b64','utf8').trim(),'base64');
if(createHash('sha256').update(data).digest('hex')!==e.PACKET_SHA256)throw Error('PACKET_DIGEST_MISMATCH');
const proposals=JSON.parse(gunzipSync(data));
const api=p=>JSON.parse(execFileSync('gh',['api',`repos/brandrice-dev/aimt-site/${p}`],{maxBuffer:10e6}));
if(api('pulls/154').head.sha!==e.CANDIDATE_HEAD)throw Error('STALE_CANDIDATE');
if(api('actions/artifacts?name=manual-batch-review-2026-11-09&per_page=100').artifacts.length)throw Error('TASK_ALREADY_ATTEMPTED_DO_NOT_RESET_ALLOWANCE');
mkdirSync(dir,{recursive:true});
// Existing $2/six-call allowance is stricter than the owner-approved $5/ten-call ceiling.
const ledger=createPublicationCostControl({persist:s=>writeFileSync(dir+'/cost.json',JSON.stringify({task,...s},null,2))});
const schema={type:'object',properties:{outcome:{type:'string',enum:['PASS','FAIL']},summary:{type:'string'},issues:{type:'array',items:{type:'object',properties:{location:{type:'string'},severity:{type:'string',enum:['blocking','minor']},reason:{type:'string'},required_change:{type:'string'}},required:['location','severity','reason','required_change'],additionalProperties:false}},source_verification_limits:{type:'string'}},required:['outcome','summary','issues','source_verification_limits'],additionalProperties:false};
let failed=false;
async function review(name,content,system){
 const result=await callEducationOpsModel({...e,publicationCostControl:ledger},{role:EDUCATION_OPS_ROLES.REVIEWER,system,userContent:content,schema,maxTokens:8000,effort:'medium',callLabel:name});
 writeFileSync(`${dir}/${name}.json`,JSON.stringify({task,candidate_head:e.CANDIDATE_HEAD,reviewed_at:new Date().toISOString(),...result},null,2));
 console.log(JSON.stringify({name,ok:result.ok,outcome:result.output?.outcome,usage:result.usage}));
 if(!result.ok)throw Error('REVIEW_REQUEST_FAILED_STOP_NO_RETRY');
 if(result.output.outcome!=='PASS')failed=true;
}
for(const proposal of proposals){
 await review(proposal.plan.topic_slug,JSON.stringify(proposal),'You are the independent scientific/editorial reviewer, not the author. Inspect this author-proposed educational article, every factual prose unit, cited claim mapping, source provenance, limitations and practitioner scope. No author-supplied status constitutes clearance. Proposed supplemental claims have not been independently verified; identify that explicitly. Evaluate entailment against supplied evidence, distinguish summaries from primary source extracts, detect overclaim, incorrect mechanisms, false numerical precision and unsupported scientific framing. Return FAIL when evidence is inadequate to independently clear publication, and list concrete blocking issues with locations. Never claim to have fetched or read an external source not included in this request. No rewriting the article, no manufacturing verification. PASS is only a scientific/editorial opinion on the inspected data and is not database publication clearance.');
}
const groups=[['hair-cycle',['hair-growth-cycle-rendering.webp']],['scalp-ecosystem',['scalp-ecosystem-rendering.webp']],['immune-and-surfactant',['alopecia-areata-immune-rendering.webp','how-surfactants-clean.webp']]];
for(const [name,files] of groups){
 const content=[{type:'text',text:'Independently review the attached proposed scientific teaching illustrations and labels for correctness and misleading visual implications. They will be shown in practitioner educational articles, labeled simplified and not diagnostic. Review exact supplied images, not the prompt. Identify any anatomy, cycle, microbiology, immunology or surfactant-orientation error. Use FAIL for scientific blocking errors. Cosmetic preference alone is minor. Captions will explain exogen can overlap cycling, microbial numbers are illustrative, immune privilege is not a literal shield, and the surfactant oil droplet is not a micelle.'}];
 for(const file of files){const b=execFileSync('convert',[`assets/images/education/${file}`,'-resize','600x750>','-quality','76','jpeg:-'],{maxBuffer:2e6});content.push({type:'text',text:file},{type:'image',source:{type:'base64',media_type:'image/jpeg',data:b.toString('base64')}});}
 await review(name,content,'You are an independent scientific visual reviewer. Report factual errors and misleading representations. Return structured PASS or FAIL with concrete issues. Do not assume a realistic rendering is scientifically accurate. No treatment advice.');
}
writeFileSync(dir+'/summary.json',JSON.stringify({task,candidate_head:e.CANDIDATE_HEAD,review_only:true,outcome:failed?'FAIL':'PASS',cost:ledger.summary(),no_publication_clearance_asserted:true},null,2));
if(failed)process.exitCode=1;
