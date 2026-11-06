import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const modulePath=process.env.PGLITE_MODULE;
test('real PostgreSQL: inactive campaign, five-slot cap, replay, ownership, release and RLS',{skip:!modulePath},async()=>{
 const {PGlite}=await import(modulePath);const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;create table auth.users(id uuid primary key);
   create table public.course_entitlements(checkout_session_id text primary key,course_slug text,purchaser_email text,user_id uuid);
   create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261105133743_founder_review_offer.sql',import.meta.url),'utf8'));
  const ids=Array.from({length:6},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
  assert.equal((await db.query('select * from founder_review_hold($1)',[ids[0]])).rows.length,0);
  await db.exec("update founder_review_campaign set active=true,activated_at=now()");
  const results=await Promise.all(ids.map(id=>db.query('select * from founder_review_hold($1)',[id])));
  assert.equal(results.reduce((n,r)=>n+r.rows.length,0),5);
  assert.equal((await db.query('select * from founder_review_hold($1)',[ids[0]])).rows.length,1);
  assert.equal((await db.query('select count(*)::int as n from founder_review_reservations')).rows[0].n,5);
  await db.query('select founder_review_bind($1,$2)',[ids[0],'cs_test_one']);
  await db.query('insert into course_entitlements values($1,$2,$3,null)',['cs_test_one','headspa-mastery','student@example.com']);
  assert.equal((await db.query('select founder_review_paid($1,$2,$3) as ok',[ids[0],'cs_test_one','student@example.com'])).rows[0].ok,true);
  assert.equal((await db.query('select founder_review_paid($1,$2,$3) as ok',[ids[0],'cs_test_one','student@example.com'])).rows[0].ok,true);
  assert.equal((await db.query('select founder_review_release($1,$2) as ok',[ids[0],'cs_test_one'])).rows[0].ok,false);
  await assert.rejects(db.query('select founder_review_paid($1,$2,$3)',[ids[0],'cs_test_one','attacker@example.com']));
  const user='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users values($1)',[user]);
  await db.query('select founder_review_link($1,$2)',[user,'student@example.com']);
  assert.equal((await db.query('select user_id from founder_review_reservations where id=$1',[ids[0]])).rows[0].user_id,user);
  // The remaining hold can be recycled only by the service after verified expiration.
  assert.equal((await db.query('select founder_review_release($1,$2) as ok',[ids[1],'cs_test_expired'])).rows[0].ok,true);
  assert.equal((await db.query('select * from founder_review_hold($1)',[ids[5]])).rows.length,1);
  await db.query("update founder_review_reservations set status='scheduled',appointment_at=$2,appointment_ends_at=$3 where id=$1",[ids[0],'2026-11-09T14:00:00Z','2026-11-09T14:45:00Z']);
  await db.query('insert into course_entitlements values($1,$2,$3,null)',['cs_test_two','headspa-mastery','second@example.com']);
  await db.query('select founder_review_paid($1,$2,$3)',[ids[2],'cs_test_two','second@example.com']);
  await assert.rejects(db.query("update founder_review_reservations set status='scheduled',appointment_at=$2,appointment_ends_at=$3 where id=$1",[ids[2],'2026-11-09T14:15:00Z','2026-11-09T15:00:00Z']));
  await db.query("update founder_review_reservations set status='cancelled' where id=$1",[ids[2]]);
  assert.equal((await db.query('select * from founder_review_hold($1)',[ids[1]])).rows.length,0);
  await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from founder_review_reservations'));
  await assert.rejects(db.query('select * from founder_review_hold($1)',[ids[1]]));
  await db.exec('reset role');
  assert.equal((await db.query('select public from storage.buckets')).rows[0].public,false);
 }finally{await db.close();}
});
