// AIMT free tools + First-Service Blueprint review regressions.
// Offline only. No payments, student records, PII, or provider calls.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {calculateServiceCost,readAmount,SERVICE_COST_FIELDS} from '../assets/js/aimt-service-cost-core.mjs';
import {blueprintPayload,normalizeBlueprint,BLUEPRINT_FIELDS,BLUEPRINT_VERSION} from '../assets/js/aimt-first-service-blueprint-core.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(ROOT,p),'utf8');
const hub=read('free-tools.html'), cost=read('head-spa-service-cost.html'), blueprint=read('first-service-blueprint.html'),css=read('assets/css/aimt-free-tools.css');
const routes=JSON.parse(read('_routes.json'));

test('free tools offers exactly three existing/working categories without empty placeholders',()=>{
  assert.match(hub,/Free tools for beauty professionals/);
  assert.match(hub,/who want to offer more/);
  const categories=[...hub.matchAll(/<article class="ft-tool-card" data-ft-category="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(categories,['planning','pricing','education']);
  for(const page of ['head-spa-readiness.html','head-spa-service-cost.html','education.html'])assert.ok(existsSync(path.join(ROOT,page)),page);
  assert.match(hub,/href="\/head-spa-readiness"/);
  assert.match(hub,/href="\/head-spa-service-cost"/);
  assert.match(hub,/href="\/education"/);
  assert.doesNotMatch(hub,/coming soon|under construction|not yet available/i);
});
test('new public routes are allowlisted; Blueprint is noindex and absent from sitemap/homepage',()=>{
  for(const base of ['free-tools','head-spa-service-cost','first-service-blueprint'])for(const s of ['','.html','/'])assert.ok(routes.exclude.includes('/'+base+s));
  for(const page of [hub,cost,blueprint]){
    assert.match(page,/href="\/assets\/css\/aimt-design-system\.css"/);
    assert.match(page,/href="\/assets\/css\/aimt-public-nav\.css"/);
    assert.match(page,/href="\/assets\/css\/aimt-free-tools\.css"/);
    assert.match(page,/href="#aimtOrbitalMark"/);
  }
  assert.match(blueprint,/<meta name="robots" content="noindex,nofollow"/);
  const sitemap=read('sitemap.xml');
  assert.match(sitemap,/https:\/\/aimtrichology\.com\/free-tools/);
  assert.match(sitemap,/https:\/\/aimtrichology\.com\/head-spa-service-cost/);
  assert.doesNotMatch(sitemap,/first-service-blueprint/);
  const home=read('index.html');
  assert.match(home, /class="aimt-public-nav-link">Free Tools<\/a>/);
  assert.match(home, /class="aimt-public-nav-mobile-link">Free Tools<\/a>/);
  assert.match(home, /href="\/free-tools" class="aimt-cta aimt-cta-primary-light">Explore Free Tools/);
  assert.ok(home.indexOf('id="free-tools-teaser"') < home.indexOf('id="cta"'));
  assert.doesNotMatch(read('assets/js/aimt-course-resources.js'),/client names/);
});
test('model uses all minutes, only actual cost inputs, no invented margin or wages',()=>{
  const values={consultMinutes:'15',serviceMinutes:'60',prepMinutes:'10',resetMinutes:'15',adminMinutes:'5',
    products:'12.50',supplies:'2.50',overhead:'9.75',laborHourly:'24',menuPrice:'150'};
  const c=calculateServiceCost(values);
  assert.equal(c.ok,true);
  assert.equal(c.minutes,105);
  assert.equal(c.hours,1.75);
  assert.equal(c.labor,42);
  assert.equal(c.direct,15);
  assert.equal(c.modeledCost,66.75);
  assert.equal(c.modeledDifference,83.25);
  assert.equal(c.enteredPrice,150);
  assert.ok(!('profit' in c));
  assert.ok(!('recommendedPrice' in c));
});
test('blank is not zero, values are finite, and optional price is truly optional',()=>{
  const values=Object.fromEntries(Object.keys(SERVICE_COST_FIELDS).map(x=>[x,'0']));
  values.serviceMinutes='60';values.menuPrice='';
  let c=calculateServiceCost(values);
  assert.equal(c.ok,true);assert.equal(c.modeledCost,0);assert.equal(c.enteredPrice,null);assert.equal(c.modeledDifference,null);
  values.products='';
  c=calculateServiceCost(values);
  assert.equal(c.ok,false);assert.deepEqual(c.missing,['products']);
  values.products='-1';
  c=calculateServiceCost(values);
  assert.equal(c.ok,false);assert.ok(c.invalid.includes('products'));
  values.products='Infinity';
  c=calculateServiceCost(values);
  assert.equal(c.ok,false);assert.ok(c.invalid.includes('products'));
  assert.equal(readAmount('5.5',SERVICE_COST_FIELDS.serviceMinutes).state,'invalid');
  assert.equal(readAmount('0',SERVICE_COST_FIELDS.products).state,'ok');
});
test('public worksheet has no PII collection, tracking form or automatic network sends',()=>{
  assert.match(cost,/href="\/head-spa-readiness\?utm_source=free_tools/);
  assert.match(cost,/Your entries stay in this browser page/);
  assert.match(cost,/modeled difference/);
  assert.match(cost,/Print \/ Save as PDF/);
  assert.doesNotMatch(cost,/fetch\(|localStorage|api\/readiness\/submit|<form[^>]*action=/);
  assert.match(cost,/<form id="costWorksheet" novalidate>/);
  assert.match(cost,/role="alert"/);
});
test('Blueprint exports and imports a stable, bounded, business-only shape',()=>{
  const values=Object.fromEntries(Object.keys(BLUEPRINT_FIELDS).map(k=>[k,'Example: '+k]));
  const obj=blueprintPayload(values);
  assert.equal(obj.version,BLUEPRINT_VERSION);
  assert.deepEqual(normalizeBlueprint(JSON.parse(JSON.stringify(obj))),obj);
  assert.equal(Object.keys(obj.fields).length,16);
  assert.equal(obj.fields.value,'Example: value');
  assert.throws(()=>normalizeBlueprint({version:999,fields:{}}),/Unsupported Blueprint/);
  assert.throws(()=>normalizeBlueprint({version:BLUEPRINT_VERSION,fields:{value:'a'.repeat(261)}}),/Invalid value/);
  assert.throws(()=>normalizeBlueprint({version:BLUEPRINT_VERSION,fields:{value:'bad\u0000text'}}),/Unsupported text/);
});
test('Blueprint connects course modules, never grants credentials and requires no server storage',()=>{
  const resources=read('assets/js/aimt-course-resources.js');
  assert.match(resources,/title: 'First-Service Blueprint'/);
  assert.match(resources,/href: 'first-service-blueprint\.html'/);
  assert.match(resources,/type: 'tool'/);
  for(const original of ['Head Spa Intake + Service Plan','AIMT Service Timer','Core Service Map',
    'Extended Service Map','Head Spa Enhancement Strategy Guide','Between-Client Sanitation & Reset Checklist','AIMT AI Practice Toolkit'])
    assert.ok(resources.includes(original),'existing resource lost '+original);
  assert.match(blueprint,/No client information/);
  assert.match(blueprint,/A completed Blueprint does not mean AIMT has approved your service/);
  assert.match(blueprint,/Nothing is stored online/);
  assert.match(blueprint,/id="bpExport"/);
  assert.match(blueprint,/id="bpImport"/);
  assert.match(blueprint,/type="file"/);
  assert.match(blueprint,/window\.print\(\)/);
  assert.doesNotMatch(blueprint,/localStorage|sessionStorage|fetch\(|supabase\.|AIMTGrowth/);
  assert.doesNotMatch(blueprint,/diagnoses clients|medical records|patient symptoms/i);
});
test('The presentation has a compact responsive page system and explicit letter print styling',()=>{
  assert.match(css,/@media\(max-width:680px\)/);
  assert.match(css,/@media print/);
  assert.match(css,/@page\{size:letter;margin:12mm\}/);
  assert.match(blueprint,/@page\{size:letter;margin:10mm 12mm\}/);
  assert.match(blueprint,/break-after:page/);
  assert.match(css,/\.ft-form-grid/);
});
