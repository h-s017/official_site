const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function client(userResult,rpcResult){const db={auth:{getUser:async()=>userResult},rpc:async()=>rpcResult};const storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};const window={HANA_CMS_CONFIG:{supabaseUrl:'https://example.invalid',supabaseAnonKey:'publishable-test'},supabase:{createClient:()=>db}};vm.runInNewContext(fs.readFileSync('assets/student-auth.js','utf8'),{window,sessionStorage:storage,localStorage:storage,location:{origin:'https://hanascent.com',search:''},URL,URLSearchParams});return window.HanaStudents;}
test('verified account with missing review service remains logged in but cannot buy',async()=>{const x=client({data:{user:{email_confirmed_at:'2026-10-28'}},error:null},{error:{code:'PGRST202'}});assert.deepEqual(JSON.parse(JSON.stringify(await x.status())),{status:'service_pending',allowed:false,admin:false,verified:true});});
test('signed-out users cannot gain access through the unavailable-service fallback',async()=>{assert.equal(await client({data:{user:null},error:null},{error:{code:'PGRST202'}}).status(),null);});
test('other API errors are surfaced, not converted to permission grants',async()=>{await assert.rejects(client({data:{user:{email_confirmed_at:'2026-10-28'}},error:null},{error:new Error('network error')}).status(),/network error/);});
test('successful server authorization is returned unchanged',async()=>{const x=await client({data:{user:{}},error:null},{data:{allowed:true,status:'approved'},error:null}).status();assert.equal(x.allowed,true);assert.equal(x.status,'approved');});

test('temporary auth network failure is not mistaken for a signed-out student',async()=>{
 await assert.rejects(client({data:{user:null},error:new Error('network unavailable')},{data:{allowed:true}}).status(),/network unavailable/);
});
test('missing session still requires login',async()=>{
 const error=new Error('session missing');error.name='AuthSessionMissingError';
 assert.equal(await client({data:{user:null},error},{data:{allowed:true}}).status(),null);
});

test('portal and shop share browser session, but stale tabs cannot restore it after logout',async()=>{
 const key='hana-student-auth-v1';
 const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
 const shared=storage(),firstTab=storage(),staleTab=storage();
 firstTab.setItem(key,'test-session');staleTab.setItem(key,'test-session');
 function page(tab){
  let options;const redirects=[];
  const db={auth:{signOut:async()=>{options.auth.storage.removeItem(options.auth.storageKey);return {error:null};}}};
  const window={HANA_CMS_CONFIG:{supabaseUrl:'https://example.invalid',supabaseAnonKey:'publishable-test'},supabase:{createClient:(_url,_key,config)=>{options=config;return db;}}};
  vm.runInNewContext(fs.readFileSync('assets/student-auth.js','utf8'),{window,sessionStorage:tab,localStorage:shared,location:{origin:'https://hanascent.com',search:'',replace:url=>redirects.push(url)},URL,URLSearchParams});
  return {auth:window.HanaStudents,options,redirects};
 }
 const portal=page(firstTab),shop=page(storage());
 assert.equal(portal.options.auth.storage,shared);assert.equal(shop.options.auth.storage,shared);
 assert.equal(shop.options.auth.storage.getItem(key),'test-session');
 assert.equal(firstTab.getItem(key),null);
 await portal.auth.logout();assert.equal(shared.getItem(key),null);assert.deepEqual(portal.redirects,['/student-tools/']);
 page(staleTab);assert.equal(shared.getItem(key),null);assert.equal(staleTab.getItem(key),null);
});
