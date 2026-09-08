const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, overrides = {}) {
  const mod = { exports: {} };
  const req = name => name === './glass-card'
    ? { GlassCard: ({ children }) => React.createElement('div', null, children) }
    : require(name);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: mod, exports: mod.exports, require: req, Date, Intl, AbortSignal, console, ...overrides });
  return mod.exports;
}
const { MacroCalendarPanel } = load('components/ui/macro-calendar-panel.tsx');
const render = info => renderToStaticMarkup(React.createElement(MacroCalendarPanel, { info }));
const info = { status:'SCANNING', is_blocked:false, active_event:null, blackout_reason:'', upcoming_events:[] };

test('unknown calendar never renders a clear gate', () => {
  const html = render(null);
  assert.match(html, /Calendar unavailable/);
  assert.doesNotMatch(html, /No news blackout/);
});
test('clear empty calendar is distinct from unavailable data', () => {
  assert.match(render(info), /No remaining qualifying events in this week/);
  assert.match(render(info), /Other entry and risk checks still apply/);
});
test('blocked panel shows event, IST time and entry window', () => {
  const event = { id:'cpi', title:'CPI', country:'USD', impact:'High', timestamp_utc:1789129800 };
  const html = render({ ...info, status:'STANDBY', is_blocked:true, active_event:event,
    blackout_reason:'Entries paused for CPI', upcoming_events:[event] });
  assert.match(html, /News gate active/);
  assert.match(html, /Entries paused for CPI/);
  assert.match(html, /06:00 pm/);
  assert.match(html, /04:00 pm/);
  assert.match(html, /07:00 pm/);
});
test('API fails closed on empty upstream feed', async () => {
  const api = load('app/api/macro/route.ts', { fetch: async () => ({ ok:true, text:async () => '<weeklyevents></weeklyevents>' }), console:{warn(){}} });
  const data = await (await api.GET()).json();
  assert.equal(data.status, 'UNKNOWN');
  assert.equal(data.is_blocked, true);
});
