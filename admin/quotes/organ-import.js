(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HanaQuoteOrgan=api;
})(globalThis,function(){
  'use strict';
  const origin='https://h-s017.github.io', picker=origin+'/myorgan/quote-picker.html';
  const str=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
  function number(value,label){
    const text=str(value);
    if(!text)return '';
    const n=Number(text.replace(',','.'));
    if(!Number.isFinite(n)||n<0)throw Error(label+'格式不正確');
    return n;
  }
  function choices(source){
    if(Array.isArray(source?.formulas))return source.formulas;
    if(source&&(Array.isArray(source.rows)||Array.isArray(source.formula)||Array.isArray(source.payload?.formula)))return [source];
    throw Error('請選擇 MY ORGAN 下載的配方 JSON。');
  }
  function convert(source,model,filename){
    if(!source||typeof source!=='object')throw Error('配方資料無法辨識');
    const p=source.payload||source,meta=source.payload?source:p;
    // Older multi-formula exports reused the active form's DOM for nested metadata.
    const attr=k=>Object.hasOwn(meta,k)?meta[k]:p[k];
    const input=Array.isArray(source.rows)?source.rows:p.formula;
    if(!Array.isArray(input))throw Error('所選配方缺少原料列');
    const f=model.formula('');
    f.name=str(attr('workName'))||'未命名配方';
    f.organId=str(source.id??p.formulaId);f.organDate=str(attr('formulaDate'));
    f.sourceType='使用者提供的 MY ORGAN 匯出快照';f.sourceUrl=origin+'/myorgan/';
    f.organCapacity=str(attr('perfumeCapacity'));f.organConcentration=str(attr('perfumeConcentration'));
    f.sourceFile=filename;f.notes=str(attr('designNote')??p.note);
    for(const r of input){
      if(!r||(!str(r.materialId)&&!str(r.materialCn)&&!str(r.materialEn)))continue;
      const row=model.row();row.organId=str(r.materialId);
      row.name=[str(r.materialEn),str(r.materialCn)].filter(Boolean).join('｜')||'原料 '+row.organId;
      const raw=number(r.actualIngredientG,'實際秤重'),con=str(r.concentration);
      const pct=con.endsWith('%')?Number(con.slice(0,-1)):Number(con);
      const isNeat=con!==''&&(pct===100||(!con.endsWith('%')&&pct===1));
      // MY ORGAN weighs the solution. Quote IFRA rows refer to the supplier's undiluted material.
      row.actualG=isNeat?raw:'';
      row.organRecipe={share:str(r.rowPercent),amount:number(r.amount,'配方用量'),targetG:number(r.targetIngredientG,'目標秤量'),unit:str(r.unit),concentration:con,weighedG:raw,reason:str(r.reason)};
      f.rows.push(row);
    }
    if(!f.rows.length)throw Error('所選配方沒有可帶入的原料');
    const explicit=number(attr('actualFragranceG'),'實際香精總量'),base=number(attr('actualBaseG'),'實際基底量');
    const all=f.rows.every(r=>r.organRecipe.weighedG!=='');
    const weighed=explicit!==''?explicit:all?f.rows.reduce((sum,r)=>sum+r.organRecipe.weighedG,0):'';
    f.organFragranceG=explicit;f.organBaseG=base;
    f.finalG=weighed!==''&&base!==''?Number((weighed+base).toFixed(9)):'';
    // Independent of quote-side edits and local row IDs, so a retry reopens the same snapshot.
    f.organSnapshot=JSON.stringify([f.organId,f.name,f.organDate,f.notes,f.organCapacity,f.organConcentration,explicit,base,f.rows.map(r=>{
      const x=r.organRecipe;
      return [r.organId,r.name,Number(x.amount)||0,x.unit,x.concentration,x.weighedG,x.reason];
    })]);
    return f;
  }
  function costing(f){
    if(!f?.rows?.length)return null;
    let grams=0,cost=0,missing=0;
    for(const r of f.rows){
      const g=number(r.actualG,'原料重量'),price=number(r.costG,'原料單價');
      if(g===''||(g>0&&price==='')){missing++;continue;}
      grams+=g;cost+=g*price;
    }
    return {missing,unit:!missing&&grams>0?cost/grams:null};
  }
  function connect(model,api){
    const el=id=>document.getElementById(id),status=el('organStatus'),pending=el('organPending'),select=el('organChoices');
    let request=null,items=[],filename='',epoch=0,readId=0;
    const tell=msg=>{status.textContent=msg;};
    function reset(){
      epoch++;readId++;request=null;items=[];filename='';select.replaceChildren();pending.hidden=true;tell('');
    }
    function insert(source,file){
      const f=convert(source,model,file);
      api.accept(f);
    }
    el('organPick').onclick=()=>{
      const token=crypto.randomUUID(),params=new URLSearchParams({origin:location.origin,request:token});
      const popup=window.open(picker+'#'+params.toString(),'_blank','popup,width=560,height=640');
      request=popup?{popup,token}:null;
      tell(popup?'請在 MY ORGAN 選擇配方。':'瀏覽器未開啟選擇視窗，可改用匯入 JSON。');
    };
    window.addEventListener('message',event=>{
      if(!request||event.origin!==origin||event.source!==request.popup||event.data?.type!=='hana-organ-quote-selection-v1'||event.data.token!==request.token)return;
      if(api.busy()){tell('正在儲存報價，完成後請重新選取。');return;}
      try{insert(event.data.formula,'MY ORGAN 選取');event.source.postMessage({type:'hana-organ-quote-received-v1',token:request.token},origin);request=null;}
      catch(error){tell(error.message);}
    });
    el('organFile').onchange=async event=>{
      const input=event.target,file=input.files[0],active=epoch,load=++readId;if(!file)return;
      input.value='';pending.hidden=true;items=[];select.replaceChildren();
      try{
        if(file.size>5*1024*1024)throw Error('請使用 5 MB 以下的 JSON 檔');
        const data=JSON.parse(await file.text());if(epoch!==active||load!==readId||api.busy())return;
        if(data.source==='MY ORGAN'&&Array.isArray(data.formula?.rows)){api.legacy(data);return;}
        items=choices(data);filename=file.name;
        if(!items.length)throw Error('檔案沒有配方');
        items.forEach((f,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=str(f?.workName??f?.payload?.workName)||'未命名配方 '+(i+1);select.append(opt);});
        const index=items.findIndex(f=>data.activeFormulaId!=null&&String(f?.id)===String(data.activeFormulaId));select.selectedIndex=Math.max(0,index);
        pending.hidden=false;tell('請確認要帶入哪一支配方。');
      }catch(error){if(epoch===active&&load===readId)tell('匯入失敗：'+error.message);}
    };
    el('organConfirm').onclick=()=>{try{if(api.busy())return;insert(items[select.selectedIndex],filename);pending.hidden=true;items=[];}catch(error){tell(error.message);}};
    return {reset,tell};
  }
  return {choices,convert,costing,connect};
});
