import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabase } from '../src/services/supabase.js';
import { exerciseDuration } from '../src/models/exercise.js';

const config = { url: 'https://project.example', key: 'sb_publishable_demo' };
const row = {
  id: 1, title: 'Lugn andning', description: 'En kort övning.', session_type: 'short',
  duration_minutes: 3, content_type: 'breathing', video_url: 'sample-mp4-360p-h264-10s.mp4',
  subtitle_url: null, file_size_bytes: null, published: true
};

// Samma svarstyper som Data API och Storage, helt utan riktiga nycklar.
function fixture(rows = [row], size = 277212) {
  const calls = [];
  const api = createSupabase(config, async (url, options) => {
    const request = new URL(url);
    calls.push({ request, options });
    assert.equal(request.origin, config.url);
    assert.equal(options.headers.apikey, config.key);
    assert.ok(!('Authorization' in options.headers));
    if (request.pathname === '/rest/v1/exercises') {
      assert.equal(options.method, 'GET');
      assert.equal(request.searchParams.get('published'), 'eq.true');
      assert.equal(request.searchParams.get('video_url'), 'not.is.null');
      const fields = request.searchParams.get('select').split(',');
      assert.ok(fields.every(name => Object.hasOwn(row, name)));
      return Response.json(rows);
    }
    if (request.pathname.startsWith('/storage/v1/object/info/exercise-videos/')) {
      assert.equal(options.method, 'GET');
      return Response.json({ size });
    }
    if (request.pathname.startsWith('/storage/v1/object/sign/exercise-videos/')) {
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { expiresIn: 3600 });
      return Response.json({ signedURL: request.pathname.slice('/storage/v1'.length) + '?token=demo' + calls.length });
    }
    throw new Error('Oväntat anrop: ' + request.pathname);
  });
  return { calls, api };
}

test('existing schema: only published exercises with a file appear; nullable size needs no migration', async () => {
  const f = fixture([row, { ...row, id: 2, video_url: null }, { ...row, id: 3, published: false }]);
  const catalog = await f.api.list();
  assert.equal(f.calls.length, 1);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'sb-1');
  assert.equal(catalog[0].title_sv, row.title);
  assert.equal(catalog[0].category_sv, 'Andning');
  assert.equal(catalog[0].video_bytes, null);
  assert.equal(exerciseDuration(catalog[0]), 'Planerat pass: 3 min');
  assert.equal(exerciseDuration({ ...catalog[0], film_seconds: 10 }), 'Filmlängd: 10 sek');
});

test('streaming needs only a new signed URL; a download also resolves missing bytes from Storage', async () => {
  const f = fixture();
  const [exercise] = await f.api.list();
  const streaming = await f.api.media(exercise);
  assert.equal(f.calls.length, 2);
  const download = await f.api.media(exercise, true);
  assert.equal(f.calls.length, 4);
  assert.equal(download.videoBytes, 277212);
  assert.equal(download.subtitleUrl, null);
  assert.notEqual(streaming.videoUrl, download.videoUrl);
  assert.equal(exercise.video_url.includes('token='), false);
});

test('known file size avoids metadata request; video and subtitle paths are encoded once and signed separately', async () => {
  const f = fixture([{ ...row, session_type: 'long', duration_minutes: 8, file_size_bytes: '277212',
    video_url: 'Långa pass/film ett.mp4', subtitle_url: 'Långa pass/film ett.sv.vtt' }]);
  const [exercise] = await f.api.list();
  assert.equal(exercise.session_type, 'long');
  const media = await f.api.media(exercise, true);
  assert.match(media.videoUrl, /L%C3%A5nga%20pass\/film%20ett\.mp4\?token=/);
  assert.match(media.subtitleUrl, /film%20ett\.sv\.vtt\?token=/);
  assert.equal(f.calls.length, 3);
  assert.equal(media.videoBytes, 277212);
});

test('no usable size blocks a download; a signing error does not substitute the old demo video', async () => {
  const f = fixture([row], null);
  const [exercise] = await f.api.list();
  await assert.rejects(f.api.media(exercise, true), /file_size_bytes/);
  const refused = createSupabase(config, async () => Response.json({}, { status: 403 }));
  await assert.rejects(refused.media(exercise), /Storage.*403/);
});

test('invalid object paths, missing publishable keys and secret keys are refused', async () => {
  for (const key of ['', 'sb_secret_example', 'legacy.jwt.example']) {
    assert.throws(() => createSupabase({ ...config, key }), /Publishable key/);
  }
  for (const path of ['../other/file.mp4', '/file.mp4', 'https://example.org/film.mp4?token=old']) {
    await assert.rejects(fixture([{ ...row, video_url: path }]).api.list(), /sökvägen/);
  }
});
