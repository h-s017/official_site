const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('notification outbox permissions, leases and status changes',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create schema shop_private;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create table shop_private.student_applications(user_id uuid primary key references auth.users(id),application_email text,full_name text,status text,revision bigint);
 grant usage on schema shop_private to authenticated;`);
 await db.exec(fs.readFileSync('supabase/student-notifications.sql','utf8'));
 const uid='10000000-0000-4000-8000-000000000001';
 await db.query("insert into auth.users values($1,'student@example.invalid',now())",[uid]);
 await db.query("insert into shop_private.student_applications values($1,'student@example.invalid','測試學員','pending',1)",[uid]);
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  await assert.rejects(db.query('select public.claim_student_notifications()'),/permission/);
  await assert.rejects(db.query('select * from shop_private.student_notifications'),/permission/);
  await db.exec('reset role');
 }
 const claim=async()=>{await db.exec('set role service_role');const r=(await db.query('select public.claim_student_notifications() jobs')).rows[0].jobs;await db.exec('reset role');return r;};
 const finish=async(job,lease,sent)=>{await db.exec('set role service_role');const r=(await db.query('select public.finish_student_notification($1,$2,$3,$4,$5) ok',[job.id,lease,sent,'provider-test','temporary_failure'])).rows[0].ok;await db.exec('reset role');return r;};
 let jobs=await claim();assert.equal(jobs.length,1);assert.equal(jobs[0].recipient,'hanasscent@gmail.com');assert.equal(jobs[0].kind,'application_received');
 assert.deepEqual(await claim(),[]); // Active lease cannot be claimed twice.
 assert.equal(await finish(jobs[0],'00000000-0000-4000-8000-000000000000',true),false);
 assert.equal(await finish(jobs[0],jobs[0].lease_token,false),true);
 assert.deepEqual(await claim(),[]); // Backoff is enforced.
 await db.exec("update shop_private.student_notifications set available_at=now()-interval '1 minute'");
 jobs=await claim();assert.equal(jobs.length,1);assert.equal(await finish(jobs[0],jobs[0].lease_token,true),true);
 assert.deepEqual(await claim(),[]);
 await db.query("update shop_private.student_applications set status='approved',revision=2 where user_id=$1",[uid]);
 jobs=await claim();assert.equal(jobs[0].recipient,'student@example.invalid');assert.equal(jobs[0].kind,'application_approved');
 await db.query("update shop_private.student_applications set status='suspended',revision=3 where user_id=$1",[uid]);
 assert.deepEqual(await claim(),[]); // Withdrawn qualification cancels unsent approval.
 assert.equal(await finish(jobs[0],jobs[0].lease_token,true),false);
 await db.query("update shop_private.student_applications set status='pending',revision=4 where user_id=$1",[uid]);
 await db.query("update shop_private.student_applications set status='pending' where user_id=$1",[uid]);
 jobs=await claim();assert.equal(jobs.length,1); // Same revision never duplicates.
 await db.exec("update shop_private.student_notifications set leased_at=now()-interval '16 minutes',attempts=5 where status='sending'");
 assert.deepEqual(await claim(),[]);
 assert.equal((await db.query("select count(*)::int n from shop_private.student_notifications where status='failed'")).rows[0].n,1);
 } finally {await db.close();}
});
