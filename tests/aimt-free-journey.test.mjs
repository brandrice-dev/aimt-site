// Offline validation for AIMT's shared Free Tools + Accelerator path.
// Run: node --test tests/aimt-free-journey.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 STORAGE_KEY,STATES,LICENSES,SCOPE_SOURCES,LESSONS,emptyPlan,normalizePlan,writePlan,readPlan,
 appointmentMinutes,pricingResult,scopeResult,equipmentResult,observationFeedback,renderPlanText,blueprintFromPlan
} from '../assets/js/aimt-launch-journey-core.mjs';
import {normalizeBlueprint,BLUEPRINT_FIELDS} from '../assets/js/aimt-first-service-blueprint-core.mjs';

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
test('scope finder provides only official source references, never permission decisions',()=>{
 const p=normalizePlan(example),r=scopeResult(p);
 assert.ok(r.sources.length>=1);
 assert.match(r.status,/NOT determined/i);
 assert.match(r.inquiry,/California/);
 assert.match(r.inquiry,/Shampooing or washing hair/);
 assert.doesNotMatch(r.inquiry,/authorized|you may offer|permission granted/i);
 const unknown=scopeResult({...p,state:'Pennsylvania'});
 assert.equal(unknown.sources.length,0);assert.match(unknown.status,/No curated official source/);
 assert.equal(Object.keys(SCOPE_SOURCES).length,5);
});
test('scope result clarifies mismatch for massage therapy and unlicensed learner',()=>{
 for(const license of ['Massage therapist','Student / not yet licensed']){
  const r=scopeResult({...example,license});
  assert.match(r.note,/appropriate regulator/);
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
