import test from 'node:test';
import assert from 'node:assert/strict';
import {maintenanceSignature,verifyMaintenance} from '../functions/_lib/founder-review/maintenance-auth.mjs';
import {onRequestPost as cleanup} from '../functions/api/founder-review/cleanup.js';
import {onRequestGet as offer} from '../functions/api/founder-review/offer.js';
const secret='test-only-signing-secret',stamp=()=>String(Math.floor(Date.now()/1000));
test('cleanup signature binds timestamp and exact dry-run body',async()=>{
 const time=stamp(),body='{"dryRun":true}',sig=await maintenanceSignature(secret,time,body);
 assert.equal(await verifyMaintenance(secret,time,body,sig),true);
 assert.equal(await verifyMaintenance(secret,time,'{"dryRun":false}',sig),false);
 assert.equal(await verifyMaintenance(secret,String(Number(time)-301),body,sig),false);
 assert.equal(await verifyMaintenance('other',time,body,sig),false);
});
test('unsigned cleanup cannot read or delete anything',async t=>{
 const original=global.fetch;global.fetch=()=>{throw Error('No downstream reads allowed');};t.after(()=>global.fetch=original);
 const r=await cleanup({env:{SUPABASE_SERVICE_ROLE_KEY:secret},request:new Request('https://aimtrichology.com/api/founder-review/cleanup',{method:'POST',body:'{"dryRun":false}'})});assert.equal(r.status,401);
});
test('oversized maintenance body is bounded before parsing',async()=>{
 const r=await cleanup({env:{},request:new Request('https://aimtrichology.com/api/founder-review/cleanup',{method:'POST',body:'x'.repeat(513)})});assert.equal(r.status,413);
});
test('inactive offer makes no database request and returns no marketing promise',async t=>{
 const original=global.fetch;global.fetch=()=>{throw Error('Unexpected database call');};t.after(()=>global.fetch=original);
 assert.deepEqual(await (await offer({env:{}})).json(),{active:false});
});
test('unavailable campaign data hides the offer',async t=>{
 const original=global.fetch;global.fetch=async()=>Response.json({error:'offline'},{status:500});t.after(()=>global.fetch=original);
 assert.deepEqual(await (await offer({env:{FOUNDER_REVIEW_SALES_ENABLED:'true',SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:secret}})).json(),{active:false});
});
