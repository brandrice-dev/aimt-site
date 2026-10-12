import { supabaseRest } from '../certification/auth.mjs';

const REPO = 'brandrice-dev/aimt-site';
const WEB = `https://github.com/${REPO}`;
const LIMIT = 30;
const source = (id, name, state, records = [], note = '') => ({ id, name, state, records, note, limit: LIMIT });
const text = v => String(v ?? '').slice(0, 240);
const time = v => v && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
export function safeLink(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.pages.dev') || u.hostname === 'aimtrichology.com') ? u.href : null; } catch { return null; }
}
export function sourceDiagnostic(status, code = '') {
  if (['42P01', 'PGRST205'].includes(code)) return { code: 'RELATION_UNAVAILABLE', httpStatus: status, explanation: 'The source table is missing or unavailable in the schema cache.', nextStep: 'Confirm applied schema and table exposure in the preview environment; do not create a replacement table.' };
  if (['42703', 'PGRST204'].includes(code)) return { code: 'PROJECTION_MISMATCH', httpStatus: status, explanation: 'An expected source column is unavailable.', nextStep: 'Compare the declared projection with the applied schema before changing the adapter.' };
  if ([401, 403].includes(status)) return { code: 'ACCESS_REJECTED', httpStatus: status, explanation: 'The source rejected the server request.', nextStep: 'Verify the existing environment binding and permissions without weakening authorization.' };
  return { code: 'SOURCE_HTTP_FAILURE', httpStatus: status, explanation: 'The source returned an unsuccessful HTTP response.', nextStep: 'Check source availability and the preview environment configuration. This response alone does not establish a schema defect.' };
}
function unavailable(id, name, diagnostic) {
  return { ...source(id, name, 'Activity unavailable', [], diagnostic.explanation), diagnostic };
}
function requestDiagnostic(error) {
  const timeout = ['TimeoutError', 'AbortError'].includes(error?.name);
  return { code: timeout ? 'REQUEST_TIMEOUT' : 'REQUEST_FAILED', explanation: timeout ? 'The source request exceeded its time limit.' : 'The source request could not be completed.', nextStep: 'Check network availability and source health. Private error messages are not displayed.' };
}
async function db(env, id, name, select, order, map, filter = {}) {
  try {
    const result = await supabaseRest(env, `${id}?${new URLSearchParams({ select, order, limit: String(LIMIT), ...filter })}`, { signal: AbortSignal.timeout(6000) });
    if (!result.ok) return unavailable(id, name, sourceDiagnostic(result.status, result.body?.code));
    if (!Array.isArray(result.body)) return unavailable(id, name, { code: 'MALFORMED_RESPONSE', httpStatus: result.status, explanation: 'The source did not return the expected record list.', nextStep: 'Check the existing API response contract; no records are inferred.' });
    return { ...source(id, name, 'Connected', result.body.map(map), 'Latest 30 records at most; this is not a complete history.'), diagnostic: { code: 'READ_SUCCEEDED', httpStatus: result.status, explanation: 'The bounded source read succeeded.' } };
  } catch (error) { return unavailable(id, name, requestDiagnostic(error)); }
}
async function github(path) {
  // Existing public repository only. No private feed, token, logs or artifact bodies.
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'AIMT-Office' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    const error = new Error('GitHub source unavailable');
    error.diagnostic = res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')
      ? { code: 'RATE_LIMITED', httpStatus: res.status, explanation: 'GitHub reports a read rate limit.', nextStep: 'Wait before refreshing. No private-repository credential is needed for these public reads.' }
      : sourceDiagnostic(res.status);
    throw error;
  }
  return res.json();
}
async function ghSource(id, name, path, field, map) {
  try {
    const data = await github(path); const rows = field ? data[field] : data;
    if (!Array.isArray(rows)) return unavailable(id, name, { code: 'MALFORMED_RESPONSE', explanation: 'GitHub did not return the expected record list.', nextStep: 'Check the source response contract.' });
    const result = source(id, name, 'Connected', rows.map(map), 'Public aimt-site metadata only. Bounded snapshot; GitHub rate limits may apply.');
    result.limit = Number(new URLSearchParams(path.split('?')[1]).get('per_page')) || LIMIT;
    result.diagnostic = { code: 'READ_SUCCEEDED', httpStatus: 200, explanation: 'The bounded source read succeeded.' };
    return result;
  } catch (error) { return unavailable(id, name, error?.diagnostic || requestDiagnostic(error)); }
}
function runRole(path) {
  if (path === '.github/workflows/aimt-research-feed-ingest.yml') return 'scientific';
  if (['.github/workflows/aimt-education-operations.yml', '.github/workflows/aimt-education-publish.yml'].includes(path)) return 'education';
  return 'technology';
}
export const ROLES = [
  { id: 'scientific', department: 'Scientific Intelligence', title: 'Research stewardship', mandate: 'Preserve scientific provenance and surface ingestion failures and evidence gaps.', systems: ['Research Library', 'Research Feed Ingest', 'Research MCP'], sources: ['research_ingestion_log', 'research_verification_queue', 'research_ingestion_quarantine', 'github_runs'], outstanding: 'Scientific approval remains in its existing governed systems. Researcher execution and source access are not verified by ingestion alone.' },
  { id: 'market', department: 'Market Intelligence', title: 'Demand analysis', mandate: 'Assess attributable audience and demand signals using existing growth reporting.', systems: ['Admin Growth'], sources: [], outstanding: 'Growth reporting is available in Admin → Growth. No employee execution log, Search Console or market dataset is connected to Office.' },
  { id: 'innovation', department: 'Innovation Intelligence', title: 'Technology scouting', mandate: 'Evaluate emerging tools and technologies against evidence and professional scope.', systems: [], sources: [], outstanding: 'A dedicated innovation observation feed and execution history are not connected.' },
  { id: 'education', department: 'Education Development', title: 'Education operations', mandate: 'Track governed education development and publication records without granting approval.', systems: ['Education Operations', 'Publication Editor', 'Writer / Reviewer', 'Public Page Library'], sources: ['research_public_pages', 'github_runs', 'github_issues'], outstanding: 'Job success does not establish scientific validity, a successful model stage, or publication. Stage reports are not connected.' },
  { id: 'creative', department: 'Creative Intelligence', title: 'Creative development', mandate: 'Organize instructional and brand production responsibilities.', systems: ['Existing design system', 'Listen Mode production documents'], sources: [], outstanding: 'No creative execution log or persistent assignment source is connected.' },
  { id: 'technology', department: 'Technology & Operations', title: 'Development and reliability', mandate: 'Track development proposals, workflow results and deployment evidence.', systems: ['GitHub pull requests', 'GitHub Actions', 'Admin System Health'], sources: ['github_runs', 'github_prs', 'github_checks', 'github_statuses', 'github_artifacts', 'github_deployments'], outstanding: 'Passing checks and successful previews are distinct. Cloudflare runtime configuration remains separately verified.' },
  { id: 'executive', department: 'Executive Coordination', title: 'Founder coordination', mandate: 'Present operational exceptions and prepare future governed assignments.', systems: ['Office Decision Desk'], sources: [], outstanding: 'Persistent supervisor, assignments, workforce communication and dispatch are not connected or activated.' },
];
export function classifyRole(role, sources) {
  const records = sources.filter(s => role.sources.includes(s.id)).flatMap(s => s.records).filter(r => r.role === role.id);
  const sorted = records.sort((a, b) => (Date.parse(b.time) || 0) - (Date.parse(a.time) || 0));
  // Only GitHub supplies a live execution status. DB running flags lack heartbeats.
  const active = sorted.find(r => r.kind === 'workflow' && r.status === 'in_progress');
  return { ...role, classification: active ? 'Execution observed' : sorted.length ? 'Historical activity verified' : 'Activity unavailable', lastVerifiedActivity: sorted[0]?.time || null, evidence: active || sorted[0] || null, outputs: sorted.filter(r => r.status === 'published' || r.status === 'success' || r.kind === 'pull_request').slice(0, 5) };
}
export async function buildOfficeSnapshot(env) {
  const sources = await Promise.all([
    db(env, 'research_ingestion_log', 'Research ingestion', 'id,batch_id,status,dry_run,started_at,finished_at', 'started_at.desc', r => ({ id: r.id, role: 'scientific', kind: 'ingestion', dryRun: typeof r.dry_run === 'boolean' ? r.dry_run : null, title: `Batch ${text(r.batch_id)}${r.dry_run ? ' · dry run' : ''}`, status: text(r.status), time: time(r.finished_at || r.started_at), detail: r.status === 'running' ? 'Recorded running; no heartbeat is available. Current execution or a stall cannot be verified.' : 'Library ingestion status only; not independent scientific verification.', url: null, artifact: text(r.batch_id) })),
    db(env, 'research_verification_queue', 'Research work queue', 'queue_id,lane,item_type,status,created_at,updated_at', 'updated_at.desc', r => ({ id: r.queue_id, role: 'scientific', kind: 'queue', title: text(r.queue_id), status: text(r.status) || 'Status unavailable', time: time(r.updated_at || r.created_at), detail: `Lane: ${text(r.lane)} · ${text(r.item_type)}. Queue status is not proof of an active worker.`, url: null })),
    db(env, 'research_ingestion_quarantine', 'Ingestion exceptions', 'id,batch_id,record_type,status,received_at', 'received_at.desc', r => ({ id: r.id, role: 'scientific', kind: 'exception', title: `Quarantined ${text(r.record_type)}`, status: text(r.status), time: time(r.received_at), detail: `Batch ${text(r.batch_id)} · rejected record held for review. Raw payload and credentials are not returned.`, url: null }), { status: 'eq.pending' }),
    db(env, 'research_public_pages', 'Education page records', 'topic_slug,seo_title,status,canonical_url,updated_at,published_at', 'updated_at.desc', r => ({ id: r.topic_slug, role: 'education', kind: 'page', title: text(r.seo_title || r.topic_slug), status: text(r.status), time: time(r.updated_at), detail: r.status === 'published' ? `Library records publication at ${time(r.published_at) || 'an unavailable time'}. Live route not independently checked.` : 'Library page state; not a release authorization.', url: r.status === 'published' ? safeLink(r.canonical_url) : null, artifact: text(r.topic_slug) })),
    ghSource('github_runs', 'Workflow execution', 'actions/runs?per_page=30', 'workflow_runs', r => ({ id: r.id, role: runRole(r.path), kind: 'workflow', workflowPath: text(r.path), branch: text(r.head_branch), title: text(r.name), status: r.status === 'completed' ? text(r.conclusion) || 'Conclusion unavailable' : text(r.status), time: time(r.updated_at), detail: `GitHub execution: ${text(r.status)} · branch ${text(r.head_branch)} · commit ${text(r.head_sha)}. Workflow conclusion does not verify business stages or deployment.`, url: safeLink(r.html_url), artifact: `Run #${r.run_number}` })),
    ghSource('github_prs', 'Open development proposals', 'pulls?state=open&sort=updated&direction=desc&per_page=30', null, r => ({ id: r.number, role: 'technology', kind: 'pull_request', title: `#${r.number} ${text(r.title)}`, status: r.draft ? 'Draft' : 'Open', time: time(r.updated_at), detail: `Targets ${text(r.base?.ref)} · candidate ${text(r.head?.sha)}. Tests and preview must be checked for this exact commit.`, url: safeLink(r.html_url), sha: r.head?.sha, artifact: `PR #${r.number}` })),
    ghSource('github_issues', 'Operational review issues', 'issues?state=open&sort=updated&direction=desc&per_page=30', null, r => ({ id: r.number, role: 'education', kind: 'issue', reviewType: r.labels?.some(l => l.name === 'education-infra') ? 'operations' : 'education', title: `#${r.number} ${text(r.title)}`, status: 'Open', time: time(r.updated_at), detail: 'Existing education review / infrastructure issue; opening this record does not approve work.', url: safeLink(r.html_url), relevant: !r.pull_request && r.labels?.some(l => ['education-review', 'education-infra'].includes(l.name)) })),
    ghSource('github_artifacts', 'Produced workflow artifacts', 'actions/artifacts?per_page=30', 'artifacts', r => ({ id: r.id, role: 'technology', kind: 'artifact', title: text(r.name), status: r.expired ? 'Expired' : 'Available', time: time(r.created_at), detail: `Produced artifact metadata only · expires ${time(r.expires_at) || 'at an unavailable time'}. Contents are not read.`, url: r.workflow_run?.id ? `${WEB}/actions/runs/${r.workflow_run.id}` : null, artifact: text(r.name) })),
    ghSource('github_deployments', 'Deployment records', 'deployments?per_page=5', null, r => ({ id: r.id, role: 'technology', kind: 'deployment', title: `Deployment ${text(r.environment)}`, status: 'Status unavailable', time: time(r.created_at), detail: `Commit ${text(r.sha)}. A deployment record alone does not prove deployment success.`, url: `${WEB}/deployments`, sha: r.sha })),
  ]);
  const issues = sources.find(s => s.id === 'github_issues');
  issues.records = issues.records.filter(r => r.relevant).map(({ relevant, ...r }) => r);
  // Check exact current PR heads, bounded to two proposals. Never call a check a test unless its source says so.
  const prs = sources.find(s => s.id === 'github_prs').records.slice(0, 2);
  const checks = await Promise.all(prs.map(async pr => ghSource('github_checks', `Checks for PR #${pr.id}`, `commits/${encodeURIComponent(pr.sha)}/check-runs?per_page=30`, 'check_runs', r => ({ id: r.id, role: 'technology', kind: r.app?.slug === 'cloudflare-pages' || /^Cloudflare Pages$/i.test(r.name || '') ? 'preview_check' : 'check', prNumber: pr.id, candidateSha: pr.sha, title: `${text(r.name)} · PR #${pr.id}`, status: r.status === 'completed' ? text(r.conclusion) : text(r.status), time: time(r.completed_at || r.started_at), detail: `Exact candidate ${text(pr.sha)}. ${r.app?.slug === 'cloudflare-pages' || /^Cloudflare Pages$/i.test(r.name || '') ? 'Cloudflare Pages provider-reported preview check; not test evidence or independent route verification.' : 'Check conclusion is not deployment success or a count of passing tests.'}`, url: safeLink(r.html_url) }))));
  sources.push(...checks);
  const commitStatuses = await Promise.all(prs.map(pr => ghSource('github_statuses', `Commit statuses for PR #${pr.id}`, `commits/${encodeURIComponent(pr.sha)}/status?per_page=30`, 'statuses', r => ({ id: r.id, role: 'technology', kind: /cloudflare/i.test(r.context) ? 'preview_check' : 'check', prNumber: pr.id, candidateSha: pr.sha, title: `${text(r.context)} · PR #${pr.id}`, status: text(r.state), time: time(r.updated_at), detail: `Provider-reported status for exact candidate ${text(pr.sha)}. ${/cloudflare/i.test(r.context) ? 'Cloudflare preview check; not test evidence or independent route verification.' : 'Commit check; not a deployment preview.'}`, url: safeLink(r.target_url) }))));
  sources.push(...commitStatuses);
  const deployments = sources.find(s => s.id === 'github_deployments');
  await Promise.all(deployments.records.slice(0, 2).map(async record => {
    try { const statuses = await github(`deployments/${record.id}/statuses?per_page=1`); if (statuses[0]) { record.status = text(statuses[0].state); record.time = time(statuses[0].created_at); record.detail = `GitHub deployment status for commit ${text(record.sha)}. Successful deployment is separate from tests; preview URL availability is not independently checked.`; record.url = safeLink(statuses[0].environment_url) || record.url; } } catch { record.detail += ' Deployment status request unavailable.'; }
  }));
  sources.push(source('assignments', 'Persistent assignments and communication', 'Not connected', [], 'No dispatch, messages or autonomous task execution in Office V1.'));
  const activities = sources.flatMap(s => s.records.map(r => ({ ...r, source: s.name, sourceId: s.id }))).sort((a,b) => (Date.parse(b.time)||0)-(Date.parse(a.time)||0));
  return { fetchedAt: new Date().toISOString(), scope: 'Bounded read-only snapshot. Role cards describe responsibilities, not newly created employees.', sources, roles: ROLES.map(r => classifyRole(r, sources)), activities, decisions: activities.filter(r => r.kind === 'exception' || r.kind === 'issue' || ['failure','failed','partial','timed_out','action_required'].includes(r.status)) };
}
