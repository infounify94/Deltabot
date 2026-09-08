const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/currency.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {module:mod,exports:mod.exports});
const fmt = mod.exports.formatAccountCurrency;
test('account currency formats rupees, negative amounts and grouping without approximation symbols',()=>{
 assert.equal(fmt(1000,'INR'),'₹85,000.00');
 assert.equal(fmt(-1,'INR'),'-₹85.00');
 assert.equal(fmt(100,'INR'),'₹8,500.00');
 assert.equal(fmt(240,'INR'),'₹20,400.00');
 assert.equal(fmt(0,'INR'),'₹0.00');
 assert.equal(fmt(-0,'USD'),'$0.00');
 assert.equal(fmt(1234.56,'USD'),'$1,234.56');
 assert.equal(fmt(NaN,'INR'),'Unavailable');
});
