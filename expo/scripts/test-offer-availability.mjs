import assert from 'node:assert/strict';
import test from 'node:test';
import { getOfferAvailability, getVenueOpeningState, getWindowAvailability, getNextDrinkWindow, hasAvailableFreeDrink } from '../lib/offerAvailability.ts';
import * as edgeSchedule from '../../supabase/functions/_shared/venueOfferSchedule.ts';

const allDay = { byDay: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, { open: '00:00', close: '24:00' }])) };
const sunday = new Date('2026-10-04T15:45:00Z'); // 17:45 Budapest, regardless of the device timezone.
const drink = { id: 'drink-1', venueId: 'venue-1', drinkName: 'Limonádé', isFreeDrink: true };
const window = (overrides = {}) => ({ id: 'window-1', venueId: 'venue-1', drinkId: drink.id, days: [7], start: '17:30:00', end: '18:00:00', timezone: 'Europe/Budapest', ...overrides });
const venue = (overrides = {}) => ({ id: 'venue-1', name: 'Teszt hely', address: 'Budapest', opening_hours: allDay, freeDrinkData: { status: 'ready', drinks: [drink], windows: [window()] }, ...overrides });

test('an active free drink is available only while its venue and offer are open', () => {
  assert.deepEqual(getOfferAvailability(venue(), sunday).drinkIds, [drink.id]);
  assert.equal(hasAvailableFreeDrink(venue({ opening_hours: { sunday: { closed: true } } }), sunday), false);
  assert.equal(hasAvailableFreeDrink(venue({ is_paused: true }), sunday), false);
});

test('minute boundaries are inclusive at start and exclusive at end', () => {
  assert.equal(getWindowAvailability(window(), new Date('2026-10-04T15:29:00Z')), 'unavailable');
  assert.equal(getWindowAvailability(window(), new Date('2026-10-04T15:30:00Z')), 'available');
  assert.equal(getWindowAvailability(window(), new Date('2026-10-04T16:00:00Z')), 'unavailable');
});

test('only the configured weekday is eligible', () => {
  assert.equal(getWindowAvailability(window({ days: [1] }), sunday), 'unavailable');
});

test('overnight offers belong to their starting day, including a Sunday to Monday rollover', () => {
  const overnight = window({ days: [7], start: '22:00', end: '02:00' });
  assert.equal(getWindowAvailability(overnight, new Date('2026-10-04T21:00:00Z')), 'available');
  assert.equal(getWindowAvailability(overnight, new Date('2026-10-04T23:30:00Z')), 'available');
  assert.equal(getWindowAvailability(overnight, new Date('2026-10-05T00:00:00Z')), 'unavailable');
  assert.equal(getWindowAvailability(overnight, new Date('2026-10-03T23:30:00Z')), 'unavailable');
});

test('yesterday opening hours keep a venue open after midnight even when today is closed', () => {
  const hours = { friday: { open: '22:00', close: '02:00' }, saturday: { closed: true } };
  assert.equal(getVenueOpeningState(hours, new Date('2026-10-02T23:00:00Z')), 'available');
  assert.equal(getVenueOpeningState(hours, new Date('2026-10-03T00:00:00Z')), 'unavailable');
  assert.equal(getVenueOpeningState(hours, new Date('2026-10-01T23:00:00Z')), 'unavailable');
});

test('a known empty offer schedule means venue opening hours, not an unknown failed query', () => {
  const always = venue({ freeDrinkData: { status: 'ready', drinks: [drink], windows: [] } });
  assert.equal(hasAvailableFreeDrink(always, sunday), true);
  assert.equal(getOfferAvailability({ ...always, freeDrinkData: { ...always.freeDrinkData, status: 'unknown' } }, sunday).status, 'unknown');
  assert.equal(hasAvailableFreeDrink(venue({ freeDrinkData: undefined }), sunday), false);
});

test('missing or malformed opening hours fail closed', () => {
  for (const opening_hours of [null, undefined, '', 'bad json', {}, { sunday: { open: 'invalid', close: '18:00' } }]) {
    assert.equal(getOfferAvailability(venue({ opening_hours }), sunday).status, 'unknown');
  }
});

test('malformed windows cannot turn into an always available offer', () => {
  for (const invalid of [window({ days: [] }), window({ days: [8] }), window({ start: '25:00' }), window({ timezone: 'Not/AZone' })]) {
    assert.equal(getOfferAvailability(venue({ freeDrinkData: { status: 'ready', drinks: [drink], windows: [invalid] } }), sunday).status, 'unknown');
  }
});

test('one available drink is enough, even when the first configured drink is unavailable', () => {
  const second = { ...drink, id: 'drink-2' };
  const data = { status: 'ready', drinks: [drink, second], windows: [window({ days: [1] }), window({ drinkId: second.id })] };
  assert.deepEqual(getOfferAvailability(venue({ freeDrinkData: data }), sunday).drinkIds, [second.id]);
});

test('ordinary drinks never generate a free-drink badge', () => {
  const data = { status: 'ready', drinks: [{ ...drink, isFreeDrink: false }], windows: [] };
  assert.equal(getOfferAvailability(venue({ freeDrinkData: data }), sunday).reason, 'no_free_drink');
});

test('the free-drink filter keeps only available venues, while the source list keeps every venue', () => {
  const rows = [venue(), venue({ id: 'closed', opening_hours: { sunday: null } }), venue({ id: 'unknown', freeDrinkData: undefined })];
  assert.deepEqual(rows.filter((row) => hasAvailableFreeDrink(row, sunday)).map((row) => row.id), ['venue-1']);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.slice(1).filter((row) => hasAvailableFreeDrink(row, sunday)), []);
});

test('both occurrences of a repeated Budapest DST hour use local opening and offer time', () => {
  const repeated = window({ start: '02:00', end: '03:00' });
  assert.equal(getWindowAvailability(repeated, new Date('2026-10-25T00:30:00Z')), 'available');
  assert.equal(getWindowAvailability(repeated, new Date('2026-10-25T01:30:00Z')), 'available');
});

test('legacy weekday indexing and stringified opening hours remain supported', () => {
  assert.equal(getWindowAvailability(window({ days: undefined, dayOfWeek: 6 }), sunday), 'available');
  assert.equal(getVenueOpeningState(JSON.stringify(allDay), sunday), 'available');
});

test('the next offer is the earliest upcoming minute, independent of database row order', () => {
  const next = getNextDrinkWindow([window({ start: '20:00', end: '21:00' }), window({ start: '18:15', end: '19:00' })], drink.id, sunday);
  assert.equal(next?.start, '18:15');
});

test('native and server schedule decisions follow the same business boundaries', () => {
  const periods = [window(), window({ days: [7], start: '22:00', end: '02:00' }), window({ start: '00:00', end: '24:00' }), window({ days: [] }), window({ timezone: 'invalid' })];
  const instants = ['2026-10-04T15:29:00Z', '2026-10-04T15:30:00Z', '2026-10-04T16:00:00Z', '2026-10-04T23:30:00Z', '2026-10-05T00:00:00Z', '2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z'];
  for (const instant of instants) {
    const now = new Date(instant);
    for (const period of periods) assert.equal(edgeSchedule.getWindowAvailability(period, now), getWindowAvailability(period, now));
    for (const hours of [allDay, null, {}, { sunday: { open: '22:00', close: '02:00' } }, { sunday: { closed: true } }]) {
      assert.equal(edgeSchedule.getVenueOpeningState(hours, now), getVenueOpeningState(hours, now));
    }
  }
});
