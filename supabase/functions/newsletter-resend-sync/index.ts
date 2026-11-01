import {createClient} from 'npm:@supabase/supabase-js@2.57.0';

const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
});
function adminDb(){
 const url=Deno.env.get('SUPABASE_URL')||'';
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!url||!key)throw Error('missing_backend_config');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function rpc(db:ReturnType<typeof adminDb>,fn:string,body:Record<string,unknown>){
 const {data,error}=await db.rpc(fn,body);if(error)throw Error('db_'+fn+':'+error.code);
 return data;
}
async function resend(apiKey:string,method:string,path:string,body?:unknown){
 const response=await fetch('https://api.resend.com'+path,{
   method,signal:AbortSignal.timeout(12000),
   headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
   ...(body===undefined?{}:{body:JSON.stringify(body)})
 });
 let data:any={};try{data=await response.json()}catch{}
 return {status:response.status,ok:response.ok,data};
}
function normalizeEmail(v:unknown){return String(v||'').trim().toLowerCase();}
function visibleError(status:number){return status===401||status===403?'resend_credentials_or_permission':status===429?'resend_rate_limit':'resend_http_'+status;}
async function syncContact(db:ReturnType<typeof adminDb>,key:string,segmentId:string,row:any){
 const email=normalizeEmail(row.email);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('invalid_email');
 const endpoint='/contacts/'+encodeURIComponent(email);
 if(!row.desired){
  const rm=await resend(key,'DELETE',endpoint+'/segments/'+encodeURIComponent(segmentId));
  if(!rm.ok&&rm.status!==404)throw Error(visibleError(rm.status));
  return;
 }
 // Global Contacts may exist or be unsubscribed in another segment.
 // Never revive an existing globally unsubscribed contact.
 let contact=await resend(key,'GET',endpoint);
 if(contact.status===404){
  const created=await resend(key,'POST','/contacts',{
    email,first_name:String(row.name||'').slice(0,80)
  });
  if(!created.ok&&created.status!==409)throw Error(visibleError(created.status));
  contact=await resend(key,'GET',endpoint);
 }
 if(!contact.ok)throw Error(visibleError(contact.status));
 const obj=contact.data?.data||contact.data;
 if(obj?.unsubscribed===true){
  await rpc(db,'newsletter_resend_suppress',{p_email:email,p_event_id:null});
  return 'suppressed';
 }
 const added=await resend(key,'POST',endpoint+'/segments/'+encodeURIComponent(segmentId));
 if(!added.ok&&added.status!==409)throw Error(visibleError(added.status));
}
Deno.serve(async req=>{
 if(req.method!=='POST')return json({error:'method_not_allowed'},405);
 let db:ReturnType<typeof adminDb>;
 try{db=adminDb()}catch{return json({error:'server_not_ready'},503)}
 const token=req.headers.get('x-newsletter-worker-token')||'';
 if(token.length<50)return json({error:'unauthorized'},401);
 try{
  const allowed=await rpc(db,'newsletter_resend_worker_authorized',{p_token:token});
  if(allowed!==true)return json({error:'unauthorized'},401);
 }catch{return json({error:'authorization_unavailable'},503)}
 const key=Deno.env.get('RESEND_MARKETING_API_KEY')||'';
 const segmentId=Deno.env.get('RESEND_NEWSLETTER_SEGMENT_ID')||'';
 if(!key.startsWith('re_')||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(segmentId)){
  return json({configured:false,sync:'paused',reason:'marketing_key_or_segment_missing'});
 }
 let claimed:any[];
 try{
  const items=await rpc(db,'newsletter_resend_claim',{p_limit:5});
  claimed=Array.isArray(items)?items:[];
 }catch{return json({error:'claim_failed'},503)}
 let successful=0,failed=0,suppressed=0;
 for(const row of claimed){
  let ok=false,code:string|null=null;
  try{
   const result=await syncContact(db,key,segmentId,row);
   ok=true;successful++;if(result==='suppressed')suppressed++;
  }catch(error){
   failed++;code=String((error as Error).message||'sync_failed').slice(0,120);
  }
  try{await rpc(db,'newsletter_resend_finish',{p_email:row.email,p_desired:Boolean(row.desired),p_success:ok,p_error:code});}
  catch{failed++;/* lease expiry allows retry; no personal data logged */ }
 }
 return json({configured:true,processed:claimed.length,successful,failed,suppressed});
});
