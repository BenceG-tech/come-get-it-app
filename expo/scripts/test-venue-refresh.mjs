import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function moduleFrom(path, imports = {}, globals = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, URL, Map, Set, Date, AbortController, setTimeout, clearTimeout, console, ...globals });
  return exports;
}
function appState() {
  let listener;
  let removed = false;
  return { currentState: 'active', addEventListener: (_, callback) => {
    listener = callback; return { remove() { removed = true; listener = undefined; } };
  }, change(state) { this.currentState = state; listener?.(state); }, get removed() { return removed; } };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

test('focus immediately fetches; only resume refetches; cleanup removes listener and cancels', () => {
  const { startVenueRefreshLifecycle } = moduleFrom('../lib/venueRefreshLifecycle.ts');
  const state = appState(); let refreshes = 0, cancelled = 0;
  const stop = startVenueRefreshLifecycle(state, () => refreshes++, () => cancelled++);
  assert.equal(refreshes, 1);
  state.change('active'); assert.equal(refreshes, 1);
  state.change('inactive'); state.change('active'); assert.equal(refreshes, 2);
  state.change('background'); state.change('active'); assert.equal(refreshes, 3);
  stop(); state.change('background'); state.change('active');
  assert.equal(refreshes, 3); assert.equal(cancelled, 1); assert.equal(state.removed, true);
});

function catalogue(fetch) {
  return moduleFrom('../lib/publicVenues.ts', {}, { process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } }, fetch });
}
test('public list bypasses cache, uses unique-time URL and filters paused entries', async () => {
  let request;
  const { fetchPublicVenueRows } = catalogue(async (url, init) => {
    request = { url: new URL(url), init };
    return { ok: true, json: async () => [{ id: 'a', name: 'Active', is_paused: false }, { id: 'p', name: 'Paused', is_paused: true }] };
  });
  const controller = new AbortController();
  const rows = await fetchPublicVenueRows({ signal: controller.signal });
  assert.deepEqual(Array.from(rows, row => row.id), ['a']);
  assert.equal(request.url.pathname, '/functions/v1/get-public-venues');
  assert.ok(Number(request.url.searchParams.get('v')) > 0);
  assert.equal(request.init.cache, 'no-store');
  assert.equal(request.init.signal, controller.signal);
});
test('public list loads more than 100 entries without losing later venues', async () => {
  const offsets = [];
  const { fetchPublicVenueRows } = catalogue(async (url) => {
    const offset = Number(new URL(url).searchParams.get('offset')); offsets.push(offset);
    return { ok: true, json: async () => Array.from({ length: offset === 0 ? 100 : 3 }, (_, index) => ({ id: String(offset + index), name: 'Hely' })) };
  });
  assert.equal((await fetchPublicVenueRows()).length, 103);
  assert.deepEqual(offsets, [0, 100]);
});
test('empty success is authoritative; invalid response and HTTP failures reject', async () => {
  assert.equal((await catalogue(async () => ({ ok: true, json: async () => [] })).fetchPublicVenueRows()).length, 0);
  await assert.rejects(catalogue(async () => ({ ok: false, status: 503 })).fetchPublicVenueRows(), /503/);
  await assert.rejects(catalogue(async () => ({ ok: true, json: async () => ({ venues: [] }) })).fetchPublicVenueRows(), /Hibás/);
});

function hookHarness() {
  const slots = []; let cursor = 0, effect;
  const requests = [];
  const state = appState();
  const { startVenueRefreshLifecycle } = moduleFrom('../lib/venueRefreshLifecycle.ts');
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useCallback(fn) { return fn; },
  };
  const { useVenueList } = moduleFrom('../lib/useVenueList.ts', {
    react, 'react-native': { AppState: state }, 'expo-router': { useFocusEffect: (fn) => { effect = fn; } },
    '@/lib/venueRefreshLifecycle': { startVenueRefreshLifecycle },
    '@/lib/venueService': { fetchVenues: (options) => { const pending = deferred(); requests.push({ ...pending, options }); return pending.promise; } },
  });
  const render = () => { cursor = 0; return useVenueList(); };
  render();
  return { render, focus: () => effect(), requests, state };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('fresh base removes stale venue before offers finish, empty refresh clears UI', async () => {
  const h = hookHarness(); const stop = h.focus(); const first = h.requests[0];
  first.options.onBase([{ id: 'old' }, { id: 'active' }]); first.resolve([{ id: 'old' }, { id: 'active' }]); await settle();
  h.render().onRefresh(); const next = h.requests[1];
  assert.equal(h.render().refreshing, true);
  next.options.onBase([{ id: 'active' }]);
  assert.deepEqual(h.render().venues.map(v => v.id), ['active']);
  next.resolve([{ id: 'active' }]); await settle();
  h.render().onRefresh(); h.requests[2].options.onBase([]); h.requests[2].resolve([]); await settle();
  assert.equal(h.render().venues.length, 0); assert.equal(h.render().refreshing, false); stop();
});
test('older slow requests cannot resurrect removed venues; offline refresh keeps labelled fallback', async () => {
  const h = hookHarness(); const stop = h.focus(); const old = h.requests[0];
  h.render().onRefresh(); const latest = h.requests[1];
  assert.equal(old.options.signal.aborted, true);
  latest.options.onBase([{ id: 'new' }]); latest.resolve([{ id: 'new' }]); await settle();
  old.options.onBase([{ id: 'old' }]); old.resolve([{ id: 'old' }]); await settle();
  assert.deepEqual(h.render().venues.map(v => v.id), ['new']);
  h.render().onRefresh(); h.requests[2].reject(new Error('offline')); await settle();
  assert.deepEqual(h.render().venues.map(v => v.id), ['new']);
  assert.match(h.render().error, /legutóbb/); assert.equal(h.render().refreshing, false);
  h.render().onRefresh(); const inFlight = h.requests[3]; stop();
  assert.equal(inFlight.options.signal.aborted, true);
  inFlight.resolve([]); await settle(); assert.deepEqual(h.render().venues.map(v => v.id), ['new']);
});

test('authoritative list evicts absent detail cache entries, including empty catalogue', () => {
  const { rememberVenues, replaceCachedVenues, getCachedVenue } = moduleFrom('../lib/venueData.ts', { '@/lib/supabaseClient': {} });
  rememberVenues([{ id: 'a' }, { id: 'b' }]);
  replaceCachedVenues([{ id: 'b' }]); assert.equal(getCachedVenue('a'), null);
  assert.equal(getCachedVenue('b').id, 'b');
  replaceCachedVenues([]); assert.equal(getCachedVenue('b'), null);
  rememberVenues([{ id: 'p', is_paused: true }]); assert.equal(getCachedVenue('p'), null);
});

test('public endpoint enforces pause filter and stable bounded pagination', async () => {
  const calls = []; let handler;
  const query = {
    select() { return this; }, eq(...args) { calls.push(['eq', ...args]); return this; },
    order(...args) { calls.push(['order', ...args]); return this; }, range(...args) { calls.push(['range', ...args]); return this; },
    then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); },
  };
  moduleFrom('../../supabase/functions/get-public-venues/index.ts', {
    'https://deno.land/std@0.168.0/http/server.ts': { serve: (fn) => { handler = fn; } },
    'https://esm.sh/@supabase/supabase-js@2': { createClient: () => ({ from: () => query }) },
  }, { Deno: { env: { get: () => 'test' } }, Response, Intl });
  const response = await handler({ method: 'GET', url: 'https://example.test/?limit=100&offset=100&sort=newest' });
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'is_paused' && c[2] === false));
  assert.ok(calls.some(c => c[0] === 'range' && c[1] === 100 && c[2] === 199));
  assert.ok(calls.some(c => c[0] === 'order' && c[1] === 'id'));
  assert.equal((await handler({ method: 'GET', url: 'https://example.test/?offset=-1' })).status, 400);
});
