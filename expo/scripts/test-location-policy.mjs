import assert from 'node:assert/strict';
import test from 'node:test';
import { isFreshAccurateLocation } from '../lib/locationPolicy.ts';
const now = 1_800_000_000_000;
const position = (timestamp = now, accuracy = 20) => ({ timestamp, coords: { latitude: 47.5, longitude: 19.05, accuracy } });
test('fresh accurate GPS can be reused without issuing a second native location request', () => {
  assert.equal(isFreshAccurateLocation(position(now - 15000, 100), now), true);
  assert.equal(isFreshAccurateLocation(position(now - 15001, 100), now), false);
  assert.equal(isFreshAccurateLocation(position(now, 101), now), false);
});
test('stale, future, approximate and unknown accuracy fixes cannot authorize redemption', () => {
  for (const p of [null, position(now + 1), position(now - 60000), position(now, null), position(now, NaN), position(now, -1)])
    assert.equal(isFreshAccurateLocation(p, now), false);
  assert.equal(isFreshAccurateLocation({ timestamp: now, coords: { latitude: 47.5, longitude: 19.05 } }, now), false);
});
test('invalid geographic coordinates are rejected even if accuracy metadata is good', () => {
  for (const [latitude, longitude] of [[91, 19], [47, 181], [NaN, 19], [47, Infinity]])
    assert.equal(isFreshAccurateLocation({ timestamp: now, coords: { latitude, longitude, accuracy: 10 } }, now), false);
});
