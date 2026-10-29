(() => {
 'use strict';
 const {db,check,status,logout,redirect,next}=window.HanaStudents;
 const $=id=>document.getElementById(id);
 let recovery=false;
 const message=text=>{$('student-message').textContent=text;};
 const newsletterButtons=['newsletter-unsubscribe','pending-newsletter-unsubscribe'];
 let newsletterRevision=0;
 let newsletterLoadFailed=false;
 const newsletterMessage=(text,loadFailed=false)=>{newsletterLoadFailed=loadFailed;for(const id of ['newsletter-message','pending-newsletter-message'])$(id).textContent=text;};
 async function updateNewsletterControls(){
  const revision=++newsletterRevision;
  try{
   let result=await db.rpc('student_newsletter_status');
   if(result.error&&(result.status===401||result.status===0)){
    await check(await db.auth.getUser());
    result=await db.rpc('student_newsletter_status');
   }
   const subscribed=await check(result);if(revision!==newsletterRevision)return;
   for(const id of newsletterButtons)$(id).hidden=!subscribed;
   if(newsletterLoadFailed)newsletterMessage('');
  }catch{if(revision===newsletterRevision)newsletterMessage('訂閱狀態暫時無法載入，請稍後重新整理。',true);}
 }
 for(const id of newsletterButtons)$(id).onclick=async()=>{
  newsletterRevision++;
  for(const button of newsletterButtons)$(button).disabled=true;
  try{await check(await db.rpc('student_newsletter_unsubscribe'));for(const button of newsletterButtons)$(button).hidden=true;newsletterMessage('已取消氣味通信訂閱。');}
  catch{newsletterMessage('取消未完成，請稍後重試。');}
  finally{for(const button of newsletterButtons)$(button).disabled=false;}
 };
 $('student-menu-toggle').onclick=()=>{const toggle=$('student-menu-toggle'),open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));$('student-navigation').classList.toggle('is-open',open);};
 const courseToggle=$('student-course-toggle'),courseLinks=$('student-course-links');
 const setCourseOpen=open=>{courseToggle.setAttribute('aria-expanded',String(open));courseLinks.hidden=!open;courseToggle.parentElement.classList.toggle('is-open',open);};
 courseToggle.onclick=()=>setCourseOpen(courseToggle.getAttribute('aria-expanded')!=='true');
 document.addEventListener('click',event=>{if(!courseToggle.parentElement.contains(event.target))setCourseOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&courseToggle.getAttribute('aria-expanded')==='true'){setCourseOpen(false);courseToggle.focus();}});
 function mode(name){for(const form of document.querySelectorAll('[data-auth-panel]'))form.hidden=form.dataset.authPanel!==name;for(const tab of document.querySelectorAll('[data-mode]'))tab.setAttribute('aria-pressed',String(tab.dataset.mode===name));message('');}
 for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>mode(button.dataset.mode);
 function operationError(error){
  if(error?.code==='invalid_credentials')return 'Email 或密碼不正確，請重新輸入或使用忘記密碼。';
  if(error?.code==='email_not_confirmed')return '請先完成信箱驗證，再登入。';
  if(error?.status===429)return '操作次數過多，請稍後再試。';
  return '操作未完成，請檢查輸入資料與網路後重試。';
 }
 async function busy(form,work){const button=form.querySelector('button[type=submit]');message('');button.disabled=true;try{await work();}catch(error){message(operationError(error));}finally{button.disabled=false;}}
 function application(form){const data=new FormData(form);const courses=data.getAll('courses');if(!courses.length)throw new Error('course required');return {full_name:String(data.get('name')).trim(),phone:String(data.get('phone')).replace(/[ ()-]/g,''),courses,consent_version:'2026-10-28',...(form.id==='register-form'?{newsletter_consent_version:'2026-10-29'}:{})};}
 async function refresh(){
  $('student-content').hidden=true;
  const access=await status();
  message('');
  const unlocked=!!access?.allowed&&!recovery;
  $('student-introduction').hidden=unlocked;
  $('student-entry').hidden=unlocked;
  $('tools-review-link').hidden=!access?.admin;
  for(const id of newsletterButtons)$(id).hidden=true;
  $('signed-in').hidden=!access;
  if(!access){$('auth-tabs').hidden=false;mode('login');return;}
  $('auth-tabs').hidden=true;
  for(const panel of document.querySelectorAll('[data-auth-panel]'))panel.hidden=true;
  $('review-link').hidden=!access.admin;
  updateNewsletterControls();
  if(recovery){$('reset-form').hidden=false;message('請設定新密碼。');return;}
  if(access.status==='service_pending'){$('access-status').textContent=access.verified?'信箱驗證已完成，帳戶登入成功。學員審核服務尚未啟用，目前暫時無法送審或購買；請保留原帳戶，無需重複註冊。':'帳戶登入成功，請先完成信箱驗證。學員審核服務尚未啟用。';return;}
  if(access.allowed){$('student-content').hidden=false;$('access-status').textContent='已通過學員資格審核';sessionStorage.setItem('hana_student_tools_unlocked','true');if(next().includes('/materials/'))location.replace(next());}
  else if(access.admin){$('access-status').textContent='管理員帳戶：請前往學員審核後台完成二階段驗證。';}
  else if(access.status==='not_applied'){$('complete-form').hidden=false;$('access-status').textContent='請補填學員資格申請。';}
  else {$('access-status').textContent=({pending:'資格審查中',approved:'帳戶信箱或資格已變更，需要 HANA 重新確認，請聯絡我們。',rejected:'目前未通過審核，請聯絡 HANA 確認課程紀錄。',suspended:'學員權限已暫停，請聯絡 HANA。'})[access.status]||'資格尚未通過';}
 }
 $('login-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;await check(await db.auth.signInWithPassword({email:form.elements.email.value.trim(),password:form.elements.password.value}));form.elements.password.value='';await refresh();});};
 $('register-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;if(form.elements.password.value!==form.elements.confirm.value){message('兩次輸入的密碼不一致。');return;}if(!form.querySelector('[name=courses]:checked')){message('請至少選擇一項曾上過的課程。');return;}const profile=application(form);await check(await db.auth.signUp({email:form.elements.email.value.trim(),password:form.elements.password.value,options:{emailRedirectTo:redirect,data:{student_application:profile}}}));form.reset();mode('login');message('若資料可受理，驗證信將寄到你的 Email。請先驗證信箱，再回來登入查看審核進度。已有帳戶請使用登入或忘記密碼。');});};
 $('complete-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{if(!e.target.querySelector('[name=courses]:checked')){message('請選擇曾上過的課程。');return;}const a=application(e.target);await check(await db.rpc('student_apply',{p_name:a.full_name,p_phone:a.phone,p_courses:a.courses,p_consent:a.consent_version}));e.target.reset();await refresh();});};
 let resetSending=false,resetRetryAt=0;
 function resetEmailButton(){
  const button=$('forgot-form').querySelector('button[type=submit]');
  const remaining=Math.max(0,Math.ceil((resetRetryAt-Date.now())/1000));
  button.disabled=resetSending||remaining>0;
  button.textContent=resetSending?'寄送中…':remaining?'稍後重寄（'+remaining+' 秒）':'寄送密碼重設信';
  if(remaining>0)setTimeout(resetEmailButton,1000);
 }
 $('forgot-form').onsubmit=async e=>{
  e.preventDefault();if(resetSending||Date.now()<resetRetryAt)return;
  resetSending=true;message('');resetEmailButton();$('reset-email-message').textContent='寄送中…';
  try{await check(await db.auth.resetPasswordForEmail(e.target.elements.email.value.trim(),{redirectTo:redirect}));$('reset-email-message').textContent='已寄送，請收信。';resetRetryAt=Date.now()+60000;}
  catch(error){$('reset-email-message').textContent=operationError(error);if(error?.status===429)resetRetryAt=Date.now()+60000;}
  finally{resetSending=false;resetEmailButton();}
 };
 $('reset-form').onsubmit=e=>{e.preventDefault();busy(e.currentTarget,async()=>{const form=e.target;if(form.elements.password.value!==form.elements.confirm.value){message('兩次輸入的密碼不一致。');return;}await check(await db.auth.updateUser({password:form.elements.password.value}));form.reset();recovery=false;await db.auth.signOut({scope:'global'});await refresh();message('密碼已更新，請用新密碼重新登入。');});};
 $('student-logout').onclick=logout;$('lock-tools').onclick=logout;
 $('refresh-status').onclick=()=>refresh().catch(()=>message('無法取得最新資格，請稍後重試。'));
 db.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')recovery=true;setTimeout(()=>refresh().catch(()=>message('暫時無法驗證資格，請重新登入。')),0);});
 refresh().catch(()=>message('目前無法連線，請稍後重新整理。'));
})();
