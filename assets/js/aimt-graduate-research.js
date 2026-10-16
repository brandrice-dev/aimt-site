const SUPABASE_URL = 'https://epcnkncyxqgscrejinwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY25rbmN5eHFnc2NyZWppbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTc5MDcsImV4cCI6MjA5MjIzMzkwN30.jB6JIr9sYwOAYQz7k1nJj2XVGp3q1kQU-jbfy4Z3mH0';
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id),form=$('graduate-search');
const e=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readableLabels={rct:'Randomized controlled trial',not_reviewed:'Independent review pending',reviewed_supported:'Independently reviewed: supported',reviewed_narrowed:'Independently reviewed: narrowed',reviewed_access_limited:'Independent review limited by source access',association:'Association (does not establish causation)',unclear:'Unclear or mixed findings',primary_text:'Primary source text'};
const label=value=>readableLabels[value] || String(value || 'Not recorded').replaceAll('_',' ');
let page=1,sourceId='',requestSerial=0;
const requestedReturn=new URLSearchParams(location.search).get('return_module');
const returnModule=/^(?:[0-9]|1[01])$/.test(requestedReturn || '')?requestedReturn:null;
if(returnModule)$('return-course').href='/head-spa-certification?enter=1&module='+returnModule;
function clearProtected() { clearCadenceAnswer(); requestSerial++;$('graduate-results').replaceChildren();$('study-detail').replaceChildren();$('graduate-library').hidden=true; }
async function api(params) {
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw Object.assign(Error('Sign in to My AIMT to continue.'),{status:401});
 const response=await fetch(`/api/graduate-research?${params}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
 const body=await response.json();if(!response.ok)throw Object.assign(Error(body.error || 'Unable to load the library.'),{status:response.status});return body;
}

let cadenceRequestSerial=0;
function clearCadenceAnswer(){
 cadenceRequestSerial++;
 $('cadence-answer').hidden=true;
 $('cadence-answer-body').textContent='';
 $('cadence-answer-sources').replaceChildren();
 $('cadence-answer-status').textContent='';
}
async function askResearchCadence(question, sourceId=''){
 const serial=++cadenceRequestSerial;
 const panel=$('cadence-answer');
 panel.hidden=false;
 $('cadence-answer-body').textContent='';
 $('cadence-answer-sources').replaceChildren();
 $('cadence-answer-status').textContent='Cadence is checking eligible AIMT findings…';
 if(!question.trim()){$('cadence-answer-status').textContent='Type a question to ask Cadence.';return;}
 const askBtn=$('ask-cadence');
 askBtn.disabled=true;
 panel.scrollIntoView({block:'nearest'});
 try{
  const {data:{session}}=await client.auth.getSession();
  if(!session)throw Object.assign(Error('Sign in to My AIMT to continue.'),{status:401});
  const response=await fetch('/api/research-cadence',{
   method:'POST',cache:'no-store',
   headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({question,source_id:sourceId})
  });
  const data=await response.json();
  if(!response.ok)throw Object.assign(Error(data.error||'Cadence is temporarily unavailable.'),{status:response.status});
  if(serial!==cadenceRequestSerial)return;
  const title=data.coverage==='verified_findings'?'Source-linked explanation':
   data.coverage==='general_background'?'General background · not AIMT verified':
   data.coverage==='assessment_restricted'?'Learning support only':'Limited evidence explanation';
  $('cadence-answer-title').textContent=title;
  $('cadence-answer-status').textContent=(data.citations||[]).length+
    ((data.citations||[]).length===1?' verified finding referenced.':' verified findings referenced.');
  $('cadence-answer-body').textContent=data.answer||'';
  if(data.note){const note=document.createElement('p');note.className='cadence-answer-note';note.textContent=data.note;$('cadence-answer-sources').append(note);}
  if(Array.isArray(data.citations)&&data.citations.length){
   const heading=document.createElement('h3');heading.textContent='Examine the evidence';$('cadence-answer-sources').append(heading);
   const list=document.createElement('ul');list.className='cadence-source-links';
   for(const citation of data.citations){
    try{
     const href=new URL(citation.library_href,location.origin);
     if(href.origin!==location.origin || href.pathname!=='/my-aimt/research')continue;
     if(returnModule)href.searchParams.set('return_module',returnModule);
     const li=document.createElement('li'),a=document.createElement('a');
     a.href=href.href;a.textContent='['+citation.id+'] '+citation.title+(citation.year?' ('+citation.year+')':'');
     const tag=document.createElement('small');
     tag.textContent=citation.verification_status==='AIMT_APPROVED'?'AIMT approved':'Claim verified';
     li.append(a,tag);list.append(li);
    }catch{}
   }
   $('cadence-answer-sources').append(list);
  }
 }catch(error){
  if(serial!==cadenceRequestSerial)return;
  if(error.status===401||error.status===403){accessFailure(error);return;}
  $('cadence-answer-status').textContent=error.message;
 }finally{if(serial===cadenceRequestSerial)askBtn.disabled=false;}
}

function accessFailure(error) {clearProtected();$('access-status').textContent=error.message;$('access-help').hidden=false;}
const sourceLink=id=>`/my-aimt/research?source_id=${encodeURIComponent(id)}${returnModule?'&return_module='+returnModule:''}`;
const findingLink=c=>`${sourceLink(c.source_id)}#${encodeURIComponent(c.claim_id)}`;
function metadata(s) {return `<p class="research-meta">${e((s.authors || []).join(', ') || 'Authors not recorded')} · ${e(s.year || 'Year not recorded')} · ${e(s.source_venue || '')}</p><p class="graduate-provenance">${e(label(s.evidence_type))} · ${e(label(s.source_role))}<br>Source verified · ${e(label(s.verification_depth))} verification · ${e(label(s.verification_review_status))}</p>${s.original_url?`<p><a href="${e(s.original_url)}" target="_blank" rel="noopener noreferrer">Open original scientific source ↗</a>${s.doi_url?` · <a href="${e(s.doi_url)}" target="_blank" rel="noopener noreferrer">DOI: ${e(s.doi)}</a>`:''}</p>`:'<p>Original source link not recorded.</p>'}<p class="research-meta">Source use status: ${e(label(s.use_status))}. Source access: ${e(label(s.rights_access_status))}. A publisher may require a subscription.</p>`;}
function topicLinks(topics) {return (topics || []).map(t=>`<a href="/my-aimt/research?topic=${encodeURIComponent(t)}${returnModule?'&return_module='+returnModule:''}">${e(label(t).replaceAll('-',' '))}</a>`).join(' · ');}
function finding(c) {return `<article class="graduate-finding" id="${e(c.claim_id)}"><span class="research-kind">${c.verification_status==='AIMT_APPROVED'?'AIMT approved':'Claim verified'} · ${e(label(c.claim_type))}</span><blockquote>${e(c.claim_text)}</blockquote><p class="graduate-provenance">Finding: ${e(c.claim_id)} · Source: ${e(c.source_id)}<br>Origin: ${e(label(c.claim_origin))} · Extraction: ${e(label(c.extraction_basis))} · Fidelity: ${e(label(c.claim_text_fidelity))}<br>Locator: ${e(c.page_or_section_locator || c.locator || 'Not recorded')} · Verified: ${e(c.verified_on || 'Date not recorded')}<br>Scientific review: ${e(label(c.verification_review_status))} · Use status: ${e(label(c.use_status))} · Direction: ${e(label(c.direction))}</p>${c.population_or_scope?`<p>Recorded population or scope: ${e(c.population_or_scope)}</p>`:''}<p>${topicLinks(c.topics)}</p><a href="${e(findingLink(c))}">Link to this finding</a></article>`;}
function paramsFromForm() {const params=new URLSearchParams(new FormData(form));for(const [k,v] of [...params])if(!v)params.delete(k);if(sourceId)params.set('source_id',sourceId);if(page>1)params.set('page',String(page));if(returnModule)params.set('return_module',returnModule);return params;}
function syncForm(params) {for(const key of ['q','topic','year','evidence_type','verification','category'])form.elements[key].value=params.get(key) || '';page=Number(params.get('page')) || 1;sourceId=params.get('source_id') || '';}
async function relatedEducation(source,serial) {
 try {
  const response=await fetch('/api/public-research');if(!response.ok)return;
  const catalog=await response.json();if(serial!==requestSerial)return;
  const doi=String(source.doi || '').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi.org\//,'');
  const studies=catalog.studies.filter(s=>(doi && String(s.doi || '').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi.org\//,'')===doi) || (source.url && s.source_url===source.url));
  const articles=[...new Map(studies.flatMap(s=>s.articles).map(a=>[a.href,a])).values()];
  // Public catalog supplies already-reviewed article associations; no inferred
  // course or article associations, and no interpretation lifted into findings.
  if(articles.length)$('related-education').innerHTML=`<h2>Related AIMT Education</h2><ul>${articles.filter(a=>/^\/education\/[a-z0-9/-]+$/.test(a.href)).map(a=>`<li><a href="${e(a.href)}">${e(a.title)}</a></li>`).join('')}</ul>`;
 }catch{/* Related public links do not determine protected research access. */}
}
async function search({historyMode='push'}={}) {
 const serial=++requestSerial,params=paramsFromForm();
 clearCadenceAnswer();$('graduate-results').replaceChildren();$('study-detail').replaceChildren();$('study-detail').hidden=true;
 $('result-status').textContent='Searching verified research…';$('previous-page').hidden=true;$('next-page').hidden=true;$('page-label').textContent='';
 for(const button of document.querySelectorAll('#graduate-library button'))button.disabled=true;
 if(historyMode==='push')history.pushState({},'',`/my-aimt/research${params.size?`?${params}`:''}${sourceId?location.hash:''}`);
 try {
  const result=await api(params);if(serial!==requestSerial)return;
  $('result-status').textContent=result.claims.length?`${result.claims.length} verified finding${result.claims.length===1?'':'s'} on page ${result.page}.`:'No eligible verified findings match this search. Try a broader phrase or clear a filter.';
  if(sourceId && result.claims.length) {
   const source=result.claims[0].source;
   const cited=decodeURIComponent(location.hash.slice(1));
   if(cited && !result.claims.some(c=>c.claim_id===cited)) {
    const citation=await api(new URLSearchParams({source_id:sourceId,claim_id:cited}));
    if(serial!==requestSerial)return;
    result.claims.push(...citation.claims);
   }
   const limitations=result.claims.filter(c=>c.claim_type==='limitation'),evidence=result.claims.filter(c=>c.claim_type!=='limitation');
   $('study-detail').hidden=false;
   $('study-detail').innerHTML=`<p><a href="/my-aimt/research">← Back to research search</a></p><h2>${e(source.title || 'Scientific source')}</h2>${metadata(source)}<p>${topicLinks(source.topics)}</p><button class="cadence-explain-source" type="button" data-explain-source="${e(source.source_id)}">Explain this study with Cadence ↗</button><h2>Scientific evidence</h2>${evidence.map(finding).join('') || '<p>No other findings on this page.</p>'}<h2>Understanding the findings</h2><p>A separately validated explanation is not available in this view. The findings above preserve the recorded evidence and extraction provenance.</p><h2>Limitations and uncertainty</h2>${limitations.map(finding).join('') || '<p>No verified limitation statement appears on this page. This does not mean the study has no limitations. Read the original methods and discussion; more findings may appear on subsequent pages.</p>'}<h2>Practitioner context</h2><p>Consider the recorded population, evidence type, and study methods before applying these findings to professional learning. Preclinical or animal evidence does not by itself establish clinical applicability; observational associations do not establish causation. No practice recommendation has been inferred here.</p><div id="related-education"></div><h2>Continue investigating</h2><p>Explore related findings through the subject links above, or <a href="/research">visit the public Research Library</a>.</p>`;
   await relatedEducation(source,serial);
   if(serial!==requestSerial)return;
   if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'center'});
  }else {
   $('graduate-results').innerHTML=result.claims.map(c=>`<li class="research-result"><span class="research-kind">${c.verification_status==='AIMT_APPROVED'?'AIMT approved':'Claim verified'} · ${e(label(c.source.evidence_type))}</span><h2><a href="${e(sourceLink(c.source_id))}">${e(c.source.title || 'Scientific source')}</a></h2><p class="research-meta">${e((c.source.authors || []).join(', '))} · ${e(c.source.year || 'Year not recorded')}</p><p>${e(c.claim_text)}</p><p class="graduate-provenance">${e(label(c.direction))} · ${e(label(c.verification_review_status))} · ${e(label(c.source.verification_depth))} source verification</p><p>${topicLinks(c.topics)}</p><a href="${e(findingLink(c))}">Examine evidence and provenance →</a></li>`).join('');
  }
  $('previous-page').hidden=page<=1;$('next-page').hidden=!result.has_more;$('page-label').textContent=`Page ${page}`;
  if(!sourceId || !location.hash) {
   const focus=sourceId?$('study-detail'):$('result-status');focus.tabIndex=-1;focus.focus({preventScroll:true});
   if(historyMode!=='none')focus.scrollIntoView({block:'start'});
  }
 }catch(error){if(serial!==requestSerial)return;if(error.status===401 || error.status===403)accessFailure(error);else $('result-status').textContent=error.message;}
 finally {if(serial===requestSerial)for(const button of document.querySelectorAll('#graduate-library button'))button.disabled=false;}
}
form.addEventListener('submit',event=>{event.preventDefault();sourceId='';page=1;search();});
$('ask-cadence').addEventListener('click',()=>askResearchCadence(form.elements.q.value));
$('study-detail').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-explain-source]');
 if(btn)askResearchCadence('Explain the verified findings of this paper in plain language. What are its limitations and what should a head spa professional not infer from it?',btn.dataset.explainSource);
});
$('previous-page').addEventListener('click',()=>{page--;search();});$('next-page').addEventListener('click',()=>{page++;search();});
$('clear-search').addEventListener('click',()=>{form.reset();sourceId='';page=1;search();});
for(const button of document.querySelectorAll('[data-query]'))button.addEventListener('click',()=>{form.reset();form.elements.q.value=button.dataset.query;sourceId='';page=1;search();});
// Keep navigation within the authenticated experience without full reloads.
document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button!==0)return;const url=new URL(link.href);if(url.origin!==location.origin || url.pathname!=='/my-aimt/research')return;event.preventDefault();if(returnModule)url.searchParams.set('return_module',returnModule);syncForm(url.searchParams);history.pushState({},'',url.href);search({historyMode:'none'});});
window.addEventListener('popstate',()=>{syncForm(new URLSearchParams(location.search));search({historyMode:'none'});});
client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')accessFailure(Error('Sign in to My AIMT to continue.'));});
// Remove protected content from a browser back/forward cache before restoration.
window.addEventListener('pagehide',clearProtected);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
async function init() {
 try {
  await api(new URLSearchParams({action:'access'}));
  const filters=await api(new URLSearchParams({action:'filters'}));
  for(const [key,values] of [['topic',filters.topics],['evidence_type',filters.evidence_types],['category',filters.categories]])for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=label(value).replaceAll('-',' ');form.elements[key].append(option);}
  $('access-status').textContent='Research access verified.';$('access-help').hidden=true;$('graduate-library').hidden=false;
  syncForm(new URLSearchParams(location.search));await search({historyMode:'none'});
 }catch(error){accessFailure(error);}
}
init();
