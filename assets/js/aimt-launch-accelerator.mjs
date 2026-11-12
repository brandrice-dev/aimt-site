// AIMT Head Spa Launch Accelerator navigation and export.
// Tool implementations live in aimt-launch-journey-widgets.mjs and are shared
// with independent Free Tools pages. No separate enrollment or grading system.
import {mountAll} from './aimt-launch-journey-widgets.mjs';
import {LESSONS,readPlan,writePlan,STORAGE_KEY,appointmentMinutes,renderPlanText,blueprintFromPlan} from './aimt-launch-journey-core.mjs';

const $=selector=>document.querySelector(selector);
const ids=LESSONS.map(x=>x.id).concat('summary');
let active='scope';
function getPlan(){return readPlan(window.localStorage);}
function lessonReady(id,p=getPlan()){
 if(id==='scope')return !!(p.state&&p.license&&p.activities.length);
 if(id==='service')return !!(p.serviceFormat&&p.clientPromise&&appointmentMinutes(p));
 if(id==='equipment')return !!(p.space&&p.equipmentSystem&&p.equipmentPriority);
 if(id==='observation')return !!(p.observationAnswer&&p.observationNote);
 if(id==='launch')return !!(p.nextSteps.length===3&&p.nextSteps.every(Boolean)&&p.trainingPriority);
 return false;
}
function refresh(){
 const p=getPlan(),done=LESSONS.filter(l=>p.completed.includes(l.id)&&lessonReady(l.id,p)).length;
 $('#progressNumber').textContent=done+' / 5';
 $('#progressFill').style.width=(done/5*100)+'%';
 document.querySelectorAll('[data-open-lesson]').forEach(btn=>{
  const id=btn.dataset.openLesson;
  btn.classList.toggle('is-active',id===active);
  if(id===active)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');
 });
 document.querySelectorAll('[data-done]').forEach(tag=>{
  const id=tag.dataset.done;
  tag.textContent=p.completed.includes(id)&&lessonReady(id,p)?'✓':'';
  tag.setAttribute('aria-label',tag.textContent?'Completed':'Not yet complete');
 });
 if(active==='summary')refreshSummary();
}
function refreshSummary(){
 const p=getPlan();
 $('#planSummary').textContent=renderPlanText(p);
 const ready=LESSONS.filter(l=>lessonReady(l.id,p)).length;
 $('#summaryIntro').textContent=ready===5
  ?'You have recorded all five early-stage decisions. This is a working plan, not proof of permission or professional service competence. Confirm each unresolved item before acting.'
  :'You have '+ready+' of 5 decision areas documented. The blank areas are worth revisiting, but you can keep this provisional plan now. No readiness or certification is implied.';
}
function openLesson(id){
 if(!ids.includes(id))return;
 active=id;
 document.querySelectorAll('[data-lesson]').forEach(section=>{section.hidden=section.dataset.lesson!==id;});
 refresh();
 const section=$('[data-lesson="'+id+'"]');
 const heading=section.querySelector('h2');
 if(heading){heading.focus({preventScroll:true});}
 const course=$('#course');
 window.scrollTo({top:Math.max(0,course.getBoundingClientRect().top+window.scrollY-12),
  behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
}
function markAndContinue(id){
 const p=getPlan();
 if(lessonReady(id,p)){
  writePlan(window.localStorage,{completed:[...new Set(p.completed.concat(id))]});
  const label=$('[data-lesson-status="'+id+'"]');if(label)label.textContent='Your lesson decisions are saved. You can revise them later.';
 }else{
  const label=$('[data-lesson-status="'+id+'"]');
  if(label)label.textContent='Some plan fields are still open. You may continue and return when you have the information.';
 }
 const i=ids.indexOf(id);
 openLesson(ids[Math.min(i+1,ids.length-1)]);
}
function download(name,content,type){
 const blob=new Blob([content],{type});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=name;link.style.display='none';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('#planStatus').textContent='Your file was generated locally. AIMT has not received your plan content.';
}
async function copyPlan(){
 const value=renderPlanText(getPlan());
 try{await navigator.clipboard.writeText(value);$('#planStatus').textContent='Launch Plan copied.';}
 catch{
  const area=document.createElement('textarea');area.value=value;area.readOnly=true;area.rows=10;area.setAttribute('aria-label','Select and copy your Launch Plan');
  $('#planSummary').insertAdjacentElement('afterend',area);area.focus();area.select();
  $('#planStatus').textContent='Clipboard unavailable. Select and copy the text shown below.';
 }
}
mountAll();
document.querySelectorAll('[data-open-lesson]').forEach(btn=>btn.addEventListener('click',()=>openLesson(btn.dataset.openLesson)));
document.querySelectorAll('[data-continue]').forEach(btn=>btn.addEventListener('click',()=>markAndContinue(btn.dataset.continue)));
document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>openLesson(btn.dataset.back)));
$('#startCourse').addEventListener('click',()=>{
 const p=getPlan(),first=LESSONS.find(l=>!(p.completed.includes(l.id)&&lessonReady(l.id,p)));
 openLesson(first?.id||'summary');
});
$('#downloadLaunchPlan').addEventListener('click',()=>download('AIMT-Head-Spa-Launch-Plan.txt',renderPlanText(getPlan()),'text/plain;charset=utf-8'));
$('#downloadBlueprintPlan').addEventListener('click',()=>{
 const data=blueprintFromPlan(getPlan());
 download('AIMT-First-Service-Blueprint-From-Accelerator.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');
});
$('#copyLaunchPlan').addEventListener('click',copyPlan);
$('#printLaunchPlan').addEventListener('click',()=>window.print());
$('#clearPlan').addEventListener('click',()=>{
 if(!window.confirm('Clear the answers saved for this Free Accelerator on this device? The existing standalone Blueprint and Cost Worksheet will not be deleted.'))return;
 try{window.localStorage.removeItem(STORAGE_KEY);}
 catch{$('#progressNumber').textContent='Local storage unavailable';return;}
 window.location.reload();
});
window.addEventListener('aimt-launch-plan-change',refresh);
window.addEventListener('focus',refresh);
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)refresh();});
openLesson('scope');
