/** Run with Node >=24: node --test scripts/test-release-regressions.mjs
 * Executes the actual TypeScript source with native platform boundaries mocked.
 * No Supabase connection, push delivery, or native device is required.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { createHash, randomBytes } from 'node:crypto';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function load(path, names, mocks = {}) {
  const code = stripTypeScriptTypes(source(path).replace(/^import .*;\r?\n/gm, ''), { mode: 'transform' })
    .replace(/^export /gm, '');
  const context = vm.createContext({ console, setTimeout, clearTimeout, AbortController, Response,
    process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://unit.invalid', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'unit-anon' } },
    ...mocks });
  vm.runInContext(`${code}\nglobalThis.exports = { ${names.join(', ')} };`, context, { filename: path });
  return context.exports;
}

function edgeHarness({ sessionUser = 'user-a', refreshedUser = sessionUser, expiresAt, fetchImpl } = {}) {
  const calls = [];
  let refreshes = 0;
  const session = (userId, token) => ({ user: { id: userId }, access_token: token, expires_at: expiresAt });
  const api = load('../lib/edgeRequest.ts', ['postAuthenticatedFunction', 'EdgeRequestError'], {
    getSupabase: () => ({ auth: {
      getSession: async () => ({ data: { session: session(sessionUser, 'old-token') } }),
      refreshSession: async () => { refreshes++; return { data: { session: session(refreshedUser, 'fresh-token') } }; },
    } }),
    withDataTimeout: (promise) => promise,
    fetch: async (...args) => { calls.push(args); return fetchImpl(...args); },
  });
  return { ...api, calls, refreshes: () => refreshes };
}

test('authenticated mutation refreshes once after a confirmed 401', async () => {
  let attempts = 0;
  const h = edgeHarness({ fetchImpl: async () => ++attempts === 1
    ? Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }) : Response.json({ success: true }) });
  assert.equal((await h.postAuthenticatedFunction('redeem-reward', {}, 100, 'user-a')).success, true);
  assert.equal(h.refreshes(), 1);
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1][1].headers.Authorization, 'Bearer fresh-token');
});

test('an ambiguous network failure is never automatically replayed', async () => {
  const h = edgeHarness({ fetchImpl: async () => { throw new Error('connection lost after commit'); } });
  await assert.rejects(h.postAuthenticatedFunction('redeem-reward', {}, 100, 'user-a'), { code: 'NETWORK_ERROR' });
  assert.equal(h.calls.length, 1);
  assert.equal(h.refreshes(), 0);
});

test('request timeout aborts without replaying a mutation', async () => {
  const h = edgeHarness({ fetchImpl: (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }) });
  await assert.rejects(h.postAuthenticatedFunction('redeem-reward', {}, 5, 'user-a'), { code: 'TIMEOUT' });
  assert.equal(h.calls.length, 1);
});

test('a refreshed session belonging to a different user cannot submit the captured action', async () => {
  const h = edgeHarness({ refreshedUser: 'user-b', expiresAt: 1, fetchImpl: () => { throw new Error('must not fetch'); } });
  await assert.rejects(h.postAuthenticatedFunction('redeem-reward', {}, 100, 'user-a'), { code: 'SESSION_CHANGED' });
  assert.equal(h.calls.length, 0);
});

test('a 401 retry also rechecks the expected user before sending again', async () => {
  const h = edgeHarness({ refreshedUser: 'user-b', fetchImpl: async () => Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }) });
  await assert.rejects(h.postAuthenticatedFunction('redeem-reward', {}, 100, 'user-a'), { code: 'SESSION_CHANGED' });
  assert.equal(h.calls.length, 1);
});

test('reward reads and mutations both pass the captured user to authenticated transport', async () => {
  const calls = [];
  const receipt = { redemption_id: 'receipt', new_balance: 70, redemption_code: 'CGI-AABBCCDD', reward_name: 'Limonádé' };
  const api = load('../lib/rewardService.ts', ['redeemReward', 'getRewardRedemption'], {
    EdgeRequestError: class extends Error {},
    postAuthenticatedFunction: async (...args) => {
      calls.push(args);
      return args[1].action === 'status' ? { success: true, redemption: receipt } : { success: true, ...receipt };
    },
  });
  await api.getRewardRedemption('reward', 'user-a');
  await api.redeemReward('reward', 'user-a');
  assert.deepEqual(calls.map((call) => call[3]), ['user-a', 'user-a']);
  assert.equal(calls[0][1].action, 'status');
});

test('GPS cache accepts only recent finite coordinates with measured accuracy', () => {
  const { isFreshAccurateLocation } = load('../lib/locationPolicy.ts', ['isFreshAccurateLocation']);
  const now = 100_000;
  const position = { timestamp: now - 15_000, coords: { latitude: 47.5, longitude: 19, accuracy: 100 } };
  assert.equal(isFreshAccurateLocation(position, now), true);
  for (const patch of [{ timestamp: now - 15_001 }, { timestamp: now + 1 }, { timestamp: NaN },
    ...[null, undefined, -1, 101, Infinity].map(accuracy => ({ coords: { ...position.coords, accuracy } })),
    { coords: { ...position.coords, latitude: 91 } }, { coords: { ...position.coords, longitude: Infinity } }]) {
    assert.equal(isFreshAccurateLocation({ ...position, ...patch }, now), false);
  }
  assert.equal(isFreshAccurateLocation(null, now), false);
});

function campaignHarness({ saved, token = 'ExpoPushToken[new]', permission = true, request } = {}) {
  let stored = saved ? JSON.stringify(saved) : null;
  const calls = [];
  let permissionRequests = 0;
  const api = load('../lib/campaignNotifications.ts', [
    'enableCampaignNotifications', 'disableCampaignNotifications', 'syncCampaignNotifications', 'campaignNotificationPreference',
  ], {
    AsyncStorage: {
      getItem: async () => stored,
      setItem: async (_, value) => { stored = value; },
      removeItem: async () => { stored = null; },
    },
    Constants: { expoConfig: { extra: { eas: { projectId: 'unit-project' } }, version: '1.0' } },
    Platform: { OS: 'ios' },
    Notifications: {
      getPermissionsAsync: async () => ({ granted: permission }),
      requestPermissionsAsync: async () => { permissionRequests++; return { granted: permission }; },
      getExpoPushTokenAsync: async () => ({ data: token }),
    },
    withDataTimeout: (promise) => promise,
    postAuthenticatedFunction: async (...args) => { calls.push(args); return request ? request(...args) : { success: true }; },
  });
  return { ...api, calls, stored: () => stored ? JSON.parse(stored) : null, permissionRequests: () => permissionRequests };
}

test('passive foreground sync cannot ask for permission or create marketing consent', async () => {
  const h = campaignHarness();
  await h.syncCampaignNotifications('user-a');
  assert.equal(h.calls.length, 0);
  assert.equal(h.permissionRequests(), 0);
  assert.equal(h.stored(), null);
});

test('a different account cannot sync, revoke, or see another account preference', async () => {
  const saved = { userId: 'user-a', enabled: true, token: 'ExpoPushToken[old]' };
  const h = campaignHarness({ saved });
  await h.syncCampaignNotifications('user-b');
  await h.disableCampaignNotifications('user-b');
  assert.deepEqual(plain(await h.campaignNotificationPreference('user-b')), { enabled: false, pending: false });
  assert.equal(h.calls.length, 0);
  assert.deepEqual(h.stored(), saved);
});

test('failed opt-out remains durably disabled and retries on next foreground', async () => {
  let fail = true;
  const h = campaignHarness({ saved: { userId: 'user-a', enabled: true, token: 'ExpoPushToken[old]' },
    request: async () => { if (fail) throw new Error('offline'); return { success: true }; } });
  await assert.rejects(h.disableCampaignNotifications('user-a'), /offline/);
  assert.equal(h.stored().enabled, false);
  assert.equal(h.stored().pending, true);
  fail = false;
  await h.syncCampaignNotifications('user-a');
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1][1].marketing_opt_in, false);
  assert.equal(h.calls[1][3], 'user-a');
  assert.equal(h.stored(), null);
});

test('failed token rotation preserves the old token until opt-out removes both', async () => {
  let fail = true;
  const h = campaignHarness({ saved: { userId: 'user-a', enabled: true, token: 'ExpoPushToken[old]' },
    request: async () => { if (fail) throw new Error('response lost'); return { success: true }; } });
  await assert.rejects(h.syncCampaignNotifications('user-a'), /response lost/);
  assert.deepEqual(h.stored().previousTokens, ['ExpoPushToken[old]']);
  fail = false;
  await h.disableCampaignNotifications('user-a');
  assert.equal(h.calls[1][1].token, 'ExpoPushToken[new]');
  assert.deepEqual(plain(h.calls[1][1].previous_tokens), ['ExpoPushToken[old]']);
  assert.equal(h.calls[1][1].marketing_opt_in, false);
  assert.equal(h.stored(), null);
});

test('queued disable wins after a slow enable and removes its new token', async () => {
  const pending = deferred();
  const started = deferred();
  const h = campaignHarness({ request: async (_, body) => {
    if (body.marketing_opt_in) { started.resolve(); await pending.promise; }
    return { success: true };
  } });
  const enabling = h.enableCampaignNotifications('user-a');
  await started.promise;
  const disabling = h.disableCampaignNotifications('user-a');
  pending.resolve();
  await Promise.all([enabling, disabling]);
  assert.deepEqual(h.calls.map(call => call[1].marketing_opt_in), [true, false]);
  assert.equal(h.stored(), null);
});

test('OS permission revocation cleans up persisted marketing tokens', async () => {
  const h = campaignHarness({ permission: false, saved: { userId: 'user-a', enabled: true, token: 'ExpoPushToken[old]' } });
  await h.syncCampaignNotifications('user-a');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][1].marketing_opt_in, false);
  assert.equal(h.permissionRequests(), 0);
  assert.equal(h.stored(), null);
});

function qrHarness(create, overrides = {}) {
  // Execute the production callback, not a reimplementation of its state machine.
  const component = source('../components/RedemptionWindowModal.tsx');
  const start = 'const handleCreateWindow = useCallback(async () => {';
  const end = '\n  }, [drink, getCurrentLocation, startCountdown, venueCoordinates, venueId, userId]);';
  assert.ok(component.includes(start) && component.includes(end), 'QR callback boundaries changed; update extraction');
  const body = component.split(start)[1].split(end)[0];
  const updates = [];
  const refs = { createInFlightRef: { current: false }, flowGenerationRef: { current: 1 } };
  const context = vm.createContext({ console, ...refs, drink: { id: 'drink' }, venueId: 'venue', venueCoordinates: null,
    DEMO_MODE: false, userId: 'user-a', currentUserRef: { current: 'user-a' },
    userActivity: { record() {} }, rememberRedemption() {},
    Haptics: { ImpactFeedbackStyle: {}, NotificationFeedbackType: {}, impactAsync: async () => { throw new Error('no haptic engine'); },
      notificationAsync: async () => { throw new Error('no haptic engine'); } },
    setState: value => updates.push(['state', value]), setWindowToken: value => updates.push(['token', value]),
    setErrorMessage: value => updates.push(['error', value]), setCheckingStage() {}, setLocationWarning() {},
    startCountdown: value => updates.push(['countdown', value]), createRedemptionWindow: create, ...overrides });
  vm.runInContext(stripTypeScriptTypes(`globalThis.run = async () => {${body}\n};`, { mode: 'transform' }), context);
  return { run: context.run, updates, ...refs };
}
const windowResult = { success: true, data: { token: 'qr-token', expires_at: '2026-10-04T20:00:00Z' } };

test('haptics failure cannot turn a successfully created QR into an error', async () => {
  const h = qrHarness(async () => windowResult);
  await h.run();
  assert.deepEqual(h.updates.filter(([name]) => name === 'state'), [['state', 'checking'], ['state', 'countdown']]);
  assert.equal(h.updates.find(([name]) => name === 'token')[1].token, 'qr-token');
  assert.equal(h.createInFlightRef.current, false);
});

test('double QR activation creates only one window', async () => {
  const pending = deferred();
  const started = deferred();
  let calls = 0;
  const h = qrHarness(async () => { calls++; started.resolve(); return pending.promise; });
  const first = h.run();
  await started.promise;
  await h.run();
  pending.resolve(windowResult);
  await first;
  assert.equal(calls, 1);
  assert.equal(h.createInFlightRef.current, false);
});

test('a late QR response from a closed flow cannot publish a token into the new flow', async () => {
  const pending = deferred();
  const started = deferred();
  const h = qrHarness(async () => { started.resolve(); return pending.promise; });
  const first = h.run();
  await started.promise;
  h.flowGenerationRef.current++;
  pending.resolve(windowResult);
  await first;
  assert.equal(h.updates.some(([name]) => name === 'token' || name === 'countdown'), false);
  assert.equal(h.createInFlightRef.current, false);
});

function authHarness({ echoState = true, revokeError, signOutError, appleUser = false, appleCancel = false,
  deletionResult = { status: 'deleted', manualAppleRevocation: false }, deletionError, stalledCleanup = false } = {}) {
  const events = [];
  let appleRequest;
  let stateCalls = 0;
  const api = load('../context/AuthContext.tsx', ['useAuth'], {
    console: { log() {}, warn() {}, error() {} },
    createContextHook: factory => [null, factory()],
    useCallback: callback => callback,
    useMemo: factory => factory(),
    useEffect() {},
    useState: () => [stateCalls++ === 0 ? { user: { id: 'user-a', identities: appleUser ? [{ provider: 'apple' }] : [] } } : true,
      value => events.push(['session', value])],
    useQueryClient: () => ({ clear: () => events.push(['clear-query-cache']) }),
    disableCampaignNotifications: async userId => { events.push(['revoke', userId]); if (revokeError) throw revokeError; },
    disableNearbyAlerts: async () => { events.push(['stop-nearby']); if (stalledCleanup) await new Promise(() => {}); },
    clearDeletedAccountNotificationPreference: async userId => { events.push(['clear-push', userId]); if (stalledCleanup) await new Promise(() => {}); },
    requestAccountDeletion: async (...args) => { events.push(['delete-request', ...args]); if (deletionError) throw deletionError; return deletionResult; },
    accountDeletionErrorMessage: () => 'A törlés nem fejeződött be.',
    withDataTimeout: (promise) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10))]),
    clearPersistedSupabaseSession: async () => { events.push(['clear-session']); },
    Platform: { OS: 'ios' },
    Constants: {},
    Alert: { alert: (...args) => events.push(['alert', ...args]) },
    WebBrowser: { maybeCompleteAuthSession() {} },
    Crypto: {
      getRandomBytesAsync: async count => randomBytes(count),
      CryptoDigestAlgorithm: { SHA256: 'SHA256' },
      digestStringAsync: async (_, value) => createHash('sha256').update(value).digest('hex'),
    },
    AppleAuthentication: {
      AppleAuthenticationScope: { FULL_NAME: 1, EMAIL: 2 },
      isAvailableAsync: async () => true,
      signInAsync: async request => {
        appleRequest = request;
        if (appleCancel) throw new Error('ERR_CANCELED');
        return { identityToken: 'apple-id-token', authorizationCode: 'fresh-code', state: echoState ? request.state : 'different-state' };
      },
    },
    getSupabase: () => ({ auth: {
      signInWithIdToken: async request => { events.push(['apple-auth', request]); return { data: { session: {} } }; },
      signOut: async () => { events.push(['signout']); return { error: signOutError }; },
    } }),
  });
  return { auth: api.useAuth, events, appleRequest: () => appleRequest };
}

test('Apple receives a hashed nonce while Supabase receives the matching raw nonce', async () => {
  const h = authHarness();
  await h.auth.signInWithApple();
  const native = h.appleRequest();
  const exchange = h.events.find(([name]) => name === 'apple-auth')[1];
  assert.match(exchange.nonce, /^[a-f0-9]{64}$/);
  assert.match(native.state, /^[a-f0-9]{32}$/);
  assert.equal(native.nonce, createHash('sha256').update(exchange.nonce).digest('hex'));
  assert.notEqual(native.nonce, exchange.nonce);
});

test('confirmed account deletion clears local auth, account query cache and notification preferences', async () => {
  const h = authHarness({ appleUser: true });
  const result = await h.auth.deleteAccount();
  assert.equal(result.status, 'deleted');
  assert.equal(h.events.find(([name]) => name === 'delete-request')[2], 'fresh-code');
  for (const name of ['stop-nearby', 'clear-push', 'signout', 'clear-session', 'clear-query-cache']) {
    assert.equal(h.events.some(([event]) => event === name), true, name);
  }
  assert.equal(h.events.some(([name, value]) => name === 'session' && value === null), true);
});

test('Apple cancellation and a mismatched native state cannot block deletion or forward an untrusted code', async () => {
  for (const options of [{ appleCancel: true }, { echoState: false }]) {
    const h = authHarness({ appleUser: true, ...options,
      deletionResult: { status: 'deleted', manualAppleRevocation: true } });
    assert.equal((await h.auth.deleteAccount()).manualAppleRevocation, true);
    assert.equal(h.events.find(([name]) => name === 'delete-request')[2], undefined);
  }
});

test('a pending deletion request preserves the account and local consent instead of announcing deletion', async () => {
  const h = authHarness({ deletionResult: { status: 'pending', requestId: 'request-1' } });
  assert.equal((await h.auth.deleteAccount()).status, 'pending');
  assert.equal(h.events.some(([name]) => ['stop-nearby', 'signout', 'clear-session', 'session'].includes(name)), false);
});

test('failed server deletion preserves local auth and reports the failure', async () => {
  const h = authHarness({ deletionError: new Error('database failure') });
  await assert.rejects(h.auth.deleteAccount(), /database failure/);
  assert.equal(h.events.some(([name]) => ['signout', 'clear-session', 'session'].includes(name)), false);
  assert.equal(h.events.some(([name]) => name === 'alert'), true);
});

test('stalled native cleanup cannot keep a server-deleted account signed in indefinitely', async () => {
  const h = authHarness({ stalledCleanup: true });
  assert.equal((await h.auth.deleteAccount()).status, 'deleted');
  assert.equal(h.events.some(([name, value]) => name === 'session' && value === null), true);
  assert.equal(h.events.some(([name]) => name === 'clear-query-cache'), true);
});

test('mismatched Apple state cannot reach the Supabase token exchange', async () => {
  const h = authHarness({ echoState: false });
  await assert.rejects(h.auth.signInWithApple(), /nem egyezik/);
  assert.equal(h.events.some(([name]) => name === 'apple-auth'), false);
});

test('sign-out waits for push revocation before dropping the authenticated session', async () => {
  const h = authHarness();
  await h.auth.signOut();
  assert.deepEqual(h.events, [['revoke', 'user-a'], ['stop-nearby'], ['signout'], ['clear-query-cache']]);
});

test('failed push revocation preserves the authenticated session for a retry', async () => {
  const h = authHarness({ revokeError: new Error('offline') });
  await assert.rejects(h.auth.signOut(), /offline/);
  assert.equal(h.events.some(([name]) => name === 'signout' || name === 'clear-session' || name === 'session'), false);
});

test('sign-out checks returned auth errors instead of announcing false success', async () => {
  const h = authHarness({ signOutError: new Error('server unavailable') });
  await assert.rejects(h.auth.signOut(), /server unavailable/);
  assert.equal(h.events.some(([name]) => name === 'alert'), true);
});

test('notification routing accepts known internal destinations and deduplicates taps', () => {
  const layout = source('../app/_layout.tsx');
  const start = layout.indexOf('const handledNotificationIds');
  const end = layout.indexOf('// Keeps nearby free-drink alerts');
  assert.ok(start >= 0 && end > start, 'Notification routing boundaries changed; update extraction');
  const context = vm.createContext({});
  vm.runInContext(stripTypeScriptTypes(`${layout.slice(start, end)}\nglobalThis.target = notificationTarget;`, { mode: 'transform' }), context);
  const response = (id, url) => ({ notification: { request: { identifier: id, content: { data: { url } } } } });
  assert.equal(context.target(response('1', '/reward/reward-123')), '/reward/reward-123');
  assert.equal(context.target(response('1', '/reward/reward-123')), null);
  assert.equal(context.target(response('2', '/venue/venue-123')), '/venue/venue-123');
  assert.equal(context.target(response('3', '/(tabs)/rewards')), '/(tabs)/rewards');
  for (const [index, url] of ['https://untrusted.invalid', 'javascript:alert(1)', '/profile', '/venue/a?next=/profile', '/venue/../profile', '//untrusted.invalid'].entries()) {
    assert.equal(context.target(response(`rejected-${index}`, url)), null);
  }
});
