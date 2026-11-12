// Shared AIMT free launch experience. Browser-local business notes, no PII or client images.
// Used by standalone tools AND the five-lesson Accelerator. Does not grant practice scope.
import { blueprintPayload } from './aimt-first-service-blueprint-core.mjs';

export const STORAGE_KEY='aimt-free-head-spa-launch-plan-v1';
export const VERSION=1;
export const LESSONS=Object.freeze([
 {id:'scope',title:'Can I actually offer this?',minutes:5},
 {id:'service',title:'What am I actually building?',minutes:5},
 {id:'equipment',title:'Set up without regret',minutes:6},
 {id:'observation',title:'What am I looking at?',minutes:6},
 {id:'launch',title:'Know your next move',minutes:6}
]);
export const STATES=Object.freeze([
 'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia',
 'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine',
 'Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
 'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma',
 'Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
 'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
]);
export const LICENSES=Object.freeze(['Cosmetologist','Esthetician','Barber','Massage therapist','Student / not yet licensed','Other / unsure']);
export const ACTIVITIES=Object.freeze([
 {key:'wash',label:'Shampooing or washing hair'},
 {key:'scalp',label:'Cosmetic scalp cleansing or exfoliation'},
 {key:'scalp-massage',label:'Scalp massage'},
 {key:'bodywork',label:'Neck or shoulder massage'},
 {key:'styling',label:'Blow-drying or styling'},
 {key:'camera',label:'Scalp camera observations'},
 {key:'wet',label:'Water/steam equipment and sanitation'}
]);
// Curated Nov 11, 2026; official source links, NOT legal opinions or approval.
export const SCOPE_SOURCES=Object.freeze({
 California:[
  ['California Board — Head Spas bulletin','https://barbercosmo.ca.gov/forms_pubs/headspas.pdf'],
  ['California Board — bulletins index','https://barbercosmo.ca.gov/forms_pubs/publications/bulletins.shtml']],
 Tennessee:[
  ['Tennessee Commerce — shampoo and head spa FAQ','https://support.commerce.tn.gov/hc/en-us/articles/29894088035987-Shampoo-and-Head-Spa'],
  ['Tennessee Board — individual licensing','https://www.tn.gov/commerce/regboards/cosmo/license/individual.html']],
 Texas:[
  ['TDLR — scope of practice guides','https://www.tdlr.texas.gov/barbering-and-cosmetology/scope-of-practice/'],
  ['TDLR — who regulates what','https://www.tdlr.texas.gov/barbering-and-cosmetology/who-regulates-what.htm']],
 Florida:[
  ['Florida DBPR — cosmetology FAQ','https://www2.myfloridalicense.com/cosmetology/faqs/'],
  ['Florida DBPR — what requires a license','https://ula.myfloridalicense.com/what-requires-a-license/']],
 'New York':[
  ['New York DOS — appearance-enhancement procedure chart','https://dos.ny.gov/system/files/documents/2025/03/ae-licensees-procedural-service-determinations_03.2025.pdf']]
});
export const SYSTEM_OPTIONS=Object.freeze([
 {key:'undecided',label:'Not decided yet'},
 {key:'plumbed',label:'Plumbed head spa bed'},
 {key:'portable',label:'Portable / non-plumbed bed'},
 {key:'attachment',label:'Existing shampoo bowl attachment'}
]);
export const SPACE_OPTIONS=Object.freeze([
 {key:'exploring',label:'Exploring a future location'},
 {key:'station',label:'Existing shampoo station'},
 {key:'suite',label:'Salon suite / rented room'},
 {key:'dedicated',label:'Dedicated treatment room'}
]);
export const PLAN_FIELDS=Object.freeze([
 'state','license','activities','licenseQuestions','serviceFormat','clientPromise','audience',
 'consultMinutes','serviceMinutes','prepMinutes','resetMinutes','adminMinutes',
 'space','equipmentSystem','equipmentPriority','equipmentQuestions',
 'observationAnswer','observationNote','trainingPriority','trainingChecklist','nextSteps','completed'
]);
const LIMITS={licenseQuestions:320,clientPromise:240,audience:120,equipmentQuestions:320,observationNote:220,trainingPriority:180};
const TEXT_FIELDS=Object.keys(LIMITS);
function cleanText(raw,max=160){
 return typeof raw==='string'?raw.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max):'';
}
function accepted(value,choices){return choices.includes(value)?value:'';}
function minutes(v){
 if(v===''||v===null||v===undefined)return '';
 const n=Number(v);return Number.isInteger(n)&&n>=0&&n<=1440?String(n):'';
}
export function emptyPlan(){
 return {version:VERSION,state:'',license:'',activities:[],licenseQuestions:'',serviceFormat:'',clientPromise:'',audience:'',
  consultMinutes:'',serviceMinutes:'',prepMinutes:'',resetMinutes:'',adminMinutes:'',
  space:'',equipmentSystem:'',equipmentPriority:'',equipmentQuestions:'',
  observationAnswer:'',observationNote:'',trainingPriority:'',trainingChecklist:[],nextSteps:[],completed:[]};
}
export function normalizePlan(raw){
 const p=emptyPlan();
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==VERSION)return p;
 p.state=accepted(raw.state,STATES);
 p.license=accepted(raw.license,LICENSES);
 p.activities=Array.isArray(raw.activities)?[...new Set(raw.activities.filter(x=>ACTIVITIES.some(a=>a.key===x)))].slice(0,7):[];
 p.serviceFormat=accepted(raw.serviceFormat,['undecided','focused','dedicated']);
 p.space=accepted(raw.space,SPACE_OPTIONS.map(x=>x.key));
 p.equipmentSystem=accepted(raw.equipmentSystem,SYSTEM_OPTIONS.map(x=>x.key));
 p.equipmentPriority=accepted(raw.equipmentPriority,['water','installation','supplier','sanitation','training']);
 p.observationAnswer=accepted(raw.observationAnswer,['visible','diagnosis','guarantee']);
 p.trainingChecklist=Array.isArray(raw.trainingChecklist)?[...new Set(raw.trainingChecklist.filter(x=>['curriculum','assessment','scope','terms','practice'].includes(x)))]:[];
 p.nextSteps=Array.isArray(raw.nextSteps)?raw.nextSteps.slice(0,3).map(x=>cleanText(x,180)):[];
 p.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(x=>LESSONS.some(l=>l.id===x)))]:[];
 TEXT_FIELDS.forEach(k=>p[k]=cleanText(raw[k],LIMITS[k]));
 ['consultMinutes','serviceMinutes','prepMinutes','resetMinutes','adminMinutes'].forEach(k=>p[k]=minutes(raw[k]));
 return p;
}
export function readPlan(storage){
 try{return normalizePlan(JSON.parse(storage.getItem(STORAGE_KEY)||'null'));}
 catch{return emptyPlan();}
}
export function writePlan(storage,patch){
 const old=readPlan(storage);
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return old;
 const next={...old};
 for(const k of PLAN_FIELDS)if(Object.prototype.hasOwnProperty.call(patch,k))next[k]=patch[k];
 const updated=normalizePlan(next);
 try{storage.setItem(STORAGE_KEY,JSON.stringify(updated));}
 catch{return old;}
 return updated;
}
export function appointmentMinutes(plan){
 const p=normalizePlan(plan),keys=['consultMinutes','serviceMinutes','prepMinutes','resetMinutes','adminMinutes'];
 if(keys.some(k=>p[k]==='')||Number(p.serviceMinutes)<1)return null;
 const service=Number(p.serviceMinutes);
 const total=keys.reduce((sum,k)=>sum+Number(p[k]),0);
 return {service,total,extra:total-service};
}
export function scopeResult(plan){
 const p=normalizePlan(plan),sources=SCOPE_SOURCES[p.state]||[];
 const activities=ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label);
 const list=activities.length?activities.map(a=>'• '+a).join('\n'):'• [describe proposed activities]';
 return {sources,activities,
  status:sources.length?'Official source links located; permission NOT determined.':'No curated official source for this state. Locate the state licensing board.',
  note:['Massage therapist','Student / not yet licensed','Other / unsure'].includes(p.license)
   ?'These references may cover barbering or cosmetology rather than your credential. Identify the appropriate regulator.'
   :'Official sources require activity-by-activity review. This tool does not approve a service.',
  inquiry:'Subject: Scope of a proposed cosmetic scalp-care service\n\nHello,\n\nI am a '+(p.license||'[credential]')+' in '+(p.state||'[state]')+'. Before offering cosmetic scalp-care or head spa services, I need to verify which activities are permitted:\n\n'+list+'\n\nCould you identify the written rules and any separate establishment permits, supervision, sanitation or equipment requirements?\n\nThank you.'
 };
}
export function equipmentResult(plan){
 const p=normalizePlan(plan),questions=[
  'Request the actual model specification and installation manual before paying.',
  'Verify water supply, hot-water capacity, wastewater handling and fresh versus recirculated water.',
  'Have a qualified professional review plumbing, electrical requirements and permits.',
  'Confirm cleaning, sanitation, parts and after-sales support.',
  'Get written warranty, returns, delivery, service and replacement-parts terms.'
 ];
 if(p.equipmentSystem==='portable')questions.unshift('Calculate filling, emptying, cleaning and tank capacity for the actual appointment volume.');
 if(p.equipmentSystem==='attachment')questions.unshift('Check dimensions, fit, water pressure and drainage of the exact existing sink.');
 if(p.equipmentSystem==='plumbed')questions.unshift('Get site-specific installation requirements reviewed before ordering permanent equipment.');
 if(p.space==='suite')questions.unshift('Check landlord permission and rules on water connections and tenant improvements.');
 if(p.space==='exploring')questions.unshift('Do not commit to a particular bed before the room and utilities are known.');
 return {label:SYSTEM_OPTIONS.find(x=>x.key===p.equipmentSystem)?.label||'Unselected',questions,
  caution:'Planning questions only. Check manufacturer instructions, local codes and qualified installers before any equipment modification or installation.'};
}
export function observationFeedback(choice){
 if(choice==='visible')return {correct:true,title:'Supported by the illustration.',copy:'You can describe visible light-colored surface material. You cannot identify its cause from a single illustrative view.'};
 if(choice==='diagnosis')return {correct:false,title:'That exceeds observation.',copy:'A single view does not establish a disorder or its severity. Describe the feature; do not diagnose.'};
 if(choice==='guarantee')return {correct:false,title:'Appearance does not predict an outcome.',copy:'Neither a scalp image nor this exercise justifies hair-growth promises or treatment predictions.'};
 return null;
}
export function renderPlanText(plan){
 const p=normalizePlan(plan),time=appointmentMinutes(p),eq=equipmentResult(p);
 return [
  'AIMT — HEAD SPA LAUNCH PLAN','Working plan only; not certification or legal clearance.','',
  '01 / SCOPE','State: '+(p.state||'Unselected'),'Credential: '+(p.license||'Unselected'),
  'Activities to verify: '+(ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label).join('; ')||'Unspecified'),
  'Board question: '+(p.licenseQuestions||'Unwritten'),'Permission: NOT DETERMINED','',
  '02 / SERVICE','Clients: '+(p.audience||'Unspecified'),'Format: '+(p.serviceFormat||'Unselected'),
  'Client promise: '+(p.clientPromise||'Unwritten'),
  'Full appointment: '+(time?time.total+' minutes (including '+time.extra+' outside hands-on service)':'Not calculated'),'',
  '03 / EQUIPMENT','Environment: '+(SPACE_OPTIONS.find(o=>o.key===p.space)?.label||'Unspecified'),
  'Equipment under consideration: '+eq.label,'Supplier/installer question: '+(p.equipmentQuestions||'Unwritten'),'Installation: NOT VERIFIED','',
  '04 / OBSERVATION','Practice sentence: '+(p.observationNote||'Unwritten'),'An observation is not a medical diagnosis.','',
  '05 / NEXT STEPS',...[0,1,2].map(i=>(i+1)+'. '+(p.nextSteps[i]||'Unwritten')),
  'Training priority: '+(p.trainingPriority||'Unidentified'),'', 'Verify scope, setup and costs before advertising or providing services.'
 ].join('\n');
}
export function blueprintFromPlan(plan){
 const p=normalizePlan(plan),time=appointmentMinutes(p),activities=ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label);
 return blueprintPayload({
  practice:p.serviceFormat==='dedicated'?'Proposed dedicated head spa service':'Proposed scalp-care service',
  audience:p.audience,value:p.clientPromise,
  format:p.serviceFormat==='dedicated'?'Extended 90':p.serviceFormat==='focused'?'Core 60':'Custom',
  consultation:'Review client goals, comfort, intake, scope, and appropriate service decisions.',
  serviceTime:time?time.total+' minutes total including pre/post-treatment time':'',
  cost:'Estimate separately using the Service Cost Worksheet',price:'',
  difference:'A purpose-built client experience with verified operational capacity.',
  equipment:eqShort(p), licensing:(p.state||'State?')+' / '+(p.license||'Credential?')+'. Verify: '+(activities.join(', ')||'activities unknown'),
  supplier:p.equipmentQuestions||'Check parts, warranty, instructions, installation.',
  operations:'Verify sanitation, setup, checkout and between-client reset.',
  rehearsal:'Practice service and measure the real full appointment.',
  nextStep:p.nextSteps.find(Boolean)||'Confirm scope and first training priority.',reviewDate:''
 });
}
function eqShort(p){return (SYSTEM_OPTIONS.find(o=>o.key===p.equipmentSystem)?.label||'Equipment undecided')+'. Verify utilities and sanitation.';}
