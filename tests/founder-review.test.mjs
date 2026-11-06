import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/founder-review/index.js';
import {onRequestPut} from '../functions/api/founder-review/material.js';
import {onRequestPost} from '../functions/api/founder-review/questions.js';
import {onRequestPost as booking} from '../functions/api/founder-review/booking.js';
import {validReviewTime} from '../functions/_lib/founder-review/schedule.mjs';
import {onRequestGet as ownerGet} from '../functions/api/admin/founder-reviews.js';
import {MAX_BYTES,objectPath} from '../functions/_lib/founder-review/access.mjs';
const env={FOUNDER_REVIEW_ENABLED:'true',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only'};
const id='11111111-1111-4111-8111-111111111111';
const reservation={id,status:'reserved',questions:'My service question'};
const credential={credential_id:'AIMT-HS-2026-ABC234',revoked:false,completed_at:'2026-01-01'};
function request(path='',options={}){return new Request('https://aimtrichology.com/api/founder-review'+path,{...options,headers:{Authorization:'Bearer student-token',...options.headers}});}
function setup(t,{graduate=true,recipient=true,entitled=true,dbFail=false,status='reserved',uploadFail=false,owner=false,materials=['blueprint']}={}){
  const calls=[];const original=global.fetch;t.after(()=>global.fetch=original);
  global.fetch=async(url,options={})=>{
    const u=new URL(url);calls.push([u,options]);
    if(u.pathname==='/auth/v1/user')return Response.json({id:'student-1',email:'student@example.com'});
    if(u.pathname==='/rest/v1/course_entitlements')return Response.json(entitled?[{checkout_session_id:'cs_test_x'}]:[]);
    if(u.pathname==='/rest/v1/admin_users')return Response.json(owner?[{role:'owner',active:true}]:[]);
    if(u.pathname==='/rest/v1/founder_review_reservations'){
      if(dbFail)return Response.json({}, {status:500});
      if(u.searchParams.has('user_id'))assert.equal(u.searchParams.get('user_id'),'eq.student-1');
      return Response.json(recipient?[{...reservation,status}]:[]);
    }
    if(u.pathname==='/rest/v1/completions'){
      assert.equal(u.searchParams.get('user_id'),'eq.student-1');assert.equal(u.searchParams.get('revoked'),'eq.false');
      return Response.json(graduate?[credential]:[]);
    }
    if(u.pathname.startsWith('/storage/v1/object/list/'))return Response.json(materials.map(slot=>({name:slot+'.pdf'})));
    if(u.pathname.startsWith('/storage/v1/object/sign/'))return Response.json({signedURL:'/object/sign/founder-review-materials/'+id+'/blueprint.pdf?token=test'});
    if(u.pathname.startsWith('/storage/v1/object/'))return Response.json(uploadFail?{}:{Key:'saved'}, {status:uploadFail?500:200});
    throw Error('Unexpected URL '+url);
  };return calls;
}
test('feature disabled prevents all downstream reads',async t=>{
  const calls=setup(t,{});const r=await onRequestGet({env:{...env,FOUNDER_REVIEW_ENABLED:'false'},request:request()});assert.equal(r.status,404);assert.equal(calls.length,0);
});
test('anonymous and non-entitled users cannot read a reservation',async t=>{
  setup(t,{entitled:false});assert.equal((await onRequestGet({env,request:new Request('https://aimtrichology.com/api/founder-review')})).status,401);
  assert.equal((await onRequestGet({env,request:request()})).status,403);
});
test('non-recipients cannot upload even if certified',async t=>{
  const calls=setup(t,{recipient:false});const r=await onRequestPut({env,request:request('/material?slot=blueprint',{method:'PUT',headers:{'Content-Type':'application/pdf'},body:'%PDF-1.7\n%%EOF'})});assert.equal(r.status,403);assert.ok(!calls.some(([u])=>u.pathname.includes('/storage/')));
});
test('reserved but uncertified student sees no materials and cannot upload',async t=>{
  const calls=setup(t,{graduate:false});const r=await onRequestGet({env,request:request()});assert.equal((await r.json()).certified,false);
  assert.equal((await onRequestPut({env,request:request('/material?slot=blueprint',{method:'PUT'})})).status,403);assert.ok(!calls.some(([u])=>u.pathname.includes('/storage/')));
});
test('DB failure does not grant access',async t=>{setup(t,{dbFail:true});assert.equal((await onRequestGet({env,request:request()})).status,503);});
test('only reserved reviews can change materials',async t=>{setup(t,{status:'scheduled'});assert.equal((await onRequestPut({env,request:request('/material?slot=blueprint',{method:'PUT'})})).status,409);});
test('fixed paths ignore caller identity and reject arbitrary slots',async t=>{
  const calls=setup(t,{});
  const r=await onRequestPut({env,request:request('/material?slot=blueprint&user_id=someone-else',{method:'PUT',headers:{'Content-Type':'application/pdf'},body:'%PDF-1.7\n%%EOF'})});assert.equal(r.status,200);
  const [url,options]=calls.find(([u,o])=>u.pathname.includes('/storage/v1/object/founder-review-materials')&&o.method==='POST');
  assert.equal(url.pathname,'/storage/v1/object/founder-review-materials/'+id+'/blueprint.pdf');assert.equal(options.headers['x-upsert'],'true');
  assert.throws(()=>objectPath(reservation,'../../secret'));
});
test('invalid PDF and too-large bodies cannot reach storage',async t=>{
  const calls=setup(t,{});
  for(const [body,expected] of [['<html>not pdf</html>',400],['%PDF-'+ 'a'.repeat(MAX_BYTES),413]]){
    const r=await onRequestPut({env,request:request('/material?slot=blueprint',{method:'PUT',headers:{'Content-Type':'application/pdf'},body})});assert.equal(r.status,expected);
  }
  assert.ok(!calls.some(([u])=>u.pathname.includes('/storage/')));
});
test('failed upload never reports receipt',async t=>{
  setup(t,{uploadFail:true});const r=await onRequestPut({env,request:request('/material?slot=blueprint',{method:'PUT',headers:{'Content-Type':'application/pdf'},body:'%PDF-1.7\n%%EOF'})});assert.equal(r.status,503);assert.equal((await r.json()).saved,undefined);
});
test('questions are bounded and use the server reservation',async t=>{
  const calls=setup(t,{});const r=await onRequestPost({env,request:request('/questions',{method:'POST',body:JSON.stringify({questions:'What next?',user_id:'other'})})});assert.equal(r.status,200);
  const [u,o]=calls.find(([u,o])=>o.method==='PATCH');assert.equal(u.searchParams.get('id'),'eq.'+id);assert.deepEqual(JSON.parse(o.body),{questions:'What next?'});
  const tooLong=await onRequestPost({env,request:request('/questions',{method:'POST',body:JSON.stringify({questions:'x'.repeat(1001)})})});assert.equal(tooLong.status,400);
});
test('owner-only review API rejects student and returns short-lived links for owner',async t=>{
  setup(t,{});assert.equal((await ownerGet({env,request:request()})).status,403);
});
test('owner links are no-store and expire in 60 seconds',async t=>{
  const calls=setup(t,{owner:true});const r=await ownerGet({env,request:request()});assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
  const [,options]=calls.find(([u])=>u.pathname.includes('/object/sign/'));assert.equal(JSON.parse(options.body).expiresIn,60);
  assert.equal((await r.json()).reviews.length,1);
});

test('booking stays inline and requires an uploaded Blueprint',async t=>{
 setup(t,{});const response=await booking({env,request:request('/booking',{method:'POST'})});assert.equal(response.status,200);const data=await response.json();assert.match(data.url,/^https:\/\/calendar.google.com\/calendar\/appointments\/schedules\//);assert.match(data.url,/gv=true$/);
});
test('review schedule uses Eastern time across daylight saving boundaries',()=>{
 assert.equal(validReviewTime('2026-11-09T09:00:00-05:00'),true);
 assert.equal(validReviewTime('2026-07-06T13:15:00-04:00'),true);
 assert.equal(validReviewTime('2026-11-09T13:30:00-05:00'),false);
 assert.equal(validReviewTime('2026-11-11T09:00:00-05:00'),false);
 assert.equal(validReviewTime('2026-11-09T08:45:00-05:00'),false);
});

test('booking is blocked until the Blueprint is actually received',async t=>{
 setup(t,{materials:[]});assert.equal((await booking({env,request:request('/booking',{method:'POST'})})).status,409);
});
