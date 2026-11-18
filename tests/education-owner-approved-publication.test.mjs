import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyStoredClearanceIntegrity } from '../functions/_lib/research/publication-clearance-fingerprint.mjs';
import { validatePageInvariants } from '../functions/_lib/research/publication-clearance-invariants.mjs';
import { publicationRouteFor } from '../functions/_lib/education-ops/education-publication-registry.mjs';
import { buildPublicCatalog } from '../functions/_lib/public-research/catalog.mjs';

const slugs = ['sensitive-scalp', 'dandruff-shampoo-actives', 'essential-oils-botanicals'];
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const records = slugs.map(slug => JSON.parse(read('functions/_data/education-human-approvals/' + slug + '.json')));

for (const record of records) {
  test(record.topic_slug + ' release preserves the article approved by the owner', async () => {
    const html = read(publicationRouteFor(record.topic_slug).slice(1) + '.html');
    const approval = record.publication_clearance.human_approval;
    const article = html.match(/<article\b[\s\S]*?<\/article>/)[0];
    assert.equal(record.clearance_mode, 'HUMAN_APPROVED');
    assert.equal(approval.decision, 'APPROVED_FOR_PUBLICATION');
    assert.equal(approval.approval_text, 'ok, i checked them, they pass, publish them all');
    assert.match(approval.reviewed_commit_sha, /^[a-f0-9]{40}$/);
    assert.equal(createHash('sha256').update(article).digest('hex'), approval.approved_article_html_sha256);
    assert.ok(html.includes('<meta name="aimt-generation-source-hash" content="' + record.generation_source_hash + '">'));
    assert.ok(!html.includes('noindex'));
    assert.ok(!html.includes('Independent review pending'));
    assert.equal((await verifyStoredClearanceIntegrity(record)).valid, true);
    const published = { ...record, status: 'published', sitemap_eligible: true, published_at: approval.recorded_at };
    assert.equal(validatePageInvariants(published).valid, true);
    const route = publicationRouteFor(record.topic_slug);
    assert.ok(read('sitemap.xml').includes('<loc>https://aimtrichology.com' + route + '</loc>'));
    const hub = route.split('/').slice(1, -1).join('/') + '.html';
    assert.ok(read(hub).includes('href="' + route + '"'));
  });
}

test('the public research catalog can discover all three human-approved releases', async () => {
  const published = records.map(record => ({ ...record, status: 'published', sitemap_eligible: true, published_at: record.publication_clearance.human_approval.recorded_at }));
  const catalog = await buildPublicCatalog(published, async route => new Response(read(route.slice(1) + '.html')));
  assert.deepEqual(catalog.articles.map(article => article.href).sort(), slugs.map(publicationRouteFor).sort());
});
