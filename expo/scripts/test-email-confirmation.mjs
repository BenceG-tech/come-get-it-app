import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const source = readFileSync(new URL('../lib/email-confirmation.ts', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, ''), { mode: 'transform' }).replace(/^export /gm, '');
const context = vm.createContext({ URL, URLSearchParams });
vm.runInContext(`${code}\nglobalThis.complete = completeEmailConfirmation;`, context);
function harness(result = { data: { session: { user: { id: 'test' } } }, error: null }) {
 const calls = [];
 return { calls, auth: {
  exchangeCodeForSession: async code => { calls.push(['pkce', code]); return result; },
  setSession: async tokens => { calls.push(['implicit', tokens]); return result; },
 } };
}
test('signup confirmation creates a session from PKCE', async () => {
 const h=harness(); assert.equal(await context.complete(h.auth,'comegetit://auth?code=test'),true);
 assert.deepEqual(h.calls,[['pkce','test']]);
});
test('legacy signup fragment creates a session', async () => {
 const h=harness(); assert.equal(await context.complete(h.auth,'comegetit:///auth#access_token=a&refresh_token=r&type=signup'),true);
 assert.equal(h.calls[0][0],'implicit'); assert.equal(h.calls[0][1].refresh_token,'r');
});
test('normal navigation and foreign callbacks do not alter auth', async () => {
 for(const url of ['comegetit://auth','comegetit://reset-password?code=a','https://example.com/auth?code=a','invalid']) {
  const h=harness(); assert.equal(await context.complete(h.auth,url),false); assert.equal(h.calls.length,0);
 }
});
test('expired, partial and misplaced recovery callbacks are rejected before auth', async () => {
 for(const suffix of ['?error_code=otp_expired&code=a','#access_token=a','#refresh_token=r','#access_token=a&refresh_token=r&type=recovery']) {
  const h=harness(); await assert.rejects(context.complete(h.auth,'comegetit://auth'+suffix)); assert.equal(h.calls.length,0);
 }
});
test('empty session, server errors and thrown failures never expose secrets', async () => {
 for(const result of [{data:{session:null},error:null},{data:{session:null},error:{message:'secret'}}]) {
  const h=harness(result); await assert.rejects(context.complete(h.auth,'comegetit://auth?code=secret'),e=>!e.message.includes('secret'));
 }
 const auth={exchangeCodeForSession:async()=>{throw new Error('secret');}};
 await assert.rejects(context.complete(auth,'comegetit://auth?code=secret'),e=>!e.message.includes('secret'));
});
