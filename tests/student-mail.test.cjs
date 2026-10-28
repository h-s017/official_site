const {test}=require('node:test'),assert=require('node:assert/strict');
test('mail templates use fixed destinations and no private application details',async()=>{
 const {notificationMail}=await import('../supabase/functions/student-notifications/mail.mjs');
 const admin=notificationMail({kind:'application_received',recipient:'hanasscent@gmail.com',full_name:'<script>bad</script>',phone:'0912345678'});
 assert.match(admin.text,/https:\/\/hanascent.com\/admin\/students\//);
 assert.doesNotMatch(admin.text,/<script>|0912345678/);assert.equal(admin.html,undefined);
 assert.throws(()=>notificationMail({kind:'application_received',recipient:'other@example.invalid'}),/invalid_admin/);
 assert.match(notificationMail({kind:'application_approved',recipient:'student@example.invalid'}).text,/https:\/\/hanascent.com\/student-tools\//);
});
test('worker authenticates before claiming and uses provider idempotency',async()=>{
 const {createHandler}=await import('../supabase/functions/student-notifications/mail.mjs');
 const calls=[];let authorized=false,configured=false;
 const job={id:'event-1',lease_token:'lease-1',kind:'application_received',recipient:'hanasscent@gmail.com'};
 const handler=createHandler(name=>({SUPABASE_URL:'https://project.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-server-key',RESEND_API_KEY:configured?'test-mail-key':undefined})[name],async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('student_notification_worker_authorized'))return Response.json(authorized);
  if(url.endsWith('claim_student_notifications'))return Response.json([job]);
  if(url==='https://api.resend.com/emails'){assert.equal(options.headers['Idempotency-Key'],'hana-student/event-1');return Response.json({id:'provider-1'});}
  if(url.endsWith('finish_student_notification')){const data=JSON.parse(options.body);assert.equal(data.p_sent,true);assert.equal(data.p_provider_id,'provider-1');return Response.json(true);}
  throw new Error('unexpected request');
 });
 assert.equal((await handler(new Request('https://worker.invalid',{method:'POST'}))).status,401);assert.equal(calls.length,0);
 const req=()=>new Request('https://worker.invalid',{method:'POST',headers:{'x-notification-token':'test-token'}});
 assert.equal((await handler(req())).status,401);assert.equal(calls.length,1);
 authorized=true;assert.equal((await handler(req())).status,503);assert.equal(calls.some(x=>x.url.endsWith('claim_student_notifications')),false);
 configured=true;assert.deepEqual(await (await handler(req())).json(),{sent:1,failed:0});
});
test('provider failure is recorded for retry without leaking provider body',async()=>{
 const {createHandler}=await import('../supabase/functions/student-notifications/mail.mjs');let finished;
 const handler=createHandler(name=>({SUPABASE_URL:'https://project.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test',RESEND_API_KEY:'test'})[name],async(url,options)=>{
  if(url.endsWith('student_notification_worker_authorized'))return Response.json(true);
  if(url.endsWith('claim_student_notifications'))return Response.json([{id:'event',lease_token:'lease',kind:'application_approved',recipient:'student@example.invalid'}]);
  if(url==='https://api.resend.com/emails')return new Response('private provider body',{status:429});
  finished=JSON.parse(options.body);return Response.json(true);
 });
 assert.deepEqual(await (await handler(new Request('https://worker.invalid',{method:'POST',headers:{'x-notification-token':'test-token'}}))).json(),{sent:0,failed:1});
 assert.equal(finished.p_sent,false);assert.equal(finished.p_error,'resend_429');
});
