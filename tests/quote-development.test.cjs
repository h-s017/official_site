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


test('calculated quote allocates fragrance and PIF by internal quantity, not displayed quantity',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 const start=html.indexOf('const finishedWeight=i=>');
 const end=html.indexOf('async function refresh()',start);
 assert.ok(start>0&&end>start);
 const source="(()=>{const isCandle=i=>i.name==='容器蠟燭';"+html.slice(start,end)+"return {fragranceUnit,pifPerUnit,quotedCost,publicQty,internalQty};})()";
 const calc=vm.runInNewContext(source);
 const row={name:'香水',pricingMode:'calculated',qty:500,displayQty:100,fragranceTotal:40000,pifFee:30000,scentCount:1,ml:50,density:1,concentration:10,mix:0,container:0,sticker:0,box:0,pack:0,misc:0};
 assert.equal(calc.internalQty(row),500);
 assert.equal(calc.publicQty(row),100);
 assert.equal(calc.fragranceUnit(row),80);
 assert.equal(calc.pifPerUnit(row),60);
 assert.equal(calc.quotedCost(row),140);
 assert.equal(calc.quotedCost({...row,displayQty:300}),140);
 assert.equal(calc.quotedCost({...row,displayQty:0}),140);
 assert.equal(calc.quotedCost({...row,qty:100}),700);
 assert.equal(calc.quotedCost({...row,pricingMode:'supplier',supplierUnitCost:250}),250);
});


test('quick client quantity reads explicit displayQty, not internal qty fallback',()=>{
 const source=fs.readFileSync('admin/quotes/index.html','utf8');
 assert.match(source,/quick-client-qty'\)\.textContent=positiveInt\(i\.displayQty\)>0\?positiveInt\(i\.displayQty\)/);
 assert.match(source,/對客顯示瓶數尚未填寫/);
 assert.match(source,/data-quick="displayQty"/);
 assert.match(source,/quickRowValue\(tr,field\)\.value=input\.value/);
});


test('quote typography uses the same Chinese-first font for numbers and Chinese text',()=>{
 const css=fs.readFileSync('admin/quotes/development.css','utf8');
 assert.match(css,/body, body :where\(\*\)\s*\{\s*font-family: "Noto Serif TC"/);
 assert.match(css,/font-variant-numeric:\s*normal/);
});

test('cost table shows calculated internal unit cost instead of editing the selling price',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 assert.match(html,/<th>內部單瓶成本（自動計算）<\/th>/);
 assert.doesNotMatch(html,/<th>單瓶對客價（回推輸入）<\/th>/);
 assert.match(html,/data-field="sell" type="hidden"/);
 assert.match(html,/<output class="internal-unit-cost"/);
 assert.match(html,/querySelector\('\.internal-unit-cost'\)\.textContent=supplier/);
 assert.match(html,/單瓶價格（NT\$）<input data-quick="sell"/);
 assert.doesNotMatch(html,/<button type="button" class="alt apply-row-price"/);
 assert.match(html,/quickRowValue\(tr,field\)\.value=input\.value/);
 assert.match(html,/fields\.forEach\(f=>i\[f\]=/);
});

test('quote alternatives preserve separate sale prices and allocate costs only to quoted quantity',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 const start=html.indexOf('const finishedWeight=i=>');
 const end=html.indexOf('async function refresh()',start);
 assert.ok(start>0&&end>start);
 const model=vm.runInNewContext("(()=>{const isCandle=i=>i.name==='容器蠟燭';"+html.slice(start,end)+"return {planMetrics,quotedCost};})()");
 const row={name:'香水',pricingMode:'calculated',qty:600,displayQty:100,sell:600,fragranceTotal:40000,pifFee:0,scentCount:1,ml:50,density:1,mix:0,container:0,sticker:0,box:0,pack:0,misc:200};
 const p=model.planMetrics(row);
 assert.equal(p.unitCost,40000/600+200);
 assert.equal(p.revenue,60000);
 assert.ok(Math.abs(p.cost-(40000/600+200)*100)<1e-8);
 assert.ok(Math.abs(p.gross-(60000-(40000/600+200)*100))<1e-8);
 assert.ok(Math.abs(p.perSold-(600-(40000/600+200)))<1e-8);
 assert.ok(p.margin>0&&p.markup>0);
 assert.equal(model.quotedCost({...row,displayQty:500}),p.unitCost);
 const larger=model.planMetrics({...row,displayQty:500});
 assert.ok(Math.abs(larger.cost-p.cost*5)<1e-8);
 assert.ok(Math.abs(larger.gross-(300000-(40000/600+200)*500))<1e-8);
 assert.ok(larger.margin>0&&larger.markup>0);
 const equal=model.planMetrics({...row,displayQty:600});
 assert.equal(equal.perSold,600-equal.unitCost);
 assert.equal(equal.margin,(equal.gross/equal.revenue)*100);
 const supplier=model.planMetrics({...row,pricingMode:'supplier',supplierUnitCost:300,supplierQty:600});
 assert.equal(supplier.cost,30000);
 assert.equal(supplier.gross,30000);
 assert.equal(supplier.margin,50);
 const unknown=model.planMetrics({...row,qty:0});
 assert.equal(unknown.valid,false);
 assert.equal(unknown.margin,null);
});

test('cost comparison keeps alternative quote plans separate',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 assert.match(html,/comparisons\.join\(' ｜ '\)/);
 assert.doesNotMatch(html,/costComparison\+=/);
 assert.match(html,/方案平均單瓶毛利/);
 assert.match(html,/方案毛利率/);
 assert.match(html,/方案實際加成率/);
});

test('two alternative quote plans retain independent sales prices and unit-cost allocations',()=>{
 const html=fs.readFileSync('admin/quotes/index.html','utf8');
 const a=html.indexOf('const finishedWeight=i=>');
 const b=html.indexOf('async function refresh()',a);
 const {planMetrics,quotedCost}=vm.runInNewContext("(()=>{const isCandle=i=>i.name==='容器蠟燭';"+html.slice(a,b)+"return {planMetrics,quotedCost};})()");
 const common={name:'香水',pricingMode:'calculated',qty:600,fragranceTotal:40000,pifFee:0,scentCount:1,ml:50,density:1,mix:0,container:0,sticker:0,box:0,pack:0,misc:200};
 const a100=planMetrics({...common,displayQty:100,sell:650});
 const b500=planMetrics({...common,displayQty:500,sell:550});
 assert.equal(a100.revenue,65000);
 assert.equal(b500.revenue,275000);
 assert.equal(a100.unitCost,b500.unitCost);
 assert.ok(Math.abs(a100.cost-100*quotedCost(common))<1e-9);
 assert.ok(Math.abs(b500.cost-500*quotedCost(common))<1e-9);
 assert.ok(Math.abs(a100.gross-100*(650-quotedCost(common)))<1e-9);
 assert.ok(Math.abs(b500.gross-500*(550-quotedCost(common)))<1e-9);
 assert.equal(a100.perSold,650-a100.unitCost);
 assert.equal(b500.perSold,550-b500.unitCost);
 assert.ok(a100.margin>0&&b500.margin>0);
 const loss=planMetrics({...common,displayQty:100,sell:100});
 assert.ok(loss.gross<0&&loss.margin<0&&loss.markup<0);
});
