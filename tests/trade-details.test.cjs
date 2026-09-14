const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript'), fs=require('node:fs'),vm=require('node:vm');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/trade-details.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports});
const {buildPayoff,fillDetails}=mod.exports;
const p={lots:8,contract_value:.001,credit_received:2,adjustment_cost:0,short_call_symbol:'C-BTC-80000-150926',short_put_symbol:'P-BTC-76000-150926'};
test('actual lots and contract multiplier determine expiry payoff and breakevens',()=>{
 const c=buildPayoff(p);assert.equal(c.at(78000),2);assert.equal(c.at(81000),-6);assert.equal(c.maxLoss,Infinity);
 assert.deepEqual(Array.from(c.breakevens),[75750,80250]);
 const scaled=buildPayoff({...p,lots:80,credit_received:20});assert.equal(scaled.at(81000),-60);
});
test('filled wings cap the corresponding tail and retain their actual debit',()=>{
 const c=buildPayoff({...p,long_call_symbol:'C-BTC-82000-150926',long_call_lots:8,long_put_symbol:'P-BTC-74000-150926',long_put_lots:8,adjustment_cost:.5});
 assert.equal(c.at(78000),1.5);assert.equal(c.at(100000),-14.5);assert.equal(c.maxLoss,14.5);
 assert.equal(buildPayoff({...p,contract_value:null}),null);
});
test('weighted entry and exit prices are displayed; missing wing fill is not invented',()=>{
 const rows=fillDetails(p,[{event_type:'entry',detail:{call_fill_price:137,put_fill_price:129}},{event_type:'exit',detail:{execution:{legs:{[p.short_call_symbol]:{filled_lots:8,price_quantity:800}}}}}]);
 assert.equal(rows[p.short_call_symbol].entry,137);assert.equal(rows[p.short_call_symbol].exit,100);assert.equal(rows[p.short_put_symbol].exit,null);
});
