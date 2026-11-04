// Rendering and consent regression checks for AIMT Readiness result email.
// Runs entirely offline. No production emails, database writes or Stripe calls.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  renderReadinessHtml, renderReadinessText, PRIORITY_CONTENT,
  READINESS_RESULT_SUBJECT, educationUrlFor, CERTIFICATION_URL,
} from '../functions/_lib/readiness/readiness-profile-email.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFileSync(path.join(ROOT,file),'utf8');
const areas=['scope','assessment','service','communication','business'];
const testProfile={
  first_name:'Brandon',
  score:37,
  band:'Foundation Building',
  priority_pillar:'communication',
  strongest_pillar:'scope',
  pillar_scores:{scope:3,assessment:3,service:3,communication:1,business:1},
  marketing_consent:true,
};
test('AIMT results use the canonical branded email shell, with live clickable destinations',()=>{
  const html=renderReadinessHtml(testProfile);
  const plain=renderReadinessText(testProfile);
  assert.equal(READINESS_RESULT_SUBJECT,'Your AIMT Readiness Score + Next Steps');
  assert.match(html,/AMERICAN INSTITUTE OF MODERN TRICHOLOGY|AIMT/);
  assert.match(html,/aimt-mark-email\.png/);
  assert.match(html,/role="presentation"/);
  assert.match(html,/600px/);
  assert.match(html,/37\s*<span[^>]*>\s*\/ 100/);
  assert.match(html,/Foundation Building/);
  assert.match(html,/Client Communication &amp; Experience/);
  assert.match(html,/Explore Head Spa Certification/);
  assert.match(html,/href="https:\/\/aimtrichology\.com\/head-spa-certification\?utm_source=email&amp;utm_medium=email/);
  assert.match(html,/free practitioner education library/);
  assert.match(html,/https:\/\/aimtrichology\.com\/education\?utm_source=email/);
  assert.match(plain,/Explore AIMT Head Spa Certification:\nhttps:\/\/aimtrichology\.com\/head-spa-certification\?utm_source=email/);
  assert.match(plain,/Free practitioner education:/);
  assert.match(html,/One of your strongest areas/); // score ties are handled honestly
  assert.match(plain,/Professional Foundation & Scope: 3\/6/);
  assert.match(plain,/Client Communication & Experience: 1\/6/);
});
test('Non-marketing opt-in receives educational results, not a course pitch',()=>{
  const row={...testProfile,marketing_consent:false,priority_pillar:'scope'};
  const html=renderReadinessHtml(row);
  const plain=renderReadinessText(row);
  assert.match(html,/Explore Practitioner Education/);
  assert.match(html,/education\/safety/);
  assert.match(plain,/education\/safety/);
  assert.doesNotMatch(html,/head-spa-certification/);
  assert.doesNotMatch(plain,/head-spa-certification/);
  assert.doesNotMatch(html,/Explore Head Spa Certification/);
});
test('Every priority routes to a real canonical education section',()=>{
  const expected={
    scope:'/education/safety',
    assessment:'/education/scalp-health',
    service:'/education/head-spa-techniques',
    communication:'/education',
    business:'/education',
  };
  const htmlFiles={
    scope:'education/safety.html',
    assessment:'education/scalp-health.html',
    service:'education/head-spa-techniques.html',
    communication:'education.html',
    business:'education.html',
  };
  for(const key of areas){
    assert.equal(new URL(educationUrlFor(key)).pathname,expected[key],key);
    assert.match(read(htmlFiles[key]),/rel="canonical"/);
    assert.ok(PRIORITY_CONTENT[key].actions.length===3);
    const row={...testProfile,priority_pillar:key,strongest_pillar:key,marketing_consent:false};
    const html=renderReadinessHtml(row);
    const plain=renderReadinessText(row);
    for(const step of PRIORITY_CONTENT[key].actions)assert.ok(plain.includes(step),key+': '+step);
    assert.match(html,/Three practical moves/);
    assert.match(html,/Your five-part breakdown/);
    assert.match(html,/no-reply@auth\.aimtrichology\.com|aimt-mark-email\.png/);
  }
});
test('The email reflects the exact agreed Readiness assessment guidance',()=>{
  const readiness=read('head-spa-readiness.html');
  for(const key of areas) {
    assert.ok(readiness.includes(PRIORITY_CONTENT[key].affects),key+' explanation drift');
    for(const step of PRIORITY_CONTENT[key].actions) assert.ok(readiness.includes(step),key+' action drift');
  }
});
test('Dynamic user input is escaped in HTML',()=>{
  const malicious={...testProfile,first_name:'<img src=x onerror="alert(1)">',marketing_consent:false};
  const html=renderReadinessHtml(malicious);
  assert.doesNotMatch(html,/<img src=x onerror/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});
test('All five area scores and the 100-point score are included, no misleading preview link',()=>{
  const html=renderReadinessHtml(testProfile);
  for(const n of ['3 / 6','1 / 6'])assert.ok(html.includes(n));
  assert.doesNotMatch(html,/href="[^"]*my-aimt/);
  assert.match(html,/reply to this email/i);
  assert.match(html,/privacy/);
  assert.match(html,/This score is a professional self-assessment/);
  assert.ok(CERTIFICATION_URL.startsWith('https://aimtrichology.com/head-spa-certification?'));
});
