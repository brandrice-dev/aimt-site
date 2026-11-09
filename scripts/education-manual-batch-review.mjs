import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {callEducationOpsModel} from '../functions/_lib/education-ops/education-ops-client-base.mjs';
import {EDUCATION_OPS_ROLES} from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import {createManualReviewAllowance} from './_lib/education-manual-review-allowance.mjs';
const e=process.env, task='manual-article-batch-2026-11-09',dir='research-import/manual-batch-review';
if(e.APPROVE_REVIEW!=='true'||e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.GITHUB_REPOSITORY!=='brandrice-dev/aimt-site'||e.CANDIDATE_HEAD!=='d6e2a4d8f5190eddd8748fd6f2cebf9ed0ff4220')throw Error('APPROVAL_OR_CANDIDATE_MISMATCH');
const data=Buffer.from(readFileSync('private-review/reviews/manual-article-batch-2026-11-09.packet.b64','utf8').trim(),'base64');
if(createHash('sha256').update(data).digest('hex')!==e.PACKET_SHA256)throw Error('PACKET_DIGEST_MISMATCH');
const proposals=JSON.parse(gunzipSync(data));
const api=p=>JSON.parse(execFileSync('gh',['api',`repos/brandrice-dev/aimt-site/${p}`],{maxBuffer:10e6}));
if(api('pulls/154').head.sha!==e.CANDIDATE_HEAD)throw Error('STALE_CANDIDATE');
const priorArtifact=api('actions/artifacts/13690823512'); if(priorArtifact.workflow_run.id!==42654391453||priorArtifact.name!=='manual-batch-review-2026-11-09-visual-continuation')throw Error('PRIOR_REVIEW_IDENTITY'); const archive=execFileSync('gh',['api','repos/brandrice-dev/aimt-site/actions/artifacts/13690823512/zip'],{maxBuffer:2e6}); if(createHash('sha256').update(archive).digest('hex')!=='1be60a8a8ec05081e358337c218943e9b9223e2f205d1e36487c40b7601d2cdb')throw Error('PRIOR_REVIEW_DIGEST'); mkdirSync(dir,{recursive:true}); execFileSync('python3',['-c',"import zipfile,io,sys;z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));z.extractall('research-import/manual-batch-review')"],{input:archive});
mkdirSync(dir,{recursive:true});
// Restore exact aggregate cost; owner-approved ceiling is $5/ten requests. Dispatch requires revised-probe reauthorization after TOKEN_LIMIT.
const ledger=createManualReviewAllowance({previous:JSON.parse(readFileSync(dir+'/cost.json')),persist:s=>writeFileSync(dir+'/cost.json',JSON.stringify({task,...s},null,2))});
const schema={type:'object',properties:{outcome:{type:'string',enum:['PASS','FAIL']},summary:{type:'string'},issues:{type:'array',items:{type:'object',properties:{location:{type:'string'},severity:{type:'string',enum:['blocking','minor']},reason:{type:'string'},required_change:{type:'string'}},required:['location','severity','reason','required_change'],additionalProperties:false}},source_verification_limits:{type:'string'}},required:['outcome','summary','issues','source_verification_limits'],additionalProperties:false};
let failed=false;
async function review(name,content,system){
 const result=await callEducationOpsModel({...e,publicationCostControl:ledger},{role:EDUCATION_OPS_ROLES.REVIEWER,system,userContent:content,schema,maxTokens:8000,effort:'medium',callLabel:name});
 writeFileSync(`${dir}/${name}.json`,JSON.stringify({task,candidate_head:e.CANDIDATE_HEAD,reviewed_at:new Date().toISOString(),...result},null,2));
 console.log(JSON.stringify({name,ok:result.ok,outcome:result.output?.outcome,usage:result.usage}));
 if(!result.ok)throw Error('REVIEW_REQUEST_FAILED_STOP_NO_RETRY');
 if(result.output.outcome!=='PASS')failed=true;
}
// Exact three prior article FAIL results retained; no repeated text calls.
failed=true;
const groups=[['immune-and-surfactant',['alopecia-areata-immune-rendering.webp','how-surfactants-clean.webp']]];
for(const [name,files] of groups){
 const content=[{type:'text',text:'Independently review the attached proposed scientific teaching illustrations and labels for correctness and misleading visual implications. They will be shown in practitioner educational articles, labeled simplified and not diagnostic. Review exact supplied images, not the prompt. Identify any anatomy, cycle, microbiology, immunology or surfactant-orientation error. Use FAIL for scientific blocking errors. Cosmetic preference alone is minor. Captions will explain exogen can overlap cycling, microbial numbers are illustrative, immune privilege is not a literal shield, and the surfactant oil droplet is not a micelle.'}];
 for(const file of files){const b=execFileSync('convert',[`assets/images/education/${file}`,'-resize','600x750>','-quality','65','jpeg:-'],{maxBuffer:2e6});content.push({type:'text',text:file},{type:'image',source:{type:'base64',media_type:'image/jpeg',data:b.toString('base64')}});}
 if(new TextEncoder().encode(JSON.stringify(content)).length+12000>=235000)throw Error('REVISED_IMAGE_PREFLIGHT_FAILED_NO_CALL');
 await review(name,content,'You are an independent scientific visual reviewer. Report factual errors and misleading representations. Return structured PASS or FAIL with concrete issues. Do not assume a realistic rendering is scientifically accurate. No treatment advice.');
}
writeFileSync(dir+'/summary.json',JSON.stringify({task,candidate_head:e.CANDIDATE_HEAD,review_only:true,outcome:failed?'FAIL':'PASS',cost:ledger.summary(),no_publication_clearance_asserted:true},null,2));
if(failed)process.exitCode=1;
