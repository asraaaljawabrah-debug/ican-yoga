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
      if (url.endsWith('.vtt')) {
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
