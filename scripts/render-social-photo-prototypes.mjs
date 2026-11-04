// Owner-review prototypes only. Never loaded by My AIMT; no authentication,
// credential lookup, entitlement, clipboard or download implementation here.
// Uses supplied repository photographs unchanged, and homepage brand sources.
// NODE_PATH=<existing Playwright runtime> node scripts/render-social-photo-prototypes.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(process.env.AIMT_PHOTO_REVIEW_DIR || path.join(root, 'docs/design-review/social-sharing-photo-prototypes'));
await mkdir(output, { recursive: true });
const homepage = await readFile(path.join(root, 'index.html'), 'utf8');
const fonts = homepage.match(/<link href="https:\/\/fonts.googleapis.com\/css2[^>]+>/)[0];
const orbital = homepage.match(/<symbol id="aimtOrbitalMark"[\s\S]*?<\/symbol>/)[0];
const html = `<!doctype html><html><head><meta charset="utf-8">${fonts}
<link rel="stylesheet" href="/assets/css/aimt-design-system.css">
<style>
* { box-sizing:border-box; margin:0; }
body { display:flex; gap:40px; padding:40px; background:#dfdacf; }
.story { flex:none; width:1080px; height:1920px; position:relative; overflow:hidden; color:#fff; background:var(--aimt-color-bg-primary); isolation:isolate; }
.photo, .shade { position:absolute; inset:0; width:100%; height:100%; }
.photo { object-fit:cover; z-index:-3; }
.enrollment .photo { object-position:53% center; }
.graduate .photo { object-position:62% center; }
/* Homepage mobile hero's feathered bottom gradient, adapted to Story copy. */
.enrollment .shade { z-index:-2; background:linear-gradient(to bottom,rgba(0,0,0,.13) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,.08) 43%,rgba(0,0,0,.42) 62%,rgba(0,0,0,.82) 83%,rgba(0,0,0,.9) 100%); }
.graduate .shade { z-index:-2; background:linear-gradient(to bottom,rgba(0,0,0,.12) 0%,rgba(0,0,0,.06) 29%,rgba(0,0,0,.42) 51%,rgba(0,0,0,.82) 78%,rgba(0,0,0,.9) 100%); }
/* Same identity, fonts, weight, tracking, compact leading and shadow as index.html. */
.identity { position:absolute; left:96px; top:265px; display:flex; align-items:center; gap:28px; }
.identity svg { width:82px; height:82px; color:rgba(255,255,255,.88); fill:none; filter:drop-shadow(0 4px 20px rgba(0,0,0,.28)); }
.identity span { font:400 24px/1.4 var(--aimt-font-sans); color:rgba(255,255,255,.84); }
.copy { position:absolute; left:96px; right:96px; text-shadow:0 3px 24px rgba(0,0,0,.42); }
.enrollment .copy { top:1040px; }
.headline { font:700 86px/.96 var(--aimt-font-mont); letter-spacing:-.02em; text-transform:uppercase; }
.support { font:italic 400 40px/1.4 var(--aimt-font-serif); color:rgba(255,255,255,.84); }
.enrollment .support { margin-top:44px; max-width:840px; }
.signal { font:400 23px/1.6 var(--aimt-font-mono); letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.78); }
.enrollment .signal { margin-top:46px; padding-top:27px; border-top:1px solid rgba(255,255,255,.18); }
/* Earned crest only on the graduate review; reuses the site's transparent crest. */
.crest { position:absolute; width:390px; height:auto; left:345px; top:335px; filter:drop-shadow(0 26px 38px rgba(0,0,0,.46)) drop-shadow(0 3px 6px rgba(0,0,0,.3)); }
.graduate .copy { top:855px; text-align:center; }
.graduate .headline { font-size:82px; line-height:1.05; }
.graduate .support { margin-top:35px; font-size:40px; }
.credential { margin-top:76px; padding-top:38px; border-top:1px solid rgba(255,255,255,.18); font-family:var(--aimt-font-sans); }
.name { font-size:48px; font-weight:400; line-height:1.3; }
.date { margin-top:18px; font-size:27px; color:rgba(255,255,255,.72); }
.credential-id { margin-top:17px; font:400 24px/1.5 var(--aimt-font-mono); color:rgba(255,255,255,.78); }
.verify { margin-top:23px; font-size:23px; line-height:1.5; color:rgba(255,255,255,.78); }
.sample { margin-top:38px; font:400 18px/1.5 var(--aimt-font-mono); letter-spacing:.08em; color:rgba(255,255,255,.6); text-transform:uppercase; }
</style></head><body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${orbital}</svg>
<article class="story enrollment" id="enrollment" aria-label="Enrollment prototype">
<img class="photo" src="/assets/images/social-sharing/source/head-spa-halo-rinse.png" alt="Supplied halo-rinse service photograph"><div class="shade"></div>
<div class="identity" data-safe><svg viewBox="0 0 44 44"><use href="#aimtOrbitalMark"></use></svg><span>American Institute of<br>Modern Trichology</span></div>
<div class="copy" data-safe><h1 class="headline">Experience<br>isn't where<br>I stop.</h1>
<p class="support">Continuing my education in scalp science and professional head spa practice.</p>
<p class="signal">Currently pursuing AIMT<br>Head Spa Certification.</p></div>
</article>
<article class="story graduate" id="graduate" aria-label="Graduate prototype with synthetic review credential">
<img class="photo" src="/assets/images/social-sharing/source/dark-lather-macro.png" alt="Supplied lather and hair close-up"><div class="shade"></div>
<img class="crest" data-safe src="/assets/brand/aimt-badge-transparent.png" alt="AIMT earned certification crest">
<div class="copy" data-safe><h1 class="headline">The standard<br>keeps rising.</h1>
<p class="support">AIMT Head Spa Certification — Earned.</p>
<div class="credential"><p class="name">Review Student</p><p class="date">Completed November 1, 2026</p>
<p class="credential-id">AIMT-HS-2026-ABC234</p><p class="verify">aimtrichology.com/verify?id=AIMT-HS-2026-ABC234</p>
<p class="sample">Sample credential · Design review only</p></div></div>
</article></body></html>`;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(path.join(root, 'assets') + '/')) { res.writeHead(404).end(); return; }
  try {
    res.setHeader('Content-Type', ({'.png':'image/png','.css':'text/css','.webp':'image/webp'})[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
let browser;
try {
  browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport:{width:2280,height:2000}, deviceScaleFactor:1 });
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load('700 86px Montserrat'),document.fonts.load('italic 400 40px "Playfair Display"'),document.fonts.load('400 48px Outfit')]);
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(img=>img.decode()));
  });
  const evidence = await page.evaluate(() => Array.from(document.querySelectorAll('.story')).map(story=> {
    const rect=story.getBoundingClientRect();
    return { prototype:story.id,width:rect.width,height:rect.height,photo:story.querySelector('.photo').getAttribute('src'),headline:story.querySelector('h1').innerText,copy:story.innerText,bounds:Array.from(story.querySelectorAll('[data-safe]')).map(el=> {const b=el.getBoundingClientRect();return {left:b.left-rect.left,right:b.right-rect.left,top:b.top-rect.top,bottom:b.bottom-rect.top};}) };
  }));
  assert.deepEqual(errors,[]);
  for (const item of evidence) {
    assert.equal(item.width,1080); assert.equal(item.height,1920);
    for (const b of item.bounds) assert.ok(b.left>=90 && b.right<=990 && b.top>=250 && b.bottom<=1720,JSON.stringify(b));
    const dest=path.join(output,item.prototype+'-prototype.png');
    await page.locator('#'+item.prototype).screenshot({path:dest});
    const png=await readFile(dest); assert.equal(png.readUInt32BE(16),1080); assert.equal(png.readUInt32BE(20),1920);
    item.pngSha256=createHash('sha256').update(png).digest('hex');
    item.photoSha256=createHash('sha256').update(await readFile(path.join(root,item.photo))).digest('hex');
  }
  assert.match(evidence[0].copy,/Currently pursuing AIMT/i);
  assert.doesNotMatch(evidence[0].copy,/Earned|certified/i);
  assert.match(evidence[1].copy,/Sample credential · Design review only/i);
  await writeFile(path.join(output,'render-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS: 2 full-resolution PNG prototypes; actual supplied photographs loaded; homepage fonts loaded; safe margins, training/earned copy and synthetic-credential label checked; no page errors.\nOutput: '+output);
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
