// Readiness-completion final-decision funnel, offline contract tests.
// The page is unlisted and links into the EXISTING live Stripe checkout;
// no new payment handler, entitlement, or readiness score rule is created.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { CERTIFICATION_URL, renderReadinessHtml } from '../functions/_lib/readiness/readiness-profile-email.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFileSync(path.join(ROOT,rel),'utf8');
const HTML=read('readiness-enroll.html');
const MOCK=read('my-aimt.html');
const ADMIN=read('admin.html');
const ROUTES=JSON.parse(read('_routes.json'));
const SITEMAP=read('sitemap.xml');

test('Decision page matches approved Version 6 copy, price, and plain direction',()=>{
  assert.match(HTML,/GIVE CLIENTS MORE REASONS\s*<em>TO CHOOSE YOU\.<\/em>/);
  assert.match(HTML,/Stand out from other salons\. Offer more value\. Build a stronger business\./);
  assert.match(HTML,/Offer more to each client/);
  assert.match(HTML,/Stand out from the competition/);
  assert.match(HTML,/Know what you're doing—and why/);
  assert.match(HTML,/\$597 one time\./);
  assert.match(HTML,/Keep access for life/);
  assert.match(HTML,/Certification is earned by completing/);
  assert.doesNotMatch(HTML,/previewDialog|Owner draft|mock checkout/i);
  assert.doesNotMatch(HTML,/countdown|guaranteed income|100% guaranteed results/i);
});
test('Only real enrollment CTA points to the existing secure payment flow',()=>{
  assert.match(HTML,/<a class="cta" href="\/enroll" id="startTraining">Start My Training/);
  assert.doesNotMatch(HTML,/stripe\.com\/v1\/checkout\/sessions|\/api\/create-checkout-session/);
  assert.match(read('enroll.html'),/\/api\/create-checkout-session/);
  assert.doesNotMatch(HTML,/<form[^>]*payment/i);
});
test('Unlisted static page is excluded from indexing and is absent from public navigation',()=>{
  assert.match(HTML,/<meta name="robots" content="noindex,nofollow">/);
  assert.ok(ROUTES.exclude.includes('/readiness-enroll'));
  assert.ok(ROUTES.exclude.includes('/readiness-enroll.html'));
  assert.doesNotMatch(SITEMAP,/readiness-enroll/);
  for(const file of ['index.html','courses.html'])assert.doesNotMatch(read(file),/href=["'][^"']*readiness-enroll/);
  assert.doesNotThrow(()=>new vm.Script(
    [...HTML.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(a=>a[1]).join('\n')
  ));
});
test('Readiness page uses the canonical AIMT mark, typography, navigation and colors',()=>{
  const canonical=read('about.html').match(/<symbol id="aimtOrbitalMark" viewBox="0 0 44 44">[\s\S]*?<\/symbol>/)?.[0];
  const actual=HTML.match(/<symbol id="aimtOrbitalMark" viewBox="0 0 44 44">[\s\S]*?<\/symbol>/)?.[0];
  assert.ok(canonical,'canonical mark exists on the About page');
  assert.equal(actual,canonical,'orbital geometry must match the existing institute logo exactly');
  assert.match(HTML,/class="aimt-public-nav aimt-public-nav--sticky"/);
  assert.match(HTML,/class="aimt-public-nav-name">AIMT<\/span>/);
  assert.match(HTML,/href="#aimtOrbitalMark"/);
  assert.match(HTML,/href="\/assets\/css\/aimt-design-system\.css"/);
  assert.match(HTML,/href="\/assets\/css\/aimt-public-nav\.css"/);
  const homepage=read('index.html');
  const canonicalFonts=homepage.match(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Montserrat:[^"]+" rel="stylesheet">/)?.[0];
  assert.ok(canonicalFonts,'canonical institute fonts on homepage');
  assert.ok(HTML.includes(canonicalFonts),'must load identical fonts and available weights');
  assert.match(HTML,/font-family:\s*var\(--aimt-font-mont\)/);
  assert.match(HTML,/font-family:\s*var\(--aimt-font-sans\)/);
  assert.match(HTML,/background:\s*var\(--aimt-color-bg-primary\)/);
  assert.match(HTML,/background:\s*var\(--aimt-color-light-bg\)/);
  assert.match(HTML,/border-radius:\s*var\(--aimt-btn-pill-radius\)/);
  assert.doesNotMatch(HTML, /#[a-f\d]{3,8}\b/gi,'page must not invent brand hex colors');
  assert.doesNotMatch(HTML,/font:[^;]+Montserrat/i,'avoid hard-coded font shorthand overriding tokens');
});
test('Readiness mock dashboard points to new decision page with tracking',()=>{
  assert.match(MOCK,/href="\/readiness-enroll\?utm_source=aimt&amp;utm_medium=readiness_preview/);
  assert.match(MOCK,/See Your Next Step →/);
});
test('Results email and admin manual follow-up both point to decision page',()=>{
  assert.equal(new URL(CERTIFICATION_URL).pathname,'/readiness-enroll');
  assert.match(ADMIN,/https:\/\/aimtrichology\.com\/readiness-enroll\?utm_source=email/);
  assert.match(ADMIN,/consent\?'<a href="/); // manual outreach only with opt-in
  const sample={ first_name:'Sample',score:50,band:'Developing System',priority_pillar:'service',strongest_pillar:'assessment',pillar_scores:{scope:3,assessment:3,service:3,communication:3,business:3},marketing_consent:true };
  assert.match(renderReadinessHtml(sample),/readiness-enroll/);
  assert.doesNotMatch(renderReadinessHtml({...sample,marketing_consent:false}),/readiness-enroll/);
});
