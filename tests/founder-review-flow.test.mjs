import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localReviewServices} from './support/founder-review-local-service.mjs';
import {onRequestPost as checkout} from '../functions/api/create-checkout-session.js';
import {onRequestPost as webhook} from '../functions/api/stripe-webhook.js';
import {onRequestPost as claim} from '../functions/api/claim-course-access.js';
import {onRequestGet as status} from '../functions/api/founder-review/index.js';
import {onRequestPut as upload} from '../functions/api/founder-review/material.js';
import {onRequestPost as questions} from '../functions/api/founder-review/questions.js';
import {onRequestPost as booking} from '../functions/api/founder-review/booking.js';
import {onRequestGet as ownerList,onRequestPost as ownerUpdate} from '../functions/api/admin/founder-reviews.js';
import {onRequestPost as cleanup} from '../functions/api/founder-review/cleanup.js';
import {onRequestGet as offer} from '../functions/api/founder-review/offer.js';
import {maintenanceSignature} from '../functions/_lib/founder-review/maintenance-auth.mjs';
const modulePath=process.env.PGLITE_MODULE;
test('integrated handlers + PostgreSQL: purchase → claim → certify → upload → booking → owner confirmation → completion → retention cleanup',{skip:!modulePath},async t=>{
 const {PGlite}=await import(modulePath);const db=new PGlite();const original=global.fetch;t.after(()=>global.fetch=original);
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);
   create table public.course_entitlements(checkout_session_id text primary key,course_slug text,purchaser_email text,user_id uuid);
   create table public.completions(user_id uuid,course_slug text,credential_id text,revoked boolean,completed_at timestamptz);
   create table public.admin_users(user_id uuid,role text,active boolean);
   create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261105133743_founder_review_offer.sql',import.meta.url),'utf8'));
  await db.exec("update founder_review_campaign set active=true,activated_at=now()");
  const service=await localReviewServices(db),{env}=service;global.fetch=service.fetch;
  const ids=Array.from({length:7},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
  for(let i=0;i<ids.length;i++){await db.query('insert into auth.users values($1)',[ids[i]]);service.users.set('Bearer token-'+i,{id:ids[i],email:`student${i}@example.invalid`,email_confirmed_at:'2026-01-01'});}
  await db.query("insert into admin_users values($1,'owner',true)",[ids[6]]);
  const request=(path,actor,method='GET',body,contentType='application/json')=>new Request('https://aimtrichology.com'+path,{method,headers:{Authorization:'Bearer token-'+actor,'Content-Type':contentType},body});
  const call=(handler,req)=>handler({env,request:req});
  async function event(type,session){
   const body=JSON.stringify({type,data:{object:session}}),timestamp=Math.floor(Date.now()/1000),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body))),sig=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   return call(webhook,new Request('https://aimtrichology.com/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':`t=${timestamp},v1=${sig}`},body}));
  }
  // Six checkouts together: five real SQL reservations, sixth still buys the course without a bonus.
  assert.equal((await (await offer({env})).json()).remaining,5);
  const starts=await Promise.all(Array.from({length:6},(_,i)=>call(checkout,request('/api/create-checkout-session',i,'POST',JSON.stringify({ui:'embedded',checkoutRequestKey:ids[i]})))));
  const startsData=await Promise.all(starts.map(async r=>{assert.equal(r.status,200);return r.json();}));
  assert.equal(startsData.filter(r=>r.founderReview).length,5);
  assert.equal((await (await offer({env})).json()).remaining,0);
  // Concurrent allocation does not guarantee actor 0 receives a bonus hold.
  const retryActor=startsData.findIndex(d=>d.founderReview);assert.ok(retryActor>=0);
  const retry=await call(checkout,request('/api/create-checkout-session',retryActor,'POST',JSON.stringify({ui:'embedded',checkoutRequestKey:ids[retryActor]})));assert.equal((await retry.json()).clientSecret,startsData[retryActor].clientSecret);assert.equal(service.sessions.size,6);
  const sessions=startsData.map(d=>service.sessions.get(d.clientSecret.split('_secret_')[0]));
  assert.match(sessions.find(s=>!s.metadata.founder_review_hold).customText,/does not include/);
  // A completed but pending payment must grant neither access nor its bonus.
  const first=sessions.find(s=>s.metadata.founder_review_hold);first.status='complete';first.customer_email='student0@example.invalid';
  assert.equal((await event('checkout.session.completed',first)).status,200);
  assert.equal((await db.query('select count(*)::int as n from course_entitlements')).rows[0].n,0);
  first.payment_status='paid';assert.equal((await event('checkout.session.async_payment_succeeded',first)).status,200);
  assert.equal((await event('checkout.session.completed',first)).status,200);
  assert.equal(service.emails.filter(m=>m.to.includes(first.customer_email)).length,1);
  assert.match(service.emails[0].text,/YOUR FOUNDER REVIEW IS RESERVED/);
  // Wrong account cannot claim the purchase. The real purchaser can.
  assert.notEqual((await call(claim,request('/api/claim-course-access',1,'POST',JSON.stringify({sessionId:first.id})))).status,200);
  assert.equal((await call(claim,request('/api/claim-course-access',0,'POST',JSON.stringify({sessionId:first.id})))).status,200);
  let data=await (await call(status,request('/api/founder-review',0))).json();assert.equal(data.certified,false);
  const pdf='%PDF-1.7\nAIMT test service plan\n%%EOF';
  assert.equal((await call(upload,request('/api/founder-review/material?slot=blueprint',0,'PUT',pdf,'application/pdf'))).status,403);
  await db.query("insert into completions values($1,'headspa-mastery','AIMT-HS-2026-ABC234',false,now())",[ids[0]]);
  assert.equal((await call(booking,request('/api/founder-review/booking',0,'POST'))).status,409);
  assert.equal((await call(upload,request('/api/founder-review/material?slot=blueprint',0,'PUT',pdf,'application/pdf'))).status,200);
  assert.equal(service.files.size,1);
  assert.equal((await call(questions,request('/api/founder-review/questions',0,'POST',JSON.stringify({questions:'Help me plan my first service.'})))).status,200);
  const book=await call(booking,request('/api/founder-review/booking',0,'POST'));assert.equal(book.status,200);assert.match((await book.json()).url,/calendar.google.com/);
  data=await (await call(status,request('/api/founder-review',0))).json();assert.equal(data.status,'reserved');assert.deepEqual(data.materials,['blueprint']);
  assert.equal((await call(ownerList,request('/api/admin/founder-reviews',0))).status,403);
  const list=await (await call(ownerList,request('/api/admin/founder-reviews',6))).json();assert.equal(list.reviews.length,1);const id=list.reviews[0].id;
  assert.match(list.reviews[0].materials[0].url,/object\/sign/);
  const owner=(action,extra={})=>call(ownerUpdate,request('/api/admin/founder-reviews',6,'POST',JSON.stringify({id,action,...extra})));
  // Google confirmation is simulated here; no real calendar event is created.
  assert.equal((await owner('confirm',{appointmentAt:'2026-11-09T09:00:00-05:00',googleEventId:'simulated-google-booking'})).status,200);
  assert.equal((await call(booking,request('/api/founder-review/booking',0,'POST'))).status,409);
  assert.equal((await owner('clear_booking')).status,200);
  assert.equal((await call(booking,request('/api/founder-review/booking',0,'POST'))).status,200);
  assert.equal((await owner('confirm',{appointmentAt:'2026-11-10T09:00:00-05:00',googleEventId:'simulated-google-booking-2'})).status,200);
  assert.equal((await owner('reschedule',{appointmentAt:'2026-11-10T10:00:00-05:00',googleEventId:'simulated-google-booking-2'})).status,200);
  assert.equal((await owner('complete')).status,200);
  async function runCleanup(dryRun){const body=JSON.stringify({dryRun}),stamp=String(Math.floor(Date.now()/1000));return call(cleanup,new Request('https://aimtrichology.com/api/founder-review/cleanup',{method:'POST',headers:{'x-aimt-timestamp':stamp,'x-aimt-signature':await maintenanceSignature(env.SUPABASE_SERVICE_ROLE_KEY,stamp,body)},body}));}
  assert.equal((await (await runCleanup(true)).json()).due,0);assert.equal(service.files.size,1);
  await db.query("update founder_review_reservations set materials_delete_after=now()-interval '1 day' where id=$1",[id]);
  assert.equal((await (await runCleanup(true)).json()).due,1);assert.equal(service.files.size,1);
  assert.equal((await (await runCleanup(false)).json()).deleted,1);assert.equal(service.files.size,0);
  assert.equal((await db.query('select questions from founder_review_reservations where id=$1',[id])).rows[0].questions,'');
  // Fill the other four paid reservations. The sixth paid buyer never receives one.
  for(let i=1;i<sessions.length;i++){sessions[i].status='complete';sessions[i].payment_status='paid';sessions[i].customer_email=`student${i}@example.invalid`;assert.equal((await event('checkout.session.completed',sessions[i])).status,200);}
  assert.equal((await db.query("select count(*)::int as n from founder_review_reservations where status<>'held'")).rows[0].n,5);
  const sixth=sessions.find(s=>!s.metadata.founder_review_hold),sixthIndex=sessions.indexOf(sixth);
  assert.equal((await call(claim,request('/api/claim-course-access',sixthIndex,'POST',JSON.stringify({sessionId:sixth.id})))).status,200);
  assert.equal((await call(status,request('/api/founder-review',sixthIndex))).status,403);
  const second=(await db.query("select id from founder_review_reservations where status='reserved' limit 1")).rows[0];
  assert.equal((await call(ownerUpdate,request('/api/admin/founder-reviews',6,'POST',JSON.stringify({id:second.id,action:'cancel_refunded_bonus',refundVerified:true})))).status,200);
  assert.equal((await (await offer({env})).json()).remaining,0);
  assert.equal((await db.query('select count(*)::int as n from founder_review_reservations')).rows[0].n,5);
 }finally{await db.close();}
});
