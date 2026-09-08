const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const mod = { exports:{} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/dashboard-navigation.ts','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS},
}).outputText, {module:mod, exports:mod.exports, URLSearchParams});
const { sectionHref, sectionFromSearch } = mod.exports;

test('bookmarks and reloads preserve each dashboard section', () => {
  const hrefs = new Set();
  for (const section of ['dashboard','trading','risk','analytics','history','billing','settings']) {
    const href = sectionHref(section);
    hrefs.add(href);
    assert.equal(sectionFromSearch(new URL(href, 'https://example.com').search), section);
  }
  assert.equal(hrefs.size, 7);
});
test('missing or unrecognized sections safely open account overview', () => {
  assert.equal(sectionFromSearch(''), 'dashboard');
  assert.equal(sectionFromSearch('?view=unknown'), 'dashboard');
  assert.equal(sectionFromSearch('?view=https://other.example'), 'dashboard');
  assert.equal(sectionFromSearch('?utm_source=bookmark&view=risk'), 'risk');
});
