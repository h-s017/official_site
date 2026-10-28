(() => {
 'use strict';
 const {db,check,status,logout}=window.HanaStudents,$=id=>document.getElementById(id);
 let pending=null;
 const message=text=>{$('memberStatus').textContent=text;};
 async function identity(){const access=await status();if(!access?.allowed){location.replace('/student-tools/?next=materials');return false;}document.body.hidden=false;$('orderFields').hidden=false;$('memberIdentity').textContent=access.full_name||'HANA 管理員';if(!$('customerName').value)$('customerName').value=access.full_name||'';return true;}
 function review(){$('orderReview').replaceChildren();for(const item of rows()){const p=document.createElement('p');p.textContent=item.p.zh+' / '+item.o.label+' × '+item.qty+' · '+money(item.o.price*item.qty);$('orderReview').append(p);}const total=document.createElement('strong');total.textContent='商品合計 '+money(rows().reduce((n,x)=>n+x.qty*x.o.price,0));$('orderReview').append(total);}
 $('memberOpen').onclick=async()=>{if(await identity()){$('members').showModal();review();}};
 $('memberClose').onclick=()=>$('members').close();$('memberLogout').onclick=logout;
 $('checkout').onclick=async()=>{$('cart').close();if(await identity()){$('members').showModal();review();message('確認購物車後送出訂單。');}};
 $('orderForm').onsubmit=async e=>{e.preventDefault();const button=$('submitOrder');button.disabled=true;try{
  if(!await identity())return;if(!cart.length)throw new Error('Empty cart');
  const items=cart.map(x=>({option_id:x.option,qty:x.qty})),name=$('customerName').value.trim(),note=$('orderNote').value;
  const signature=JSON.stringify({items,name,note});if(pending?.signature!==signature)pending={signature,id:crypto.randomUUID()};
  const id=await check(await db.rpc('submit_material_order',{p_request_id:pending.id,p_name:name,p_note:note,p_items:items}));pending=null;cart=[];save();review();
  message('訂單已送出，編號：'+id+'。待 HANA 確認運費、稅費與付款方式，尚未付款。');await history();
 }catch{message('訂單未完成，請確認購物車及學員審核資格，稍後重試。');}finally{button.disabled=false;}};
 async function history(){const orders=await check(await db.from('material_orders').select('id,created_at,status,total,items').order('created_at',{ascending:false}).limit(30));$('orderHistory').replaceChildren();if(!orders.length){$('orderHistory').textContent='目前沒有訂單';return;}for(const order of orders){const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent='訂單 '+order.id;p.textContent=new Date(order.created_at).toLocaleString('zh-TW')+' · '+({pending_confirmation:'待確認',confirmed:'已確認',cancelled:'已取消',fulfilled:'已完成'}[order.status]||order.status)+' · '+money(order.total);card.append(h,p);for(const item of order.items){const line=document.createElement('p');line.textContent=item.name+' / '+item.specification+' × '+item.qty+' · '+money(item.price);card.append(line);}$('orderHistory').append(card);}}
 $('loadOrders').onclick=()=>history().catch(()=>message('無法載入訂單，請重新登入。'));
 identity().catch(()=>{location.replace('/student-tools/?next=materials');});
})();
