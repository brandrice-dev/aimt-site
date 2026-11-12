// Shared interactive learning widgets. Mount the same tool once in its own page or a lesson.
// No API calls, diagnostic model, user photos, or lead database.
import {
 STATES,LICENSES,STATE_CREDENTIALS,CREDENTIAL_NOTES,LICENSE_STATUSES,CAREER_STAGES,CAREER_STAGE_GUIDANCE,OPERATING_CONTEXTS,ACTIVITIES,SCOPE_SOURCES,SYSTEM_OPTIONS,SPACE_OPTIONS,readPlan,writePlan,
 scopeResult,equipmentResult,observationFeedback,appointmentMinutes,pricingResult
} from './aimt-launch-journey-core.mjs';

const $=(root,selector)=>root.querySelector(selector);
function options(items,selected=''){
 return items.map(x=>{const value=typeof x==='string'?x:x.key,label=typeof x==='string'?x:x.label;
  return '<option value="'+safe(value)+'"'+(value===selected?' selected':'')+'>'+safe(label)+'</option>';
 }).join('');
}
function safe(value){
 return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function field(label,id,inner,help=''){
 return '<div><label for="'+id+'">'+label+'</label>'+inner+(help?'<p class="lj-help">'+help+'</p>':'')+'</div>';
}
function select(id,items,placeholder){
 return '<select id="'+id+'" required><option value="">'+safe(placeholder)+'</option>'+options(items)+'</select>';
}
function info(root,selector,msg){
 const elem=$(root,selector);if(elem)elem.textContent=msg;
}
function current(){return readPlan(window.localStorage);}
function persist(patch,root){
 const next=writePlan(window.localStorage,patch);
 let stored=false;
 try{stored=window.localStorage.getItem('aimt-free-head-spa-launch-plan-v1')===JSON.stringify(next);}
 catch{}
 if(root)info(root,'.lj-save-message',stored?'Saved on this device. Your notes are not uploaded or linked to an account.':'This device could not save your answers. Copy the visible result before leaving.');
 if(stored)window.dispatchEvent(new Event('aimt-launch-plan-change'));
 return next;
}
function radio(name,values){
 return values.map(o=>'<label class="lj-option"><input type="radio" name="'+name+'" value="'+safe(o[0])+'"> <span>'+o[1]+'</span></label>').join('');
}
function btn(label,id,alt=false){
 return '<button class="lj-btn '+(alt?'lj-btn-outline-dark':'lj-btn-dark')+'" type="button" data-action="'+id+'">'+label+'</button>';
}
function trigger(root,id,fn){
 const el=$(root,'[data-action="'+id+'"]');if(el)el.addEventListener('click',fn);
}
function resultHTML(title='Your working result'){
 return '<div class="lj-keep" data-result hidden><strong>'+safe(title)+'</strong><p data-result-copy></p><small>Planning only. Confirm all legal, operational and training requirements before practice.</small></div>';
}
async function copy(value,root){
 try{await navigator.clipboard.writeText(value);info(root,'.lj-save-message','Copied. You can paste this into your own plan or message.');}
 catch{
  const area=document.createElement('textarea');area.setAttribute('aria-label','Select and copy this text');
  area.value=value;area.style.width='100%';area.rows=7;root.appendChild(area);area.focus();area.select();
  info(root,'.lj-save-message','Clipboard access is unavailable. Select and copy the text shown below.');
 }
}
function feedbackState(element,isSupported){
 element.classList.toggle('is-correct',!!isSupported);
 element.classList.toggle('is-incorrect',!isSupported);
 element.dataset.feedback=!!isSupported?'correct':'review';
}
function showResult(root,text){
 const area=$(root,'[data-result]');if(!area)return;
 area.hidden=false;$(root,'[data-result-copy]').textContent=text;
}
function markSaved(root){info(root,'.lj-save-message','Saved in the shared Launch Plan on this device.');}

export function mountScope(root){
 const p=current();
 root.innerHTML=[
  '<div class="lj-tool-head"><small>Free Tool / License &amp; Scope Finder</small><small>Primary sources, not legal clearance</small></div>',
  '<h3>What does your license let you do?</h3>',
  '<p>A head spa is made of individual services: shampooing, cosmetic scalp care, massage, styling, and equipment use. The law can treat each step differently. <strong>One shampoo exception is not permission to perform the entire head spa treatment.</strong></p>',
  '<p class="lj-help">This research preview gives activity-by-activity explanations only where AIMT has identified an official source. It cannot confirm your license is active or approve a complete service.</p>',
  '<div class="lj-tool-grid">',
   field('Where are you in your career?','sc-stage',select('sc-stage',CAREER_STAGES,'Choose your starting point'),'New to the industry and experienced professionals use the same legal verification process.'),
   field('State or jurisdiction','sc-state',select('sc-state',STATES,'Choose a state')),
   field('What exact license do you hold?','sc-license',select('sc-license',LICENSES,'Choose a credential'),'Choose the license category written on your state record. Licenses with similar names do not always cover the same steps.'),
   field('Is it active in this state?','sc-status',select('sc-status',LICENSE_STATUSES,'Choose your license status'),'A license from another state is not automatically valid here. AIMT does not check your license status.'),
   field('Where would you work?','sc-context',select('sc-context',OPERATING_CONTEXTS,'Choose a work setting'),'Individual scope and business/facility permissions are separate questions.'),
  '</div>',
  '<div class="lj-stage-guidance" data-stage-guidance role="status" aria-live="polite" hidden></div>',
  '<p class="lj-help lj-credential-note" data-credential-note aria-live="polite"></p>',
  '<fieldset><legend>Which steps would your head spa include?</legend><p class="lj-help">Select only what you would actually do. Each step gets its own research result.</p>',
   ACTIVITIES.map(a=>'<label class="lj-check"><input type="checkbox" name="sc-activity" value="'+a.key+'"><span>'+a.label+'</span></label>').join(''),
  '</fieldset>',
  field('What still needs clarification?','sc-question','<textarea id="sc-question" maxlength="320" placeholder="Example: Can my license include scalp cleansing and shampooing at a private suite?"></textarea>','No names, license numbers, medical concerns or client information.'),
  '<div class="lj-actions">',btn('Review my activities','scope-save'),btn('Copy my findings','scope-report-copy',true),btn('Copy questions for my board','scope-copy',true),'</div>',
  '<p class="lj-status lj-save-message" role="status" aria-live="polite"></p>',
  '<div data-sources hidden>',
   '<div class="lj-scope-overview">',
    '<div class="lj-scope-coverage"><span>RESEARCH COVERAGE</span><h4 data-source-state></h4><p data-source-coverage></p><p data-source-reviewed></p></div>',
    '<p class="lj-scope-not-cleared"><strong>Important:</strong> These are findings about specific activities, <strong>not</strong> an approval to offer your full head spa service. Facility licenses, equipment, local codes and the exact technique may change the answer.</p>',
   '</div>',
   '<section class="lj-scope-license-check" aria-label="License validity reminder"><h4>Your professional license status</h4><p data-license-caution></p><div data-license-lookup></div><p class="lj-help">Check the license directly on the government website. Do not enter your name, license number or private documents into AIMT.</p></section>',
   '<h4>What the sources say about each step</h4>',
   '<div data-activity-findings class="lj-evidence-list"></div>',
   '<h4>Facility and business requirements</h4><p data-source-facility class="lj-scope-facility"></p>',
   '<h4>Official sources you can open</h4><ul class="lj-source-list" data-source-links></ul>',
   '<h4>What to do next</h4><p class="lj-help" data-next-contact></p>',
   '<div class="lj-feedback lj-scope-inquiry"><strong>Your licensing questions</strong><p class="lj-help">Copy this draft and send it yourself. Boards differ in what advice they can give; in some states legal interpretation requires a qualified attorney.</p><div data-board-inquiry style="white-space:pre-wrap;word-break:break-word"></div></div>',
  '</div>',
  resultHTML('Your licensing research summary')
 ].join('');
 const st=$(root,'#sc-state'),lic=$(root,'#sc-license'),licenseStatus=$(root,'#sc-status'),stage=$(root,'#sc-stage'),context=$(root,'#sc-context');
 st.value=p.state;licenseStatus.value=p.licenseStatus;stage.value=p.careerStage;context.value=p.operatingContext;
 function refreshCredentials(preferred){
  const values=STATE_CREDENTIALS[st.value]||LICENSES;
  const prior=typeof preferred==='string'?preferred:lic.value;
  lic.replaceChildren();
  const blank=document.createElement('option');blank.value='';blank.textContent='Choose the exact credential';lic.appendChild(blank);
  for(const value of values){
   const option=document.createElement('option');option.value=value;option.textContent=value;lic.appendChild(option);
  }
  lic.value=values.includes(prior)?prior:'';
  info(root,'[data-credential-note]',CREDENTIAL_NOTES[st.value]||'For states without curated coverage, select the closest professional category and verify your exact state license title with its board.');
 }
 st.addEventListener('change',()=>refreshCredentials());
 refreshCredentials(p.license);
 $(root,'#sc-question').value=p.licenseQuestions;
 function updateGuidance(){
  const el=$(root,'[data-stage-guidance]');el.hidden=!stage.value;
  if(stage.value)el.textContent=CAREER_STAGE_GUIDANCE[stage.value];
 }
 stage.addEventListener('change',updateGuidance);updateGuidance();
 root.querySelectorAll('[name="sc-activity"]').forEach(x=>x.checked=p.activities.includes(x.value));
 let inquiry='',report='';
 function createLink(item){
  const a=document.createElement('a');a.href=item.url;
  a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;
  return a;
 }
 function generate(save=true){
  const state=st.value,license=lic.value,credentialStatus=licenseStatus.value,operatingContext=context.value;
  const activities=Array.from(root.querySelectorAll('[name="sc-activity"]:checked')).map(x=>x.value);
  if(!state||!license||!credentialStatus||!operatingContext||!activities.length){
   info(root,'.lj-save-message','Select your state, credential, license status, work setting, and at least one service step.');return false;
  }
  const patch={careerStage:stage.value,state,license,licenseStatus:credentialStatus,operatingContext,activities,licenseQuestions:$(root,'#sc-question').value};
  const next=save?persist(patch,root):{...current(),...patch};
  const g=scopeResult(next),review=g.review;
  info(root,'[data-source-state]',review.researchStatus);
  info(root,'[data-source-coverage]',review.coverage);
  const mismatch=(license==='No professional license'||license==='Student / not yet licensed') && credentialStatus==='active_here';
  info(root,'[data-license-caution]',mismatch
    ?'Your selections conflict: you selected no current professional credential but also selected an active license. Verify your status before using credential-specific guidance.'
    :g.licenseStatusNote);
  const lookup=$(root,'[data-license-lookup]');lookup.replaceChildren();
  if(review.licenseLookup){
   const a=createLink(review.licenseLookup);a.className='lj-license-lookup-link';a.textContent='Open official license verification → '+review.licenseLookup.title;lookup.appendChild(a);
  }else{
   const note=document.createElement('p');note.textContent='AIMT has not yet mapped the public license lookup for this state. Find it on the official regulator site.';lookup.appendChild(note);
  }
  info(root,'[data-source-reviewed]',review.researchDate?'Official sources examined: '+review.researchDate+'. Guidance can change; always check the current source.':'This state has no reviewed activity findings in AIMT yet.');
  const list=$(root,'[data-activity-findings]');list.replaceChildren();
  for(const finding of review.findings){
   const card=document.createElement('article');card.className='lj-evidence-card';
   card.dataset.scopeStatus=finding.status;
   const heading=document.createElement('h5');
   heading.textContent=ACTIVITIES.find(x=>x.key===finding.activity)?.label||finding.activity;
   const kind=document.createElement('span');kind.className='lj-evidence-kind';
   kind.textContent=finding.heading;
   const p=document.createElement('p');p.textContent=finding.summary;
   const fine=document.createElement('p');fine.className='lj-evidence-limits';fine.textContent=finding.limits;
   card.append(heading,kind,p,fine);
   if(finding.sources.length){
    const links=document.createElement('div');links.className='lj-evidence-refs';
    for(const source of finding.sources){
     const a=createLink(source);links.appendChild(a);
    }
    card.appendChild(links);
   }else{
    const no=document.createElement('small');no.textContent='No verified activity-specific source in the current AIMT research.';card.appendChild(no);
   }
   list.appendChild(card);
  }
  info(root,'[data-source-facility]',review.facility);
  const sources=$(root,'[data-source-links]');sources.replaceChildren();
  if(review.sources.length){
   for(const source of review.sources){
    const li=document.createElement('li');li.appendChild(createLink(source));
    const meta=document.createElement('small');meta.textContent=' — '+(source.detail||'Official agency resource')+(source.date?' · Published/updated '+source.date:'');
    li.appendChild(meta);sources.appendChild(li);
   }
  }else{
   const li=document.createElement('li');li.textContent='This state has not yet been researched. Find your state’s official cosmetology/barber board and current written law. Do not infer permission.';sources.appendChild(li);
  }
  info(root,'[data-next-contact]',review.nextContact);
  info(root,'[data-board-inquiry]',g.inquiry);
  $(root,'[data-sources]').hidden=false;inquiry=g.inquiry;
  report=[
    'AIMT / HEAD SPA LICENSE & SCOPE RESEARCH NOTES',
    'Research is not permission to practice. Confirm current law and professional scope.',
    'State: '+state,'Professional credential: '+license,
    'License status (self-reported): '+credentialStatus,
    'Work setting: '+(OPERATING_CONTEXTS.find(x=>x.key===operatingContext)?.label||operatingContext),
    'Source review: '+(review.researchDate||'No reviewed jurisdiction sources'),
    '',
    'ACTIVITY-BY-ACTIVITY NOTES',
    ...review.findings.flatMap((item,index)=>[
      (index+1)+'. '+(ACTIVITIES.find(x=>x.key===item.activity)?.label||item.activity),
      'Finding: '+item.heading,'Source explanation: '+item.summary,
      'Limitations: '+item.limits,
      'Sources: '+(item.sources.length?item.sources.map(x=>x.title+' — '+x.url).join(' | '):'No supported source yet'),
      ''
    ]),
    'LICENSE STATUS: '+g.licenseStatusNote,
    'ESTABLISHMENT / FACILITY: '+review.facility,
    'NEXT VERIFICATION: '+review.nextContact,
    'OFFICIAL LICENSE LOOKUP: '+(review.licenseLookup?.url||'Not yet mapped'),
    '',
    'No finding authorizes a complete head spa treatment. An individual licensing exemption for one step does not extend to others.'
  ].join('\n');
  const documented=review.findings.filter(x=>x.status!=='unresolved').length;
  showResult(root,documented+' of '+review.findings.length+' selected activities have a specific official-source note in this research snapshot. The rest need further verification. No complete service is cleared.');
  return true;
 }
 trigger(root,'scope-save',()=>generate(true));
 trigger(root,'scope-report-copy',()=>{if(generate(false))copy(report,root);});
 trigger(root,'scope-copy',()=>{if(generate(false))copy(inquiry,root);});
 if(p.state&&p.license&&p.licenseStatus&&p.operatingContext&&p.activities.length)generate(false);
}

export function mountService(root){
 const p=current();
 root.innerHTML=[
  '<div class="lj-tool-head"><small>Lesson tool / Service Design</small><small>Client promise + real costs</small></div>',
  '<h3>Build the experience before the equipment list.</h3>',
  '<p>A focused scalp-care addition and a dedicated head spa appointment can both be legitimate when accurately described and within scope. The client promise, planned flow and available capacity make the difference.</p>',
  '<div class="lj-tool-grid">',
   field('Who would this service be for?','sv-audience','<input id="sv-audience" type="text" maxlength="120" placeholder="e.g. clients looking for a quiet scalp-focused visit">'),
   field('First format you are considering','sv-format',select('sv-format',[{key:'undecided',label:'Undecided'},{key:'focused',label:'Focused scalp service'},{key:'dedicated',label:'Dedicated head spa appointment'}],'Choose a direction')),
  '</div>',
  field('What should the guest value?','sv-promise','<textarea id="sv-promise" maxlength="240" placeholder="Describe one specific client-facing reason for the appointment, not a treatment claim."></textarea>'),
  '<fieldset><legend>Practitioner decision: someone tells you only a dedicated bed makes a service genuine. What should you do?</legend>',
   radio('sv-scenario',[
    ['buy','Buy a head spa bed first. The equipment will determine the service.'],
    ['define','Clarify the client promise, professional scope and space before choosing equipment.'],
    ['sell','Advertise a full head spa appointment now and work out how to deliver it later.']
   ]),
  '</fieldset>',
  '<div class="lj-feedback" data-scenario-feedback role="status" aria-live="polite" hidden></div>',
  '<h4>What does an appointment really occupy?</h4>',
  '<p class="lj-help">Illustrative example: 60 minutes of hands-on treatment + 15 consultation + 10 prep + 15 reset + 5 notes = 105 minutes. Put in your own estimates; no prices or profit are assumed here.</p>',
  '<div class="lj-tool-grid">',
   field('Hands-on treatment (minutes)','sv-service','<input id="sv-service" type="number" inputmode="numeric" min="1" max="1440" placeholder="60">'),
   field('Consultation (minutes)','sv-consult','<input id="sv-consult" type="number" inputmode="numeric" min="0" max="1440" placeholder="15">'),
   field('Preparation (minutes)','sv-prep','<input id="sv-prep" type="number" inputmode="numeric" min="0" max="1440" placeholder="10">'),
   field('Between-client reset (minutes)','sv-reset','<input id="sv-reset" type="number" inputmode="numeric" min="0" max="1440" placeholder="15">'),
   field('Checkout and notes (minutes)','sv-admin','<input id="sv-admin" type="number" inputmode="numeric" min="0" max="1440" placeholder="5">')
  ,'</div>',
  '<div class="lj-feedback" data-capacity role="status" aria-live="polite">Enter all five time assumptions to see how much of the schedule the appointment requires.</div>',
  '<h4>Check the numbers before choosing a menu price.</h4>',
  '<p class="lj-help">A transparent first cost estimate uses your full appointment time, a labor rate you choose, products, consumables and allocated overhead. If you do not know a number, leave it blank instead of guessing. This uses the exact calculation behind AIMT\'s standalone Service Cost Worksheet.</p>',
  '<div class="lj-tool-grid">',
   field('Products used (USD)','sv-products','<input id="sv-products" type="number" inputmode="decimal" min="0" max="100000" step=".01" placeholder="Product cost">'),
   field('Other supplies (USD)','sv-supplies','<input id="sv-supplies" type="number" inputmode="decimal" min="0" max="100000" step=".01" placeholder="Consumable cost">'),
   field('Allocated overhead (USD)','sv-overhead','<input id="sv-overhead" type="number" inputmode="decimal" min="0" max="100000" step=".01" placeholder="Overhead per appointment">'),
   field('Labor value per hour (USD)','sv-labor','<input id="sv-labor" type="number" inputmode="decimal" min="0" max="100000" step=".01" placeholder="Your hourly rate">'),
   field('Potential menu price (optional)','sv-menuPrice','<input id="sv-menuPrice" type="number" inputmode="decimal" min="0" max="100000" step=".01" placeholder="Your proposed price">'),
  '</div>',
  '<div class="lj-feedback" data-pricing role="status" aria-live="polite">Add your actual cost assumptions to see the modeled cost; a proposed price is optional.</div>',
  '<div class="lj-actions">',btn('Save my service direction','service-save'),'</div>',
  '<p class="lj-status lj-save-message" role="status" aria-live="polite"></p>',
  resultHTML('Your provisional service direction'),
  '<p class="lj-help">For a full standalone version, use the <a href="/head-spa-service-cost" target="_blank" rel="noopener">Service Cost Worksheet</a>. The same calculation is used in both tools. Neither result is a guaranteed profit or forecast.</p>'
 ].join('');
 const map={serviceMinutes:'sv-service',consultMinutes:'sv-consult',prepMinutes:'sv-prep',resetMinutes:'sv-reset',adminMinutes:'sv-admin',products:'sv-products',supplies:'sv-supplies',overhead:'sv-overhead',laborHourly:'sv-labor',menuPrice:'sv-menuPrice'};
 $(root,'#sv-audience').value=p.audience;$(root,'#sv-promise').value=p.clientPromise;$(root,'#sv-format').value=p.serviceFormat;
 Object.keys(map).forEach(k=>$(root,'#'+map[k]).value=p[k]);
 function time(){
  const values={};for(const k in map)values[k]=$(root,'#'+map[k]).value;
  const t=appointmentMinutes({...current(),...values});
  const price=pricingResult({...current(),...values});
  const fmt=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  info(root,'[data-pricing]',price.ok?'Modeled cost: '+fmt.format(price.modeledCost)+(price.enteredPrice===null?'. Add a price if you want to compare.':'. Price minus modeled cost: '+fmt.format(price.modeledDifference)+' (not profit; excludes any omitted costs).'):'Add valid product, supply, overhead and labor estimates if you want a cost result. Blank is not zero.');
  info(root,'[data-capacity]',t?'Your appointment would occupy '+t.total+' minutes, including '+t.extra+' minutes outside the hands-on service. Verify these estimates before making a schedule.':'Enter valid nonnegative whole minutes in every field (hands-on must be greater than zero).');
  return t;
 }
 Object.values(map).forEach(id=>$(root,'#'+id).addEventListener('input',time));time();
 root.querySelectorAll('[name="sv-scenario"]').forEach(input=>input.addEventListener('change',()=>{
  const fb=$(root,'[data-scenario-feedback]');
  const messages={
   buy:'Start with the client experience and feasibility. Buying a bed first can create expensive constraints.',
   define:'Correct reasoning: decide what is being offered, then verify scope, operations and equipment.',
   sell:'A promise should not get ahead of your skills or service plan. Do not advertise a full service before you can deliver it.'
  };
  fb.hidden=false;fb.textContent=messages[input.value];feedbackState(fb,input.value==='define');
 }));
 trigger(root,'service-save',()=>{
  const patch={audience:$(root,'#sv-audience').value,clientPromise:$(root,'#sv-promise').value,serviceFormat:$(root,'#sv-format').value};
  for(const k in map)patch[k]=$(root,'#'+map[k]).value;
  if(!patch.serviceFormat||!patch.clientPromise.trim()){info(root,'.lj-save-message','Choose a format (or undecided) and describe the intended client experience first.');return;}
  const t=time();if(!t){info(root,'.lj-save-message','Complete the time assumptions before saving.');return;}
  persist(patch,root);
  showResult(root,'Your '+(patch.serviceFormat==='dedicated'?'dedicated appointment':patch.serviceFormat==='focused'?'focused scalp service':'undecided service concept')+' is planned around '+t.total+' minutes of full appointment capacity. Your promise: '+patch.clientPromise+'. No purchase or legal clearance is implied.');
 });
}

export function mountEquipment(root){
 const p=current();
 root.innerHTML=[
  '<div class="lj-tool-head"><small>Free Tool / Equipment Planner</small><small>Before you buy</small></div>',
  '<h3>The expensive decision is usually the one you made before checking the space.</h3>',
  '<p>A bed specification is not an installation plan. Check water supply, hot-water capacity, drainage, electrical needs, cleaning time, parts and supplier support before paying. Plumbed, portable and existing-station setups have different operational tradeoffs.</p>',
  '<fieldset><legend>Scenario: you found a bed and are ready to order. What must happen first?</legend>',
   radio('eq-choice',[
    ['looks','Compare its appearance and accessories with what is trending online.'],
    ['verify','Get the exact equipment specifications and ask a qualified professional to verify the installation requirements for the actual space.'],
    ['modify','Order it and plan to modify tanks, hot-water or wiring yourself if needed.']
   ]),
  '</fieldset>',
  '<div class="lj-feedback" data-eq-feedback role="status" aria-live="polite" hidden></div>',
  '<div class="lj-tool-grid">',
   field('Your likely space','eq-space',select('eq-space',SPACE_OPTIONS,'Choose a space')),
   field('System you are considering','eq-system',select('eq-system',SYSTEM_OPTIONS,'Choose a system')),
  '</div>',
  '<fieldset><legend>Your biggest unresolved question</legend>',
   radio('eq-priority',[
    ['water','Water supply, wastewater and heating capacity'],
    ['installation','Plumbing, electrical and permission to install'],
    ['supplier','Parts, warranty, import terms and vendor support'],
    ['sanitation','Cleaning, equipment maintenance and turnover'],
    ['training','Training and safe service operation']
   ]),
  '</fieldset>',
  field('One question you will ask before paying','eq-question','<textarea id="eq-question" maxlength="320" placeholder="For this exact model and room, what is the manufacturer-approved water and drain connection?"></textarea>'),
  '<div class="lj-actions">',btn('Build my equipment checklist','equipment-save'),'</div>',
  '<p class="lj-status lj-save-message" role="status" aria-live="polite"></p>',
  '<div data-eq-list hidden><h4>Questions to verify before purchasing</h4><ul data-eq-questions class="lj-source-list"></ul></div>',
  resultHTML('Your equipment planning direction')
 ].join('');
 $(root,'#eq-space').value=p.space;$(root,'#eq-system').value=p.equipmentSystem;$(root,'#eq-question').value=p.equipmentQuestions;
 root.querySelectorAll('[name="eq-priority"]').forEach(x=>x.checked=x.value===p.equipmentPriority);
 root.querySelectorAll('[name="eq-choice"]').forEach(x=>x.addEventListener('change',()=>{
  const fb=$(root,'[data-eq-feedback]');fb.hidden=false;
  feedbackState(fb,x.value==='verify');
  fb.textContent=x.value==='verify'?'Correct: the exact model, room and local requirements determine feasibility.':
    x.value==='modify'?'Do not assume that DIY changes to water and electrical systems are appropriate or compliant. Confirm safe manufacturer-supported requirements with qualified professionals.':
    'Appearance is secondary to whether a system can be installed, cleaned, supported and operated in your actual space.';
 }));
 trigger(root,'equipment-save',()=>{
  const space=$(root,'#eq-space').value,system=$(root,'#eq-system').value;
  const priority=root.querySelector('[name="eq-priority"]:checked')?.value||'';
  if(!space||!system||!priority){info(root,'.lj-save-message','Select a space, equipment path and biggest unanswered question.');return;}
  const next=persist({space,equipmentSystem:system,equipmentPriority:priority,equipmentQuestions:$(root,'#eq-question').value},root);
  const r=equipmentResult(next);const ul=$(root,'[data-eq-questions]');ul.replaceChildren();
  for(const item of r.questions){const li=document.createElement('li');li.textContent=item;ul.appendChild(li);}
  $(root,'[data-eq-list]').hidden=false;
  showResult(root,'You are considering '+r.label+'. '+r.caution);
 });
}

export function mountObservation(root){
 const p=current();
 root.innerHTML=[
  '<div class="lj-tool-head"><small>Free Tool / Scalp Observation Lab</small><small>Introductory non-diagnostic practice</small></div>',
  '<h3>What can you describe—and what can you not conclude?</h3>',
  '<p>Magnification lets you see more detail. It does not, by itself, identify the cause of a scalp concern. This exercise practices accurate language, not medical interpretation.</p>',
  '<figure class="lj-illustration lj-illustration-photo">',
    '<img src="/assets/images/course/module-04/microscopy/microscopy-surface-residue.webp" width="560" height="340" loading="lazy" decoding="async" alt="Illustrative magnified scalp teaching example from AIMT Module 4 showing hair shafts and surface detail, not a clinical diagnosis.">',
    '<figcaption class="lj-illustration-note"><strong>Illustrative course image — not clinical evidence.</strong><p>This actual AIMT Module 4 teaching asset shows what magnification can reveal. Look for visible details near the hair shafts, but do not label a condition or cause from one picture.</p></figcaption>',
  '</figure>',
  '<fieldset><legend>In this magnified example, what statement can you support?</legend>',
   radio('ob-choice',[
    ['visible','I can describe visible surface material near the hair shafts without naming its cause.'],
    ['diagnosis','This proves the person has a specific scalp disorder.'],
    ['guarantee','This means a particular treatment will stimulate hair regrowth.']
   ]),
  '</fieldset>',
  '<div class="lj-feedback" data-ob-feedback role="status" aria-live="polite" hidden></div>',
  '<h4>Practitioner communication: a client asks if the image means they have a disease.</h4>',
  '<p class="lj-help">A safer response describes only what is visible, acknowledges the limits of the camera image, and directs medical concerns to an appropriate qualified professional. Lighting, parting, symptoms and other context can change interpretation. Do not assume one technique fits curls, coils, locs, braids, or every scalp tone.</p>',
  field('Try one observation-only sentence','ob-note','<textarea id="ob-note" maxlength="220" placeholder="In this magnified view I notice... This image cannot establish..."></textarea>','Use this teaching image only. Do not enter client names, medical details or identifying information.'),
  '<figure class="lj-cert-preview">',
    '<a class="lj-cert-preview-image" href="/head-spa-certification" aria-label="Explore AIMT Head Spa Certification and its Module 4 microscopy lessons">',
      '<img src="/assets/images/marketing/product-proof/lesson-module-04-microscopy-assessment-1x1.webp" loading="lazy" decoding="async" width="480" height="480" alt="Screenshot of the actual AIMT Head Spa Certification Module 4 scalp microscopy and assessment lesson.">',
    '</a>',
    '<figcaption class="lj-cert-preview-copy">',
      '<small>INSIDE AIMT HEAD SPA CERTIFICATION · MODULE 4</small>',
      '<strong>See what deeper scalp assessment training looks like.</strong>',
      '<p>This is a view of AIMT’s actual Module 4 teaching interface. The certification develops observation, context and practitioner decisions in far more depth. This free example is not a diagnosis or a certificate of competence.</p>',
      '<a href="/head-spa-certification" class="lj-cert-preview-link">Explore Head Spa Certification <span aria-hidden="true">→</span></a>',
    '</figcaption>',
  '</figure>',
  '<div class="lj-actions">',btn('Save my observation practice','observation-save'),'</div>',
  '<p class="lj-status lj-save-message" role="status" aria-live="polite"></p>',
  resultHTML('Your observation practice')
 ].join('');
 $(root,'#ob-note').value=p.observationNote;
 root.querySelectorAll('[name="ob-choice"]').forEach(input=>{
  input.checked=input.value===p.observationAnswer;
  input.addEventListener('change',()=>{
   const fb=observationFeedback(input.value),el=$(root,'[data-ob-feedback]');
   el.hidden=false;feedbackState(el,fb.correct);el.replaceChildren();const strong=document.createElement('strong');strong.textContent=fb.title;el.append(strong,document.createTextNode(fb.copy));
  });
 });
 trigger(root,'observation-save',()=>{
  const choice=root.querySelector('[name="ob-choice"]:checked')?.value||'';
  const note=$(root,'#ob-note').value.trim();
  if(!choice||!note){info(root,'.lj-save-message','Choose an answer and write an observation-only sentence first.');return;}
  persist({observationAnswer:choice,observationNote:note},root);
  const fb=observationFeedback(choice);
  showResult(root,'Your working sentence: '+note+'. '+fb.copy+' Your next learning priority is to observe without assuming a diagnosis.');
 });
}

export function mountLaunch(root){
 const p=current();
 root.innerHTML=[
  '<div class="lj-tool-head"><small>Lesson tool / Launch Decisions</small><small>Training + next three actions</small></div>',
  '<h3>The order of decisions matters.</h3>',
  '<p>Training, equipment, pricing, professional permissions and a first service plan belong together. Knowing what you still need to verify is a useful result—not a failure.</p>',
  '<fieldset><legend>Before you advertise appointments, what should come first?</legend>',
   radio('la-sequence',[
    ['advertise','Set a launch date and start taking deposits before confirming permissions.'],
    ['verify','Verify professional scope and facility needs, define the appointment, confirm feasible equipment, then train and rehearse.'],
    ['purchase','Buy the most complete kit first so it determines the menu.']
   ]),
  '</fieldset>',
  '<div class="lj-feedback" data-la-feedback role="status" aria-live="polite" hidden></div>',
  '<h4>Before you pay for professional training</h4>',
  '<p class="lj-help">Check whether the provider clearly answers these questions. An unanswered item is a research task, not a pass/fail judgment on one program.</p>',
  [
   ['curriculum','Can I see what the curriculum actually teaches?'],
   ['assessment','How do students demonstrate learning? Is a certificate earned or automatic?'],
   ['scope','Does the provider explain how training relates to state licensing?'],
   ['terms','Are refunds, support and access terms clear before payment?'],
   ['practice','Does the program disclose online versus hands-on practice and its limits?']
  ].map(a=>'<label class="lj-check"><input type="checkbox" name="la-vet" value="'+a[0]+'"><span>'+a[1]+'</span></label>').join(''),
  '<h4>Choose your next three actions</h4>',
  '<p class="lj-help">Make them specific and realistic. For example: verify shampoo scope, measure total appointment time, or request the actual equipment installation manual.</p>',
  field('First action','la-next0','<input id="la-next0" maxlength="180" type="text" placeholder="First, I will...">'),
  field('Second action','la-next1','<input id="la-next1" maxlength="180" type="text" placeholder="Then, I will...">'),
  field('Third action','la-next2','<input id="la-next2" maxlength="180" type="text" placeholder="After that, I will...">'),
  field('What do you most need to learn or practice?','la-priority','<textarea id="la-priority" maxlength="180" placeholder="One training or rehearsal priority"></textarea>'),
  '<div class="lj-actions">',btn('Save my next steps','launch-save'),'</div>',
  '<p class="lj-status lj-save-message" role="status" aria-live="polite"></p>',
  resultHTML('Your next training priority')
 ].join('');
 (p.nextSteps||[]).forEach((v,i)=>{const input=$(root,'#la-next'+i);if(input)input.value=v;});
 $(root,'#la-priority').value=p.trainingPriority;
 root.querySelectorAll('[name="la-vet"]').forEach(x=>x.checked=p.trainingChecklist.includes(x.value));
 root.querySelectorAll('[name="la-sequence"]').forEach(x=>x.addEventListener('change',()=>{
  const feedback=$(root,'[data-la-feedback]');
  feedback.hidden=false;feedbackState(feedback,x.value==='verify');
  feedback.textContent=x.value==='verify'?'Strong sequence: verify what is permitted, define the experience, check feasibility, acquire necessary education and practice, then launch.':
   'That puts spending or sales ahead of legal permissions and operational readiness. Reconsider what needs verification first.';
 }));
 trigger(root,'launch-save',()=>{
  const nextSteps=[0,1,2].map(i=>$(root,'#la-next'+i).value.trim());
  const priority=$(root,'#la-priority').value.trim();
  if(!priority||nextSteps.some(x=>!x)){info(root,'.lj-save-message','Fill in three actions and one specific training priority before saving.');return;}
  persist({nextSteps,trainingPriority:priority,trainingChecklist:Array.from(root.querySelectorAll('[name="la-vet"]:checked')).map(x=>x.value)},root);
  showResult(root,'Your first action: '+nextSteps[0]+'. Training priority: '+priority+'. These are planning decisions, not permission to begin services.');
 });
}
export function mountAll(root=document){
 root.querySelectorAll('[data-aimt-tool]').forEach(el=>{
  const name=el.getAttribute('data-aimt-tool');
  if(name==='scope')mountScope(el);
  if(name==='service')mountService(el);
  if(name==='equipment')mountEquipment(el);
  if(name==='observation')mountObservation(el);
  if(name==='launch')mountLaunch(el);
 });
}
