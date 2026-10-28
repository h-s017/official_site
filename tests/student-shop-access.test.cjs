const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function openShop(access){
 const elements=new Map(),redirects=[];
 const element=()=>({value:'',hidden:true,textContent:'',children:[],append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}});
 const body=element();
 const document={body,createElement:element,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
 vm.runInNewContext(fs.readFileSync('student-tools/materials/members.js','utf8'),{
  window:{HanaStudents:{db:{},check:()=>{},logout:()=>{},status:access}},document,
  location:{replace:url=>redirects.push(url),reload:()=>{}},
 });
 await new Promise(resolve=>setImmediate(resolve));
 return {body,elements,redirects};
}
test('approved portal session opens the material shop directly',async()=>{
 const page=await openShop(async()=>({allowed:true,full_name:'測試學員'}));
 assert.deepEqual(page.redirects,[]);assert.equal(page.body.hidden,false);
 assert.equal(page.elements.get('memberIdentity').textContent,'測試學員');
 assert.equal(page.elements.get('orderFields').hidden,false);
});
test('network failures show a retry screen without redirecting to login or revealing shop',async()=>{
 const page=await openShop(async()=>{throw new Error('network error');});
 assert.deepEqual(page.redirects,[]);assert.equal(page.body.children.length,1);
 assert.equal(page.body.children[0].children[0].textContent,'暫時無法確認學員資格');
 assert.equal(page.elements.has('orderFields'),false);
});
test('missing or unapproved sessions are still blocked',async()=>{
 for(const access of [null,{allowed:false,status:'pending'}]){
  const page=await openShop(async()=>access);assert.deepEqual(page.redirects,['/student-tools/?next=materials']);assert.equal(page.body.hidden,true);
 }
});
