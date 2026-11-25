import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { Preferences } from '@capacitor/preferences';
import { OfflineLibrary, directMedia } from './offline-library.js';
import { appSupabase } from './supabase.js';

const folder = 'icanyoga-media';
const directory = Directory.LibraryNoCloud;
const native = Capacitor.isNativePlatform();
const indexKey = 'icanyoga:downloads:v1';
const pathOf = name => {
  if (!/^[a-z0-9_.-]+$/.test(name)) throw new Error('Ogiltigt lokalt filnamn.');
  return `${folder}/${name}`;
};
const missing = error => error?.code === 'OS-PLUG-FILE-0008' ||
  /does not exist|doesn't exist|not found|no such|ENOENT/i.test(error?.message || '');

const storage = {
  async init() {
    try { await Filesystem.mkdir({ path: folder, directory, recursive: true }); }
    catch (error) {
      const info = await Filesystem.stat({ path: folder, directory });
      if (info.type !== 'directory') throw error;
    }
  },
  async list() {
    const { files } = await Filesystem.readdir({ path: folder, directory });
    return files.filter(file => file.type === 'file').map(file => file.name);
  },
  async stat(name) {
    try { return await Filesystem.stat({ path: pathOf(name), directory }); }
    catch (error) { if (missing(error)) return null; throw error; }
  },
  async remove(name) {
    try { await Filesystem.deleteFile({ path: pathOf(name), directory }); }
    catch (error) { if (!missing(error)) throw error; }
  },
  async move(from, to) { await Filesystem.rename({ from: pathOf(from), to: pathOf(to), directory }); },
  async readText(name) {
    const { data } = await Filesystem.readFile({ path: pathOf(name), directory, encoding: Encoding.UTF8 });
    return data;
  },
  async url(name) {
    const { uri } = await Filesystem.getUri({ path: pathOf(name), directory });
    return Capacitor.convertFileSrc(uri);
  },
  async download(url, name, onProgress) {
    const { uri } = await Filesystem.getUri({ path: pathOf(name), directory });
    const listener = await FileTransfer.addListener('progress', event => {
      onProgress({ received: event.bytes, total: event.contentLength > 0 ? event.contentLength : null });
    });
    try {
      await FileTransfer.downloadFile({ url, path: uri, progress: true, connectTimeout: 15000, readTimeout: 30000 });
    } catch {
      throw new Error('Filöverföringen avbröts. Kontrollera anslutningen och att det finns ledigt utrymme.');
    } finally { await listener.remove(); }
  }
};
const indexStore = {
  async read() {
    const { value } = await Preferences.get({ key: indexKey });
    if (!value) return {};
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Registret över sparade filmer kunde inte läsas.');
    return parsed;
  },
  async write(records) { await Preferences.set({ key: indexKey, value: JSON.stringify(records) }); }
};

const onlineMedia = (exercise, forDownload) => exercise.media_provider === 'supabase'
  ? appSupabase().media(exercise, forDownload) : directMedia(exercise);
export const library = new OfflineLibrary(storage, indexStore, native, onlineMedia);
export const nativePlatform = native;
