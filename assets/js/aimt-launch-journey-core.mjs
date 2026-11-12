// Shared AIMT free launch experience. Browser-local business notes, no PII or client images.
// Used by standalone tools AND the five-lesson Accelerator. Does not grant practice scope.
import { blueprintPayload } from './aimt-first-service-blueprint-core.mjs';
import { calculateServiceCost } from './aimt-service-cost-core.mjs';
import { SCOPE_EVIDENCE,evidenceFor } from './aimt-scope-evidence.mjs';

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
export const LICENSES=Object.freeze(['Cosmetologist','Cosmetology Operator','Esthetician','Facial Specialist','Full Specialist','Barber','Class A Barber','Master Barber','Hairstylist','Natural Hair Stylist','Massage therapist','No professional license','Student / not yet licensed','Other / unsure']);
export const CREDENTIAL_NOTES=Object.freeze({
 'California':'Choose the exact California board credential. A hairstylist license differs from an esthetician license, and an unrelated out-of-state license is not automatically valid.',
 'Texas':'Texas uses the titles Cosmetology Operator and Class A Barber. Use your actual TDLR credential; a generic title does not prove a particular license subtype.',
 'Tennessee':'The state distinguishes Master Barber, Barber Technician and Cosmetologist. Generic Barber does not establish Master Barber status.',
 'Florida':'Florida uses the titles Cosmetologist, Facial Specialist and Full Specialist. A generic Esthetician choice is not automatically equivalent to Florida registration.',
 'Pennsylvania':'PA cosmetologists, estheticians and barbers are regulated under different statutory definitions and sometimes different boards.',
 'New York':'NY distinguishes Cosmetology, Esthetics and Natural Hair Styling, plus separate barbering regulation. Confirm your exact registered category.'
});
export const LICENSE_STATUSES=Object.freeze([
 {key:'active_here',label:'I hold an active license issued by this state'},
 {key:'licensed_elsewhere',label:'My license is from a different state'},
 {key:'pending_or_expired',label:'My state license is pending, inactive or expired'},
 {key:'none',label:'I do not currently hold a professional license'},
 {key:'unsure',label:'I need to check my license status'}
]);
export const OPERATING_CONTEXTS=Object.freeze([
 {key:'salon',label:'An existing salon or licensed workplace'},
 {key:'suite',label:'A private salon suite or rented room'},
 {key:'independent',label:'Opening my own head spa or location'},
 {key:'mobile',label:'Mobile / visiting clients'},
 {key:'exploring',label:'Still researching my options'}
]);
export const CAREER_STAGES=Object.freeze([
 {key:'exploring',label:'Exploring head spa or still in school'},
 {key:'new',label:'Newly licensed / early in my career'},
 {key:'experienced',label:'Experienced professional, new to head spa'},
 {key:'offering',label:'Already providing head spa services'}
]);
export const CAREER_STAGE_GUIDANCE=Object.freeze({
 exploring:'Start by checking licensing requirements and finding out what supervised or permitted practice you need. There is no need to buy a bed before you know your path.',
 new:'Focus first on professional scope, core consultation skills and practicing a repeatable service before making big equipment purchases.',
 experienced:'You bring useful experience, but head spa has its own timing, equipment and client-expectation decisions. Review what changes in your current space.',
 offering:'Use your existing appointments as evidence. Measure what takes time, identify weak points in your setup and improve consistency before adding more services.'
});
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
// Source directory and activity-level evidence share one canonical registry.
export const SCOPE_SOURCES=Object.freeze(Object.fromEntries(
 Object.entries(SCOPE_EVIDENCE).map(([state,entry])=>[state,entry.sources.map(x=>[x.title,x.url])])
));
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
 'careerStage','state','license','licenseStatus','operatingContext','activities','licenseQuestions','serviceFormat','clientPromise','audience',
 'consultMinutes','serviceMinutes','prepMinutes','resetMinutes','adminMinutes',
 'products','supplies','overhead','laborHourly','menuPrice',
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
function amount(value){
 if(value===''||value===undefined||value===null)return '';
 const v=String(value).trim();
 if(!/^(?:\d+)(?:\.\d{1,4})?$/.test(v)||Number(v)>100000)return '';
 return v;
}
export function emptyPlan(){
 return {version:VERSION,careerStage:'',state:'',license:'',licenseStatus:'',operatingContext:'',activities:[],licenseQuestions:'',serviceFormat:'',clientPromise:'',audience:'',
  consultMinutes:'',serviceMinutes:'',prepMinutes:'',resetMinutes:'',adminMinutes:'',
  products:'',supplies:'',overhead:'',laborHourly:'',menuPrice:'',
  space:'',equipmentSystem:'',equipmentPriority:'',equipmentQuestions:'',
  observationAnswer:'',observationNote:'',trainingPriority:'',trainingChecklist:[],nextSteps:[],completed:[]};
}
export function normalizePlan(raw){
 const p=emptyPlan();
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==VERSION)return p;
 p.careerStage=accepted(raw.careerStage,CAREER_STAGES.map(x=>x.key));
 p.state=accepted(raw.state,STATES);
 p.license=accepted(raw.license,LICENSES);
 p.licenseStatus=accepted(raw.licenseStatus,LICENSE_STATUSES.map(x=>x.key));
 p.operatingContext=accepted(raw.operatingContext,OPERATING_CONTEXTS.map(x=>x.key));
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
 ['products','supplies','overhead','laborHourly','menuPrice'].forEach(k=>p[k]=amount(raw[k]));
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
export function pricingResult(plan){
 const p=normalizePlan(plan);
 return calculateServiceCost({
  consultMinutes:p.consultMinutes,serviceMinutes:p.serviceMinutes,prepMinutes:p.prepMinutes,
  resetMinutes:p.resetMinutes,adminMinutes:p.adminMinutes,
  products:p.products,supplies:p.supplies,overhead:p.overhead,laborHourly:p.laborHourly,menuPrice:p.menuPrice
 });
}
export function scopeResult(plan){
 const p=normalizePlan(plan),review=evidenceFor(p.state,p.license,p.activities);
 const activities=ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label);
 const list=activities.length?activities.map(a=>'• '+a).join('\n'):'• [describe proposed activities]';
 const context=OPERATING_CONTEXTS.find(x=>x.key===p.operatingContext)?.label||'[work setting]';
 const inquiry=[
  'Subject: Professional scope and establishment questions about a head spa service','',
  'Hello,','',
  'I am evaluating a cosmetic scalp-care / head spa service in '+(p.state||'[state]')+'.',
  'My credential: '+(p.license||'[credential or no professional license]')+'.',
  'My planned work setting: '+context+'.','',
  'Before offering services, I want to verify the requirements for these specific activities:',
  list,'',
  'Could you point me to the governing statutes, regulations or official guidance for each activity?',
  'What individual professional licenses, establishment licenses, inspections, supervision and sanitation obligations apply?',
  'Are there additional requirements for the head spa water/steam equipment and its installation?','',
  'I understand some boards cannot provide advisory legal opinions; a reference to the governing written sources would still be helpful.','',
  'Thank you.'
 ].join('\n');
 return {
   sources:review.sources.map(x=>[x.title,x.url]),
   licenseStatus:p.licenseStatus,
   licenseStatusNote:p.licenseStatus==='active_here'?'AIMT has not verified your license. Confirm the public record and status before practicing.':
      p.licenseStatus==='licensed_elsewhere'?'An out-of-state license does not automatically authorize practice here. Check reciprocity and obtain the required credential before offering regulated services.':
      p.licenseStatus==='pending_or_expired'?'Pending, inactive and expired credentials are not proof of current authorization. Check official status before practice.':
      p.licenseStatus==='none'?'A source-backed exemption may cover one narrow activity, but a professional license is required for other regulated steps.':'Confirm your credential is active and valid in this state before practicing regulated services.',
   activities,review,inquiry,
   status:review.researchStatus,
   note:['Massage therapist','Student / not yet licensed','No professional license','Other / unsure'].includes(p.license)
      ?'Some curated sources concern cosmetology rather than massage therapy or another credential. The right regulator for each activity must be identified.'
      :'The findings describe individual steps only, not permission to perform the whole head spa service.'
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
 if(choice==='visible')return {correct:true,title:'Supported by this teaching image.',copy:'You can describe visible surface material near hair shafts. The image alone cannot establish its cause or a medical condition.'};
 if(choice==='diagnosis')return {correct:false,title:'That exceeds observation.',copy:'A single view does not establish a disorder or its severity. Describe the feature; do not diagnose.'};
 if(choice==='guarantee')return {correct:false,title:'Appearance does not predict an outcome.',copy:'Neither a scalp image nor this exercise justifies hair-growth promises or treatment predictions.'};
 return null;
}
export function renderPlanText(plan){
 const p=normalizePlan(plan),time=appointmentMinutes(p),eq=equipmentResult(p),price=pricingResult(p);
 return [
  'AIMT — HEAD SPA LAUNCH PLAN','Working plan only; not certification or legal clearance.','',
  '01 / SCOPE','Experience: '+(CAREER_STAGES.find(x=>x.key===p.careerStage)?.label||'Not selected'),'State: '+(p.state||'Unselected'),
  'License status (self-reported, not verified by AIMT): '+(LICENSE_STATUSES.find(x=>x.key===p.licenseStatus)?.label||'Not checked'),
  'Work setting: '+(OPERATING_CONTEXTS.find(x=>x.key===p.operatingContext)?.label||'Not selected'),'Credential: '+(p.license||'Unselected'),
  'Activities to verify: '+(ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label).join('; ')||'Unspecified'),
  'Board question: '+(p.licenseQuestions||'Unwritten'),'Permission: NOT DETERMINED','',
  '02 / SERVICE','Clients: '+(p.audience||'Unspecified'),'Format: '+(p.serviceFormat||'Unselected'),
  'Client promise: '+(p.clientPromise||'Unwritten'),
  'Full appointment: '+(time?time.total+' minutes (including '+time.extra+' outside hands-on service)':'Not calculated'),
  'Modeled service cost: '+(price.ok?'$'+price.modeledCost.toFixed(2)+' (your inputs; not a profit figure)':'Not calculated'),
  'Proposed price: '+(price.ok&&price.enteredPrice!==null?'$'+price.enteredPrice.toFixed(2):'Not entered'),
  'Price minus modeled cost: '+(price.ok&&price.modeledDifference!==null?'$'+price.modeledDifference.toFixed(2)+' (before other costs; not profit)':'Not calculated'),'',
  '03 / EQUIPMENT','Environment: '+(SPACE_OPTIONS.find(o=>o.key===p.space)?.label||'Unspecified'),
  'Equipment under consideration: '+eq.label,'Supplier/installer question: '+(p.equipmentQuestions||'Unwritten'),'Installation: NOT VERIFIED','',
  '04 / OBSERVATION','Practice sentence: '+(p.observationNote||'Unwritten'),'An observation is not a medical diagnosis.','',
  '05 / NEXT STEPS',...[0,1,2].map(i=>(i+1)+'. '+(p.nextSteps[i]||'Unwritten')),
  'Training priority: '+(p.trainingPriority||'Unidentified'),'', 'Verify scope, setup and costs before advertising or providing services.'
 ].join('\n');
}
export function blueprintFromPlan(plan){
 const p=normalizePlan(plan),time=appointmentMinutes(p),price=pricingResult(p),activities=ACTIVITIES.filter(a=>p.activities.includes(a.key)).map(a=>a.label);
 return blueprintPayload({
  practice:p.serviceFormat==='dedicated'?'Proposed dedicated head spa service':'Proposed scalp-care service',
  audience:p.audience,value:p.clientPromise,
  format:p.serviceFormat==='dedicated'?'Extended 90':p.serviceFormat==='focused'?'Core 60':'Custom',
  consultation:'Review client goals, comfort, intake, scope, and appropriate service decisions.',
  serviceTime:time?time.total+' minutes total including pre/post-treatment time':'',
  cost:price.ok?'$'+price.modeledCost.toFixed(2)+' modeled cost using user estimates':'Estimate separately in the Cost Worksheet',
  price:price.ok&&price.enteredPrice!==null?'$'+price.enteredPrice.toFixed(2)+' proposed price':'',
  difference:'A purpose-built client experience with verified operational capacity.',
  equipment:eqShort(p), licensing:(p.state||'State?')+' / '+(p.license||'Credential?')+'. Verify: '+(activities.join(', ')||'activities unknown'),
  supplier:p.equipmentQuestions||'Check parts, warranty, instructions, installation.',
  operations:'Verify sanitation, setup, checkout and between-client reset.',
  rehearsal:'Practice service and measure the real full appointment.',
  nextStep:p.nextSteps.find(Boolean)||'Confirm scope and first training priority.',reviewDate:''
 });
}
function eqShort(p){return (SYSTEM_OPTIONS.find(o=>o.key===p.equipmentSystem)?.label||'Equipment undecided')+'. Verify utilities and sanitation.';}
