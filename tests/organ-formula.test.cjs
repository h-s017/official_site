const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('../organ/formula-engine.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('organ/safety-data.js','utf8'),context);
const source=context.window.HFUGUE_SAFETY_DATA;
const materials=Object.entries(source.materialNames).map(([id,en])=>({id,en,kind:'香基'}));
const meta={perfumeCapacity:'10',perfumeConcentration:'20%',productCategory:'cat4'};
const row=(id=1005,amount='1',concentration='100%',unit='g',conversion='')=>({materialId:id,amount,concentration,unit,conversion});
const calc=(rows,overrides={},db=materials)=>E.calculate({...meta,...overrides},rows,db,source);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('CW dataset has exactly 80 unique matching product identities',()=>{
  assert.equal(source.rows.length,80);assert.equal(new Set(source.rows.map(r=>r[0])).size,80);
  assert.equal(materials.length,80);
  const html=fs.readFileSync('organ/index.html','utf8');
  const bases=vm.runInNewContext(html.match(/const BASES_80=(\[[\s\S]*?\n\]);/)[1]);
  for(const b of bases)assert.equal(source.materialNames[b.id],b.en);
});
test('percent inputs are percentage points including 1%, 0.1%, 1 and unicode percent',()=>{
  for(const [value,expected] of [['1%',1],['1',1],['0.1%',.1],['0.1',.1],['1％',1],['0,5%',.5],['100%',100],['0%',0]])assert.equal(E.percent(value),expected);
  for(const value of ['',null,'101%','-1%','abc','10garbage','1/2','Infinity','1e3'])assert.equal(E.percent(value),null);
});
test('g formula uses dilution-adjusted weights and balances final mass',()=>{
  const result=calc([row(1005),row(1008,'1','10%')]);
  assert.equal(result.feasible,true);near(result.rows[0].rowPercentNumber,100/1.1);
  near(result.rows[1].rowPercentNumber,10/1.1);
  near(result.rows[0].targetIngredientG,2/1.1);near(result.rows[1].targetIngredientG,2/1.1);
  near(result.rows.reduce((s,r)=>s+r.finishedPercent,0),20);
  near(result.stockTotalG+result.solventG,10);
});
test('very small percentages are neither multiplied by 100 nor rounded to safe zero',()=>{
  const result=calc([row()],{perfumeConcentration:'0.1%'});
  near(result.rows[0].finishedPercent,.1);near(result.targetFragranceG,.01);
  assert.equal(E.fmt(.00000007),'7.00e-8');
});
test('known Riesling limits differ by product category',()=>{
  for(const [category,limit,level] of [['cat4',.93,'over'],['cat9',1.76,'ok'],['cat10b',6.52,'ok']]){
    const result=calc([row(1033)],{productCategory:category,perfumeConcentration:'1%'});
    assert.equal(result.rows[0].safety.limit,limit);assert.equal(result.rows[0].safety.level,level);
  }
});
test('duplicate CW ingredient rows are aggregated across dilutions before comparison',()=>{
  const result=calc([row(1033,'.03'),row(1033,'.3','10%'),row(1005,'.94')]);
  near(result.rows[0].safety.actual,1.2);assert.equal(result.rows[0].safety.level,'over');
  assert.equal(result.rows[1].safety.level,'over');assert.equal(result.rows[0].safety.combinedRows,2);
  assert.equal(result.summary.checked,2);assert.equal(result.summary.over,1);
});
test('exact limit passes while 80% warns and any meaningful exceedance fails',()=>{
  for(const [concentration,level] of [['0.744%','near'],['0.93%','near'],['0.93001%','over'],['0.5%','ok']]){
    assert.equal(calc([row(1033)],{perfumeConcentration:concentration}).rows[0].safety.level,level);
  }
});
test('different input units are combined only after explicit conversion to g',()=>{
  const result=calc([row(1005,'1'),row(1008,'2','100%','mL','.5'),row(1057,'20','100%','滴','.05')]);
  assert.equal(result.feasible,true);for(const r of result.rows)near(r.rowPercentNumber,100/3);
  near(result.stockTotalG,2);
});
test('unmeasured drops and missing density block all weight and IFRA verdicts',()=>{
  for(const unit of ['滴','mL']){
    const result=calc([row(1005,'1','100%',unit),row(1033)]);
    assert.equal(result.valid,false);assert.equal(result.feasible,false);assert.equal(result.stockTotalG,null);
    assert.equal(result.summary.level,'neutral');assert.ok(result.errors.length);
    assert.equal(result.rows[1].safety,undefined);
  }
});
test('invalid amount, concentration, final weight and fragrance rate cannot produce a pass',()=>{
  const cases=[calc([row(1005,'-1')]),calc([row(1005,'')]),calc([row(1005,'1','')]),calc([row(1005,'1','0%')]),calc([row()],{perfumeCapacity:'0'}),calc([row()],{perfumeConcentration:'101%'}),calc([row()],{perfumeConcentration:''}),calc([row(99999)])];
  for(const result of cases){assert.equal(result.feasible,false);assert.notEqual(result.summary.level,'ok');}
});
test('excess diluted stock blocks a physically impossible target',()=>{
  const result=calc([row(1005,'1','10%')]);
  near(result.stockTotalG,20);assert.equal(result.feasible,false);assert.equal(result.rows[0].safety.level,'review');
  assert.match(result.errors.join(' '),/超過成品重量/);
});
test('empty and zero-use rows do not invent a valid recipe',()=>{
  assert.equal(calc([]).feasible,false);assert.equal(calc([row(1033,'0')]).feasible,false);
  const result=calc([row(),row(1033,'0')]);assert.equal(result.summary.over,0);assert.equal(result.summary.checked,1);
});
test('missing category, missing documents, partial category and reviewed limits never show pass',()=>{
  assert.equal(calc([row()],{productCategory:''}).summary.level,'neutral');
  for(const id of [1014,1015,1017,1065,1071]){
    const result=calc([row(id)],{perfumeConcentration:'0.1%'});
    assert.equal(result.rows[0].safety.level,'review');
  }
  assert.equal(calc([row(1074)],{productCategory:'cat10b'}).rows[0].safety.level,'review');
  assert.equal(calc([row(1015)]).rows[0].safety.level,'over');
});
test('renaming a builtin cannot borrow its original supplier limit',()=>{
  const changed=materials.map(m=>({...m,en:m.id==='1005'?'Other material':m.en}));
  assert.equal(calc([row()],{},changed).rows[0].safety.level,'review');
});
test('custom monomers default to review and numeric source data remains for teacher review',()=>{
  const custom={id:1081,en:'Test monomer',kind:'單體',cas:'123-45-6'};
  const db=[...materials,custom];
  assert.equal(calc([row(1081)],{},db).rows[0].safety.level,'review');
  custom.ifraSafety={status:'numeric',cat4:'0.5',source:'Supplier certificate 2026-09',amendment:'51st'};
  assert.equal(calc([row(1081)],{},db).rows[0].safety.level,'over');
  assert.equal(calc([row(1081)],{perfumeConcentration:'0.1%'},db).rows[0].safety.level,'review');
  custom.ifraSafety.cat4='0';assert.equal(calc([row(1081)],{},db).rows[0].safety.label,'禁止使用');
});
test('custom limits need source and matching amendment',()=>{
  const custom={id:1081,en:'Test',kind:'單體',ifraSafety:{status:'numeric',cat4:'100',amendment:'51st'}};
  assert.equal(calc([row(1081)],{},[custom]).rows[0].safety.limit,null);
  custom.ifraSafety.source='Certificate';custom.ifraSafety.amendment='49th';
  assert.equal(calc([row(1081)],{},[custom]).rows[0].safety.limit,null);
});
test('same-CAS custom monomers aggregate even with different record IDs',()=>{
  const custom=[1081,1082].map(id=>({id,en:'Test '+id,cas:'123-45-6',kind:'單體',ifraSafety:{status:'numeric',cat4:'1',source:'Certificate',amendment:'51st'}}));
  const result=calc([row(1081,'.03'),row(1082,'.03'),row(1005,'.94')],{},[...materials,...custom]);
  near(result.rows[0].safety.actual,1.2);assert.equal(result.summary.over,1);
});
test('explicitly prohibited custom ingredients are blocked',()=>{
  const custom={id:1081,en:'Test',kind:'單體',ifraSafety:{status:'prohibited'}};
  assert.equal(calc([row(1081)],{},[custom]).rows[0].safety.label,'禁止使用');
});
test('each formula export computes its own metadata, totals and results without DOM cross-talk',()=>{
  const c={HanaFormula:E,db:materials,window:{HFUGUE_SAFETY_DATA:source}};
  vm.createContext(c);vm.runInContext(fs.readFileSync('organ/formula-ui.js','utf8'),c);
  const a=c.payloadForFormula(meta,[row(1033)],'a');
  const b=c.payloadForFormula({...meta,perfumeCapacity:'30',perfumeConcentration:'0.5%',productCategory:'cat9'},[row(1033)],'b');
  assert.equal(a.totals.perfumeCapacityG,10);near(a.totals.targetFragranceG,2);assert.equal(a.ifra.over,1);
  assert.equal(b.productCategory,'cat9');assert.equal(b.totals.perfumeCapacityG,30);near(b.totals.targetFragranceG,.15);assert.equal(b.ifra.over,0);
});
test('import preserves explicit zeros and low concentrations instead of substituting defaults',()=>{
  const html=fs.readFileSync('organ/index.html','utf8');
  const c={emptyFormulaData:()=>({}),uid:()=> 'imported',todayISO:()=> '2026-11-02'};
  vm.createContext(c);
  for(const name of ['importedRowFromPayload','importedFormulaFromPayload'])vm.runInContext(html.match(new RegExp('^function '+name+'.*$','m'))[0],c);
  const imported=c.importedFormulaFromPayload({perfumeCapacity:0,perfumeConcentration:'0.1%',formula:[{materialId:1033,amount:0,concentration:'1%',unit:'g'}]});
  assert.equal(imported.perfumeCapacity,'0');assert.equal(imported.perfumeConcentration,'0.1%');
  assert.equal(imported.rows[0].amount,'0');assert.equal(imported.rows[0].concentration,'1%');
});
