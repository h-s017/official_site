(() => {
 'use strict';
 const {db,check,status,logout,redirect,next}=window.HanaStudents;
 const $=id=>document.getElementById(id);
 let recovery=false;
 const message=text=>{$('student-message').textContent=text;};
 function mode(name){for(const form of document.querySelectorAll('[data-auth-panel]'))form.hidden=form.dataset.authPanel!==name;for(const tab of document.querySelectorAll('[data-mode]'))tab.setAttribute('aria-pressed',String(tab.dataset.mode===name));message('');}
 for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>mode(button.dataset.mode);
 async function busy(form,work){const button=form.querySelector('button[type=submit]');button.disabled=true;try{await work();}catch{message('操作未完成。請檢查資料、Email 驗證與網路狀態；若持續發生，請聯絡 HANA。');}finally{button.disabled=false;}}
 function application(form){const data=new FormData(form);const courses=data.getAll('courses');if(!courses.length)throw new Error('course required');return {full_name:String(data.get('name')).trim(),phone:String(data.get('phone')).replace(/[ ()-]/g,''),courses,consent_version:'2026-10-28'};}
 async function refresh(){
  $('student-content').hidden=true;
  const access=await status();
  $('signed-in').hidden=!access;
  if(!access){$('auth-tabs').hidden=false;mode('login');return;}
  $('auth-tabs').hidden=true;
  for(const panel of document.querySelectorAll('[data-auth-panel]'))panel.hidden=true;
  $('review-link').hidden=!access.admin;
  if(recovery){$('reset-form').hidden=false;message('請設定新密碼。');return;}
  if(access.allowed){$('student-content').hidden=false;$('access-status').textContent='已通過學員資格審核';sessionStorage.setItem('hana_student_tools_unlocked','true');if(next().includes('/materials/'))location.replace(next());}
  else if(access.admin){$('access-status').textContent='管理員帳戶：請前往學員審核後台完成二階段驗證。';}
  else if(access.status==='not_applied'){$('complete-form').hidden=false;$('access-status').textContent='請補填學員資格申請。';}
  else {$('access-status').textContent=({pending:'申請已送出，等待 HANA 審核。通過後，使用同一組 Email 與密碼登入即可。',approved:'帳戶信箱或資格已變更，需要 HANA 重新確認，請聯絡我們。',rejected:'目前未通過審核，請聯絡 HANA 確認課程紀錄。',suspended:'學員權限已暫停，請聯絡 HANA。'})[access.status]||'資格尚未通過';}
 }
 $('login-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;await check(await db.auth.signInWithPassword({email:form.elements.email.value.trim(),password:form.elements.password.value}));form.elements.password.value='';await refresh();});};
 $('register-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;if(form.elements.password.value!==form.elements.confirm.value){message('兩次輸入的密碼不一致。');return;}if(!form.querySelector('[name=courses]:checked')){message('請至少選擇一項曾上過的課程。');return;}const profile=application(form);await check(await db.auth.signUp({email:form.elements.email.value.trim(),password:form.elements.password.value,options:{emailRedirectTo:redirect,data:{student_application:profile}}}));form.reset();mode('login');message('若資料可受理，驗證信將寄到你的 Email。請先驗證信箱，再回來登入查看審核進度。已有帳戶請使用登入或忘記密碼。');});};
 $('complete-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{if(!e.target.querySelector('[name=courses]:checked')){message('請選擇曾上過的課程。');return;}const a=application(e.target);await check(await db.rpc('student_apply',{p_name:a.full_name,p_phone:a.phone,p_courses:a.courses,p_consent:a.consent_version}));e.target.reset();await refresh();});};
 $('forgot-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{await check(await db.auth.resetPasswordForEmail(e.target.elements.email.value.trim(),{redirectTo:redirect}));message('若此 Email 已有帳戶，將收到密碼重設信。請在同一瀏覽器開啟連結。');});};
 $('reset-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;if(form.elements.password.value!==form.elements.confirm.value){message('兩次輸入的密碼不一致。');return;}await check(await db.auth.updateUser({password:form.elements.password.value}));form.reset();recovery=false;await db.auth.signOut({scope:'global'});await refresh();message('密碼已更新，請用新密碼重新登入。');});};
 $('student-logout').onclick=logout;$('lock-tools').onclick=logout;
 $('refresh-status').onclick=()=>refresh().catch(()=>message('無法取得最新資格，請稍後重試。'));
 db.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recovery=true;setTimeout(()=>refresh().catch(()=>message('暫時無法驗證資格，請重新登入。')),0);});
 refresh().catch(()=>message('目前無法連線，請稍後重新整理。'));
})();
