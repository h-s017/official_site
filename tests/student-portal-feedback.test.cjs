const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function portal(initialAccess=null){
 const nodes=new Map();let access=initialAccess,loginError=null,authEvent;
 function node(id){if(!nodes.has(id)){
  const button={disabled:false};
  nodes.set(id,{id,hidden:false,textContent:'',value:'',dataset:{},parentElement:{contains:()=>false,classList:{toggle(){}}},
   classList:{toggle(){}},getAttribute:()=>null,setAttribute(){},
   elements:{email:{value:'student@example.invalid'},password:{value:'test-password'}},
   querySelector:()=>button,button});
 }return nodes.get(id);}
 const panels=['login','register','complete','forgot','reset'].map(mode=>{const form=node(mode+'-form');form.dataset.authPanel=mode;return form;});
 const tabs=['login','register','forgot'].map(mode=>({dataset:{mode},setAttribute(){}}));
 const document={getElementById:node,querySelectorAll:selector=>selector==='[data-auth-panel]'?panels:tabs,addEventListener(){}};
 const db={auth:{onAuthStateChange:cb=>{authEvent=cb;},signInWithPassword:async()=>({data:{},error:loginError})}};
 const window={HanaStudents:{db,check:async result=>{if(result.error)throw result.error;return result.data;},status:async()=>access,logout(){},redirect:'https://example.invalid/student-tools/',next:()=>'/student-tools/'}};
 vm.runInNewContext(fs.readFileSync('assets/student-portal.js','utf8'),{window,document,sessionStorage:{setItem(){}},setTimeout:fn=>fn()});
 await settle();
 return {nodes,node,setAccess:value=>{access=value;},setLoginError:value=>{loginError=value;},refresh:async()=>{authEvent('SIGNED_IN');await settle();},login:async()=>{const form=node('login-form');form.onsubmit({preventDefault(){},currentTarget:form,target:form});await settle();}};
}
test('a failed login reports credentials, never claims pending review',async()=>{
 const page=await portal();page.setLoginError({code:'invalid_credentials'});await page.login();
 assert.match(page.node('student-message').textContent,/Email 或密碼不正確/);
 assert.doesNotMatch(page.node('student-message').textContent,/資格審查中/);
 assert.equal(page.node('login-form').button.disabled,false);
});
test('successful approved status clears stale pending and error messages',async()=>{
 const page=await portal();page.node('student-message').textContent='資格審查中';
 page.setAccess({allowed:true,status:'approved',admin:false});await page.refresh();
 assert.equal(page.node('student-message').textContent,'');
 assert.equal(page.node('access-status').textContent,'已通過學員資格審核');
 assert.equal(page.node('student-content').hidden,false);assert.equal(page.node('login-form').hidden,true);
});
test('only an actual server pending status shows review pending',async()=>{
 const page=await portal({allowed:false,status:'pending',admin:false});
 assert.equal(page.node('access-status').textContent,'資格審查中');
 assert.equal(page.node('student-content').hidden,true);assert.equal(page.node('student-message').textContent,'');
});
test('rate limits, email verification and service errors have distinct feedback',async()=>{
 for(const [error,pattern] of [[{status:429},/操作次數過多/],[{code:'email_not_confirmed'},/完成信箱驗證/],[new Error('network'),/操作未完成/]]){
  const page=await portal();page.setLoginError(error);await page.login();
  assert.match(page.node('student-message').textContent,pattern);assert.doesNotMatch(page.node('student-message').textContent,/資格審查中/);
 }
});
