const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function loadMiddleware(user, changes) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../middleware.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, process,
    require: name => name === '@supabase/ssr' ? {
      createServerClient: (_url, _key, options) => ({ auth: {
        getUser: async () => { options.cookies.setAll(changes); return { data: { user } }; },
      } }),
    } : require(name),
  });
  return module.exports.middleware;
}

test('session refresh keeps every cookie chunk on response and forwarded request', async () => {
  const cookies = [0, 1].map(n => ({ name: `qa-auth.${n}`, value: `chunk-${n}`, options: { path: '/', sameSite: 'lax' } }));
  const response = await loadMiddleware({ id: 'qa' }, cookies)(new NextRequest('http://localhost/dashboard'));
  assert.equal(response.cookies.get('qa-auth.0').value, 'chunk-0');
  assert.equal(response.cookies.get('qa-auth.1').value, 'chunk-1');
  assert.match(response.headers.get('x-middleware-request-cookie'), /qa-auth\.0=chunk-0/);
  assert.match(response.headers.get('x-middleware-request-cookie'), /qa-auth\.1=chunk-1/);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('signed-out redirect preserves deletion of all stale session chunks', async () => {
  const cookies = [0, 1].map(n => ({ name: `qa-auth.${n}`, value: '', options: { path: '/', maxAge: 0 } }));
  const response = await loadMiddleware(null, cookies)(new NextRequest('http://localhost/dashboard/billing'));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'http://localhost/login');
  assert.equal(response.cookies.getAll().length, 2);
  assert.ok(response.cookies.getAll().every(cookie => cookie.maxAge === 0));
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('public homepage remains available without a session', async () => {
  const response = await loadMiddleware(null, [])(new NextRequest('http://localhost/'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
});
