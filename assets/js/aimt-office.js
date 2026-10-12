/* Office contains no client credentials, execution or approval controls. */
window.AIMTOffice = (() => {
  let snapshot = null, section = 'overview', selectedRole = null, generation = 0;
  const root = () => document.getElementById('officeBody');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = v => v ? new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Time unavailable';
  const tone = s => ['failure','failed','timed_out'].includes(s) ? 'bad' : ['partial','pending','action_required'].includes(s) ? 'warn' : ['success','published'].includes(s) ? 'good' : '';
  function link(url, label) {
    try { const u = new URL(url); if (u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.pages.dev') || u.hostname === 'aimtrichology.com')) return `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`; } catch {}
    return '';
  }
  function record(r) {
    return `<article class="office-record"><div class="office-record-top"><h3>${esc(r.title)}</h3><span class="pill ${tone(r.status)}">${esc(r.status)}</span></div><p class="office-meta">${esc(date(r.time))} · ${esc(r.source || r.kind)}</p><p>${esc(r.detail)}</p><div class="office-record-foot">${r.artifact ? `<span>Artifact / reference: ${esc(r.artifact)}</span>` : ''}${link(r.url, 'Open source')}</div></article>`;
  }
  function records(rows, empty = 'No records in the available snapshot.') { return rows.length ? `<div class="office-records">${rows.map(record).join('')}</div>` : `<div class="office-empty">${esc(empty)} Source coverage is shown below.</div>`; }
  function heading(title, description) { return `<div class="office-section-head"><h2>${esc(title)}</h2><p>${esc(description)}</p></div>`; }
  function render() {
    if (!snapshot || !root()) return;
    const d = snapshot, rows = d.activities;
    let html = `<div class="office-welcome"><div><div class="eyebrow">Founder’s workplace · read only</div><h2>AIMT Office</h2><p>${esc(d.scope)}</p><p class="office-meta">Verified snapshot fetched ${esc(date(d.fetchedAt))} · times shown in your local timezone</p></div><button class="btn" id="officeRefresh">Refresh activity</button></div><nav class="office-tabs" aria-label="Office sections">${[['overview','Office Overview'],['directory','Employee Directory'],['activity','Work Activity'],['decisions','Decision Desk'],['development','Development Activity']].map(([id, label]) => `<button type="button" data-office-section="${id}" class="${id === section ? 'active' : ''}" aria-current="${id === section ? 'page' : 'false'}">${label}</button>`).join('')}</nav><div id="officeSection" tabindex="-1">`;
    if (section === 'overview') {
      const completed = rows.filter(r => ['success','published'].includes(r.status) && !['check','deployment','preview_check'].includes(r.kind));
      const active = rows.filter(r => r.kind === 'workflow' && r.status === 'in_progress');
      const executionAvailable = d.sources.some(s=>s.id==='github_runs'&&s.state==='Connected');
      const unresolved = rows.filter(r => r.kind === 'ingestion' && r.status === 'running');
      html += heading('Your morning briefing', 'Recent records, current execution evidence, and matters needing attention. A schedule alone never counts as work.');
      html += `<div class="office-summary"><div><span>Recent outcomes</span><strong>${completed.length}</strong><p>Recorded successes / published states in this snapshot.</p></div><div><span>Execution observed</span><strong>${executionAvailable ? active.length : 'Unavailable'}</strong><p>GitHub execution status in this snapshot.</p></div><div><span>Attention records</span><strong>${d.decisions.length}</strong><p>Review issues, quarantine and recorded failure / partial outcomes.</p></div><div><span>Source coverage</span><strong>${d.sources.filter(s=>s.state==='Connected').length} / ${d.sources.length}</strong><p>Unavailable sources can conceal additional work or exceptions.</p></div></div>`;
      html += `<div class="office-columns"><section>${heading('Recent completed records', 'Workflow success describes execution only; education stages are not verified here.')}${records(completed.slice(0,4))}</section><section>${heading('Needs your attention', 'Existing exceptions only. Review and approval actions remain in their current systems.')}${records(d.decisions.slice(0,4))}</section></div>`;
      html += heading('Active workflows & uncertain execution', 'Stalls cannot be established without a heartbeat or deadline. Old running flags are shown as unverified.');
      html += records([...active,...unresolved].slice(0,6), 'No currently verifiable workflow execution. Stall detection is unavailable.');
      html += heading('Research & development', 'Most recent ingestion, page records and development proposals.');
      html += records(rows.filter(r=>['ingestion','page','pull_request'].includes(r.kind)).slice(0,5));
    } else if (section === 'directory') {
      const role = d.roles.find(r=>r.id===selectedRole);
      if (role) {
        html += `<button class="btn" id="officeDirectoryBack">← All departments</button>${heading(role.department, role.title)}<span class="pill">${esc(role.classification)}</span><p class="office-role-mandate">${esc(role.mandate)}</p><div class="office-columns"><article class="office-info"><h3>Existing systems</h3><p>${esc(role.systems.join(' · ') || 'Not connected')}</p><h3>Last verified activity</h3><p>${esc(date(role.lastVerifiedActivity))}</p><p>Evidence: ${esc(role.evidence?.title || 'Activity unavailable')}. Records are attributed to systems, not proof of an individual employee working.</p></article><article class="office-info"><h3>Outstanding work & limits</h3><p>${esc(role.outstanding)}</p><p>Persistent assignments: Not connected.</p>${role.id==='market'?'<button class="btn" id="officeOpenGrowth">Open existing Growth report</button>':''}</article></div>`;
        html += heading('Recent outputs / references', 'Ingestion success, page states and PRs retain their original meaning; proposals are not completed projects.');
        html += records(role.outputs);
        html += heading('Activity evidence', 'Latest records attributed to this responsibility.');
        html += records(rows.filter(r=>r.role===role.id).slice(0,15), 'Activity unavailable for this responsibility.');
      } else {
        html += heading('Employee Directory', 'Seven departments organize responsibilities. These cards do not create employees or claim that an agent is working.');
        html += `<div class="office-directory">${d.roles.map(r=>`<button class="office-role" data-office-role="${esc(r.id)}"><span class="eyebrow">${esc(r.department)}</span><h3>${esc(r.title)}</h3><p>${esc(r.mandate)}</p><span class="pill">${esc(r.classification)}</span><p class="office-meta">Last verified: ${esc(date(r.lastVerifiedActivity))}</p><span class="office-role-link">View responsibility →</span></button>`).join('')}</div>`;
      }
    } else if (section === 'activity') {
      html += heading('Work Activity', 'Available historical records, newest first. Source limits mean this is not a complete operating ledger.');
      html += '<label class="office-filter" for="officeFilter">Filter by source <select id="officeFilter"><option value="">All sources</option>'+d.sources.filter(s=>s.records.length).map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')+'</select></label><div id="officeActivityRows">'+records(rows)+'</div>';
    } else if (section === 'decisions') {
      html += heading('Decision Desk', 'Existing operational exceptions and verified review records. No approval, merge, retry or publication action is offered.');
      html += records(d.decisions, 'No review records in the available bounded sources. This does not establish that no reviews exist.');
    } else {
      html += heading('Development Activity', 'Open proposals and workflow execution. Check conclusions and deployment status are shown separately and tied to their source commits.');
      html += heading('Pull requests', 'Open proposals, including draft and stacked work; no merge controls.');
      html += records(rows.filter(r=>r.kind==='pull_request'));
      html += heading('Checks / test evidence', 'Latest check runs for up to two current PR heads. Passing checks do not establish a successful deployment preview or unreported test counts.');
      html += records(rows.filter(r=>r.kind==='check'), 'Check / test activity unavailable or no checks in the bounded PR-head sample.');
      html += heading('Deployment evidence', 'Latest five deployment records; latest status queried for up to two. Status unavailable remains unverified.');
      html += records(rows.filter(r=>['deployment','preview_check'].includes(r.kind)), 'Deployment preview activity unavailable.');
      html += heading('Produced artifacts', 'Metadata and source links; artifact contents are not read.');
      html += records(rows.filter(r=>r.kind==='artifact'));
      html += heading('Build & workflow activity', 'GitHub conclusions report execution; business outcomes can require separate stage reports.');
      html += records(rows.filter(r=>r.kind==='workflow'));
    }
    html += '</div>'+heading('Connected sources & coverage', 'Each source fails independently. Missing records are never replaced with invented activity.');
    html += `<div class="office-sources">${d.sources.map(s=>`<div><strong>${esc(s.name)}</strong><span class="pill">${esc(s.state)}</span><p>${esc(s.note)}</p></div>`).join('')}</div>`;
    root().innerHTML = html;
    root().querySelectorAll('[data-office-section]').forEach(b=>b.onclick=()=>{section=b.dataset.officeSection;selectedRole=null;render();document.getElementById('officeSection').focus();});
    root().querySelectorAll('[data-office-role]').forEach(b=>b.onclick=()=>{selectedRole=b.dataset.officeRole;render();document.getElementById('officeSection').focus();});
    const back=document.getElementById('officeDirectoryBack');if(back)back.onclick=()=>{selectedRole=null;render();document.getElementById('officeSection').focus();};
    const growth=document.getElementById('officeOpenGrowth');if(growth)growth.onclick=()=>document.getElementById('growthNavBtn').click();
    const filter=document.getElementById('officeFilter');if(filter)filter.onchange=()=>{document.getElementById('officeActivityRows').innerHTML=records(rows.filter(r=>!filter.value||r.sourceId===filter.value));};
    document.getElementById('officeRefresh').onclick=()=>load(true);
  }
  async function load(force = false) {
    if (!actor || actor.role !== 'owner') { clear(); root().textContent='Owner access required.';return; }
    if (snapshot && !force) { render();return; }
    const current=++generation; snapshot=null;
    root().innerHTML='<p class="loading" role="status">Reading Office sources…</p>';
    try {
      const t=await token();const res=await fetch('/api/admin/office',{headers:{Authorization:`Bearer ${t}`},cache:'no-store'});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Office activity unavailable.');
      if(current!==generation)return;
      snapshot=data;render();
    } catch(e) { if(current!==generation)return;root().innerHTML=`<div class="office-empty" role="alert">${esc(e.message)} Previous activity has been cleared.<br><button class="btn" id="officeRetry">Retry</button></div>`;document.getElementById('officeRetry').onclick=()=>load(true); }
  }
  function clear() { generation++;snapshot=null;selectedRole=null;section='overview';if(root())root().replaceChildren(); }
  return {load,clear};
})();
