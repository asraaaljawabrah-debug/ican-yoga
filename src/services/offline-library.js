import { exerciseKey } from '../models/exercise.js';

export function directMedia(exercise) {
  return { videoUrl: exercise.video_url, subtitleUrl: exercise.subtitle_url, videoBytes: exercise.video_bytes };
}

function sameFiles(record, exercise) {
  return record && record.exercise.video_url === exercise.video_url &&
    (record.exercise.subtitle_url || null) === (exercise.subtitle_url || null) &&
    (exercise.video_bytes == null || record.exercise.video_bytes === exercise.video_bytes);
}

// Filhantering och beständig lagring injiceras för att logiken ska kunna testas.
// UI använder samma metoder oavsett hur lagringen implementeras.
export class OfflineLibrary {
  constructor(storage, indexStore, enabled = true, resolveMedia = directMedia) {
    this.storage = storage;
    this.indexStore = indexStore;
    this.enabled = enabled;
    this.resolveMedia = resolveMedia;
    this.records = {};
    this.busy = false;
  }

  async init() {
    if (!this.enabled) return;
    await this.storage.init();
    this.records = (await this.indexStore.read()) || {};
    // Städa filer efter en avbruten överföring. Endast vår egen undermapp.
    const keep = new Set(Object.values(this.records).flatMap(r => [r.videoPath, r.subtitlePath].filter(Boolean)));
    for (const path of await this.storage.list()) {
      if (!keep.has(path)) await this.storage.remove(path);
    }
  }

  async isReady(record) {
    if (!record) return false;
    const video = await this.storage.stat(record.videoPath);
    if (!video || video.size !== record.exercise.video_bytes) return false;
    if (record.exercise.subtitle_url) {
      const subtitle = await this.storage.stat(record.subtitlePath);
      if (!subtitle || subtitle.size <= 0) return false;
    }
    return true;
  }

  async getStatus(exercise) {
    if (!this.enabled) return 'not-downloaded';
    const record = this.records[exerciseKey(exercise)];
    if (!sameFiles(record, exercise)) return 'not-downloaded';
    return await this.isReady(record) ? 'ready' : 'incomplete';
  }

  async listDownloads() {
    return Object.values(this.records).map(record => record.exercise);
  }

  async getPlayback(exercise, localOnly = false) {
    const record = this.records[exerciseKey(exercise)];
    if (this.enabled && sameFiles(record, exercise) && await this.isReady(record)) {
      return {
        videoUrl: await this.storage.url(record.videoPath),
        subtitleUrl: record.subtitlePath ? await this.storage.url(record.subtitlePath) : null,
        offline: true
      };
    }
    if (localOnly || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      throw new Error('Filmen finns inte komplett på telefonen. Anslut till internet och ladda ned den.');
    }
    const { videoUrl, subtitleUrl } = await this.resolveMedia(exercise, false);
    return { videoUrl, subtitleUrl, offline: false };
  }

  async downloadExercise(exercise, onProgress = () => {}) {
    if (!this.enabled) throw new Error('Nedladdning provas i den installerade Android- eller iPhone-appen.');
    if (this.busy) throw new Error('Vänta tills pågående filhantering är klar.');
    this.busy = true;
    const id = exerciseKey(exercise);
    const previous = this.records[id];
    // Vid ett filbyte ligger den gamla kopian kvar tills den nya är verifierad.
    const stem = previous?.videoPath === id + '.mp4' ? id + '-ny' : id;
    const videoPath = stem + '.mp4';
    const subtitlePath = exercise.subtitle_url ? stem + '.sv.vtt' : null;
    const paths = [videoPath, subtitlePath].filter(Boolean);
    let started = false;
    let committed = false;
    try {
      if (sameFiles(previous, exercise) && await this.isReady(previous)) return;
      const media = await this.resolveMedia(exercise, true);
      if (!media.videoUrl?.startsWith('https://') || (subtitlePath && !media.subtitleUrl?.startsWith('https://'))) {
        throw new Error('En giltig HTTPS-länk till filmen eller undertexten saknas.');
      }
      if (!Number.isSafeInteger(media.videoBytes) || media.videoBytes <= 0) throw new Error('Filens storlek i byte saknas.');
      started = true;
      for (const path of paths) {
        await this.storage.remove(path);
        await this.storage.remove(`${path}.part`);
      }
      await this.storage.download(media.videoUrl, `${videoPath}.part`, progress => {
        onProgress({ ...progress, phase: 'video' });
      });
      const info = await this.storage.stat(`${videoPath}.part`);
      if (!info || info.size !== media.videoBytes) throw new Error('Filstorleken stämmer inte. Kontrollera file_size_bytes och försök igen.');
      await this.storage.move(`${videoPath}.part`, videoPath);
      if (subtitlePath) {
        onProgress({ phase: 'subtitles' });
        await this.storage.download(media.subtitleUrl, `${subtitlePath}.part`, () => {});
        const info = await this.storage.stat(`${subtitlePath}.part`);
        if (!info || info.size > 250000 || info.size < 6) throw new Error('Undertextfilen kunde inte hämtas korrekt.');
        const text = await this.storage.readText(`${subtitlePath}.part`);
        if (!text.trimStart().startsWith('WEBVTT')) throw new Error('Undertextfilen behöver vara WebVTT.');
        await this.storage.move(`${subtitlePath}.part`, subtitlePath);
      }
      // Klar först när båda filerna OCH registret har sparats.
      const next = { ...this.records, [id]: { exercise: { ...exercise, video_bytes: media.videoBytes }, videoPath, subtitlePath } };
      await this.indexStore.write(next);
      this.records = next;
      committed = true;
      if (previous) {
        for (const old of [previous.videoPath, previous.subtitlePath].filter(Boolean)) {
          if (!paths.includes(old)) await this.storage.remove(old).catch(() => {});
        }
      }
      onProgress({ phase: 'complete' });
    } catch (error) {
      if (started && !committed) {
        for (const path of paths) {
          await this.storage.remove(path).catch(() => {});
          await this.storage.remove(`${path}.part`).catch(() => {});
        }
      }
      throw error;
    } finally { this.busy = false; }
  }

  async removeExercise(exercise) {
    if (this.busy) throw new Error('Vänta tills pågående filhantering är klar.');
    this.busy = true;
    try {
      const id = exerciseKey(exercise);
      const record = this.records[id];
      if (!record) return;
      for (const path of [record.videoPath, record.subtitlePath].filter(Boolean)) await this.storage.remove(path);
      const next = { ...this.records };
      delete next[id];
      await this.indexStore.write(next);
      this.records = next;
    } finally { this.busy = false; }
  }
}
