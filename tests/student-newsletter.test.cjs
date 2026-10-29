const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('registration newsletter enrolment uses verified consent and supports private opt-out',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema shop_private;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 grant usage on schema auth,shop_private to authenticated;
 create table shop_private.student_applications(user_id uuid primary key references auth.users(id),application_email text,full_name text,consent_at timestamptz default now());
 create table public.email_subscribers(id uuid default gen_random_uuid() primary key,name text not null,email text not null,interests text[] not null default '{}',source text,path text,consent_at timestamptz default now());
 create unique index email_subscribers_email_unique on public.email_subscribers(lower(btrim(email)));
 alter table public.email_subscribers enable row level security;`);
 await db.exec(fs.readFileSync('supabase/student-newsletter.sql','utf8'));
 const A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002',C='10000000-0000-4000-8000-000000000003';
 const consent={student_application:{newsletter_consent_version:'2026-10-29',email:'forged@example.invalid'}};
 const count=async()=>Number((await db.query('select count(*) n from public.email_subscribers')).rows[0].n);
 await db.query("insert into auth.users values($1,'actual@example.invalid',null,$2)",[A,consent]);
 await db.query("insert into shop_private.student_applications(user_id,application_email,full_name) values($1,'actual@example.invalid','已同意學員')",[A]);
 assert.equal(await count(),0); // Signup alone cannot subscribe an unverified address.
 await db.query('update auth.users set email_confirmed_at=now() where id=$1',[A]);
 assert.equal(await count(),1);
 const subscriber=(await db.query('select * from public.email_subscribers')).rows[0];
 assert.equal(subscriber.email,'actual@example.invalid');assert.equal(subscriber.source,'student-registration');
 await db.query("insert into auth.users values($1,'legacy@example.invalid',now(),'{}')",[B]);
 await db.query("insert into shop_private.student_applications(user_id,application_email,full_name) values($1,'legacy@example.invalid','舊版申請')",[B]);
 assert.equal(await count(),1); // Existing/old-form consent does not authorize marketing.
 await db.query("insert into public.email_subscribers(name,email) values('原訂閱姓名','existing@example.invalid')");
 await db.query("insert into auth.users values($1,'existing@example.invalid',now(),$2)",[C,consent]);
 await db.query("insert into shop_private.student_applications(user_id,application_email,full_name) values($1,'existing@example.invalid','新的姓名')",[C]);
 assert.equal(await count(),2);
 assert.equal((await db.query("select name from public.email_subscribers where email='existing@example.invalid'")).rows[0].name,'原訂閱姓名');
 await db.exec('set role anon');await assert.rejects(db.query('select public.student_newsletter_status()'),/permission/);await db.exec('reset role');
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:A})]);await db.exec('set role authenticated');
 assert.equal((await db.query('select public.student_newsletter_status() subscribed')).rows[0].subscribed,true);
 await assert.rejects(db.query('select * from shop_private.student_newsletter_preferences'),/permission/);
 await assert.rejects(db.query('select shop_private.enroll_student_newsletter($1)',[C]),/permission/);
 await db.query('select public.student_newsletter_unsubscribe()');
 assert.equal((await db.query('select public.student_newsletter_status() subscribed')).rows[0].subscribed,false);
 await db.exec('reset role');assert.equal(await count(),1); // Opt-out affects only the caller.
 await db.query('select shop_private.enroll_student_newsletter($1)',[A]);assert.equal(await count(),1); // Never auto-resubscribe.
 await db.query("insert into auth.users values('10000000-0000-4000-8000-000000000004','unverified@example.invalid',null,'{}')");
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:'10000000-0000-4000-8000-000000000004'})]);await db.exec('set role authenticated');
 await assert.rejects(db.query('select public.student_newsletter_unsubscribe()'),/Verified login/);
 } finally {await db.close();}
});
