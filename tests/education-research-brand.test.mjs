import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {libraryPage,studyPage} from '../functions/_lib/public-research/view.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('assets/css/aimt-research.css');
const catalog={articles:[],studies:[],categories:[]};
const study={title:'Approved reference',authors:['Author'],year:2024,doi:'10.1/reference',source_url:'https://doi.org/10.1/reference',href:'/research/studies/0123456789abcdef01234567',articles:[]};
test('all public Research views load the exact existing Education Google Fonts dependency',()=>{
 const fonts=read('education.html').match(/<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>/g);
 assert.equal(fonts.length,3);
 for(const html of [libraryPage(catalog,new URLSearchParams()),libraryPage(catalog,new URLSearchParams('q=hair+biology')),studyPage(study)]) {
  for(const font of fonts)assert.ok(html.includes(font),'Missing shared font loading link');
  assert.ok(html.includes('aimt-research-body'));
 }
});
test('Research colors come exclusively from existing brand tokens, not a local palette',()=>{
 assert.doesNotMatch(css,/#(?:[a-f0-9]{3,8})\b|\b(?:rgba?|hsla?|oklch|color-mix)\s*\(/i);
 assert.doesNotMatch(css,/Playfair|Georgia|serif\b|aimt-ink\b/i);
 const shared=read('assets/css/aimt-design-system.css');
 for(const token of new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m=>m[1])))assert.ok(shared.includes(token+':'),'Undefined design token '+token);
 // Color-bearing declarations must resolve through the shared palette.
 for(const match of css.matchAll(/(?:^|[;{])\s*(?:color|background|background-color|border|outline)\s*:\s*([^;}]+)/g))assert.match(match[1],/var\(--aimt-/);
});
test('headings, body, controls and small labels use the authoritative type families',()=>{
 assert.match(css,/\.research-main h1, \.research-main h2\s*\{\s*font-family: var\(--aimt-font-mont\)/);
 assert.match(css,/\.aimt-research-body\s*\{[^}]*font-family: var\(--aimt-font-sans\)/);
 assert.match(css,/\.research-search input, \.research-search select, \.research-search button\s*\{[^}]*font-family: var\(--aimt-font-sans\)/);
 assert.match(css,/\.research-search label\s*\{[^}]*font-family: var\(--aimt-font-mono\)/);
 assert.match(css,/\.research-kind, \.research-hero \.aimt-sp-eyebrow\s*\{[^}]*font-family: var\(--aimt-font-mono\)/);
});
test('stylesheet URL changes with its contents on library, filtered and study views',()=>{
 const version=createHash('sha256').update(css).digest('hex').slice(0,12);
 for(const html of [libraryPage(catalog,new URLSearchParams()),libraryPage(catalog,new URLSearchParams('q=hair')),studyPage(study)])assert.ok(html.includes(`/assets/css/aimt-research.css?v=${version}`),'Stale stylesheet version');
});
