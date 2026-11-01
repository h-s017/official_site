import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
});
function decodeSecret(secret:string){
 const b64=secret.slice(6).replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(b64);return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function matching(a:Uint8Array,b:Uint8Array){
 if(a.length!==b.length)return false;
 let mismatches=0;for(let i=0;i<a.length;i++)mismatches|=a[i]^b[i];
 return mismatches===0;
}
async function valid(req:Request,raw:string,secret:string){
 const id=req.headers.get('svix-id')||'';
 const ts=req.headers.get('svix-timestamp')||'';
 const sig=req.headers.get('svix-signature')||'';
 const n=Number(ts);
 if(!id||id.length>200||!Number.isSafeInteger(n)||Math.abs(Date.now()/1000-n)>300||!sig||!secret.startsWith('whsec_'))return false;
 let key:CryptoKey;
 try{key=await crypto.subtle.importKey('raw',decodeSecret(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);}catch{return false}
 const signed=new TextEncoder().encode(id+'.'+ts+'.'+raw);
 const digest=new Uint8Array(await crypto.subtle.sign('HMAC',key,signed));
 return sig.split(/\s+/).some(part=>{
  if(!part.startsWith('v1,'))return false;
  try{const b=atob(part.slice(3));return matching(digest,Uint8Array.from(b,c=>c.charCodeAt(0)));}
  catch{return false}
 });
}
Deno.serve(async req=>{
 if(req.method!=='POST')return respond({error:'method_not_allowed'},405);
 const secret=Deno.env.get('RESEND_NEWSLETTER_WEBHOOK_SECRET')||'';
 if(!secret.startsWith('whsec_'))return respond({error:'webhook_not_configured'},503);
 let raw:string;
 try{raw=await req.text();if(raw.length>20000)return respond({error:'payload_too_large'},413)}
 catch{return respond({error:'bad_payload'},400)}
 if(!await valid(req,raw,secret))return respond({error:'invalid_signature'},401);
 let event:any;
 try{event=JSON.parse(raw)}catch{return respond({error:'invalid_json'},400)}
 if(event?.type!=='contact.updated'||event?.data?.unsubscribed!==true)return respond({ok:true,ignored:true});
 const email=String(event?.data?.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond({error:'invalid_event'},422);
 const url=Deno.env.get('SUPABASE_URL')||'';
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 if(!url||!key)return respond({error:'backend_not_ready'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await db.rpc('newsletter_resend_suppress',{p_email:email,p_event_id:req.headers.get('svix-id')});
 if(error)return respond({error:'database_unavailable'},503);
 return respond({ok:true,processed:true});
});
