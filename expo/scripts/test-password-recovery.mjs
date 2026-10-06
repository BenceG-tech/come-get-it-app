import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const source = readFileSync(new URL('../lib/password-recovery.ts', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, ''), { mode: 'transform' }).replace(/^export /gm, '');
const context = vm.createContext({ URL, URLSearchParams });
vm.runInContext(`${code}\nglobalThis.complete = completePasswordRecovery;`, context);
const complete = context.complete;
function harness(result = { data: { session: { user: { id: 'unit-user' } } }, error: null }) {
 const calls = [];
 const auth = {
  exchangeCodeForSession: async code => { calls.push(['pkce', code]); return result; },
  setSession: async tokens => { calls.push(['implicit', tokens]); return result; },
 };
 return { auth, calls };
}
test('PKCE recovery exchanges the email code once, without token fallback', async () => {
 const h = harness();
 await complete(h.auth, 'comegetit://reset-password?code=unit-code');
 assert.deepEqual(h.calls, [['pkce', 'unit-code']]);
});
test('legacy recovery consumes fragment tokens and triple-slash route', async () => {
 const h = harness();
 await complete(h.auth, 'comegetit:///reset-password#access_token=unit-access&refresh_token=unit-refresh&type=recovery');
 assert.equal(h.calls.length, 1);
 assert.equal(h.calls[0][0], 'implicit');
 assert.equal(h.calls[0][1].access_token, 'unit-access');
 assert.equal(h.calls[0][1].refresh_token, 'unit-refresh');
});
test('unrelated schemes/routes, missing tokens and server errors never start a session', async () => {
 for (const url of ['https://attacker.invalid/reset-password?code=x', 'comegetit://home?code=x',
  'comegetit://reset-password', 'comegetit://reset-password#access_token=x',
  'comegetit://reset-password?error=access_denied&code=x', 'invalid']) {
  const h = harness();
  await assert.rejects(complete(h.auth, url), /érvénytelen vagy lejárt/);
  assert.equal(h.calls.length, 0);
 }
});
test('expired code and empty session fail without exposing callback secrets', async () => {
 for (const result of [{ data: { session: null }, error: { message: 'unit-secret' } }, { data: { session: null }, error: null }]) {
  const h = harness(result);
  await assert.rejects(complete(h.auth, 'comegetit://reset-password?code=unit-secret'), e => !e.message.includes('unit-secret'));
  assert.equal(h.calls.length, 1);
 }
});
