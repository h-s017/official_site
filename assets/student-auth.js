/* Shared by the student portal, review console and material shop. No secret keys. */
(() => {
 'use strict';
 const cfg=window.HANA_CMS_CONFIG;
 const authKey='hana-student-auth-v1',migrationKey='hana-student-auth-shared-v1';
 // Migrate the old tab-scoped session once. Other stale tabs must not
 // restore the legacy session after a shared-browser logout.
 if(!localStorage.getItem(migrationKey)){
  const existing=sessionStorage.getItem(authKey);
  if(existing&&!localStorage.getItem(authKey))localStorage.setItem(authKey,existing);
  localStorage.setItem(migrationKey,'1');
 }
 sessionStorage.removeItem(authKey);
 const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
  auth:{storage:localStorage,storageKey:authKey,flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
 const portal='/student-tools/';
 const redirect=new URL(portal,location.origin).href;
 const check=async result=>{if(result.error)throw result.error;return result.data;};
 async function status(){
  const {data,error}=await db.auth.getUser();
  if(error){if(error.name==='AuthSessionMissingError')return null;throw error;}
  if(!data.user)return null;
  const result=await db.rpc('student_access_status');
  if(result.error?.code==='PGRST202')return {status:'service_pending',allowed:false,admin:false,verified:!!data.user.email_confirmed_at};
  return check(result);
 }
 async function requireAccess(){const access=await status();if(!access?.allowed){location.replace(portal);throw new Error('Approved student required');}return access;}
 // Only fixed same-origin destinations; never accept arbitrary return URLs.
 const next=()=>new URLSearchParams(location.search).get('next')==='materials'?'/student-tools/materials/':portal;
 async function logout(){await check(await db.auth.signOut({scope:'local'}));sessionStorage.removeItem(authKey);sessionStorage.removeItem('hana_student_tools_unlocked');localStorage.removeItem('hana-material-member-v1');location.replace(portal);}
 window.HanaStudents={db,check,status,requireAccess,logout,portal,redirect,next};
})();
