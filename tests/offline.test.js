import test from 'node:test';
import assert from 'node:assert/strict';
import { OfflineLibrary } from '../src/services/offline-library.js';
import { validateCatalog } from '../src/models/exercise.js';

const exercise = { id: 'test-01', title_sv: 'Testfilm', category_sv: 'Teknikprov', duration_seconds: 12,
  video_url: 'https://media.example/test.mp4', subtitle_url: 'https://media.example/test.vtt', video_bytes: 100,
  content_version: 1 };

function fixture({ failCaption = false, shortVideo = false, failSave = false } = {}) {
  const files = new Map();
  let saved = {};
  const storage = {
    async init() {},
    async list() { return [...files.keys()]; },
    async stat(name) { return files.has(name) ? { size: files.get(name).size } : null; },
    async remove(name) { files.delete(name); },
    async move(from, to) { files.set(to, files.get(from)); files.delete(from); },
    async url(name) { return `local://${name}`; },
    async readText(name) { return files.get(name).text; },
    async download(url, name, notify) {
      if (new URL(url).pathname.endsWith('.vtt')) {
        if (failCaption) throw new Error('Transfer interrupted');
        files.set(name, { size: 20, text: 'WEBVTT\n\n' });
      } else files.set(name, { size: shortVideo ? 50 : 100 });
      notify({ received: 100, total: 100 });
    }
  };
  const indexStore = {
    async read() { return structuredClone(saved); },
    async write(value) { if (failSave) throw new Error('Storage full'); saved = structuredClone(value); }
  };
  return { files, storage, indexStore, library: new OfflineLibrary(storage, indexStore) };
}

test('download survives a new library instance; video and captions resolve locally', async () => {
  const f = fixture(); await f.library.init();
  await f.library.downloadExercise(exercise);
  const restarted = new OfflineLibrary(f.storage, f.indexStore);
  await restarted.init();
  assert.equal(await restarted.getStatus(exercise), 'ready');
  const source = await restarted.getPlayback(exercise);
  assert.equal(source.offline, true);
  assert.match(source.videoUrl, /^local:/);
  assert.match(source.subtitleUrl, /^local:/);
});

for (const failure of ['failCaption', 'shortVideo', 'failSave']) {
  test(`${failure}: never claims ready and removes partial files`, async () => {
    const f = fixture({ [failure]: true }); await f.library.init();
    await assert.rejects(f.library.downloadExercise(exercise));
    assert.equal(await f.library.getStatus(exercise), 'not-downloaded');
    assert.deepEqual(await f.library.listDownloads(), []);
    assert.equal(f.files.size, 0);
  });
}

test('deleting a download removes both files and the record', async () => {
  const f = fixture(); await f.library.init(); await f.library.downloadExercise(exercise);
  await f.library.removeExercise(exercise);
  assert.equal(f.files.size, 0);
  assert.equal(await f.library.getStatus(exercise), 'not-downloaded');
});

test('missing file is not marked ready; older version cannot satisfy a new download', async () => {
  const f = fixture(); await f.library.init(); await f.library.downloadExercise(exercise);
  assert.equal(await f.library.getStatus({ ...exercise, content_version: 2 }), 'not-downloaded');
  f.files.delete('test-01-v1.mp4');
  assert.equal(await f.library.getStatus(exercise), 'incomplete');
});

test('restart cleans orphan temporary files without deleting a completed download', async () => {
  const f = fixture(); await f.library.init(); await f.library.downloadExercise(exercise);
  f.files.set('interrupted.mp4.part', { size: 10 });
  const restarted = new OfflineLibrary(f.storage, f.indexStore); await restarted.init();
  assert.equal(f.files.has('interrupted.mp4.part'), false);
  assert.equal(await restarted.getStatus(exercise), 'ready');
});

test('catalog rejects duplicate IDs, traversal IDs and cleartext media', () => {
  assert.throws(() => validateCatalog([exercise, exercise]));
  assert.throws(() => validateCatalog([{ ...exercise, id: '../bad' }]));
  assert.throws(() => validateCatalog([{ ...exercise, video_url: 'http://media.example/v.mp4' }]));
  assert.deepEqual(validateCatalog([exercise]), [exercise]);
});

test('signed links are renewed for download, never stored; a missing catalog size survives an offline restart', async () => {
  const f = fixture();
  const row = { ...exercise, media_provider: 'supabase', video_bytes: null };
  let calls = 0;
  const online = new OfflineLibrary(f.storage, f.indexStore, true, async (e, downloading) => {
    calls++;
    return { videoUrl: e.video_url + '?token=test' + calls, subtitleUrl: e.subtitle_url + '?token=test' + calls,
      videoBytes: downloading ? 100 : null };
  });
  const requests = [];
  const transfer = f.storage.download;
  f.storage.download = (url, ...rest) => { requests.push(url); return transfer(url, ...rest); };
  await online.init();
  assert.match((await online.getPlayback(row)).videoUrl, /token=test1$/);
  await online.downloadExercise(row);
  assert.deepEqual(requests, [row.video_url + '?token=test2', row.subtitle_url + '?token=test2']);
  const persisted = await f.indexStore.read();
  assert.ok(!JSON.stringify(persisted).includes('token='));
  assert.equal(persisted['test-01-v1'].exercise.video_bytes, 100);
  const noNetwork = new OfflineLibrary(f.storage, f.indexStore, true, () => { throw new Error('Unexpected network request'); });
  await noNetwork.init();
  const [saved] = await noNetwork.listDownloads();
  assert.equal(await noNetwork.getStatus(row), 'ready');
  const playback = await noNetwork.getPlayback(saved, true);
  assert.match(playback.videoUrl, /^local:/);
  assert.match(playback.subtitleUrl, /^local:/);
  f.files.delete('test-01-v1.mp4');
  await assert.rejects(noNetwork.getPlayback(saved, true), /inte komplett/);
});

test('new object path on the same row does not play the old file; failed replacement preserves old download', async () => {
  const f = fixture();
  await f.library.init();
  await f.library.downloadExercise(exercise);
  const next = { ...exercise, video_url: 'https://media.example/replacement.mp4' };
  assert.equal(await f.library.getStatus(next), 'not-downloaded');
  assert.equal((await f.library.getPlayback(next)).videoUrl, next.video_url);
  const transfer = f.storage.download;
  f.storage.download = async () => { throw new Error('Disconnected'); };
  await assert.rejects(f.library.downloadExercise(next), /Disconnected/);
  assert.equal(await f.library.getStatus(exercise), 'ready');
  assert.equal((await f.library.getPlayback(exercise, true)).offline, true);
  f.storage.download = transfer;
  await f.library.downloadExercise(next);
  assert.deepEqual(await f.library.listDownloads(), [next]);
  assert.equal(await f.library.getStatus(next), 'ready');
  assert.ok(!f.files.has('test-01-v1.mp4'));
});
