import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {renderEducationPageHtml} from '../functions/_lib/education-ops/education-page-renderer.mjs';import {aggregateReviewOutcome} from '../functions/_lib/education-ops/education-reviewer-validator.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),hash=s=>createHash('sha256').update(s).digest('hex');
for(const slug of ['dandruff','surfactants'])test(`${slug} published HTML matches the exact independently reviewed plan`,()=>{
 const a=JSON.parse(read(`functions/_data/education-page-plans/${slug}.json`)),p=JSON.parse(read(`functions/_data/education-page-reviews/${slug}.json`));
 assert.equal(hash(JSON.stringify(a.plan)),p.reviewed_plan_sha256);assert.equal(aggregateReviewOutcome(p.review).outcome,'PASS');assert.equal(p.verdict.outcome,'PASS');assert.equal(p.generation_source_hash,a.generation_source_hash);
 let expected=renderEducationPageHtml(a.plan,{launchReady:true,generationSourceHash:a.generation_source_hash});for(const f of p.figures){const marker=`<section class="aimt-legal-doc__section" id="${f.before}">`;assert.equal(expected.split(marker).length,2);expected=expected.replace(marker,f.html+'\n    '+marker);}
 const html=read(a.plan.route.slice(1)+'.html');assert.equal(html,expected);assert.equal(hash(html),p.rendered_sha256);assert.ok(!html.includes('noindex'));assert.ok(!html.includes('review pending'));assert.ok(read('sitemap.xml').includes(`<loc>https://aimtrichology.com${a.plan.route}</loc>`));assert.ok(read(`education/${a.plan.cluster}.html`).includes(`href="${a.plan.route}"`));
});
