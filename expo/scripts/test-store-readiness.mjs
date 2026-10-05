/** Release policy + native privacy boundaries; executes production TS with platform mocks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function load(path, names, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm, ''), { mode: 'transform' }).replace(/^export /gm, '');
  const context = vm.createContext({ console, setTimeout, clearTimeout, Date, Intl,
    process: { env: {} }, ...mocks });
  vm.runInContext(`${code}\nglobalThis.exports = { ${names.join(', ')} };`, context);
  return context.exports;
}
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
class RequestError extends Error { constructor(message, code) { super(message); this.code = code; } }

for (const flag of ['true', 'false', undefined]) {
  test(`production cannot expose unreleased bank/CSR services with public flag ${flag}`, async () => {
    const policy = load('../lib/releaseFeatures.ts', ['BANK_PREVIEW_ENABLED', 'COMMUNITY_IMPACT_PREVIEW_ENABLED'], {
      __DEV__: false, process: { env: { EXPO_PUBLIC_ENABLE_BANK_PREVIEW: flag, EXPO_PUBLIC_ENABLE_CSR_PREVIEW: flag } },
    });
    assert.equal(policy.BANK_PREVIEW_ENABLED, false);
    assert.equal(policy.COMMUNITY_IMPACT_PREVIEW_ENABLED, false);
    let requests = 0;
    const bank = load('../lib/spendPointsService.ts', ['getSpendPointsStatus', 'startBankConnection'], {
      BANK_PREVIEW_ENABLED: policy.BANK_PREVIEW_ENABLED,
      getSupabase: () => { requests++; throw new Error('must not contact bank'); },
    });
    assert.equal((await bank.getSpendPointsStatus()).enabled, false);
    await assert.rejects(bank.startBankConnection(), /nem érhető el/);
    assert.equal(requests, 0);
  });
}

test('bank preview rejects off, unknown and live server modes', () => {
  const { isBankPreviewMode } = load('../lib/releaseFeatures.ts', ['isBankPreviewMode']);
  for (const mode of [undefined, null, 'off', 'live', 'unknown']) assert.equal(isBankPreviewMode(mode), false);
  for (const mode of ['mock', 'sandbox']) assert.equal(isBankPreviewMode(mode), true);
});

function deletionHarness(response) {
  const calls = [];
  const api = load('../lib/accountDeletion.ts', ['requestAccountDeletion', 'accountDeletionErrorMessage'], {
    EdgeRequestError: RequestError,
    postAuthenticatedFunction: async (...args) => { calls.push(args); return response; },
  });
  return { ...api, calls };
}

test('Apple deletion sends a fresh code under the captured account and preserves manual-revoke status', async () => {
  const h = deletionHarness({ success: true, apple_revocation: 'manual_required' });
  const result = await h.requestAccountDeletion('user-a', 'fresh-code');
  assert.equal(result.status, 'deleted');
  assert.equal(result.manualAppleRevocation, true);
  assert.equal(h.calls[0][0], 'delete-account');
  assert.equal(h.calls[0][1].apple_authorization_code, 'fresh-code');
  assert.equal(h.calls[0][3], 'user-a');
});

test('a recorded business-account request is pending and never interpreted as completed deletion', async () => {
  const h = deletionHarness({ success: false, status: 'pending', code: 'ACCOUNT_DELETION_REQUESTED', request_id: 'request-1' });
  const result = await h.requestAccountDeletion('user-a');
  assert.equal(result.status, 'pending');
  assert.equal(result.requestId, 'request-1');
  assert.equal('apple_authorization_code' in h.calls[0][1], false);
});

test('a successful HTTP response without explicit deletion success or durable request is rejected', async () => {
  for (const payload of [{}, { success: false }, { success: 'true' }, { status: 'pending' }]) {
    await assert.rejects(deletionHarness(payload).requestAccountDeletion('user-a'), { code: 'INVALID_RESPONSE' });
  }
});

function nearbyHarness({ enabled = '1', startRegion, writePreference } = {}) {
  const stored = new Map([
    ['cgi.nearbyAlerts.enabled', enabled],
    ['cgi.nearbyAlerts.anchor', JSON.stringify({ at: 0, latitude: 47.5, longitude: 19 })],
    ['cgi.nearbyAlerts.venues', JSON.stringify([{ id: 'venue', name: 'Hely', latitude: 47.5, longitude: 19,
      opening_hours: {}, drinks: [{ id: 'drink', name: 'Limonádé' }], windows: [] }])],
  ]);
  const events = [];
  let registered = false;
  let task;
  const api = load('../lib/nearbyAlerts.ts', ['disableNearbyAlerts', 'enableNearbyAlerts', 'syncNearbyAlerts', 'isNearbyAlertsEnabled'], {
    AppState: { currentState: 'background' }, Platform: { OS: 'ios' },
    AsyncStorage: {
      getItem: async key => stored.get(key) ?? null,
      setItem: async (key, value) => {
        if (key === 'cgi.nearbyAlerts.enabled' && writePreference) await writePreference(value);
        stored.set(key, value);
      },
      removeItem: async key => { stored.delete(key); },
    },
    Location: {
      Accuracy: { Balanced: 1 }, LocationGeofencingEventType: { Enter: 1, Exit: 2 },
      getForegroundPermissionsAsync: async () => ({ status: 'granted' }), getBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }), requestBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
      getCurrentPositionAsync: async () => ({ coords: { latitude: 47.5, longitude: 19 } }),
      hasStartedGeofencingAsync: async () => registered,
      startGeofencingAsync: async () => { events.push('start'); if (startRegion) await startRegion(); registered = true; },
      stopGeofencingAsync: async () => { events.push('stop'); registered = false; },
    },
    Notifications: {
      getPermissionsAsync: async () => ({ granted: true }), requestPermissionsAsync: async () => ({ granted: true }),
      getAllScheduledNotificationsAsync: async () => [{ identifier: 'own', content: { data: { source: 'nearby_free_drink' } } },
        { identifier: 'other', content: { data: { source: 'other' } } }],
      cancelScheduledNotificationAsync: async id => { events.push(`cancel:${id}`); },
      dismissNotificationAsync: async id => { events.push(`dismiss:${id}`); },
      scheduleNotificationAsync: async () => { events.push('notify'); return 'new'; },
      setNotificationHandler() {},
    },
    TaskManager: { defineTask: (_, callback) => { task = callback; } },
    withDataTimeout: promise => promise,
    getOfferAvailability: () => ({ drinkIds: ['drink'] }),
    haversineMeters: () => 10, venueLatLng: venue => venue,
    fetchVenues: async () => [],
  });
  return { ...api, stored, events, registered: () => registered,
    enter: () => task({ data: { eventType: 1, region: { identifier: 'venue' } } }) };
}

test('a queued geofence event after opt-out cannot send an offer or restart monitoring', async () => {
  const h = nearbyHarness();
  await h.disableNearbyAlerts();
  await h.enter();
  await h.syncNearbyAlerts();
  assert.equal(h.events.includes('notify'), false);
  assert.equal(h.events.includes('start'), false);
  assert.equal(h.stored.has('cgi.nearbyAlerts.anchor'), false);
  assert.equal(h.events.includes('cancel:own'), true);
  assert.equal(h.events.includes('cancel:other'), false);
});

test('opt-out during native geofence registration leaves monitoring stopped with no saved anchor', async () => {
  const pending = deferred(); const started = deferred();
  const h = nearbyHarness({ startRegion: async () => { started.resolve(); await pending.promise; } });
  const sync = h.syncNearbyAlerts();
  await started.promise;
  const disable = h.disableNearbyAlerts();
  pending.resolve();
  await Promise.all([sync, disable]);
  assert.equal(h.registered(), false);
  assert.equal(h.stored.has('cgi.nearbyAlerts.anchor'), false);
  assert.equal(h.stored.get('cgi.nearbyAlerts.enabled'), '0');
});

test('a late enable storage write cannot resurrect consent after opt-out and app restart', async () => {
  const pending = deferred(); const started = deferred();
  const h = nearbyHarness({ enabled: '0', writePreference: async value => {
    if (value === '1') { started.resolve(); await pending.promise; }
  } });
  const enabling = h.enableNearbyAlerts();
  const enableOutcome = enabling.catch(error => error);
  await started.promise;
  const disabling = h.disableNearbyAlerts();
  pending.resolve();
  await Promise.all([enableOutcome, disabling]);
  assert.equal(h.stored.get('cgi.nearbyAlerts.enabled'), '0');
  assert.equal(await h.isNearbyAlertsEnabled(), false);
  assert.equal(h.events.includes('start'), false);
});
