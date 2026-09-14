const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
const moduleBox={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/connection-status.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:moduleBox.exports,module:moduleBox});
const {connectionLabel,validPhone,normalizePhone}=moduleBox.exports;
test('stored credentials are not mislabeled as verified, and checks become stale',()=>{
 const now=Date.now(),p={delta_api_key:'stored'};
 assert.equal(connectionLabel(p,now),'Not checked');
 assert.equal(connectionLabel({...p,connection_status:'VERIFIED',connection_checked_at:new Date(now).toISOString()},now),'Wallet access verified');
 assert.equal(connectionLabel({...p,connection_status:'VERIFIED',connection_checked_at:new Date(now-1000000).toISOString()},now),'Check stale');
 assert.equal(connectionLabel({...p,connection_requested_at:new Date(now).toISOString()},now),'Check queued');
});
test('contact numbers require country code and normalize only formatting',()=>{
 assert.equal(normalizePhone('+91 98765-43210'),'+919876543210');assert.ok(validPhone('+91 98765-43210'));
 for(const value of ['9876543210','+0123456789','+123','+1234567890123456','<script>'])assert.equal(validPhone(value),false);
});
