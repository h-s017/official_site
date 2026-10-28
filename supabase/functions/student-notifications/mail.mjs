export function notificationMail(job) {
 const admin=job.kind==='application_received';
 if(!admin&&job.kind!=='application_approved')throw new Error('invalid_kind');
 if(admin&&job.recipient!=='hanasscent@gmail.com')throw new Error('invalid_admin_recipient');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.recipient))throw new Error('invalid_recipient');
 // Plain text, no user-controlled HTML, links, subject or routing.
 return {
  from:'HANA 氣味練習曲 <students@auth.hanascent.com>',
  to:[job.recipient],reply_to:'hanasscent@gmail.com',
  subject:admin?'HANA｜有新的學員資格申請':'HANA｜學員資格審核已通過',
  text:admin?
   'HANA 收到新的學員資格申請。\n\n請登入審核後台查看上課紀錄與申請資料：\nhttps://hanascent.com/admin/students/\n\n此信僅為通知，開啟連結不會自動核准申請。':
   '你的 HANA 學員資格審核已通過。\n\n請使用申請時的 Email 與自行設定的密碼登入：\nhttps://hanascent.com/student-tools/\n\n若有任何問題，請回覆此信聯絡 HANA。HANA 不會透過信件索取你的密碼或驗證碼。'
 };
}

export function createHandler(env,fetcher=fetch) {
 async function rpc(name,args){
  const key=env('SUPABASE_SERVICE_ROLE_KEY');
  if(!key)throw new Error('server_config');
  const r=await fetcher(env('SUPABASE_URL')+'/rest/v1/rpc/'+name,{
   method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},
   body:JSON.stringify(args),signal:AbortSignal.timeout(15000)
  });
  if(!r.ok)throw new Error('rpc_'+r.status);
  return r.json();
 }
 return async req=>{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const token=req.headers.get('x-notification-token');
  if(!token||token.length>200)return new Response('Unauthorized',{status:401});
  try {
   if(await rpc('student_notification_worker_authorized',{p_token:token})!==true)return new Response('Unauthorized',{status:401});
   const apiKey=env('RESEND_API_KEY');
   if(!apiKey)return new Response('Mail service not configured',{status:503});
   const jobs=await rpc('claim_student_notifications',{});
   let sent=0,failed=0;
   for(const job of jobs){
    let providerId=null,error=null;
    try {
     const r=await fetcher('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':'hana-student/'+job.id},
      body:JSON.stringify(notificationMail(job)),signal:AbortSignal.timeout(15000)
     });
     if(!r.ok)throw new Error('resend_'+r.status);
     const data=await r.json();
     if(typeof data.id!=='string')throw new Error('resend_invalid_response');
     providerId=data.id;
    }catch(e){error=/^(resend_\d+|resend_invalid_response|invalid_kind|invalid_recipient|invalid_admin_recipient)$/.test(e.message)?e.message:'send_failed';}
    const saved=await rpc('finish_student_notification',{p_id:job.id,p_lease:job.lease_token,p_sent:!!providerId,p_provider_id:providerId,p_error:error});
    if(saved&&providerId)sent++;else failed++;
    // Respect the provider's default request rate even for fast responses.
    if(jobs.length>1)await new Promise(resolve=>setTimeout(resolve,600));
   }
   return Response.json({sent,failed});
  }catch{return new Response('Notification worker unavailable',{status:503});}
 };
}
