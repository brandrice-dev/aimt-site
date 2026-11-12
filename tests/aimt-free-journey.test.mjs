// Offline validation for AIMT's shared Free Tools + Accelerator path.
// Run: node --test tests/aimt-free-journey.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STORAGE_KEY,STATES,LICENSES,CAREER_STAGES,CAREER_STAGE_GUIDANCE,SCOPE_SOURCES,LESSONS,emptyPlan,normalizePlan,writePlan,readPlan,
 appointmentMinutes,pricingResult,scopeResult,equipmentResult,observationFeedback,renderPlanText,blueprintFromPlan
} from '../assets/js/aimt-launch-journey-core.mjs';
import {normalizeBlueprint,BLUEPRINT_FIELDS} from '../assets/js/aimt-first-service-blueprint-core.mjs';
import {SCOPE_EVIDENCE,SCOPE_FINDINGS,evidenceFor} from '../assets/js/aimt-scope-evidence.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
function store(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};}
const example={
 version:1,state:'California',license:'Cosmetologist',activities:['wash','scalp','camera'],
 serviceFormat:'focused',audience:'Existing salon guests',clientPromise:'A dedicated calm scalp-care appointment',
 consultMinutes:'15',serviceMinutes:'60',prepMinutes:'10',resetMinutes:'15',adminMinutes:'5',
 space:'station',equipmentSystem:'attachment',equipmentPriority:'supplier',
 equipmentQuestions:'Do replacement parts fit my existing basin?',
 observationAnswer:'visible',observationNote:'I can see light-colored surface material but cannot identify the cause.',
 trainingChecklist:['curriculum','assessment'],nextSteps:['Check board source','Measure appointment','Ask equipment supplier'],
 trainingPriority:'Practice intake questions',completed:['scope','service']
};
test('one shared local plan, without arbitrary properties',()=>{
 const s=store(),saved=writePlan(s,{...example,email:'secret@example.com',client_record:'never'});
 assert.equal(saved.state,'California');
 assert.equal(saved.email,undefined);assert.equal(saved.client_record,undefined);
 assert.equal(readPlan(s).clientPromise,example.clientPromise);
 assert.equal(s.map.size,1);assert.ok(s.map.has(STORAGE_KEY));
});
test('invalid or corrupted state safely resets without throwing',()=>{
 const s=store();s.setItem(STORAGE_KEY,'{invalid');
 assert.deepEqual(readPlan(s),emptyPlan());
 const reset=normalizePlan({version:99,state:'California'});
 assert.equal(reset.state,'');
});
test('state/license and activities are strict whitelists; notes sanitized',()=>{
 const v=normalizePlan({...example,state:'Atlantis',license:'Unknown',activities:['wash','wash','secret'],clientPromise:'<script>Hi</script>'});
 assert.equal(v.state,'');assert.equal(v.license,'');assert.deepEqual(v.activities,['wash']);
 assert.equal(v.clientPromise,'scriptHi/script');
 assert.equal(STATES.length,51);assert.ok(LICENSES.length>4);
});
test('Scope Finder gives sourced findings for precise activity, credential and state — never full service clearance',()=>{
 const p=normalizePlan({...example,operatingContext:'salon'}),r=scopeResult(p);
 assert.ok(r.sources.length>=1);
 assert.match(r.status,/PRIMARY SOURCES LOCATED/i);
 assert.match(r.inquiry,/California/);
 assert.match(r.inquiry,/Shampooing or washing hair/);
 assert.match(r.inquiry,/establishment/);
 assert.doesNotMatch(r.inquiry,/you are approved|permission granted/i);
 assert.equal(r.review.findings[0].status,'credential_scope');
 assert.equal(r.review.findings[1].status,'unresolved');
 const unknown=scopeResult({...p,state:'Wyoming'});
 assert.equal(unknown.sources.length,0);
 assert.match(unknown.status,/NOT YET RESEARCHED/);
 assert.ok(unknown.review.findings.every(x=>x.status==='unresolved'));
 assert.equal(Object.keys(SCOPE_EVIDENCE).length,6);
 assert.equal(Object.keys(SCOPE_SOURCES).length,6);
});
test('each official finding has exact source records, status code, and credential target',()=>{
 const legalStatuses=new Set(Object.keys(SCOPE_FINDINGS));
 for(const [state,record] of Object.entries(SCOPE_EVIDENCE)){
  assert.ok(record.sources.length>=1,'No sources: '+state);
  const ids=new Set(record.sources.map(x=>x.id));
  assert.equal(ids.size,record.sources.length,'Duplicate source ID: '+state);
  for(const source of record.sources){
   assert.match(source.url,/^https:\/\//);
   assert.ok(/(?:\.gov\/|\.state\.[a-z]{2}\.us\/|\.us\/)/.test(source.url),'Source not on official state/regulator site: '+source.url);
  }
  for(const finding of record.findings){
   assert.ok(legalStatuses.has(finding.status),'Unknown status');
   assert.ok(finding.sourceIds.every(id=>ids.has(id)),state+' has unsupported reference');
   assert.ok(finding.sourceIds.length>0,'Uncited finding');
  }
 }
});
test('individual unlicensed shampoo exceptions do not transfer to massage and styling',()=>{
 const unlicensed='No professional license';
 for(const state of ['Texas','Tennessee','Florida']){
  const r=evidenceFor(state,unlicensed,['wash','scalp-massage','styling']);
  assert.equal(r.findings[0].status,'documented_exemption');
  assert.notEqual(r.findings[1].status,'documented_exemption');
  assert.notEqual(r.findings[2].status,'documented_exemption');
  assert.match(r.findings[0].limits,/not|does not|exception/i);
 }
 const california=evidenceFor('California','Esthetician',['wash','styling','scalp-massage']);
 assert.equal(california.findings[0].status,'outside_credential');
 assert.equal(california.findings[1].status,'outside_credential');
 assert.equal(california.findings[2].status,'unresolved');
 const texas=evidenceFor('Texas','Esthetician',['wash','styling','scalp-massage']);
 assert.equal(texas.findings[0].status,'documented_exemption');
 assert.equal(texas.findings[1].status,'outside_credential');
 assert.equal(texas.findings[2].status,'credential_scope');
});
test('Pennsylvania licensed-salon obligation and no-advisory-opinion restriction are visible',()=>{
 const r=evidenceFor('Pennsylvania','Esthetician',['wash','scalp','styling']);
 assert.ok(r.findings.every(f=>f.status==='unresolved'));
 assert.match(r.facility,/licensed|inspection/i);
 assert.match(r.nextContact,/cannot issue advisory legal opinions/i);
 const unknown=evidenceFor('Alaska','No professional license',['wash','scalp']);
 assert.equal(unknown.researchDate,null);
 assert.match(unknown.coverage,/not yet researched/i);
});
test('Scope Finder shows research coverage, facility, individual source citations and safe copy action',()=>{
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 for(const token of [
  'sc-context','data-activity-findings','data-source-facility','data-source-reviewed',
  'data-next-contact','data-board-inquiry','scope-save','scope-copy',
  'RESEARCH COVERAGE','not an approval to offer your full head spa'
 ])assert.ok(widget.includes(token),'Missing '+token);
 assert.doesNotMatch(widget,/you may offer all head spa services|head spa permitted/i);
});
test('scope result clarifies mismatch for massage therapy and unlicensed learner',()=>{
 for(const license of ['Massage therapist','Student / not yet licensed','No professional license']){
  const r=scopeResult({...example,license});
  assert.match(r.note,/right regulator/);
 }
});
test('appointment calculation counts all capacity, not only hands-on time',()=>{
 assert.deepEqual(appointmentMinutes(example),{service:60,total:105,extra:45});
 assert.equal(appointmentMinutes({...example,resetMinutes:''}),null);
 assert.equal(appointmentMinutes({...example,serviceMinutes:'0'}),null);
 assert.equal(appointmentMinutes({...example,serviceMinutes:'-2'}),null);
});
test('Accelerator reuses existing numeric cost calculation and never invents missing values',()=>{
 const blank=pricingResult(example);
 assert.equal(blank.ok,false);
 const priced={...example,products:'12.50',supplies:'2.50',overhead:'9.75',laborHourly:'24',menuPrice:'150'};
 const calc=pricingResult(priced);
 assert.equal(calc.ok,true);assert.equal(calc.minutes,105);
 assert.equal(calc.modeledCost,66.75);assert.equal(calc.modeledDifference,83.25);
 assert.match(renderPlanText(priced),/Modeled service cost: \$66.75/);
 const data=blueprintFromPlan(priced);
 assert.match(data.fields.cost,/\$66.75/);assert.match(data.fields.price,/\$150.00/);
 const optional=pricingResult({...priced,menuPrice:''});
 assert.equal(optional.ok,true);assert.equal(optional.enteredPrice,null);
});
test('equipment planner changes question priorities by environment/system',()=>{
 const portable=equipmentResult({...example,space:'suite',equipmentSystem:'portable'});
 assert.match(portable.questions.join(' '),/tanks|tank capacity/);
 assert.match(portable.questions.join(' '),/landlord/);
 assert.match(portable.caution,/qualified installers/);
 const attached=equipmentResult(example);
 assert.match(attached.questions.join(' '),/dimensions/);
});
test('observation feedback rejects medical diagnoses and hair-growth promises',()=>{
 assert.equal(observationFeedback('visible').correct,true);
 assert.equal(observationFeedback('diagnosis').correct,false);
 assert.equal(observationFeedback('guarantee').correct,false);
 assert.match(observationFeedback('diagnosis').copy,/diagnos/i);
});
test('all five lessons are distinct and the plan avoids false readiness claims',()=>{
 assert.deepEqual(LESSONS.map(x=>x.id),['scope','service','equipment','observation','launch']);
 const text=renderPlanText(example);
 assert.match(text,/AIMT — HEAD SPA LAUNCH PLAN/);
 assert.match(text,/Permission: NOT DETERMINED/);
 assert.match(text,/Installation: NOT VERIFIED/);
 assert.match(text,/105 minutes/);
 assert.doesNotMatch(text,/you are certified|license approved/i);
});
test('export interoperates with the existing Blueprint v1, without overwriting it',()=>{
 const payload=blueprintFromPlan(example),validated=normalizeBlueprint(payload);
 assert.equal(payload.version,1);
 assert.equal(Object.keys(validated.fields).length,Object.keys(BLUEPRINT_FIELDS).length);
 assert.match(validated.fields.licensing,/California/);
 assert.equal(validated.fields.price,'');
});
const newPages=['head-spa-launch-accelerator.html','head-spa-scope-finder.html','head-spa-equipment-planner.html','scalp-observation-lab.html'];
test('all pages and routes are present without promotion to public indexing',()=>{
 const routes=JSON.parse(read('_routes.json'));
 for(const file of newPages){
  const html=read(file),name=file.replace(/\.html$/,'');
  assert.match(html,/<meta name="robots" content="noindex,nofollow/);
  for(const url of ['/'+name,'/'+name+'.html','/'+name+'/'])assert.ok(routes.exclude.includes(url),'Missing allowlisted route: '+url);
  assert.match(html,/aimt-launch-journey\.css/);
  assert.doesNotMatch(html,/<input[^>]*type="file"/i);
 }
});
test('standalone pages and guided lesson import one shared widget implementation',()=>{
 const app=read('head-spa-launch-accelerator.html'),runner=read('assets/js/aimt-launch-accelerator.mjs');
 const standalone=read('assets/js/aimt-standalone-tool.mjs');
 assert.equal((app.match(/data-aimt-tool="/g)||[]).length,5);
 assert.match(runner,/import \{mountAll\} from '\.\/aimt-launch-journey-widgets\.mjs'/);
 assert.match(standalone,/aimt-launch-journey-widgets\.mjs/);
 for(const p of newPages.slice(1))assert.equal((read(p).match(/data-aimt-tool="/g)||[]).length,1);
});
test('new tools do not create new lead capture, network calls, or automated image diagnosis',()=>{
 for(const file of ['assets/js/aimt-launch-journey-core.mjs','assets/js/aimt-launch-journey-widgets.mjs','assets/js/aimt-launch-accelerator.mjs']){
  const s=read(file);
  assert.doesNotMatch(s,/\bfetch\s*\(/);
  assert.doesNotMatch(s,/\/api\/(readiness|free-tools)/);
  assert.doesNotMatch(s,/input[^>]*type=['"]file['"]/);
 }
});
test('hub promotes Accelerator and links to each real, standalone route',()=>{
 const html=read('free-tools.html');
 const paths=['/head-spa-launch-accelerator','/head-spa-scope-finder','/head-spa-equipment-planner','/scalp-observation-lab','/head-spa-readiness','/head-spa-service-cost','/first-service-blueprint'];
 for(const p of paths)assert.ok(html.includes('href="'+p+'"'),p+' missing');
 assert.match(html,/Equipment Clinic/);
});


test('real AIMT references appear in the proper lessons and remain clearly contextualized',()=>{
 const lesson=read('head-spa-launch-accelerator.html');
 const references=[
  'assets/images/marketing/head-spa-service-rinse.webp',
  'assets/images/marketing/approved-aesthetic-service-shot2.png',
  'assets/images/course/module-07/module-07-treatment-bed-setup.webp',
  'assets/images/marketing/product-proof/my-aimt-resource-library.webp',
  'assets/images/course/module-04/microscopy/microscopy-surface-residue.webp',
  'assets/images/marketing/product-proof/lesson-module-04-microscopy-assessment-1x1.webp'
 ];
 for(const asset of references)assert.ok(fs.existsSync(path.join(root,asset)),'Missing approved image '+asset);
 for(const src of references.slice(0,4))assert.ok(lesson.includes('/'+src),'Lesson missing photo '+src);
 const widgets=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.ok(widgets.includes('/'+references[4]),'Shared observation tool missing actual course teaching example');
 assert.match(widgets,/INSIDE AIMT HEAD SPA CERTIFICATION/);
 assert.match(widgets,/not a diagnosis or a certificate of competence/);
 assert.match(widgets,/href="\/head-spa-certification"/);
 assert.match(widgets,/Illustrative course image — not clinical evidence/);
 assert.match(widgets,/lesson-module-04-microscopy-assessment-1x1.webp/);
 assert.doesNotMatch(widgets,/<input[^>]*type="file"/);
});
test('landing hook disappears after entering course and lesson navigation remains usable',()=>{
 const nav=read('assets/js/aimt-launch-accelerator.mjs');
 const css=read('assets/css/aimt-launch-journey.css');
 const lesson=read('head-spa-launch-accelerator.html');
 assert.match(nav,/document\.body\.classList\.add\('lj-course-started'\)/);
 assert.match(nav,/openLesson\('scope',\{enter:false,scroll:false\}\)/);
 assert.match(nav,/document\.body\.classList\.remove\('lj-course-started'\)/);
 assert.match(css,/\.lj-body\.lj-course-started \.lj-hero\{display:none\}/);
 assert.match(lesson,/id="seeLessons"/);
 assert.match(lesson,/id="backOverview"/);
});
test('tool card illustrations are accessible and the formerly light pricing card is visually unified',()=>{
 const hub=read('free-tools.html');
 const css=read('assets/css/aimt-free-tools-hub-expansion.css');
 assert.equal((hub.match(/class="ft-tool-illustration"/g)||[]).length,6);
 assert.equal((hub.match(/ft-tool-illustration"[^>]*aria-hidden="true"/g)||[]).length,6);
 assert.match(css,/\.ft-hub \.ft-grid \.ft-tool-card\[data-ft-category=pricing\]/);
 for(const promise of [
  'How do I check my license?',
  'What should I check before buying?',
  'What am I seeing on a scalp?',
  'What does one service cost?',
  'What should I learn next?',
  'How do I plan my first service?'
 ])assert.ok(hub.includes(promise),'Missing simple tool value statement: '+promise);
});

test('new graduates and experienced practitioners receive specific guidance without changing licensing results',()=>{
 const levels=CAREER_STAGES.map(x=>x.key);
 assert.deepEqual(levels,['exploring','new','experienced','offering']);
 const notes=Object.values(CAREER_STAGE_GUIDANCE);
 assert.ok(notes.every(x=>x.length>70));
 const starter=normalizePlan({...example,careerStage:'new'});
 const experienced=normalizePlan({...example,careerStage:'experienced'});
 assert.equal(starter.careerStage,'new');
 assert.equal(experienced.careerStage,'experienced');
 assert.match(renderPlanText(starter),/Early in my career|Newly licensed/i);
 assert.match(renderPlanText(experienced),/Experienced professional/i);
 assert.deepEqual(scopeResult(starter).sources,scopeResult(experienced).sources);
 assert.equal(normalizePlan({...example,careerStage:'unverified'}).careerStage,'');
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.match(widget,/select\('sc-stage',CAREER_STAGES/);
 assert.match(widget,/CAREER_STAGE_GUIDANCE/);
 const hub=read('free-tools.html');
 assert.match(hub,/Fresh out of school or years behind the chair/);
});
test('correct decisions use canonical AIMT success green, while unsafe answers are distinct',()=>{
 const css=read('assets/css/aimt-launch-journey.css');
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 const shell=read('assets/css/cadence-shell.css');
 assert.match(shell,/--aimt-success, #3a5a3a/);
 assert.match(css,/\.lj-feedback\.is-correct/);
 assert.match(css,/--aimt-success,#3a5a3a/);
 assert.match(css,/--aimt-success-light,#e8ede8/);
 assert.match(css,/\.lj-feedback\.is-incorrect/);
 assert.match(widget,/feedbackState\(fb,input.value==='define'\)/);
 assert.match(widget,/feedbackState\(fb,x.value==='verify'\)/);
 assert.match(widget,/feedbackState\(el,fb.correct\)/);
});
test('Next Move package uses authentic AIMT product proof and keeps founder bonus conditional',()=>{
 const app=read('head-spa-launch-accelerator.html');
 const official=read('assets/js/aimt-next-step-offer.js');
 assert.match(app,/id="nextStepOffer"/);
 assert.match(app,/data-bundle-photo-slot="awaiting-owner-upload"/);
 assert.match(app,/head-spa-certification-course-ui.webp/);
 assert.match(app,/approved-service-timer-live.webp/);
 assert.match(app,/First-Service Blueprint/);
 assert.match(app,/Smart Service Sidekick/);
 assert.match(app,/Practitioner Resource Library/);
 assert.match(app,/data-next-step-founder hidden/);
 assert.match(app,/data-next-step-availability hidden/);
 assert.match(app,/aimt-next-step-offer\.js/);
 assert.match(official,/remaining>0/);
 assert.match(official,/data\.capacity===5/);
 assert.doesNotMatch(app,/your_next_move_aimt_launch_bundle/);
 assert.ok(fs.existsSync(path.join(root,'assets/images/marketing/head-spa-certification-course-ui.webp')));
 assert.ok(fs.existsSync(path.join(root,'assets/images/marketing/approved-service-timer-live.webp')));
});
