import test from 'node:test';
import assert from 'node:assert/strict';
import {holdReview,applyHold,bindHold,fulfillReview,releaseExpiredReview} from '../functions/_lib/founder-review/purchase.mjs';
import {onRequestPost as checkout} from '../functions/api/create-checkout-session.js';
import {onRequestPost as webhook} from '../functions/api/stripe-webhook.js';
const id='11111111-1111-4111-8111-111111111111';
const env={FOUNDER_REVIEW_SALES_ENABLED:'true',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'server-key',STRIPE_SECRET_KEY:'sk_test_fake',STRIPE_PRICE_ID:'price_course',STRIPE_PUBLISHABLE_KEY:'pk_test_fake',STRIPE_WEBHOOK_SECRET:'whsec_fake'};
const hold={id,created_at:new Date().toISOString()};
function mock(t,fn){const original=global.fetch;global.fetch=fn;t.after(()=>global.fetch=original);}
test('disabled sales never touch the reservation DB',async t=>{mock(t,()=>{throw Error('Unexpected request');});assert.equal(await holdReview({}),null);});
test('checkout terms identify inclusion and real session expiration',()=>{
 const params={};applyHold(params,hold,true);assert.equal(params['metadata[founder_review_hold]'],id);assert.equal(Number(params.expires_at),Math.floor(Date.parse(hold.created_at)/1000)+2100);assert.match(params['custom_text[submit][message]'],/one private 45-minute/);
 const full={};applyHold(full,null,true);assert.match(full['custom_text[submit][message]'],/does not include/);
});
test('payment fulfillment ignores browser claims/unpaid sessions and honors promises after sales pause',async t=>{
 const calls=[];mock(t,async(url,options)=>{calls.push([url,JSON.parse(options.body)]);return Response.json(true);});
 assert.equal(await fulfillReview(env,{id:'cs_test_1',payment_status:'unpaid',metadata:{founder_review_hold:id}}),false);assert.equal(calls.length,0);
 assert.equal(await fulfillReview({...env,FOUNDER_REVIEW_SALES_ENABLED:'false'},{id:'cs_test_1',payment_status:'paid',customer_email:'Student@example.com',metadata:{founder_review_hold:id}}),true);
 assert.deepEqual(calls[0][1],{p_id:id,p_session:'cs_test_1',p_email:'student@example.com'});
});
test('only actual expired unpaid sessions can release a hold',async t=>{
 let calls=0;mock(t,async()=>{calls++;return Response.json(true);});
 for(const status of ['open','complete'])assert.equal(await releaseExpiredReview(env,{status,payment_status:'unpaid',metadata:{founder_review_hold:id}}),false);
 assert.equal(await releaseExpiredReview(env,{status:'expired',payment_status:'paid',metadata:{founder_review_hold:id}}),false);
 assert.equal(calls,0);assert.equal(await releaseExpiredReview(env,{id:'cs_test_old',status:'expired',payment_status:'unpaid',metadata:{founder_review_hold:id}}),true);assert.equal(calls,1);
});
test('actual checkout withholds the client secret if DB binding fails',async t=>{
 mock(t,async(url,options={})=>{
  if(url.includes('rpc/founder_review_hold'))return Response.json([hold]);
  if(url.includes('rpc/founder_review_bind'))return Response.json(false);
  if(url==='https://api.stripe.com/v1/checkout/sessions'){
   const params=new URLSearchParams(options.body);assert.equal(params.get('metadata[founder_review_hold]'),id);
   return Response.json({id:'cs_test_1',client_secret:'cs_test_1_secret_hidden'});
  }
  return Response.json([]);
 });
 const response=await checkout({env,request:new Request('https://aimtrichology.com/api/create-checkout-session',{method:'POST',body:JSON.stringify({ui:'embedded'})})});
 assert.equal(response.status,500);assert.equal((await response.json()).clientSecret,undefined);
});
async function signedEvent(event){
 const payload=JSON.stringify(event),timestamp=Math.floor(Date.now()/1000);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+payload)));
 const signature=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return new Request('https://aimtrichology.com/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':`t=${timestamp},v1=${signature}`},body:payload});
}
for(const type of ['checkout.session.completed','checkout.session.async_payment_succeeded'])test('signature-verified '+type+' reserves bonus after course entitlement',async t=>{
 const order=[];mock(t,async(url,options={})=>{
  if(url.includes('/line_items'))return Response.json({data:[{price:{id:'price_course'}}]});
  if(url.includes('/rest/v1/course_entitlements')){order.push('entitlement');return Response.json([]);}
  if(url.includes('/rpc/founder_review_paid')){order.push('bonus');return Response.json(true);}
  return Response.json([]);
 });
 const response=await webhook({env,request:await signedEvent({type,data:{object:{id:'cs_test_1',payment_status:'paid',status:'complete',customer_email:'student@example.com',metadata:{founder_review_hold:id}}}})});
 assert.equal(response.status,200);assert.deepEqual(order,['entitlement','bonus']);
});
