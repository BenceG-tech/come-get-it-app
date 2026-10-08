import assert from 'node:assert/strict';
import test from 'node:test';
import { imageCandidates, imageLoadReducer, imageRequestKey, initialImageLoadState } from '../lib/imageLoading.ts';

const original = 'https://nrxfiblssxwzeziomlvc.supabase.co/storage/v1/object/public/venue-images/photo.png';
test('public photos request a stable small derivative, retaining the original as a fallback', () => {
  assert.deepEqual(imageCandidates([original, ` ${original} `]), [original.replace('/object/public/', '/render/image/public/') + '?width=960&quality=75', original]);
  assert.match(imageCandidates([original], 480)[0], /width=480&quality=75$/);
});
test('signed/private/external URLs are not rewritten and malformed sources cannot break the UI', () => {
  const signed = original.replace('/public/', '/sign/') + '?token=secret';
  const external = 'https://example.com/photo.jpg';
  assert.deepEqual(imageCandidates([signed, external, original + '?token=private', null, '', 'not a URL', 'javascript:alert(1)']), [signed, external, original + '?token=private']);
});
test('a failed optimized image advances to the original and stops retrying after a bounded second pass', () => {
  let state = initialImageLoadState;
  const used = [];
  for (let i = 0; i < 4; i++) {
    used.push(state.attempt % 2);
    state = imageLoadReducer(state, { type: 'error', request: imageRequestKey(state), count: 2 });
    assert.equal(state.status, i < 3 ? 'waiting' : 'failed');
    state = imageLoadReducer(state, { type: 'next', request: imageRequestKey(state), count: 2 });
  }
  assert.deepEqual(used, [0, 1, 0, 1]);
  assert.equal(state.status, 'failed');
});
test('late load/error callbacks from a prior attempt cannot overwrite the current image', () => {
  const oldKey = imageRequestKey(initialImageLoadState);
  let state = imageLoadReducer(initialImageLoadState, { type: 'error', request: oldKey, count: 2 });
  state = imageLoadReducer(state, { type: 'next', request: oldKey, count: 2 });
  for (const type of ['loaded', 'error']) assert.strictEqual(imageLoadReducer(state, { type, request: oldKey, count: 2 }), state);
  state = imageLoadReducer(state, { type: 'loaded', request: imageRequestKey(state), count: 2 });
  assert.equal(state.status, 'loaded');
  assert.strictEqual(imageLoadReducer(state, { type: 'error', request: imageRequestKey(state), count: 2 }), state);
});
test('manual/foreground retry starts a fresh bounded run and invalidates previous callbacks', () => {
  const failed = { run: 0, attempt: 3, status: 'failed' };
  const retry = imageLoadReducer(failed, { type: 'reset' });
  assert.deepEqual(retry, { run: 1, attempt: 0, status: 'loading' });
  assert.strictEqual(imageLoadReducer(retry, { type: 'loaded', request: '0:0', count: 2 }), retry);
});
