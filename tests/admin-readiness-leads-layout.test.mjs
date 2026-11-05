// AIMT Admin Readiness leads presentation regression.
// The previous markup used a bare <table> and lost every canonical
// .table rule, causing default large headings and crowded rows.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const page=readFileSync(path.join(ROOT,'admin.html'),'utf8');

const start=page.indexOf('async function loadReadinessLeads(){');
const stop=page.indexOf('async function loadCheckoutDiagnostics(){',start);
assert.ok(start>=0&&stop>start,'Expected isolated Readiness leads loader');

function render(leads){
  const target={innerHTML:''};
  const api=async()=>({
    count:leads.length,
    withMarketingConsent:leads.filter(l=>l.marketing_consent===true).length,
    leads,
  });
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  })[ch]);
  const fmtDate=_=>'Nov 4, 2026';
  const context={api,esc,fmtDate,$:name=>{
    assert.equal(name,'readinessLeadsBody');
    return target;
  }};
  const load=vm.runInNewContext(page.slice(start,stop)+'\nloadReadinessLeads',context);
  return load().then(()=>target.innerHTML);
}
const demo={
  first_name:'Sample',email:'sample@example.com',score:37,
  band:'Foundation Building',priority_pillar:'communication',
  marketing_consent:true,last_submitted_at:'2026-11-04T15:00:00Z',
};
test('Readiness leads uses canonical admin table styles and accessible columns',async()=>{
  const html=await render([demo]);
  assert.match(html,/<table class="table readiness-leads-table">/);
  assert.match(html,/<th scope="col">Lead<\/th>/);
  assert.match(html,/data-label="Score"/);
  assert.match(html,/data-label="Follow-up"/);
  assert.match(html,/class="readiness-name">Sample/);
  assert.match(html,/class="readiness-score">37\/100/);
  assert.match(html,/Client communication/);
  assert.match(html,/class="pill good">Opted in/);
  assert.match(html,/class="readiness-followup-action"/);
  assert.match(html,/Draft follow-up email →/);
  assert.match(html,/sample%40example\.com/);
  assert.match(html,/<strong>1<\/strong> saved profile/);
});
test('Non-opted-in leads have no promotional follow-up action',async()=>{
  const html=await render([{...demo,marketing_consent:false}]);
  assert.match(html,/Not opted in/);
  assert.doesNotMatch(html,/mailto:/);
  assert.doesNotMatch(html,/readiness-followup-action/);
});
test('User-supplied contact details remain escaped in markup',async()=>{
  const html=await render([{...demo,first_name:'<img src=x onerror=alert(1)>'}]);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<img src=x/);
});
test('Responsive layout is scoped to Readiness leads only',()=>{
  assert.match(page,/\.readiness-leads-table\{min-width:850px;table-layout:fixed\}/);
  assert.match(page,/@media\(max-width:700px\)\{[\s\S]*?\.readiness-leads-table\{display:block;min-width:0;width:100%\}/);
  assert.match(page,/\.readiness-leads-table td::before\{content:attr\(data-label\)/);
  assert.match(page,/\.readiness-leads-summary/);
  assert.match(page,/\.table\{width:100%;border-collapse:collapse;min-width:720px\}/);
});
