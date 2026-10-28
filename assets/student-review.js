(() => {
 'use strict';
 const {db,check,status,logout}=window.HanaStudents,$=id=>document.getElementById(id);
 let factorId=null,offset=0;
 const say=text=>{$('review-message').textContent=text;};
 function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
 async function load(){
  $('student-list').replaceChildren();
  const rows=await check(await db.rpc('student_list',{p_status:$('review-status').value,p_offset:offset}));
  $('previous-page').disabled=offset===0;$('next-page').disabled=rows.length<50;
  if(!rows.length)$('student-list').append(node('p','此頁沒有申請紀錄。'));
  for(const row of rows){
   const card=node('article','');card.className='review-card';card.append(node('h2',row.full_name),node('p',row.email),node('p','手機：'+row.phone),node('p','曾上課程：'+row.courses.join('、')),node('p','申請時間：'+new Date(row.created_at).toLocaleString('zh-TW')),node('p',row.email_verified?'Email 已驗證':'Email 尚未驗證，無法核准'));
   const label=node('label','內部審核備註（拒絕／停權必填，不向學員顯示）');const reason=document.createElement('textarea');reason.maxLength=500;label.append(reason);card.append(label);const actions=node('div','');actions.className='review-actions';
   for(const [value,text] of [['approved','核准'],['rejected','拒絕'],['suspended','停權']]){
    if(row.status===value)continue;const b=node('button',text);b.type='button';if(value==='approved')b.className='approve';b.disabled=value==='approved'&&!row.email_verified;
    b.onclick=async()=>{if(value!=='approved'&&!reason.value.trim()){say('請填寫拒絕或停權原因。');reason.focus();return;}if(!window.confirm('確認將「'+row.full_name+'」設定為「'+text+'」？'))return;for(const button of card.querySelectorAll('button'))button.disabled=true;try{await check(await db.rpc('student_review',{p_user:row.user_id,p_status:value,p_revision:row.revision,p_reason:reason.value.trim()}));say('審核已儲存，權限立即生效。');await load();}catch{say('審核未完成：資料可能已更新，或驗證已失效。請重新載入或登入。');await load().catch(()=>{$('review-panel').hidden=true;});}};
    actions.append(b);
   }card.append(actions);$('student-list').append(card);
  }
 }
 async function init(){
  $('review-panel').hidden=true;const access=await status();if(!access?.admin){say('請先以管理員帳戶登入學員入口。');return;}
  const assurance=await check(await db.auth.mfa.getAuthenticatorAssuranceLevel());
  if(assurance.currentLevel==='aal2'){$('mfa-panel').hidden=true;$('mfa-qr').removeAttribute('src');$('mfa-code').value='';$('review-panel').hidden=false;say('管理員驗證完成。');await load();return;}
  $('mfa-panel').hidden=false;const factors=await check(await db.auth.mfa.listFactors());const active=factors.totp.find(f=>f.status==='verified');factorId=active?.id||null;$('enroll-mfa').hidden=!!active;$('mfa-form').hidden=!active;say('請完成管理員二階段驗證。');
 }
 $('enroll-mfa').onclick=async()=>{const button=$('enroll-mfa');button.disabled=true;try{const data=await check(await db.auth.mfa.enroll({factorType:'totp',friendlyName:'HANA 學員審核 '+new Date().toISOString()}));factorId=data.id;$('mfa-qr').src=data.totp.qr_code;$('mfa-qr').hidden=false;$('mfa-form').hidden=false;}catch{say('驗證器設定未完成，請稍後重試。');button.disabled=false;}};
 $('mfa-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const challenge=await check(await db.auth.mfa.challenge({factorId}));await check(await db.auth.mfa.verify({factorId,challengeId:challenge.id,code:$('mfa-code').value}));await init();}catch{say('驗證未通過，請輸入驗證器目前顯示的六位驗證碼。');}finally{button.disabled=false;$('mfa-code').value='';}};
 $('review-status').onchange=()=>{offset=0;load().catch(()=>say('讀取失敗，請重新登入。'));};$('reload-students').onclick=()=>load().catch(()=>say('讀取失敗，請重新登入。'));
 $('previous-page').onclick=()=>{offset=Math.max(0,offset-50);load().catch(()=>say('讀取失敗。'));};$('next-page').onclick=()=>{offset+=50;load().catch(()=>say('讀取失敗。'));};$('admin-student-logout').onclick=logout;
 init().catch(()=>say('目前無法驗證管理員權限，請稍後重新登入。'));
})();
