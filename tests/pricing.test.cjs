const {test}=require('node:test'),assert=require('node:assert/strict');
const {estimate}=require('../student-tools/materials/pricing.js');
test('weight pending never produces a payable price',()=>{assert.equal(estimate({krw:10000,grossGrams:null}).totalTwd,null);});
test('international freight rounds the packaged shipment up to a whole kg',()=>{for(const [grams,fee]of [[1,200],[999,200],[1000,200],[1001,400],[2000,400],[2001,600]]){assert.equal(estimate({krw:10000,grossGrams:grams,fulfillment:'delivery',payment:'transfer'}).internal.international,fee);}});
test('pickup removes domestic delivery; all other costs remain',()=>{const x={krw:10000,grossGrams:300,payment:'transfer'};const pickup=estimate({...x,fulfillment:'pickup'}),delivery=estimate({...x,fulfillment:'delivery'});assert.equal(delivery.internal.beforeCard-pickup.internal.beforeCard,80);});
test('credit card quote covers a 3.5% retention on the final amount',()=>{const r=estimate({krw:10000,grossGrams:300,fulfillment:'delivery',payment:'card'});assert.equal(r.totalTwd,710);assert.ok(r.totalTwd*.965>=r.internal.beforeCard);assert.ok((r.totalTwd-10)*.965<r.internal.beforeCard);});
test('bank transfer does not add the credit card cost',()=>{assert.equal(estimate({krw:10000,grossGrams:300,fulfillment:'delivery',payment:'transfer'}).totalTwd,680);});
test('invalid weight, totals and rates are rejected',()=>{assert.throws(()=>estimate({krw:-1}));assert.throws(()=>estimate({krw:10000,grossGrams:0}));assert.throws(()=>estimate({krw:10000,grossGrams:300,fulfillment:'delivery',payment:'card'},{cardRate:1}));});
