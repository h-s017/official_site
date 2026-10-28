/* Quote preview only. Final quotes must be calculated and stored by the server. */
((root)=>{
 'use strict';
 // exchangeRate includes only the FX buffer; purchaseCardRate is the separate Korean procurement fee.
 const defaults=Object.freeze({exchangeRate:0.0255,internationalPerKg:200,taxReserveRate:0.15,handling:20,serviceRate:0.10,fixedFee:100,domesticDelivery:80,freeShippingThreshold:3000,purchaseCardRate:0.035});
 function estimate(input,overrides={}){
  const c={...defaults,...overrides};
  if(!Number.isSafeInteger(input.krw)||input.krw<=0)throw new Error('Invalid KRW total');
  if(input.grossGrams==null)return {status:'pending_weight',totalTwd:null};
  if(!Number.isSafeInteger(input.grossGrams)||input.grossGrams<=0)throw new Error('Invalid packaged weight');
  if(!['delivery','pickup'].includes(input.fulfillment))throw new Error('Invalid fulfillment method');
  for(const key of Object.keys(defaults))if(!Number.isFinite(c[key])||c[key]<0)throw new Error('Invalid pricing configuration');
  if(c.exchangeRate===0||c.purchaseCardRate>=1||c.taxReserveRate>=1||c.serviceRate>=1)throw new Error('Invalid pricing rate');
  const materials=input.krw*c.exchangeRate;
  const purchaseCardFee=materials*c.purchaseCardRate;
  // An independent consignment estimate. Consolidated shipments need a server-assigned freight share.
  const international=Math.ceil(input.grossGrams/1000)*c.internationalPerKg;
  const taxReserve=(materials+international)*c.taxReserveRate;
  const handling=c.handling,service=(materials+purchaseCardFee+international+taxReserve+handling)*c.serviceRate;
  const fixedFee=c.fixedFee;
  const beforeDelivery=materials+purchaseCardFee+international+taxReserve+handling+service+fixedFee;
  const quotedSubtotalTwd=Math.ceil(beforeDelivery/10)*10;
  // Eligibility uses the quoted subtotal before Taiwan delivery; adding shipping never qualifies an order.
  const domestic=input.fulfillment==='pickup'||quotedSubtotalTwd>=c.freeShippingThreshold?0:c.domesticDelivery;
  const totalTwd=quotedSubtotalTwd+domestic;
  const unroundedTotal=beforeDelivery+domestic;
  return {status:'estimated',totalTwd,internal:{materials,purchaseCardFee,international,taxReserve,handling,service,fixedFee,quotedSubtotalTwd,domestic,unroundedTotal,rounding:quotedSubtotalTwd-beforeDelivery},configuration:{...c}};
 }
 const api={defaults,estimate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HanaPricing=api;
})(typeof window==='undefined'?globalThis:window);
