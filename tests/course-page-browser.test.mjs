import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
test('course public desktop/mobile and isolated student entry browser checks', { skip: !process.env.AIMT_COURSE_BROWSER_URL || !process.env.PLAYWRIGHT_MODULE }, async () => {
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({headless:true});
try {
const context = await browser.newContext();
await context.route('**/*', route => new URL(route.request().url()).hostname === new URL(process.env.AIMT_COURSE_BROWSER_URL).hostname ? route.continue() : route.abort());
const page = await context.newPage();
const errors=[];page.on('pageerror', e=>errors.push(e.message));
for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});
 await page.goto(process.env.AIMT_COURSE_BROWSER_URL + '/head-spa-certification?review=1');
 await page.locator('#lpEconCard').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#lpEconYear').innerText(),'—');
 await page.locator('#lpEconPrice').fill('150');await page.locator('#lpEconClients').fill('2');await page.locator('#lpEconDays').fill('3');
 assert.equal(await page.locator('#lpEconYear').innerText(),'$43,200');
 await page.locator('#lpEconDays').fill('');assert.equal(await page.locator('#lpEconYear').innerText(),'—');
 assert.equal(await page.locator('#lessonView').count(),0);
 assert.equal(await page.locator('#reviewModeBanner').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.lp-band-econ')).opacity==='1');
 if(process.env.AIMT_COURSE_SCREENSHOT_DIR) await page.screenshot({path:process.env.AIMT_COURSE_SCREENSHOT_DIR + `/aimt-cleanup-${width}.png`});
 console.log('public browser PASS',width);
}
assert.deepEqual(errors,[]);
// Browser-level exercise of bearer retrieval, session handoff, payment-claim
// recovery and document script execution with isolated, non-live fixtures.
const student = await browser.newContext();
let reads=0,claims=0;
await student.route('**/*',async route=>{
 const r=route.request(),u=new URL(r.url());
 if(u.hostname!==new URL(process.env.AIMT_COURSE_BROWSER_URL).hostname){
  if(u.href.includes('@supabase/supabase-js')) return route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient:()=>{const user={id:'fixture-user',email:'student@example.invalid',user_metadata:{first_name:'Test',headspa_intro_complete:true}};return {auth:{getSession:async()=>({data:{session:{access_token:'fixture-token',user}}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),stopAutoRefresh(){}},from:(table)=>{const result={data:table==='course_entitlements'?[{checkout_session_id:'fixture-paid'}]:[],error:null};const chain=new Proxy({}, {get:(_,key)=>key==='then'?(resolve)=>Promise.resolve(result).then(resolve):()=>chain});return chain;}}}};`});
  return route.abort();
 }
 if(u.pathname==='/head-spa-certification' && r.headers().authorization){
  assert.equal(r.headers().authorization,'Bearer fixture-token');reads++;
  if(reads===1)return route.fulfill({status:403,body:'Course enrollment required.'});
  return route.fulfill({contentType:'text/html',body:readFileSync(new URL('../headspa-mastery.html',import.meta.url),'utf8')});
 }
 if(u.pathname==='/api/claim-course-access'){claims++;assert.equal(r.postDataJSON().sessionId,'fixture-paid-session');return route.fulfill({body:'{}'});}
 return route.continue();
});
await student.addInitScript(()=>{localStorage.setItem('aimt_headspa_pending_checkout_session','fixture-paid-session');sessionStorage.setItem('aimt_headspa_access_flow_handoff',JSON.stringify({issuedAt:Date.now()}));});
const sp=await student.newPage();
await sp.goto(process.env.AIMT_COURSE_BROWSER_URL + '/head-spa-certification?enter=1');
// A new student must still pass through the existing orientation screen.
await sp.locator('#howAimtWorksView.active').waitFor({timeout:10000});
assert.equal(await sp.locator('#howAimtWorksView.active').isVisible(),true);assert.equal(reads,2);assert.equal(claims,1);assert.equal(new URL(sp.url()).pathname,'/head-spa-certification');
console.log('student browser fixture PASS: bearer retrieval, pending recovery, full course app entry');
} finally { await browser.close(); }

});
