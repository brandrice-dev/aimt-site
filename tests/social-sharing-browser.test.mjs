// Real dashboard, simulated account/API records. No production credentials.
// NODE_PATH=<bundled node_modules> node tests/social-sharing-browser.test.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(import.meta.dirname, '..');
const out = process.env.AIMT_REVIEW_DIR || '/tmp/aimt-sharing-review';
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const name = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' })[path.extname(file)] || 'text/plain');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true });
const credential = { credential_id: 'AIMT-HS-2026-ABC234', course_slug: 'headspa-mastery', revoked: false, student_name: 'Review Student', completed_at: '2026-11-01T12:00:00Z' };
const supabaseStub = `window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:window.qa.signedOut?null:{id:'fixture-user',email:'review@example.test',user_metadata:{first_name:'Review'}}}}),getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:table=>{const q={select:()=>q,or:()=>q,eq:()=>q,order:()=>q,then:resolve=>resolve({data:table==='course_entitlements'?(window.qa.enrolled?[{course_slug:'headspa-mastery'}]:[]):table==='completions'?(window.qa.credential?[window.qa.credential]:[]):[],error:null})};return q}})};`;
async function open(state, mobile = false, suffix = '') {
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 }, deviceScaleFactor: 1, acceptDownloads: true });
  await page.addInitScript(state => { window.qa = state; }, { enrolled: true, ...state });
  await page.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route => route.fulfill({ body: supabaseStub, contentType: 'text/javascript' }));
  await page.route('**/api/verify-credential?*', async route => {
    const state = await page.evaluate(() => window.qa);
    if (state.error) return route.fulfill({ status: 503, body: '{}' });
    const c = state.credential;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(!c || c.revoked || state.revokedResponse ? { valid: false, reason: 'revoked' } : { valid: true, credential_id: c.credential_id, course: 'Head Spa Certification Course', student_name: c.student_name, completed_at: c.completed_at }) });
  });
  page.on('pageerror', error => { throw error; });
  await page.goto(base + '/my-aimt.html' + suffix);
  if (!state.signedOut) await page.waitForLoadState('networkidle');

  return page;
}
try {
  const student = await open({});
  await student.locator('#socialSharing img').first().waitFor();
  assert.equal(await student.locator('#socialSharing img').count(), 2);
  assert.match(await student.locator('#socialSharing').innerText(), /Graduate announcement · Locked/);
  assert.match(await student.locator('#socialSharing textarea').inputValue(), /Currently training toward/);
  await student.locator('#socialSharing').screenshot({ path: out + '/student-desktop.png' });
  await student.screenshot({ path: out + '/dashboard-desktop.png', fullPage: true });
  const dlPromise = student.waitForEvent('download');
  await student.getByRole('button', { name: 'Download PNG' }).first().click();
  const dl = await dlPromise; await dl.saveAs(out + '/student-charcoal.png');
  const png = await readFile(out + '/student-charcoal.png');
  assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1920);
  // Clipboard denied: the visible selectable textarea is still usable.
  await student.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw Error('denied'); } }, configurable: true }));
  await student.getByRole('button', { name: 'Copy caption' }).click();
  assert.match(await student.locator('#socialSharing [role="status"]').first().innerText(), /Select and copy/);
  const grad = await open({ credential });
  await grad.locator('#socialSharing img').nth(3).waitFor();
  assert.match(await grad.locator('#socialSharing').innerText(), /Graduate announcement · Certified/);
  assert.match(await grad.locator('#socialSharing textarea').nth(1).inputValue(), /AIMT-HS-2026-ABC234/);
  assert.match(await grad.locator('.sharing-verify').getAttribute('href'), /\/verify\?id=AIMT-HS-2026-ABC234$/);
  await grad.locator('#socialSharing').screenshot({ path: out + '/graduate-desktop.png' });
  // Export every variant and inspect the actual PNG headers.
  for (let i = 0; i < 4; i++) {
    const promise = grad.waitForEvent('download');
    await grad.getByRole('button', { name: 'Download PNG' }).nth(i).click();
    const download = await promise;
    await download.saveAs(out + '/' + download.suggestedFilename());
    const bytes = await readFile(out + '/' + download.suggestedFilename());
    assert.equal(bytes.readUInt32BE(16), 1080); assert.equal(bytes.readUInt32BE(20), 1920);
  }
  await grad.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async value => { window.copiedCaption = value; } }, configurable: true }));
  await grad.getByRole('button', { name: 'Copy caption' }).nth(1).click();
  await grad.waitForFunction(() => window.copiedCaption);
  assert.match(await grad.evaluate(() => window.copiedCaption), /AIMT-HS-2026-ABC234/);
  // A credential revoked after previews were generated must not export/copy.
  let revokedDownloads = 0; grad.on('download', () => revokedDownloads++);
  await grad.evaluate(() => { window.qa.revokedResponse = true; });
  await grad.getByRole('button', { name: 'Download PNG' }).nth(2).click();
  await grad.getByRole('heading', { name: 'Graduate announcement · Locked' }).waitFor();
  assert.equal(await grad.locator('#socialSharing img').count(), 2);
  assert.equal(await grad.locator('#socialSharing textarea').count(), 1);
  assert.equal(revokedDownloads, 0);
  assert.match(await grad.locator('#socialSharing').innerText(), /Graduate announcement · Locked/);
  for (const state of [{ credential: { ...credential, revoked: true } }, { credential, revokedResponse: true }, { credential, error: true }]) {
    const page = await open(state);
    await page.locator('#socialSharing img').first().waitFor();
    await page.waitForFunction(() => document.querySelectorAll('#socialSharing img').length === 2);
    assert.equal(await page.locator('#socialSharing .sharing-verify').count(), 0);
    await page.close();
  }
  const copyRevoked = await open({ credential });
  await copyRevoked.locator('#socialSharing img').nth(3).waitFor();
  await copyRevoked.evaluate(() => { window.qa.revokedResponse = true; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { window.copiedRevoked = true; } }, configurable: true }); });
  await copyRevoked.getByRole('button', { name: 'Copy caption' }).nth(1).click();
  await copyRevoked.getByRole('heading', { name: 'Graduate announcement · Locked' }).waitFor();
  assert.equal(await copyRevoked.evaluate(() => !!window.copiedRevoked), false);
  await copyRevoked.close();
  const mobile = await open({ credential }, true);
  await mobile.locator('#socialSharing img').nth(3).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.locator('#socialSharing').screenshot({ path: out + '/graduate-mobile.png', style: '.aimt-public-nav { visibility: hidden !important; }' });
  await mobile.screenshot({ path: out + '/dashboard-mobile.png', fullPage: true });
  assert.match(await mobile.locator('.sharing-intro').innerText(), /touch and hold/);
  for (const state of [{ enrolled: false }, { signedOut: true }]) {
    const page = await open(state);
    if (state.signedOut) await page.waitForURL('**/student-access.html');
    else { await page.locator('#dashboard').waitFor({ state: 'visible' }); assert.equal(await page.locator('#socialSharing').isVisible(), false); }
    assert.equal(await page.locator('#socialSharing img').count(), 0);
    await page.close();
  }
  const preview = await open({}, false, '?preview=readiness');
  await preview.locator('#previewModeRoot').waitFor({ state: 'visible' });
  assert.equal(await preview.locator('#socialSharing').isVisible(), false);
  console.log('PASS: student/graduate exports, all four 1080×1920 PNGs, revoked/error states, clipboard fallback, mobile layout, unenrolled/signed-out and readiness isolation.\nScreenshots: ' + out);
} finally { await browser.close(); server.close(); }
