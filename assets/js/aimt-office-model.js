// Presentation of existing evidence only. No data acquisition, assignments or execution.
const failed = r => ['failure', 'failed', 'partial', 'timed_out', 'action_required'].includes(r.status);
const newest = records => [...records].sort((a,b)=>(Date.parse(b.time)||0)-(Date.parse(a.time)||0));
export function groupWorkflows(records) {
  const groups=new Map();
  for(const r of records.filter(r=>r.kind==='workflow')) {
    const key=JSON.stringify([r.role,r.workflowPath||r.title,r.branch||'']);
    if(!groups.has(key))groups.set(key,{role:r.role,title:r.title,branch:r.branch||'',records:[]});
    groups.get(key).records.push(r);
  }
  return [...groups.values()].map(g=>{
    const records=newest(g.records);
    return {...g,records,latest:records[0],completed:records.filter(r=>r.status==='success').length,attention:records.filter(failed).length,active:records.filter(r=>r.status==='in_progress').length,queued:records.filter(r=>['queued','waiting','pending'].includes(r.status)).length};
  }).sort((a,b)=>(Date.parse(b.latest.time)||0)-(Date.parse(a.latest.time)||0));
}
export function ownerTitle(record) {
  const title=String(record.title||'');
  if(record.kind==='pull_request') {
    if(/AIMT Office/i.test(title))return 'AIMT Office';
    if(/revision-aware.*import/i.test(title))return 'Research import reliability';
    if(/immutable scientific/i.test(title))return 'Scientific evidence integrity';
    if(/foundation reliability/i.test(title))return 'Operational reliability';
  }
  if(record.kind==='issue') {
    const clean=title.replace(/^#\d+\s*/,'').replace(/^\[[^\]]+\]\s*/,'');
    const topic=clean.includes(' [edu-ops:')?clean.split(' [edu-ops:')[0].replace(/[-_]+/g,' ').trim():'';
    const topicLabel=topic?topic.charAt(0).toUpperCase()+topic.slice(1):'';
    if(/UNSUPPORTED_.*NUMERIC_CLAIM/i.test(title))return topicLabel?`${topicLabel} · Claim wording needs review`:'An educational claim needs review';
    if(topicLabel&&/EDITORIAL_REVIEW/.test(title))return `${topicLabel} · Editorial review`;
    if(topicLabel&&/HUMAN_REVIEW/.test(title))return `${topicLabel} · Evidence or scope review`;
    if(/CLAIM_SCOPE/i.test(title))return 'Educational wording needs a scope review';
    return clean.replace(/[-_]+/g,' ');
  }
  return title.replace(/^#\d+\s*/,'');
}
export function deliverableLabel(record) {
  if(record.kind==='ingestion')return 'Research batch received';
  if(record.kind==='page')return ownerTitle(record);
  const title=String(record.title||'');
  if(title==='education-candidate-bundles')return 'Saved education candidate reference';
  if(title.startsWith('education-ops-shadow-'))return 'Education operations report reference';
  if(title==='education-publication-state')return 'Education publication state reference';
  return title.replace(/[-_]+/g,' ').replace(/\s\d{6,}$/,'').trim();
}
export function recentDeliverables(records) {
  // Successful jobs, drafts and checks are not substitutes for delivered work.
  const eligible=newest(records.filter(r=>(r.kind==='ingestion'&&r.status==='success'&&r.dryRun===false)||(r.kind==='page'&&r.status==='published')||(r.kind==='artifact'&&r.status==='Available')));
  const distinct=new Map();
  for(const r of eligible){const key=r.kind==='artifact'?deliverableLabel(r):`${r.kind}:${r.id}`;if(!distinct.has(key))distinct.set(key,r);}
  return [...distinct.values()].slice(0,3);
}
export function departmentBrief(snapshot, role) {
  const rows=(snapshot.activities||[]).filter(r=>r.role===role.id);
  const groups=groupWorkflows(rows);
  const running=groups.filter(g=>g.active);
  const uncertain=rows.some(r=>r.kind==='ingestion'&&r.status==='running');
  const executionFeed=role.sources.includes('github_runs')&&snapshot.sources.some(s=>s.id==='github_runs'&&s.state==='Connected');
  const ingested=rows.filter(r=>r.kind==='ingestion'&&r.status==='success'&&r.dryRun===false);
  const pages=rows.filter(r=>r.kind==='page'&&r.status==='published');
  const proposals=rows.filter(r=>r.kind==='pull_request');
  const deliverables=recentDeliverables(rows);
  let accomplished='Recent deliverables unavailable.';
  if(ingested.length)accomplished=`${ingested.length} research ${ingested.length===1?'batch recorded as received':'batches recorded as received'} in the library.`;
  else if(pages.length)accomplished=`${pages.length} education ${pages.length===1?'resource marked published':'resources marked published'} in the library.`;
  else if(proposals.length)accomplished=`${proposals.length} open development ${proposals.length===1?'proposal':'proposals'} available for inspection.`;
  else if(deliverables.length)accomplished='Recent report and artifact references are available.';
  else if(groups.some(g=>g.completed))accomplished=role.id==='scientific'?'Research intake ran; received research could not be verified.':role.id==='education'?'Education work ran; published results could not be verified.':'Routine work ran; recent deliverables could not be verified.';
  return {role,rows,groups,deliverables,accomplished,running,
    current:running.length?'Execution observed':uncertain?'Current work unverified':executionFeed?'No running workflow reported':'Current work unavailable',
    availability:'Assignments not connected',
    lastActivity:newest(rows)[0]||null,
  };
}
export function projectBrief(pr, records) {
  const checks=records.filter(r=>r.kind==='check'&&r.prNumber===pr.id&&r.candidateSha===pr.sha);
  const previews=records.filter(r=>r.kind==='preview_check'&&r.prNumber===pr.id&&r.candidateSha===pr.sha);
  return {title:ownerTitle(pr),record:pr,status:checks.some(failed)?'Check needs attention':pr.status==='Draft'?'Draft proposal':'Open proposal',
    checks:!checks.length?'Checks unavailable':checks.some(failed)?'A reported check needs attention':checks.every(r=>r.status==='success')?'Reported checks passed':'Checks are incomplete',
    preview:previews.some(failed)?'Preview check needs attention':previews.length&&previews.every(r=>r.status==='success')?'Provider reports preview success':'Preview success unverified',
    evidence:[pr,...checks,...previews],blocker:'Release blockers are not established by these records.'};
}
