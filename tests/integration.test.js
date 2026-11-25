import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHref, resolveSelection, resolvePlayback, returnToList } from '../src/integration/selection.js';
test('saved version can open without a server catalog and is not replaced by a newer version', () => {
  const old = {id: 'example', content_version: 1};
  const current = {id: 'example', content_version: 2};
  const params = new URLSearchParams(playerHref(old, true).split('?')[1]);
  assert.deepEqual(resolveSelection(params, [current], [old]), {exercise:old, localOnly:true});
  assert.deepEqual(resolveSelection(params, [], [old]), {exercise:old, localOnly:true});
  assert.throws(() => resolveSelection(params, [current], []));
});
test('invalid or absent selection never becomes the default first exercise', () => {
  for (const q of ['', 'id=unknown', 'id=../bad', 'id=x&source=download&version=0']) {
    assert.throws(() => resolveSelection(new URLSearchParams(q), [], []));
  }
});
test('incomplete downloaded file never falls back to a network request', async () => {
  let calls = 0;
  const library = {async getStatus(){return 'incomplete';}, async getPlayback(){calls++;return {offline:false};}};
  await assert.rejects(resolvePlayback(library, {}, true));
  assert.equal(calls, 0);
});
test('download-only playback rejects an accidental online source', async () => {
  const library = {async getStatus(){return 'ready';}, async getPlayback(){return {offline:false,videoUrl:'https://example.test/video.mp4'};}};
  await assert.rejects(resolvePlayback(library, {}, true));
});

test('player returns to the filtered list while a saved file returns to downloads', () => {
  const row = { id: 'example', content_version: 1 };
  const online = new URLSearchParams(playerHref(row, false, '#exercises?length=long').split('?').slice(1).join('?'));
  assert.equal(returnToList(online), 'index.html#exercises?length=long');
  const saved = new URLSearchParams(playerHref(row, true, '#exercises').split('?')[1]);
  assert.equal(returnToList(saved), 'index.html#downloads');
});

test('unexpected return URLs cannot leave the app', () => {
  for (const from of ['https://example.com', '//example.com', 'javascript:alert(1)', '#home']) {
    assert.equal(returnToList(new URLSearchParams({ from })), 'index.html#exercises');
  }
});
