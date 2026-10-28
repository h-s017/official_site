/* Shared by the student portal, review console and material shop. No secret keys. */
(() => {
 'use strict';
 const cfg=window.HANA_CMS_CONFIG;
 const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
  auth:{storage:sessionStorage,storageKey:'hana-student-auth-v1',flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
 });
 const portal='/student-tools/';
 const redirect=new URL(portal,location.origin).href;
 const check=async result=>{if(result.error)throw result.error;return result.data;};
 async function status(){const {data,error}=await db.auth.getUser();if(error||!data.user)return null;return check(await db.rpc('student_access_status'));}
 async function requireAccess(){const access=await status();if(!access?.allowed){location.replace(portal);throw new Error('Approved student required');}return access;}
 // Only fixed same-origin destinations; never accept arbitrary return URLs.
 const next=()=>new URLSearchParams(location.search).get('next')==='materials'?'/student-tools/materials/':portal;
 async function logout(){await db.auth.signOut({scope:'local'});sessionStorage.removeItem('hana_student_tools_unlocked');localStorage.removeItem('hana-material-member-v1');location.replace(portal);}
 window.HanaStudents={db,check,status,requireAccess,logout,portal,redirect,next};
})();
