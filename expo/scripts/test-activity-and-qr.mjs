import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
function load(path, names, globals = {}) {
  const code = stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, ''), {mode:'transform'}).replace(/^export /gm, '');
  const context = vm.createContext({Date, ...globals});
  vm.runInContext(`${code}\nglobalThis.api = {${names}}`, context);
  return context.api;
}
test('activity ignores anonymous calls, deduplicates opens and isolates account changes', async () => {
  let now = 0; const sent = [];
  const {createActivityTracker} = load('../lib/activityTracker.ts','createActivityTracker');
  const tracker = createActivityTracker(async (...args) => {sent.push(args);}, () => now);
  tracker.record('app_open'); assert.equal(sent.length,0);
  tracker.setUser('a');tracker.record('app_open');tracker.record('app_open');
  now=29999;tracker.record('app_open');assert.equal(sent.length,1);
  now=30000;tracker.record('app_open');assert.equal(sent.length,2);
  tracker.setUser('b');tracker.record('app_open');assert.equal(sent[2][0],'b');
  tracker.setUser(null);tracker.record('app_open');assert.equal(sent.length,3);
  assert.equal(sent[0][1].metadata.source,'mobile');
});
test('activity delivery failure never fails a product action or retries', async () => {
  const {createActivityTracker} = load('../lib/activityTracker.ts','createActivityTracker');
  let calls=0;
  for (const send of [() => {calls++;throw Error('sync');}, async () => {calls++;throw Error('offline');}]) {
    const tracker=createActivityTracker(send);tracker.setUser('a');
    assert.doesNotThrow(() => tracker.record('app_open'));
  }
  await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,2);
});
test('closing and reopening the same venue restores the original token and expiry', () => {
  const api=load('../lib/activeRedemption.ts','setRedemptionOwner,rememberRedemption,recallRedemption,forgetRedemption');
  const window={token:'one-token',expires_at:new Date(Date.now()+120000).toISOString()};
  api.setRedemptionOwner('a');api.rememberRedemption({userId:'a',venueId:'v',drinkId:'d',window});
  assert.equal(api.recallRedemption('a','v','d'),window);
  assert.equal(api.recallRedemption('a','other','d'),null);
  assert.equal(api.recallRedemption('b','v','d'),null);
  api.forgetRedemption('wrong-token');assert.equal(api.recallRedemption('a','v','d'),window);
  api.forgetRedemption('one-token');assert.equal(api.recallRedemption('a','v','d'),null);
});
test('logout and late responses cannot leak a QR to another account', () => {
  const api=load('../lib/activeRedemption.ts','setRedemptionOwner,rememberRedemption,recallRedemption');
  const value={userId:'a',venueId:'v',drinkId:'d',window:{token:'a-token',expires_at:new Date(Date.now()+120000).toISOString()}};
  api.setRedemptionOwner('a');api.rememberRedemption(value);api.setRedemptionOwner(null);
  api.rememberRedemption(value);api.setRedemptionOwner('b');assert.equal(api.recallRedemption('a','v','d'),null);
  api.setRedemptionOwner('a');assert.equal(api.recallRedemption('a','v','d'),null);
});
test('a just elapsed QR remains available for authoritative status confirmation, very old tokens do not', () => {
  const api=load('../lib/activeRedemption.ts','setRedemptionOwner,rememberRedemption,recallRedemption');api.setRedemptionOwner('a');
  const make=age=>({userId:'a',venueId:'v',drinkId:'d',window:{token:'token',expires_at:new Date(Date.now()-age).toISOString()}});
  api.rememberRedemption(make(1000));assert.ok(api.recallRedemption('a','v','d'));
  api.rememberRedemption(make(601000));assert.equal(api.recallRedemption('a','v','d'),null);
});
test('QR creation requires a server expiry and passes the captured account to status requests', async () => {
  const calls=[];
  let payload={token:'real-token'};
  const api=load('../lib/redemptionService.ts','createRedemptionWindow,getRedemptionWindowStatus', {
    __DEV__:false, process:{env:{}},
    postAuthenticatedFunction:async (...args)=>{calls.push(args);return payload;},
  });
  for (const expires_at of [undefined,'invalid-date']) {
    payload={token:'real-token',expires_at};
    assert.equal((await api.createRedemptionWindow({venue_id:'venue'},'owner')).success,false);
  }
  payload={token:'real-token',expires_at:'2026-10-05T19:00:00Z'};
  const created=await api.createRedemptionWindow({venue_id:'venue'},'owner');
  assert.equal(created.success,true);assert.equal(created.data.expires_at,payload.expires_at);
  payload={status:'consumed'};
  assert.equal((await api.getRedemptionWindowStatus('real-token','owner')).status,'consumed');
  assert.equal(calls.at(-1)[3],'owner');
});
