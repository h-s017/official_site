/* HANA customer-facing quote -> Canva-editable PowerPoint export.
   No Supabase write and no internal costing fields are exported. */
(function(root){
'use strict';
const LIB='https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
let promise;
function library(){
 if(root.pptxgen)return Promise.resolve(root.pptxgen);
 if(promise)return promise;
 promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=LIB;script.async=true;
  script.onload=()=>root.pptxgen?resolve(root.pptxgen):reject(Error('PPTX 工具未正確載入'));
  script.onerror=()=>reject(Error('無法載入 PPTX 工具，請檢查網路或瀏覽器擋廣告設定'));
  document.head.append(script);
 }).catch(e=>{promise=null;throw e;});
 return promise;
}
const str=v=>String(v??'').trim();
const num=v=>Math.max(0,Number(v)||0);
const money=v=>'NT$ '+num(v).toLocaleString('zh-TW',{maximumFractionDigits:0});
const ink='303234',soft='64716C',line='D9DEDA',paper='F7F8F5',accent='667C73',white='FFFFFF';
const font='Noto Serif TC';
function textbox(slide,text,x,y,w,h,size=17,color=ink,opts={}){
 slide.addText(str(text),{x,y,w,h,fontFace:font,fontSize:size,color,margin:0,breakLine:false,valign:'mid',fit:'shrink',...opts});
}
function rule(slide,y){slide.addShape('line',{x:0.75,y,w:11.85,h:0,line:{color:line,width:1}});}
function base(pptx,label,index){
 const s=pptx.addSlide();s.background={color:white};
 s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:0.095,line:{color:accent,transparency:100},fill:{color:accent}});
 textbox(s,'HANA SCENT ARTIST',0.75,0.36,5.5,0.32,12,ink,{charSpacing:1.5});
 textbox(s,label.toUpperCase(),8.1,0.36,4.45,0.32,10,soft,{align:'right',charSpacing:1});
 rule(s,0.96);rule(s,6.92);
 textbox(s,'BRAND SCENT DEVELOPMENT  /  HANA SCENT ARTIST',0.75,7.04,9.2,0.19,8,soft);
 textbox(s,String(index).padStart(2,'0'),11.7,7.02,0.8,0.22,9,soft,{align:'right'});
 return s;
}
function title(s,heading,sub){
 textbox(s,heading,0.8,1.23,11.4,0.7,29,ink);
 if(sub)textbox(s,sub,0.8,2.01,11.4,0.53,13,soft);
}
function paragraph(s,body,x,y,w,h,size=18){
 textbox(s,str(body).replace(/\r\n?/g,'\n'),x,y,w,h,size,ink,{valign:'top',breakLine:false,paraSpaceAfterPt:12});
}
function card(pptx,s,x,y,w,h,heading,body){
 s.addShape(pptx.ShapeType.rect,{x,y,w,h,rectRadius:0,line:{color:line,width:1},fill:{color:paper}});
 textbox(s,heading,x+0.24,y+0.18,w-0.48,0.36,18,ink);
 paragraph(s,body,x+0.24,y+0.68,w-0.48,h-0.88,15);
}
function textPages(pptx,label,heading,body,idx){
 const text=str(body);if(!text)return idx;
 const chunks=[];let left=text.replace(/\r\n?/g,'\n');
 while(left.length){chunks.push(left.slice(0,360));left=left.slice(360);}
 chunks.forEach((chunk,i)=>{
  const s=base(pptx,label,++idx);title(s,heading+(i?'（續）':''));
  paragraph(s,chunk,0.85,2.26,11.55,4.22,20);
 });
 return idx;
}
function exportData(data){
 const p=data&&data.public_data||{};
 const rawItems=Array.isArray(p.items)?p.items:[];
 const items=rawItems.map(i=>({
  name:str(i.name)||'香氛商品',ml:num(i.ml),weight:num(i.weight),unit:str(i.unit)||'mL',
  qty:Math.floor(num(i.qty)),price:num(i.unitPrice),ready:Boolean(i.quoteReady),
  note:str(i.planNote),scentCount:Math.floor(num(i.scentCount))||1
 }));
 const d=p.design||{};
 return {client:str(data.client_name)||'品牌客戶',heading:str(data.title)||'品牌氣味與香氛商品開發合作提案',
  brief:str(p.brandBrief),recommendation:str(p.recommendation),pending:str(p.pendingItems),
  next:str(p.nextSteps),items,
  design:[['LOGO 設計',d.logoFee,d.logoDeliverables],['貼紙設計',d.labelFee,d.labelDeliverables],
          ['視覺設計',d.visualFee,d.visualDeliverables],['其他個別化設計',d.customDesignFee,d.customDesignDeliverables]]
    .filter(row=>row[1]!==null&&row[1]!==undefined&&str(row[1])!=='').map(([name,fee,desc])=>({name,fee:num(fee),desc:str(desc)})),
  sampling:p.sampling&&p.sampling.perRound!==null&&p.sampling.perRound!==undefined&&num(p.sampling.rounds)>0?
    {fee:num(p.sampling.perRound),rounds:Math.floor(num(p.sampling.rounds)),note:str(p.sampling.note)}:null,
  photos:Array.isArray(p.photos)?p.photos.map(x=>({caption:str(x.caption)})):[]};
}
async function download(record){
 if(!record)throw Error('請先開啟或新增一筆報價');
 const data=exportData(record);
 const Gen=await library();const pptx=new Gen();
 pptx.layout='LAYOUT_WIDE';pptx.author='HANA SCENT ARTIST';pptx.subject='Editable customer quote for Canva';
 pptx.title=data.heading;pptx.lang='zh-TW';pptx.theme={headFontFace:font,bodyFontFace:font,lang:'zh-TW'};
 let index=0;
 let s=base(pptx,'CUSTOMER PROPOSAL',++index);
 textbox(s,'BRAND SCENT DEVELOPMENT',0.85,1.4,11.5,0.35,15,accent,{charSpacing:2});
 textbox(s,data.heading,0.85,2.17,11.3,1.75,37,ink,{bold:false,valign:'mid'});
 textbox(s,'PROPOSAL FOR  /  '+data.client,0.85,4.62,11.4,0.5,19,ink);
 textbox(s,new Date().toLocaleDateString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit'}),0.85,5.29,6,0.32,12,soft);
 index=textPages(pptx,'BRAND BRIEF','品牌需求與合作摘要',data.brief,index);
 index=textPages(pptx,'DIRECTION','合作建議與方案比較',data.recommendation,index);
 if(data.items.length){
  const perPage=4;
  for(let start=0;start<data.items.length;start+=perPage){
   const sl=base(pptx,'PRODUCT OPTIONS',++index);title(sl,'香氛商品與合作方案',data.client);
   data.items.slice(start,start+perPage).forEach((it,k)=>{
    const y=2.2+k*1.02;
    sl.addShape(pptx.ShapeType.rect,{x:0.78,y,w:11.8,h:0.87,line:{color:line,width:0.7},fill:{color:k%2?white:paper}});
    textbox(sl,it.name,1.02,y+0.1,4.3,0.26,17,ink);
    let spec=it.unit==='g'?it.weight+' g':it.ml+' mL';
    textbox(sl,spec+'  /  '+(it.qty?it.qty.toLocaleString('zh-TW')+' 件':'數量待確認'),5.1,y+0.12,3.5,0.24,13,soft);
    textbox(sl,it.ready&&it.qty&&it.price?money(it.price)+'／件':'價格待確認',9.0,y+0.1,3.15,0.27,17,ink,{align:'right'});
    if(it.note)textbox(sl,it.note.replace(/\n/g,' · ').slice(0,160),1.03,y+0.47,10.9,0.23,11,soft);
   });
  }
 }
 if(data.design.length){
  s=base(pptx,'DESIGN SERVICES',++index);title(s,'品牌識別與設計服務');
  data.design.forEach((it,j)=>{
   const y=2.15+j*1.02;
   textbox(s,it.name,0.95,y,5.2,0.32,19,ink);
   textbox(s,money(it.fee),9.3,y,2.9,0.32,19,ink,{align:'right'});
   if(it.desc)textbox(s,it.desc.replace(/\n/g,' · ').slice(0,180),0.95,y+0.42,11.0,0.33,12,soft);
   rule(s,y+0.84);
  });
 }
 if(data.sampling){
  s=base(pptx,'SCENT SAMPLING',++index);title(s,'氣味打樣');
  card(pptx,s,0.85,2.3,5.6,2.4,'單次打樣費用',money(data.sampling.fee));
  card(pptx,s,6.67,2.3,5.6,2.4,'預計打樣次數',data.sampling.rounds+' 次  /  合計 '+money(data.sampling.fee*data.sampling.rounds));
  if(data.sampling.note)paragraph(s,data.sampling.note,0.9,5.04,11.3,1.1,14);
 }
 index=textPages(pptx,'NEXT STEPS','後續合作流程',data.next,index);
 index=textPages(pptx,'OPEN ITEMS','待確認事項',data.pending,index);
 if(data.photos.length){
  s=base(pptx,'VISUAL REFERENCE',++index);title(s,'視覺參考與素材位置','圖片保留為 Canva 中可替換的編輯區塊');
  data.photos.slice(0,4).forEach((photo,j)=>{
   const x=0.86+(j%2)*6.0,y=2.16+Math.floor(j/2)*2.1;
   card(pptx,s,x,y,5.55,1.85,'圖片 '+(j+1),photo.caption||'請在 Canva 放入圖片');
  });
 }
 s=base(pptx,'THANK YOU',++index);
 textbox(s,'HANA SCENT ARTIST',0.9,2.5,11.3,0.7,36,ink,{align:'center',charSpacing:2});
 textbox(s,'讓氣味成為品牌故事的一部分',0.9,3.58,11.3,0.55,20,soft,{align:'center'});
 textbox(s,'hanascent.com',0.9,5.12,11.3,0.35,13,soft,{align:'center'});
 const filename='HANA_Canva_Proposal_'+(data.client.replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,35)||'client')+'.pptx';
 await pptx.writeFile({fileName:filename});
 return filename;
}
root.HanaQuoteCanva={download,exportData};
})(window);
