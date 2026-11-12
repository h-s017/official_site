const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../admin/quotes/development-model.js');
const p={use:'個人香水',contact:'皮膚',category:'4',ifraVersion:'51st'};
const row=(g,patch={})=>({...M.row(),name:'A',organId:'A',actualG:g,limit:'10',category:'4',ifraVersion:'51st',limitSource:'certificate.pdf',status:'已確認',...patch});
test('actual grams determine IFRA concentration, never drops, proportions or target grams',()=>{const c=M.check({finalG:'100',rows:[row('8',{drops:100,targetG:90,ratio:60})]},p);assert.equal(c.actual,8);assert.equal(c.concentration,8);assert.equal(c.rows[0].level,'within');});
test('missing grams stay unknown; no zero or target fallback',()=>{const c=M.check({finalG:'100',rows:[row('',{targetG:8})]},p);assert.equal(c.actual,null);assert.equal(c.rows[0].level,'review');assert.equal(M.n('  '),null);});
test('zero grams are accepted but impossible mass and missing uses block affirmative checks',()=>{assert.equal(M.check({finalG:100,rows:[row('0')]},p).actual,0);assert.equal(M.check({finalG:2,rows:[row('3')]},p).rows[0].level,'review');assert.equal(M.check({finalG:100,rows:[row('3')]},{...p,contact:''}).rows[0].level,'review');});
test('same material actual grams are combined with lowest known applicable limit',()=>{const c=M.check({finalG:100,rows:[row('6'),row('6',{limit:'15'})]},p);assert.equal(c.rows[0].pct,12);assert.equal(c.rows[0].level,'over');assert.equal(c.rows[1].level,'over');});
test('category, amendment, source and status cannot be silently treated as verified',()=>{for(const patch of [{category:'12'},{ifraVersion:'50th'},{limitSource:''},{status:'待查證'}])assert.equal(M.check({finalG:100,rows:[row('3',patch)]},p).rows[0].level,'review');});
test('zero limits prohibit positive use and disagreement cannot produce a within result',()=>{assert.equal(M.check({finalG:100,rows:[row('1',{limit:0})]},p).rows[0].level,'over');assert.equal(M.check({finalG:100,rows:[row('1'),row('1',{limit:15})]},p).rows[0].level,'review');});
test('snapshot is detached, retains independent vendor/client prices, and excludes recursive development',()=>{const record={client_name:'test',title:'test',cost_data:{items:[{qty:100,displayQty:80,pricingMode:'supplier',supplierQty:120,supplierUnitCost:400,sell:900}],development:{private:'nested'},logoFee:5000,labelFee:2000,sampling:{perRound:1500,rounds:2}},public_data:{items:[{name:'香水',qty:80,unitPrice:900}]}};const s=M.snapshot(record,'V1');record.cost_data.items[0].displayQty=40;assert.equal(s.cost.items[0].displayQty,80);assert.equal(s.cost.items[0].supplierQty,120);assert.equal(s.cost.items[0].supplierUnitCost,400);assert.equal(s.cost.items[0].sell,900);assert.equal(s.cost.development,undefined);assert.equal(M.quoteSummary(s).sample,3000);assert.equal(M.quoteSummary(s).design,7000);});
test('previous Site export maps to development references and independent quote snapshots only',()=>{const source={project:{name:'test',client:'A',products:[{id:'p',name:'香水',type:'香水'}],formulas:[{id:'f',productId:'p',rows:[{name:'A',actualG:'3.25'}]}],quotes:[{name:'V1',mode:'廠商直接供價',lines:[{productId:'p',name:'香水',qty:80,unit:900,vendorQty:120,vendorUnit:400}],sampleFee:1500,sampleRounds:2}],tasks:[{title:'補文件'}]}};const r=M.importSite(source);assert.equal(r.development.formulas[0].rows[0].actualG,'3.25');assert.equal(r.development.quoteVersions[0].cost.items[0].displayQty,80);assert.equal(r.development.quoteVersions[0].cost.items[0].supplierQty,120);assert.equal(r.development.tasks[0].name,'補文件');assert.equal(r.cost_data,undefined);});
test('invalid inputs and dangerous source links cannot become accepted records',()=>{const d=M.empty();d.formulas=[{rows:[row('-2')]}];assert.throws(()=>M.validate(d));assert.equal(M.safeURL('javascript:alert(1)'),null);assert.equal(M.safeURL('//evil.test'),null);assert.equal(M.safeURL('/organ/'),'/organ/');});
test('integration preserves explicit public allowlist, adds development only to cost_data and locks concurrent saves',()=>{const s=fs.readFileSync('admin/quotes/index.html','utf8');assert.match(s,/window\.HanaDevelopment\.read\(current\)/);assert.match(s,/window\.HanaDevelopment\.prepareSave\(current,status\)/);assert.match(s,/query\.eq\('updated_at',current\.updated_at\)/);const publicBuilder=s.slice(s.indexOf('current.public_data='),s.indexOf('window.HanaDevelopment.read(current)'));assert.doesNotMatch(publicBuilder,/development|formulas|documents|audit/);const client=fs.readFileSync('proposal/view/index.html','utf8');assert.match(client,/from\('fragrance_quote_public'\)/);assert.doesNotMatch(client,/cost_data|\.development/);});
test('merged form and customer rendering scripts parse',()=>{for(const path of ['admin/quotes/index.html','proposal/view/index.html']){const s=fs.readFileSync(path,'utf8');for(const m of s.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1]?.includes('application/ld+json'))continue;new vm.Script(m[2],{filename:path});}}});
test('shared design definitions match official serif font stack and neutral palette',()=>{const s=fs.readFileSync('assets/style.css','utf8'),b=fs.readFileSync('assets/hana-brand.css','utf8');const root=s.match(/:root\s*\{[^}]*\}/)[0];assert.ok(b.includes(root));assert.match(b,/Cormorant Garamond/);assert.match(b,/Noto Serif TC/);const css=fs.readFileSync('admin/quotes/development.css','utf8');assert.match(css,/font-family:var\(--hana-font-text\)/);assert.match(css,/background:var\(--white/);});
test('quick supplier panels use a matching warning selector without crashing before they mount',()=>{const s=fs.readFileSync('admin/quotes/index.html','utf8');assert.match(s,/card\.querySelector\('\.quote-quick-warning'\)/);assert.match(s,/class="quote-quick-warning" hidden/);assert.doesNotMatch(s,/querySelector\('\.quick-warning'\)/);});
test('explicit save operation sends the requested status and blocks edits until completion',()=>{const s=fs.readFileSync('admin/quotes/index.html','utf8');const save=s.slice(s.indexOf('async function save(status)'),s.indexOf('function updateSamplingPreview'));assert.match(save,/title:current\.title,status,cost_data/);assert.match(save,/updated_at:new Date\(Math\.max\(Date\.now\(\),Number\.isFinite\(priorTime\)\?priorTime\+1:0\)\)\.toISOString\(\)/);assert.match(save,/if\(saving\)return/);assert.match(save,/\$\('#editor'\)\.inert=true/);assert.match(save,/finally\{saving=false/);});



const quoteModel=()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 const start=html.indexOf('const isCandle=i=>'),end=html.indexOf('async function refresh()',start);
 assert.ok(start>0&&end>start);
 return vm.runInNewContext("(()=>{"+html.slice(start,end)+"return {yields,internalQty,publicQty,fragranceUnit,pifPerUnit,totalBatchCost,quotedCost,planMetrics};})()");
};
test('batch estimates bottle count from kg / density / volume and uses total batch inputs',()=>{
 const m=quoteModel(),row={name:'香水',pricingMode:'calculated',qty:999,batchKg:30,ml:50,density:1,scentCount:2,fragranceTotal:40000,pifFee:30000,mix:500,container:60,sticker:2,box:25,pack:15,misc:0,displayQty:100,sell:650};
 assert.equal(m.internalQty(row),600);
 assert.equal(m.internalQty({...row,density:0.8}),750);
 assert.equal(m.internalQty({...row,density:1.2}),500);
 assert.equal(m.internalQty({...row,batchKg:0}),0);
 assert.equal(m.internalQty({...row,ml:0}),0);
 assert.equal(m.fragranceUnit(row),40000/600);
 assert.equal(m.pifPerUnit(row),100);
 assert.equal(m.totalBatchCost(row),176200);
 assert.ok(Math.abs(m.quotedCost(row)-176200/600)<1e-8);
 const p=m.planMetrics(row);
 assert.equal(p.revenue,65000);
 assert.equal(p.cost,176200);
 assert.equal(p.gross,-111200);
 assert.ok(p.margin<0&&p.markup<0);
 const other=m.planMetrics({...row,displayQty:500,sell:550});
 assert.equal(other.revenue,275000);
 assert.equal(other.cost,p.cost);
 assert.ok(other.margin>0&&other.markup>0);
 assert.equal(m.publicQty({...row,displayQty:0}),0);
 const vendor=m.planMetrics({...row,pricingMode:'supplier',supplierUnitCost:250});
 assert.equal(vendor.cost,25000);
 assert.equal(vendor.gross,40000);
});
test('scent count lives on customer quote card and estimated count remains internal',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 assert.match(html,/data-quick="scentCount"/);
 assert.match(html,/data-quick="displayQty"/);
 assert.doesNotMatch(html,/data-quick="qty"/);
 assert.doesNotMatch(html,/<th>氣味款數<\/th>/);
 assert.match(html,/<th>預估瓶數（自動計算）<\/th>/);
 assert.match(html,/const internalQty=i=>yields\(i\)\?\.bottles\|\|0/);
 assert.match(html,/const totalBatchCost=i=>/);
 assert.doesNotMatch(html,/class="alt use-yield"/);
 assert.doesNotMatch(html,/<th>產量／氣味分配<\/th>/);
});
test('customer price stays on quick card and internal unit cost is read only',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 assert.match(html,/<th>內部單瓶成本（自動計算）<\/th>/);
 assert.match(html,/data-field="sell" type="hidden"/);
 assert.match(html,/<output class="internal-unit-cost"/);
 assert.match(html,/單瓶價格（NT\$）<input data-quick="sell"/);
 assert.match(html,/quickRowValue\(tr,field\)\.value=input\.value/);
 assert.match(html,/comparisons\.join\(' ｜ '\)/);
 assert.doesNotMatch(html,/costComparison\+=/);
});
test('quote typography remains Chinese-first for all numeric fields',()=>{
 const css=fs.readFileSync('admin/quotes/development.css','utf8');
 assert.match(css,/body, body :where\(\*\)\s*\{\s*font-family: "Noto Serif TC"/);
 assert.match(css,/font-variant-numeric:\s*normal/);
});
