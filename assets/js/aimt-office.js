/* Office contains no client credentials, execution or approval controls. */
import { groupWorkflows, departmentBrief, projectBrief, ownerTitle, deliverableLabel } from './aimt-office-model.js';
window.AIMTOffice = (() => {
  let snapshot=null, section='overview', selectedRole=null, generation=0;
  const root=()=>document.getElementById('officeBody');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Activity unavailable';
  const tone=s=>['failure','failed','timed_out'].includes(s)?'bad':['partial','pending','action_required','Check needs attention'].includes(s)?'warn':['success','published'].includes(s)?'good':'';
  function link(url,label){try{const u=new URL(url);if(u.protocol==='https:'&&(u.hostname==='github.com'||u.hostname.endsWith('.pages.dev')||u.hostname==='aimtrichology.com'))return `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;}catch{}return '';}
  function record(r){return `<article class="office-record"><div class="office-record-top"><h3>${esc(r.title)}</h3><span class="pill ${tone(r.status)}">${esc(r.status)}</span></div><p class="office-meta">${esc(date(r.time))} · ${esc(r.source||r.kind)}</p><p>${esc(r.detail)}</p><div class="office-record-foot">${r.artifact?`<span>Artifact / reference: ${esc(r.artifact)}</span>`:''}${link(r.url,'Open source')}</div></article>`;}
  function records(rows,empty='No records in this snapshot.'){return rows.length?`<div class="office-records">${rows.map(record).join('')}</div>`:`<div class="office-empty">${esc(empty)}</div>`;}
  function evidence(rows,label='View source evidence'){return `<details class="office-evidence"><summary>${esc(label)}${rows.length?` · ${rows.length} ${rows.length===1?'record':'records'}`:''}</summary>${records(rows,'Supporting records are unavailable.')}</details>`;}
  const heading=(title,description)=>`<div class="office-section-head"><h2>${esc(title)}</h2><p>${esc(description)}</p></div>`;
  const department=id=>snapshot.roles.find(r=>r.id===id)?.department||'Operations';
  const goButton=(target,label)=>`<button class="office-text-button" data-office-go="${target}">${esc(label)} →</button>`;
  function groupedRun(group){return `<article class="office-record"><div class="office-record-top"><h3>${esc(group.title)}</h3><span class="pill">${group.active?'Execution observed':group.attention?'Needs attention':'Recorded runs'}</span></div><p>${group.records.length} recorded runs · ${group.completed} completed successfully · ${group.attention} needing attention${group.active?` · ${group.active} running`:''}${group.queued?` · ${group.queued} queued`:''}.</p><p class="office-meta">Latest record ${esc(date(group.latest.time))}${group.branch?` · ${esc(group.branch)}`:''}</p>${evidence(group.records,'View individual runs')}</article>`;}
  function accomplishments(brief){
    const successes=brief.groups.reduce((n,g)=>n+g.completed,0);
    return `<article class="office-record"><div class="office-record-top"><button class="office-department-link" data-office-role="${esc(brief.role.id)}">${esc(brief.role.department)} →</button><span class="pill">${brief.deliverables.length?'Deliverables recorded':'Activity recorded'}</span></div><p>${esc(brief.accomplished)}</p>${!brief.deliverables.length&&successes?`<p class="office-meta">Latest routine activity ${esc(date(brief.lastActivity?.time))}. Completed runs do not confirm new research or published content.</p>`:''}${brief.deliverables.length?`<ul class="office-deliverables">${brief.deliverables.map(r=>`<li>${esc(deliverableLabel(r))}<span>${esc(date(r.time))}</span></li>`).join('')}</ul>`:''}${evidence(brief.rows,'How this summary is supported')}</article>`;
  }
  function currentWork(brief){return `<article class="office-current"><button class="office-department-link" data-office-role="${esc(brief.role.id)}">${esc(brief.role.department)} →</button><span class="pill">${esc(brief.current)}</span>${brief.running.length?`<p>${brief.running.map(g=>esc(g.title)).join(' · ')}. Source reports execution in progress.</p>${evidence(brief.running.flatMap(g=>g.records.filter(r=>r.status==='in_progress')),'Verify current execution')}`:brief.current==='Current work unverified'?'<p>A research record says running, but no heartbeat confirms current work.</p>':''}</article>`;}
  function attentionCard(r){const label=r.kind==='issue'?(r.reviewType==='operations'?'Operational review':'Education review'):r.kind==='exception'?'Research intake review':r.kind==='preview_check'?'Preview check needs attention':'Recorded work needs attention';return `<article class="office-record"><div class="eyebrow">${esc(department(r.role))}</div><h3>${esc(ownerTitle(r))}</h3><p>${label}. ${r.kind==='exception'?'An incoming research record is held for review.':r.kind==='issue'?'An existing review issue remains open.':'The source recorded a failure or incomplete outcome.'}</p><p class="office-meta">${esc(date(r.time))}</p>${evidence([r],'Review the original record')}</article>`;}
  function projectCard(pr,rows){const p=projectBrief(pr,rows);return `<article class="office-record"><div class="office-record-top"><h3>${esc(p.title)}</h3><span class="pill ${tone(p.status)}">${esc(p.status)}</span></div><p>${esc(p.checks)} · ${esc(p.preview)}.</p><p class="office-meta">${esc(p.blocker)}</p>${evidence(p.evidence,'Inspect project evidence')}</article>`;}
  function diagnostics(d){return `${heading('Connected sources & diagnostics','A successful read can contain no records. Connection health is separate from employee activity.')}${d.previewContext?`<div class="office-empty">${esc(d.previewContext)}</div>`:''}<p class="office-diagnostic-summary">${d.sources.filter(s=>s.state==='Connected').length} of ${d.sources.length} source checks connected · ${d.sources.filter(s=>s.state==='Activity unavailable').length} unavailable · ${d.sources.filter(s=>s.state==='Not connected').length} not connected. Source entries include separate checks for individual PRs and the unconnected assignment feed.</p><div class="office-sources">${d.sources.map(s=>`<article><div class="office-record-top"><strong>${esc(s.name)}</strong><span class="pill">${esc(s.state)}</span></div><p>${esc(s.diagnostic?.explanation||s.note)}</p><p>${s.state==='Connected'?`${s.records.length} records returned in the bounded sample.`:'No records inferred.'}</p><details><summary>Connection details</summary><p>Source: ${esc(s.id)} · limit ${esc(s.limit)}${s.diagnostic?.httpStatus?` · HTTP ${esc(s.diagnostic.httpStatus)}`:''}</p><p>${esc(s.diagnostic?.code||'NOT_CONNECTED')}</p><p>${esc(s.note)}</p>${s.diagnostic?.nextStep?`<p>${esc(s.diagnostic.nextStep)}</p>`:''}</details></article>`).join('')}</div>`;}
  function render(){
    if(!snapshot||!root())return;
    const d=snapshot, rows=d.activities, briefs=d.roles.map(role=>departmentBrief(d,role));
    const operations=['operations','activity','development'].includes(section);
    let html=`<div class="office-welcome"><div><div class="eyebrow">Founder’s workplace · read only</div><h2>AIMT Office</h2><p>Recent work, departments and decisions in one place.</p><p class="office-meta">Updated ${esc(date(d.fetchedAt))} · local time</p></div><div class="office-welcome-actions"><button class="btn primary" data-office-go="directory">Open Employee Directory</button><button class="btn" id="officeRefresh">Refresh activity</button></div></div><nav class="office-tabs" aria-label="Office sections">${[['overview','Office Overview'],['directory','Employee Directory'],['decisions','Decision Desk'],['operations','Operations']].map(([id,label])=>`<button type="button" data-office-section="${id}" class="${id===section||(id==='operations'&&operations)?'active':''}" aria-current="${id===section||(id==='operations'&&operations)?'page':'false'}">${label}</button>`).join('')}</nav><div id="officeSection" tabindex="-1">`;
    if(section==='overview'){
      html+=heading('Your morning briefing','What departments accomplished, what is happening now, and where your attention is needed.');
      html+='<div class="office-columns"><section>'+heading('Recently accomplished','Department summaries from the latest available records.');
      const visible=briefs.filter(b=>b.rows.length);html+=visible.length?`<div class="office-records">${visible.map(accomplishments).join('')}</div>`:'<div class="office-empty">Recent accomplishments are unavailable.</div>';
      html+='</section><section>'+heading('Happening now','Only source-confirmed execution appears as current work.');
      const currentBriefs=briefs.filter(b=>b.role.sources.includes('github_runs')||b.running.length||b.current==='Current work unverified');
      const unavailableBriefs=briefs.filter(b=>!currentBriefs.includes(b));
      html+=`<div class="office-records">${currentBriefs.map(currentWork).join('')}</div>${unavailableBriefs.length?`<details class="office-evidence"><summary>Other departments · current work unavailable</summary><div class="office-records">${unavailableBriefs.map(currentWork).join('')}</div></details>`:''}</section></div>`;
      html+='<div class="office-columns"><section>'+heading('Needs your attention','Existing review needs and operational exceptions.');
      const attention=d.decisions.filter(r=>r.kind!=='workflow');const failedGroups=groupWorkflows(d.decisions);
      html+=attention.length||failedGroups.length?`<div class="office-records">${attention.slice(0,4).map(attentionCard).join('')}${failedGroups.slice(0,2).map(groupedRun).join('')}</div>`:'<div class="office-empty">No attention records in the available sample. Unavailable sources may hide additional needs.</div>';
      html+=goButton('decisions','Open Decision Desk')+'</section><section>'+heading('Projects','Development proposals and reported checks. Drafts and open proposals are not proof of active work.');
      const projects=rows.filter(r=>r.kind==='pull_request');html+=projects.length?`<div class="office-records">${projects.slice(0,5).map(pr=>projectCard(pr,rows)).join('')}</div>`:'<div class="office-empty">Project status unavailable.</div>';
      html+=goButton('development','Inspect development activity')+'</section></div>';
      html+=`<div class="office-briefing-foot"><p>Responsibilities describe departments, not newly activated employees. Persistent assignments, capacity and stall detection remain unavailable.</p>${goButton('operations','Inspect source connections')}</div>`;
    }else if(section==='directory'){
      const brief=briefs.find(b=>b.role.id===selectedRole),role=brief?.role;
      if(role){
        html+=`<button class="btn" id="officeDirectoryBack">← All departments</button>${heading(role.department,role.title)}<p class="office-role-mandate">${esc(role.mandate)}</p><div class="office-columns"><article class="office-info"><h3>Current work</h3><span class="pill">${esc(brief.current)}</span><p>${brief.running.length?brief.running.map(g=>esc(g.title)).join(' · '):brief.current==='Current work unverified'?'A running flag is recorded; present execution cannot be confirmed.':'No current employee assignment can be verified from these sources.'}</p><h3>Work availability</h3><p>${esc(brief.availability)}. Capacity to take on new work is unavailable.</p><h3>Last verified activity</h3><p>${esc(date(brief.lastActivity?.time))}</p></article><article class="office-info"><h3>Recent department outcomes</h3><p>${esc(brief.accomplished)}</p><h3>Outstanding work & limits</h3><p>${esc(role.outstanding)}</p>${role.id==='market'?'<button class="btn" id="officeOpenGrowth">Open existing Growth report</button>':''}<details class="office-evidence"><summary>Existing systems and responsibilities</summary><p>${esc(role.systems.join(' · ')||'Not connected')}</p><p>${esc(role.classification)}. Source evidence describes system activity, not an individual employee working.</p></details></article></div>`;
        html+=heading('Recent deliverables','Received batches, published page records and available artifacts retain their original meaning.');
        html+=brief.deliverables.length?`<div class="office-records">${brief.deliverables.map(r=>`<article class="office-record"><h3>${esc(deliverableLabel(r))}</h3><p class="office-meta">${esc(date(r.time))}</p>${evidence([r])}</article>`).join('')}</div>`:'<div class="office-empty">Recent deliverables unavailable. Completed routine runs do not establish delivered research or education.</div>';
        html+=heading('Activity behind this responsibility','Repeated runs are grouped. Exact timestamps, statuses and references remain expandable.');
        html+=brief.groups.map(groupedRun).join('')+evidence(brief.rows.filter(r=>r.kind!=='workflow'),'Other activity evidence');
      }else{
        html+=heading('Employee Directory','Start with a department to inspect its responsibility, current work and recent deliverables. No agent is created or activated here.');
        html+=`<div class="office-directory">${briefs.map(b=>`<button class="office-role" data-office-role="${esc(b.role.id)}"><span class="eyebrow">${esc(b.role.department)}</span><h3>${esc(b.role.title)}</h3><p>${esc(b.role.mandate)}</p><span class="pill">${esc(b.current)}</span><p><strong>Recent work</strong><br>${esc(b.accomplished)}</p><p class="office-meta">Last verified: ${esc(date(b.lastActivity?.time))}<br>Work availability: ${esc(b.availability)}</p><span class="office-role-link">Open department →</span></button>`).join('')}</div>`;
      }
    }else if(section==='decisions'){
      html+=heading('Decision Desk','Review the existing exceptions. Approval and release authority stays in its current systems.');
      const attention=d.decisions.filter(r=>r.kind!=='workflow');html+=attention.length?`<div class="office-records">${attention.map(attentionCard).join('')}</div>`:'<div class="office-empty">No review records in the available sources. This does not establish that no reviews exist.</div>';
      html+=groupWorkflows(d.decisions).map(groupedRun).join('');
    }else{
      html+=heading('Operations','Source diagnostics, detailed work records, checks and release evidence.');
      html+=`<nav class="office-tabs office-operations-tabs" aria-label="Operations sections">${[['operations','Source Connections'],['activity','Work Activity'],['development','Development Activity']].map(([id,label])=>`<button class="${section===id?'active':''}" data-office-section="${id}" aria-current="${section===id?'page':'false'}">${label}</button>`).join('')}</nav>`;
      if(section==='operations')html+=diagnostics(d);
      if(section==='activity'){
        html+=heading('Work Activity','Detailed source records, newest first. This is a bounded sample, not a complete ledger.');
        const sourceOptions=[...new Map(d.sources.filter(s=>s.records.length).map(s=>[s.id,s])).values()];
        html+='<label class="office-filter" for="officeFilter">Filter by source <select id="officeFilter"><option value="">All sources</option>'+sourceOptions.map(s=>`<option value="${esc(s.id)}">${esc(({github_checks:"PR check runs",github_statuses:"PR commit statuses"})[s.id]||s.name)}</option>`).join('')+'</select></label><div id="officeActivityRows">'+records(rows)+'</div>';
      }
      if(section==='development'){
        html+=heading('Development Activity','Exact-head checks and preview evidence are separate. No merge or deployment controls.');
        html+=heading('Pull requests','Draft and open proposals, with their exact commit references.')+records(rows.filter(r=>r.kind==='pull_request'));
        html+=heading('Checks / test evidence','Latest check runs for up to two PR heads. No unreported test counts are inferred.')+records(rows.filter(r=>r.kind==='check'),'Check / test activity unavailable.');
        html+=heading('Deployment evidence','Provider-reported preview and deployment statuses; route success is not independently verified.')+records(rows.filter(r=>['deployment','preview_check'].includes(r.kind)),'Deployment preview activity unavailable.');
        html+=heading('Produced artifacts','Metadata and source links; artifact contents are not read.')+records(rows.filter(r=>r.kind==='artifact'));
        html+=heading('Build & workflow activity','Grouped execution records; successful runs do not establish successful business stages.')+groupWorkflows(rows).map(groupedRun).join('');
      }
    }
    root().innerHTML=html+'</div>';
    function navigate(target){section=target;selectedRole=null;render();document.getElementById('officeSection').focus();}
    root().querySelectorAll('[data-office-section],[data-office-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.officeSection||b.dataset.officeGo));
    root().querySelectorAll('[data-office-role]').forEach(b=>b.onclick=()=>{selectedRole=b.dataset.officeRole;section='directory';render();document.getElementById('officeSection').focus();});
    const back=document.getElementById('officeDirectoryBack');if(back)back.onclick=()=>navigate('directory');
    const growth=document.getElementById('officeOpenGrowth');if(growth)growth.onclick=()=>document.getElementById('growthNavBtn').click();
    const filter=document.getElementById('officeFilter');if(filter)filter.onchange=()=>{document.getElementById('officeActivityRows').innerHTML=records(rows.filter(r=>!filter.value||r.sourceId===filter.value));};
    document.getElementById('officeRefresh').onclick=()=>load(true);
  }
  async function load(force=false){
    if(!actor||actor.role!=='owner'){clear();root().textContent='Owner access required.';return;}
    if(snapshot&&!force){render();return;}
    const current=++generation;snapshot=null;root().innerHTML='<p class="loading" role="status">Reading Office sources…</p>';
    try{const t=await token();const res=await fetch('/api/admin/office',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.error||'Office activity unavailable.');if(current!==generation)return;snapshot=data;render();}
    catch(e){if(current!==generation)return;root().innerHTML=`<div class="office-empty" role="alert">${esc(e.message)} Previous activity has been cleared.<br><button class="btn" id="officeRetry">Retry</button></div>`;document.getElementById('officeRetry').onclick=()=>load(true);}
  }
  function clear(){generation++;snapshot=null;selectedRole=null;section='overview';if(root())root().replaceChildren();}
  return {load,clear};
})();
