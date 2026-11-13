// Offline validation for AIMT's shared Free Tools + Accelerator path.
// Run: node --test tests/aimt-free-journey.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STORAGE_KEY,STATES,LICENSES,STATE_CREDENTIALS,CREDENTIAL_NOTES,LICENSE_STATUSES,CAREER_STAGES,CAREER_STAGE_GUIDANCE,SCOPE_SOURCES,LESSONS,emptyPlan,normalizePlan,writePlan,readPlan,
 appointmentMinutes,pricingResult,scopeResult,equipmentResult,observationFeedback,renderPlanText,blueprintFromPlan
} from '../assets/js/aimt-launch-journey-core.mjs';
import {normalizeBlueprint,BLUEPRINT_FIELDS} from '../assets/js/aimt-first-service-blueprint-core.mjs';
import {SCOPE_EVIDENCE,SCOPE_FINDINGS,SCOPE_RESEARCH_DISCLAIMER,SCOPE_GOVERNMENT_DIRECTORY,evidenceFor,scopeSummary,scopeResearchPath} from '../assets/js/aimt-scope-evidence.mjs';

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
 assert.match(r.status,/OFFICIAL STATE REFERENCES AVAILABLE/i);
 assert.match(r.inquiry,/California/);
 assert.match(r.inquiry,/Shampooing or washing hair/);
 assert.match(r.inquiry,/establishment/);
 assert.doesNotMatch(r.inquiry,/you are approved|permission granted/i);
 assert.equal(r.review.findings[0].status,'credential_scope');
 assert.equal(r.review.findings[1].status,'unresolved');
 const unknown=scopeResult({...p,state:'Wyoming'});
 assert.equal(unknown.sources.length,0);
 assert.match(unknown.status,/NO ACTIVITY-SPECIFIC FINDING CITED YET/);
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
   assert.ok(/(?:\.gov\/|\.state\.[a-z]{2}\.us\/|palegis\.us\/|publications\.tnsosfiles\.com\/|myfloridalicense\.com\/)/.test(source.url),'Source not on official state/regulator site: '+source.url);
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
  assert.ok(r.findings[0].limits.length>20);
 }
 const california=evidenceFor('California','Esthetician',['wash','styling','scalp-massage']);
 assert.equal(california.findings[0].status,'outside_credential');
 assert.equal(california.findings[1].status,'outside_credential');
 assert.equal(california.findings[2].status,'credential_scope');
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
 assert.match(unknown.coverage,/No state-specific determination is cited/i);
});
test('Scope Finder shows research coverage, facility, individual source citations and safe copy action',()=>{
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 for(const token of [
  'sc-context','data-activity-findings','data-source-facility','data-source-reviewed',
  'data-next-contact','data-board-inquiry','scope-save','scope-copy','scope-report-copy',
  'RESEARCH COVERAGE','an approval to offer your full head spa'
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


test('license verification is an official outbound step, not AIMT credential validation',()=>{
 const options=LICENSE_STATUSES.map(x=>x.key);
 assert.deepEqual(options,['active_here','licensed_elsewhere','pending_or_expired','none','unsure']);
 for(const [state,record] of Object.entries(SCOPE_EVIDENCE)){
  assert.ok(record.licenseLookup?.url,'Missing official portal in '+state);
  assert.match(record.licenseLookup.url,/^https:\/\//);
  assert.ok(evidenceFor(state,'Cosmetologist',['wash']).licenseLookup?.url);
 }
 const other=scopeResult({...example,licenseStatus:'licensed_elsewhere'});
 assert.match(other.licenseStatusNote,/out-of-state license does not automatically authorize/i);
 const pending=scopeResult({...example,licenseStatus:'pending_or_expired'});
 assert.match(pending.licenseStatusNote,/not proof of current authorization/i);
 assert.equal(normalizePlan({...example,licenseStatus:'definitely good'}).licenseStatus,'');
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.match(widget,/select\('sc-status',LICENSE_STATUSES/);
 assert.match(widget,/data-license-lookup/);
 assert.match(widget,/official license verification/);
 assert.doesNotMatch(widget,/type="file"|name="license_number"|name="licenseNumber"/);
});
test('newest official New York procedural chart is referenced and older chart is not served',()=>{
 const ny=SCOPE_EVIDENCE['New York'];
 assert.ok(ny.sources.some(x=>x.url.includes('2026/04/ae-licensees-procedural-service-determinations_3.31.2026.pdf')));
 assert.ok(!ny.sources.some(x=>x.url.includes('2025/03/ae-licensees')));
 assert.ok(ny.findings.length>0,'NY official scope pages now have narrow source-backed findings');
 assert.equal(evidenceFor('New York','Massage therapist',['bodywork']).findings[0].status,'unresolved');
});

test('source-backed review can be copied as one actionable research record without collecting identity data',()=>{
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.match(widget,/Copy my findings/);
 assert.match(widget,/AIMT \/ HEAD SPA LICENSE & SCOPE RESEARCH NOTES/);
 assert.match(widget,/Source explanation:/);
 assert.match(widget,/OFFICIAL LICENSE LOOKUP:/);
 assert.match(widget,/No finding authorizes a complete head spa treatment/);
 assert.doesNotMatch(widget,/name="licenseNumber"|name="birthdate"|name="license_number"/i);
});


const SCOPE_SCENARIOS=[
 ['CA esthetician shampoo restriction','California','Esthetician','wash','outside_credential'],
 ['CA esthetician cosmetic scalp','California','Esthetician','scalp','credential_scope'],
 ['CA esthetician scalp massage','California','Esthetician','scalp-massage','credential_scope'],
 ['CA hairstylist hair styling','California','Hairstylist','styling','credential_scope'],
 ['CA unlicensed shampoo','California','No professional license','wash','licensed_role_required'],
 ['CA unlicensed scalp exfoliation','California','No professional license','scalp','unresolved'],
 ['TX no license shampoo','Texas','No professional license','wash','documented_exemption'],
 ['TX no license scalp massage','Texas','No professional license','scalp-massage','licensed_role_required'],
 ['TX esthetician scalp cleansing','Texas','Esthetician','scalp','credential_scope'],
 ['TX esthetician hair styling','Texas','Esthetician','styling','outside_credential'],
 ['TX Class A barber hair styling','Texas','Class A Barber','styling','credential_scope'],
 ['TX generic barber hair styling','Texas','Barber','styling','unresolved'],
 ['TX operator hair styling','Texas','Cosmetology Operator','styling','credential_scope'],
 ['TN no license shampoo','Tennessee','No professional license','wash','documented_exemption'],
 ['TN no license hair styling','Tennessee','No professional license','styling','licensed_role_required'],
 ['TN esthetician scalp massage','Tennessee','Esthetician','scalp-massage','credential_scope'],
 ['TN esthetician hair styling','Tennessee','Esthetician','styling','outside_credential'],
 ['TN Master Barber hair styling','Tennessee','Master Barber','styling','credential_scope'],
 ['TN generic barber hair styling','Tennessee','Barber','styling','unresolved'],
 ['FL no license shampoo','Florida','No professional license','wash','documented_exemption'],
 ['FL no license hair styling','Florida','No professional license','styling','licensed_role_required'],
 ['FL Facial Specialist scalp massage','Florida','Facial Specialist','scalp-massage','credential_scope'],
 ['FL Facial Specialist cosmetic scalp','Florida','Facial Specialist','scalp','credential_scope'],
 ['FL Facial Specialist hair styling','Florida','Facial Specialist','styling','outside_credential'],
 ['FL Full Specialist styling','Florida','Full Specialist','styling','outside_credential'],
 ['FL cosmetologist styling','Florida','Cosmetologist','styling','credential_scope'],
 ['PA supervised shampoo exemption','Pennsylvania','No professional license','wash','conditional_exemption'],
 ['PA cosmetologist hair wash','Pennsylvania','Cosmetologist','wash','credential_scope'],
 ['PA barber scalp massage','Pennsylvania','Barber','scalp-massage','credential_scope'],
 ['PA esthetician scalp services unclear','Pennsylvania','Esthetician','scalp','unresolved'],
 ['NY cosmetologist hair wash','New York','Cosmetologist','wash','credential_scope'],
 ['NY cosmetologist cosmetic scalp','New York','Cosmetologist','scalp','credential_scope'],
 ['NY esthetician hair styling','New York','Esthetician','styling','outside_credential'],
 ['NY no license styling','New York','No professional license','styling','licensed_role_required'],
 ['NY licensed MT therapeutic massage classification','New York','Massage therapist','bodywork','unresolved'],
 ['Unmapped state defaults safely','Alaska','No professional license','wash','unresolved']
];
for(const [label,state,license,activity,expected] of SCOPE_SCENARIOS){
 test('scope scenario: '+label,()=>{
  const record=evidenceFor(state,license,[activity]);
  assert.equal(record.findings.length,1);
  assert.equal(record.findings[0].status,expected);
  if(expected!=='unresolved'){
   assert.ok(record.findings[0].sources.length>0, 'No source for '+label);
   assert.ok(record.findings[0].sources.every(x=>x.url.startsWith('https://')));
  }
  assert.ok(!('canPerformHeadSpa' in record));
 });
}
test('six-state license selector shows exact board credential names',()=>{
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.ok(widget.includes('refreshCredentials'));
 assert.ok(widget.includes('STATE_CREDENTIALS[st.value]'));
 assert.ok(widget.includes('CREDENTIAL_NOTES[st.value]'));
 for(const [state,allowed] of Object.entries(STATE_CREDENTIALS)){
  assert.ok(allowed.length>=6, 'Few credential options for '+state);
  for(const label of allowed) assert.ok(LICENSES.includes(label), 'Unknown credential '+label);
 }
 assert.ok(!STATE_CREDENTIALS.Florida.includes('Esthetician'), 'Florida should use Facial Specialist registration');
 assert.ok(STATE_CREDENTIALS.Texas.includes('Class A Barber'));
 assert.ok(STATE_CREDENTIALS.Tennessee.includes('Master Barber'));
});
test('unlicensed Pennsylvania shampoo exception remains conditional, not a general permission',()=>{
 const result=scopeResult({...example,state:'Pennsylvania',license:'No professional license',
   licenseStatus:'none',operatingContext:'independent',activities:['wash','scalp-massage']});
 assert.equal(result.review.findings[0].status,'conditional_exemption');
 assert.equal(result.review.findings[1].status,'unresolved');
 assert.match(result.review.findings[0].limits,/not permission|NOT permission/i);
 assert.match(result.review.findings[0].summary,/supervis/i);
 assert.match(result.review.facility,/licensed|inspection/i);
});


test('plain-language summaries never clear an entire head spa, even when one step is exempt',()=>{
 const cases=[
  [evidenceFor('Florida','No professional license',['wash']),/individual license exemption/i],
  [evidenceFor('Texas','No professional license',['wash','styling']),/another professional credential/i],
  [evidenceFor('Pennsylvania','No professional license',['wash']),/narrow exception/i],
  [evidenceFor('New York','Esthetician',['scalp']),/Here’s how to confirm the rules for your service/i],
  [evidenceFor('Alaska','Cosmetologist',['wash']),/Here’s how to confirm the rules for your service/i],
  [evidenceFor('California','Esthetician',['wash','styling']),/another professional credential/i]
 ];
 for(const [review,expected] of cases){
  const summary=scopeSummary(review);
  assert.match(summary.headline,expected);
  assert.equal(summary.wholeServiceCleared,false);
  assert.equal(summary.total,review.findings.length);
  assert.equal(Object.values(summary.counts).reduce((x,y)=>x+y,0),review.findings.length);
 }
});
test('no cross-state citations or duplicate source identifiers in registry',()=>{
 for(const [state,record] of Object.entries(SCOPE_EVIDENCE)){
  const ids=new Set(record.sources.map(x=>x.id));
  const seen=new Set();
  for(const f of record.findings){
   const key=f.activity+'|'+f.license;
   assert.ok(!seen.has(key),'Duplicate rule in '+state+': '+key);
   seen.add(key);
   for(const id of f.sourceIds)assert.ok(ids.has(id),'Foreign or missing source in '+state+': '+id+' for '+key);
  }
 }
});


test('Pennsylvania cosmetologist sees covered services first, not seven scary verification warnings',()=>{
 const selections=['wash','scalp','scalp-massage','bodywork','styling','camera','wet'];
 const review=evidenceFor('Pennsylvania','Cosmetologist',selections);
 assert.deepEqual(review.findings.map(x=>x.status),[
  'credential_scope','credential_scope','credential_scope','credential_scope','credential_scope',
  'implementation_review','implementation_review'
 ]);
 const summary=scopeSummary(review);
 assert.match(summary.headline,/Your license category covers core cosmetic services/i);
 assert.equal(summary.counts.credential_scope,5);
 assert.equal(summary.counts.implementation_review,2);
 assert.equal(summary.counts.unresolved,0);
 assert.equal(summary.counts.outside_credential,0);
 assert.equal(summary.wholeServiceCleared,false);
 assert.doesNotMatch(summary.headline+summary.message,/not allowed|prohibited|probably|more verification required/i);
 const scalp=review.findings.find(x=>x.activity==='scalp');
 assert.match(scalp.summary,/scalp.*cleansing|cleansing.*scalp/i);
 assert.ok(scalp.sources.some(x=>x.url.includes('palegis.us')));
 const upper=review.findings.find(x=>x.activity==='bodywork');
 assert.match(upper.limits,/therapeutic/i);
 const machine=review.findings.find(x=>x.activity==='wet');
 assert.ok(machine.sources.some(x=>x.url.includes('s7.92.html')));
});
test('unresearched is clearly an AIMT evidence gap, not a restriction',()=>{
 const pa=evidenceFor('Pennsylvania','Esthetician',['scalp','camera']);
 const alaska=evidenceFor('Alaska','Cosmetologist',['wash']);
 for(const report of [pa,alaska]){
  const summary=scopeSummary(report);
  assert.match(summary.headline,/Here’s how to confirm the rules for your service/i);
  assert.match(summary.message,/not.*prohibited|does not mean/i);
  assert.equal(summary.counts.licensed_role_required,0);
  assert.equal(summary.counts.outside_credential,0);
 }
 const registry=read('assets/js/aimt-scope-evidence.mjs');
 assert.match(registry,/Confirm the specific rule for this activity/);
 assert.match(registry,/not evidence the activity is prohibited/);
});


test('AIMT scope status colors use canonical paid-course green/red and do not mark unknown as wrong',()=>{
 const stylesheet=read('assets/css/aimt-launch-journey.css');
 const canonical=read('assets/css/cadence-shell.css');
 assert.match(canonical,/--aimt-success,\s*#3a5a3a/);
 assert.match(canonical,/--aimt-error,\s*#7a3030/);
 for(const status of ['credential_scope','documented_exemption']){
  assert.match(stylesheet,new RegExp('\\.lj-evidence-card\\[data-scope-status="'+status+'"\\]'));
 }
 for(const status of ['outside_credential','licensed_role_required']){
  assert.match(stylesheet,new RegExp('\\.lj-evidence-card\\[data-scope-status="'+status+'"\\]'));
 }
 assert.match(stylesheet,/\.lj-scope-quick\[data-scope-tone="supported"\]/);
 assert.match(stylesheet,/\.lj-scope-quick\[data-scope-tone="restricted"\]/);
 assert.match(stylesheet,/\.lj-evidence-card\[data-scope-status="?unresolved"?\]/);
 assert.match(stylesheet,/\.lj-evidence-card\[data-scope-status="?conditional_exemption"?\]/);
 assert.match(stylesheet,/var\(--aimt-success,#3a5a3a\)/);
 assert.match(stylesheet,/var\(--aimt-error,#7a3030\)/);
 assert.match(stylesheet,/var\(--aimt-success-light,#e8ede8\)/);
 assert.match(stylesheet,/var\(--aimt-error-light,#f0e8e8\)/);
 const supported=scopeSummary(evidenceFor('Pennsylvania','Cosmetologist',['wash','scalp','scalp-massage','styling','camera','wet']));
 assert.equal(supported.tone,'supported');
 assert.equal(supported.wholeServiceCleared,false);
 assert.equal(scopeSummary(evidenceFor('Texas','No professional license',['wash'])).tone,'supported');
 assert.equal(scopeSummary(evidenceFor('California','Esthetician',['wash'])).tone,'restricted');
 assert.equal(scopeSummary(evidenceFor('Pennsylvania','No professional license',['wash'])).tone,'caution');
 assert.equal(scopeSummary(evidenceFor('Alaska','Cosmetologist',['wash'])).tone,'unknown');
 assert.equal(scopeSummary(evidenceFor('New York','Esthetician',['scalp'])).tone,'unknown');
 assert.notEqual(scopeSummary(evidenceFor('Texas','No professional license',['wash','styling'])).tone,'supported');
});
test('research-only limitation is clear in standalone and Accelerator and follows copied findings',()=>{
 assert.match(SCOPE_RESEARCH_DISCLAIMER,/Educational research only/);
 assert.match(SCOPE_RESEARCH_DISCLAIMER,/does not provide legal advice/);
 assert.match(SCOPE_RESEARCH_DISCLAIMER,/does not.*verify your individual license/);
 assert.match(SCOPE_RESEARCH_DISCLAIMER,/guarantee.*complete or current/);
 assert.match(SCOPE_RESEARCH_DISCLAIMER,/qualified licensing attorney/);
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 assert.match(widget,/Research information, not legal advice/);
 assert.match(widget,/SCOPE_RESEARCH_DISCLAIMER/);
 assert.match(widget,/data-scope-tone="neutral"/);
 assert.match(widget,/dataset\.scopeTone=quick\.tone/);
 assert.match(widget,/SCOPE_RESEARCH_DISCLAIMER,\s*[\r\n]/);
 assert.match(widget,/Use these sources for research only/);
 const standalone=read('head-spa-scope-finder.html');
 const accelerator=read('head-spa-launch-accelerator.html');
 assert.match(standalone,/data-aimt-tool="scope"/);
 assert.match(accelerator,/data-aimt-tool="scope"/);
 assert.doesNotMatch(widget,/permission granted|head spa cleared for practice/i);
});


test('Scope Finder screenshot regression: selected inputs are neutral, supported cards green, restrictions red',()=>{
 const css=read('assets/css/aimt-scope-finder-status.css');
 const base=read('assets/css/aimt-launch-journey.css');
 const shell=read('assets/css/cadence-shell.css');
 assert.match(shell,/--aimt-success,\s*#3a5a3a/);
 assert.match(shell,/--aimt-error,\s*#7a3030/);
 assert.match(base,/accent-color:#7b4d54/,'Base shared style can be burgundy but Scope Finder must override it');
 assert.match(css,/\.lj-tool\[data-aimt-tool="scope"\] input\[type=checkbox\]/);
 assert.match(css,/accent-color:var\(--scope-ink\)/);
 assert.match(css,/\.lj-tool\[data-aimt-tool="scope"\] \.lj-check:has\(input:checked\)/);
 assert.match(css,/background:#f1eee9/);
 assert.doesNotMatch(css,/(?:\.lj-check:has\(input:checked\)[\s\S]{0,110}background:var\(--scope-error)/);
 for(const key of ['credential_scope','documented_exemption']){
  assert.ok(css.includes('data-scope-status="'+key+'"'));
 }
 assert.match(css,/background:var\(--scope-success-light\)/);
 assert.match(css,/border-left:4px solid var\(--scope-success\)/);
 for(const key of ['outside_credential','licensed_role_required']){
  assert.ok(css.includes('data-scope-status="'+key+'"'));
 }
 assert.match(css,/background:var\(--scope-error-light\)/);
 assert.match(css,/border-left:4px solid var\(--scope-error\)/);
 assert.match(css,/\.lj-tool\[data-aimt-tool="scope"\] \.lj-license-lookup-link/);
 assert.match(css,/color:var\(--scope-ink\)!important/);
 assert.match(css,/\.lj-tool\[data-aimt-tool="scope"\] \.lj-evidence-refs a/);
 for(const page of ['head-spa-scope-finder.html','head-spa-launch-accelerator.html']){
  const html=read(page);
  const original=html.indexOf('aimt-launch-journey.css?v=20261113-scope-status');
  const override=html.indexOf('aimt-scope-finder-status.css?v=20261113-scope-status');
  assert.ok(original>0&&override>original,'Scope style must load after base with a fresh URL: '+page);
  assert.match(html,/class="lj-tool" data-aimt-tool="scope"/);
 }
});


test('when none of the activities has a verified state-specific interpretation, give useful next steps',()=>{
 const review=evidenceFor('Alaska','Cosmetologist',['wash','scalp','scalp-massage','bodywork','styling','camera','wet']);
 const quick=scopeSummary(review);
 const route=scopeResearchPath(review);
 assert.equal(quick.tone,'unknown');
 assert.equal(quick.total,7);
 assert.equal(quick.counts.unresolved,7);
 assert.match(quick.headline,/how to confirm the rules for your service/i);
 assert.doesNotMatch(quick.headline+/ /+quick.message,/AIMT has not finished|7 AIMT research gaps|state does not provide/i);
 assert.match(quick.message,/does not mean.*prohibited/i);
 assert.equal(route.hasStateSources,false);
 assert.equal(route.startingPoint.url,'https://www.usa.gov/state-governments');
 assert.equal(SCOPE_GOVERNMENT_DIRECTORY.url,route.startingPoint.url);
 assert.match(route.startingPoint.detail,/Alaska/);
 assert.equal(route.questions.length,7);
 assert.match(route.questions[0].question,/shampooing/i);
 assert.match(route.questions[6].question,/sanitation|plumbing/i);
 assert.deepEqual(route.steps.map(x=>x.title),[
  'Locate the governing licensing rules',
  'Match your exact credential to the activities',
  'Check the workplace and equipment',
  'Keep the source or ask for a rule citation'
 ]);
 assert.equal(quick.wholeServiceCleared,false);
 const result=scopeResult({...example,state:'Alaska',license:'Cosmetologist',activities:['wash','scalp','wet'],operatingContext:'suite'});
 assert.match(result.inquiry,/Specific questions for the steps not covered by a cited determination/);
 assert.match(result.inquiry,/Does this credential cover shampooing/);
 assert.match(result.inquiry,/What sanitation, plumbing/);
 assert.doesNotMatch(result.inquiry,/license approved|permission granted/i);
});
test('when only one or two activities lack findings, preserve cited results and offer a narrower source path',()=>{
 const review=evidenceFor('California','Esthetician',['wash','camera']);
 const quick=scopeSummary(review);
 const route=scopeResearchPath(review);
 assert.equal(quick.counts.outside_credential,1);
 assert.equal(quick.counts.unresolved,1);
 assert.equal(quick.tone,'restricted');
 assert.equal(route.hasStateSources,true);
 assert.ok(route.startingPoint.url.includes('barbercosmo.ca.gov'));
 assert.equal(route.questions.length,1);
 assert.equal(route.questions[0].activity,'camera');
 assert.equal(quick.wholeServiceCleared,false);
 const supported=evidenceFor('Pennsylvania','Cosmetologist',['wash','scalp','styling']);
 assert.equal(scopeResearchPath(supported).questions.length,0);
 assert.equal(scopeSummary(supported).tone,'supported');
});
test('unresolved activities are shown as a source-led guide instead of seven negative cards',()=>{
 const widget=read('assets/js/aimt-launch-journey-widgets.mjs');
 const css=read('assets/css/aimt-scope-finder-status.css');
 for(const fragment of [
  'data-scope-research-path',
  'data-scope-path-link',
  'data-scope-path-steps',
  'data-scope-path-questions',
  'data-scope-questions',
  'data-scope-findings-title',
  'sourced=review.findings.filter',
  "quick.tone==='unknown'",
  'SCOPE_GOVERNMENT_DIRECTORY',
  'Your personalized licensing research pathway is ready',
  'SERVICE-SPECIFIC QUESTIONS'
 ])assert.ok(widget.includes(fragment),'Missing source-led design: '+fragment);
 assert.match(widget,/for\(const finding of \[\.\.\.sourced\]/);
 assert.match(widget,/if\(sourced.length===0\)/);
 assert.match(css,/\.lj-scope-research-path/);
 assert.match(css,/\.lj-scope-path-link/);
 assert.doesNotMatch(widget,/7 AIMT research gaps/);
});


test('source limits are framed as a research pathway, not evidence that a state forbids head spa',()=>{
 const unmapped=scopeSummary(evidenceFor('Alaska','Cosmetologist',['wash','scalp']));
 const mappedButUnanswered=scopeSummary(evidenceFor('New York','Esthetician',['scalp','camera']));
 assert.match(unmapped.headline,/Here’s how to confirm the rules/);
 assert.match(mappedButUnanswered.headline,/Here’s how to confirm the rules/);
 assert.match(unmapped.message,/official government directory/i);
 assert.match(mappedButUnanswered.message,/state has official licensing resources/i);
 assert.match(unmapped.message,/not.*prohibited/i);
 assert.match(mappedButUnanswered.message,/not.*prohibited/i);
 assert.equal(unmapped.wholeServiceCleared,false);
 assert.equal(mappedButUnanswered.wholeServiceCleared,false);
 const standalone=read('head-spa-scope-finder.html');
 assert.match(standalone,/Source coverage varies by state/);
 assert.doesNotMatch(standalone,/Research in progress: six states have curated official sources/);
});
