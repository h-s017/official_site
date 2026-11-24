const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../admin/quotes/development-model.js');
const O=require('../admin/quotes/organ-import.js');

const native={activeFormulaId:'f2',formulas:[
 {id:'f1',workName:'作品甲',actualBaseG:'',actualFragranceG:'',formulaDate:'2026-10-12',designNote:'甲筆記',payload:{
  workName:'作品乙',actualBaseG:'100',actualFragranceG:'5',actualCompletedG:105,note:'乙筆記',formula:[
   {materialId:7,materialEn:'Sample A',materialCn:'甲',unit:'滴',concentration:'10%',amount:3,actualIngredientG:'2',targetIngredientG:4},
   {materialId:8,materialEn:'Sample B',unit:'g',concentration:'100%',amount:2,actualIngredientG:'',targetIngredientG:1},
   {materialId:'',actualIngredientG:0}]}},
 {id:'f2',workName:'作品乙',actualBaseG:'5',actualFragranceG:'',payload:{formula:[
  {materialId:'a',amount:1,unit:'g',actualIngredientG:2,concentration:'100%'},
  {materialId:'b',amount:1,unit:'g',actualIngredientG:1,concentration:'1'}]}}
]};
test('MY ORGAN multi-export uses the selected work and ignores stale nested form metadata',()=>{
 const [chosen]=O.choices(native);
 const f=O.convert(chosen,M,'backup.json');
 assert.deepEqual([f.name,f.notes,f.finalG,f.organDate],['作品甲','甲筆記','','2026-10-12']);
 assert.equal(f.rows.length,2);
 assert.equal(f.rows[0].name,'Sample A｜甲');
 assert.deepEqual(f.rows.map(r=>r.actualG),['','']);
 assert.deepEqual(f.rows[0].organRecipe,{share:'',amount:3,unit:'滴',concentration:'10%',targetG:4,weighedG:2,reason:''});
 assert.equal(O.costing(f).unit,null);
 assert.equal(f.rows[0].costG,'');
 assert.equal(M.validate({...M.empty(),formulas:[f]}),true);
});
test('confirmed masses & costs support weighted totals and require all contributing prices',()=>{
 const f=O.convert(native.formulas[1],M,'backup.json');
 assert.deepEqual(f.rows.map(r=>r.actualG),[2,1]);assert.equal(f.finalG,8);
 assert.deepEqual(O.costing(f),{missing:2,unit:null});
 f.rows[0].costG='12';f.rows[1].costG='0';
 assert.deepEqual(O.costing(f),{missing:0,unit:8});
 assert.equal(O.costing({...f,rows:[]}),null);
});
test('picker and native export produce the same immutable key, revised weights create a new version',()=>{
 const source=native.formulas[0];
 const wire={...source,rows:structuredClone(source.payload.formula)};delete wire.payload;
 const f=O.convert(wire,M,'MY ORGAN 選取'),other=O.convert(source,M,'備份.json');
 assert.equal(f.organSnapshot,other.organSnapshot);
 wire.rows[0].actualIngredientG=3;
 assert.notEqual(O.convert(wire,M,'再次帶入').organSnapshot,f.organSnapshot);
});
test('single-formula export never treats projected mass or an empty row as measured mass',()=>{
 const raw={formulaId:'X',workName:'樣品',actualCompletedG:99,totals:{actualIngredientG:3},formula:[{materialId:'x',concentration:'1%',actualIngredientG:'',targetIngredientG:3,unit:'滴',amount:2}]};
 assert.equal(O.choices(raw)[0],raw);
 assert.equal(O.convert(raw,M,'X').finalG,'');
 assert.equal(O.convert(raw,M,'X').rows[0].actualG,'');
 assert.throws(()=>O.convert({rows:[{}]},M,'X'));
 assert.throws(()=>O.convert({rows:[{materialId:1,actualIngredientG:-1}]},M,'X'));
 assert.throws(()=>O.choices({other:[]}));
});
test('old default links reopen the master, and custom source links survive roundtrips',()=>{
 assert.equal(M.normalize({links:{organ:'/organ/'}}).links.organ,'https://h-s017.github.io/myorgan/');
 assert.equal(M.normalize({links:{organ:'https://custom.example/organ'}}).links.organ,'https://custom.example/organ');
});
