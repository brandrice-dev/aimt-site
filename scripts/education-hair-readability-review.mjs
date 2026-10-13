import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyCandidateBundleIntegrity} from '../functions/_lib/education-ops/education-candidate-bundle.mjs';
import {validateEducationPagePlan} from '../functions/_lib/education-ops/education-page-plan-validator.mjs';
import {collectAllProseUnits} from '../functions/_lib/education-ops/education-page-plan-schema.mjs';
import {buildReviewerInstruction,REVIEWER_OUTPUT_JSON_SCHEMA} from '../functions/_lib/education-ops/education-reviewer-schema.mjs';
import {aggregateReviewOutcome} from '../functions/_lib/education-ops/education-reviewer-validator.mjs';
import {callEducationOpsModel} from '../functions/_lib/education-ops/education-ops-client-base.mjs';
import {EDUCATION_OPS_ROLES} from '../functions/_lib/education-ops/education-ops-model-config.mjs';
import {createHairReadabilityAllowance} from './_lib/education-hair-readability-allowance.mjs';
const repo='brandrice-dev/aimt-site',task='hair-readability-2026-10-13',dir='research-import/hair-readability-review';
const gh=(...args)=>execFileSync('gh',args,{maxBuffer:16*1024*1024});
const api=p=>JSON.parse(gh('api',`repos/${repo}/${p}`));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const e=process.env;
if(e.GITHUB_REPOSITORY!==repo || e.GITHUB_REF!=='refs/heads/main' || e.GITHUB_EVENT_NAME!=='workflow_dispatch' || e.APPROVE_REVIEW!=='true')throw Error('EXPLICIT_REVIEW_APPROVAL_REQUIRED');
mkdirSync(dir,{recursive:true});
// Restore cumulative budget across revisions and workflow executions. A new
// proposal SHA never creates a new allowance for this owner-approved update.
const archives=api('actions/artifacts?name=hair-biology-readability-review&per_page=100').artifacts.filter(a=>!a.expired).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id-a.id);
if(archives.length){
 const a=archives[0],run=api(`actions/runs/${a.workflow_run.id}`);
 if(run.status!=='completed' || run.head_branch!=='main' || run.path!=='.github/workflows/aimt-hair-readability-review.yml')throw Error('UNTRUSTED_REVIEW_BUDGET_ARCHIVE');
 const zip=gh('api',`repos/${repo}/actions/artifacts/${a.id}/zip`);if(a.digest!==`sha256:${hash(zip)}`)throw Error('REVIEW_ARCHIVE_DIGEST_MISMATCH');
 const cost=execFileSync('python3',['-c',"import zipfile,sys,io;z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));sys.stdout.buffer.write(z.read('cost.json'))"],{input:zip});writeFileSync(dir+'/cost.json',cost);
}
const prior=existsSync(dir+'/cost.json')?JSON.parse(readFileSync(dir+'/cost.json')):null;
if(prior && prior.task!==task)throw Error('REVIEW_ALLOWANCE_IDENTITY_MISMATCH');
const bounded=createHairReadabilityAllowance({previous:prior,persist:s=>writeFileSync(dir+'/cost.json',JSON.stringify(s,null,2))});
const pr=api(`pulls/${e.PR_NUMBER}`);if(pr.state!=='open' || pr.head.sha!==e.CANDIDATE_HEAD || pr.head.repo.full_name!==repo || pr.base.ref!=='main')throw Error('REVIEW_PR_IDENTITY_MISMATCH');
const artifact=api('actions/artifacts/11848689625');if(artifact.workflow_run.id!==38467279336 || artifact.name!=='education-candidate-bundles')throw Error('ORIGINAL_CANDIDATE_IDENTITY_MISMATCH');
const zip=gh('api',`repos/${repo}/actions/artifacts/11848689625/zip`);if(artifact.digest!==`sha256:${hash(zip)}`)throw Error('ORIGINAL_CANDIDATE_DIGEST_MISMATCH');
const original=JSON.parse(execFileSync('python3',['-c',"import zipfile,sys,io;z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));sys.stdout.buffer.write(z.read('hair-biology/candidate.json'))"],{input:zip,encoding:'utf8'}));
if(!(await verifyCandidateBundleIntegrity(original)).valid || original.review_result.outcome!=='PASS')throw Error('ORIGINAL_CANDIDATE_INTEGRITY_FAILED');
const file=api(`contents/functions/_data/education-page-plans/hair-biology.json?ref=${e.CANDIDATE_HEAD}`),bytes=Buffer.from(file.content.replace(/\s/g,''),'base64'),proposed=JSON.parse(bytes);
if(proposed.generation_source_hash!==original.generation_source_hash || JSON.stringify(proposed.plan.sources)!==JSON.stringify(original.page_plan.sources) || JSON.stringify(proposed.plan.limitations)!==JSON.stringify(original.page_plan.limitations) || proposed.plan.scope_note!==original.page_plan.scope_note)throw Error('EDITORIAL_EVIDENCE_PROVENANCE_CHANGED');
const validation=validateEducationPagePlan(proposed.plan,original.fingerprint_input,{expectedTopicSlug:'hair-biology',expectedCluster:original.cluster,expectedRoute:original.route});
if(!validation.valid)throw Error(`EDITORIAL_DETERMINISTIC_VALIDATION_FAILED:${JSON.stringify(validation)}`);
const units=collectAllProseUnits(proposed.plan),locations=units.filter(x=>['PARAPHRASE','FRAMING'].includes(x.unit.kind)).map(x=>({location:x.location,kind:x.unit.kind}));
const instruction=buildReviewerInstruction({plan:proposed.plan,clearedSnapshot:original.fingerprint_input,intentPlan:original.intent_plan})+'\nReturn exactly one verdict per unit listed here, with its location copied exactly. No unit may be omitted or reviewed twice:\n'+JSON.stringify(locations);
const response=await callEducationOpsModel({...e,publicationCostControl:bounded},{role:EDUCATION_OPS_ROLES.REVIEWER,system:instruction,userContent:'Review this editorial readability update independently.',schema:REVIEWER_OUTPUT_JSON_SCHEMA,maxTokens:8000,effort:'medium',callLabel:'HairReadabilityReviewer',fitRemainingBudget:true});
if(!response.ok){writeFileSync(dir+'/review.json',JSON.stringify({task,pr_number:pr.number,head_sha:e.CANDIDATE_HEAD,plan_sha256:hash(bytes),outcome:'FAILED',reason:response.reason},null,2));throw Error('INDEPENDENT_REVIEW_REQUEST_FAILED');}
const output=response.output;
for(const [kind,field] of [['PARAPHRASE','paraphrase_reviews'],['FRAMING','framing_reviews']]) {
 const expected=locations.filter(x=>x.kind===kind).map(x=>x.location).sort(),actual=output[field].map(x=>x.location).sort();
 if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error('REVIEW_UNIT_COVERAGE_FAILED');
}
const verdict=aggregateReviewOutcome(output),again=api(`pulls/${pr.number}`);
if(again.head.sha!==e.CANDIDATE_HEAD)throw Error('REVIEW_STALE_PR_HEAD');
writeFileSync(dir+'/review.json',JSON.stringify({task,pr_number:pr.number,head_sha:e.CANDIDATE_HEAD,plan_sha256:hash(bytes),generation_source_hash:original.generation_source_hash,original_candidate_artifact:11848689625,original_snapshot_unchanged:true,deterministic_validation:validation,reviewer_output:output,verdict,model:response.modelInfo,usage:response.usage,run_id:e.GITHUB_RUN_ID,reviewed_at:new Date().toISOString()},null,2));
console.log(JSON.stringify({outcome:verdict.outcome,paraphrases:output.paraphrase_reviews.length,usage:response.usage,allowance:bounded.summary()}));
if(verdict.outcome!=='PASS')process.exitCode=1;
