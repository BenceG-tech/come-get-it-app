import { expect, mock, test } from 'bun:test';

const responses = new Map();
function query(table) {
  const builder = {
    select() { return builder; }, eq() { return builder; }, limit() { return builder; },
    order() { return builder; }, range() { return builder; }, in() { return builder; },
    abortSignal() { return builder; },
    then(resolve, reject) { return responses.get(table).then(resolve, reject); },
  };
  return builder;
}
mock.module('../lib/supabaseClient', () => ({ getSupabase: () => ({ from: query }) }));
const { getVenueWithDetails } = await import('../lib/supabaseProvider');
const { readVenueData, fetchFreeDrinkData } = await import('../lib/venueData');

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('venue base content appears before slow photos and offer lookups complete', async () => {
  const pending = [deferred(), deferred(), deferred()];
  responses.set('venues', Promise.resolve({ data: [{ id: 'venue-1', name: 'Teszt', address: 'Budapest' }], error: null }));
  ['venue_images', 'venue_drinks', 'free_drink_windows'].forEach((table, index) => responses.set(table, pending[index].promise));
  const base = deferred();
  let completed = false;
  const detail = getVenueWithDetails('venue-1', { onBase: base.resolve }).then((result) => { completed = true; return result; });
  const first = await base.promise;
  expect(first.name).toBe('Teszt');
  expect(first.freeDrinkData.status).toBe('unknown');
  expect(completed).toBe(false);
  pending.forEach((request) => request.resolve({ data: [], error: null }));
  expect((await detail).freeDrinkData.status).toBe('ready');
});

test('a failed windows request keeps offer availability unknown instead of always available', async () => {
  responses.set('venue_drinks', Promise.resolve({ data: [{ id: 'drink-1', venue_id: 'venue-1', drink_name: 'Limonádé', is_free_drink: true }], error: null }));
  responses.set('free_drink_windows', Promise.resolve({ data: null, error: { message: 'offline' } }));
  const data = await fetchFreeDrinkData(['venue-1']);
  expect(data.get('venue-1').status).toBe('unknown');
});

test('navigation cancellation releases a stalled request even when its underlying promise never settles', async () => {
  const controller = new AbortController();
  let abortedSignal;
  const request = readVenueData('Teszt', (signal) => { abortedSignal = signal; return new Promise(() => {}); }, controller.signal);
  controller.abort();
  await expect(request).rejects.toThrow('megszakított');
  expect(abortedSignal.aborted).toBe(true);
});
