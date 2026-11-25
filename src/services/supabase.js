import { validateCatalog } from '../models/exercise.js';

const bucket = 'exercise-videos';
const fields = 'id,title,description,session_type,duration_minutes,content_type,video_url,subtitle_url,file_size_bytes,published';
const categories = new Map([
  ['breathing', 'Andning'], ['gentle_movement', 'Mjuka rörelser'],
  ['mindfulness', 'Mindfulness'], ['body_awareness', 'Kroppsmedvetenhet']
]);

function objectPath(name) {
  if (typeof name !== 'string' || !name.trim() || /[\\:#?]/.test(name) ||
      name.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Ange sökvägen i bucketen i video_url eller subtitle_url, till exempel andning.mp4.');
  }
  return name.split('/').map(encodeURIComponent).join('/');
}

// Samma klient används av mobilappen och av npm run check:supabase.
export function createSupabase({ url, key }, fetchFn = globalThis.fetch) {
  let project;
  try { project = new URL(url); } catch { throw new Error('Kontrollera VITE_SUPABASE_URL i .env.'); }
  if (project.protocol !== 'https:' || project.pathname !== '/' || project.username || project.password || project.search || project.hash) {
    throw new Error('VITE_SUPABASE_URL ska vara projektets HTTPS-adress utan extra sökväg.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key || '')) {
    throw new Error('Fyll i projektets Publishable key (sb_publishable_…) i .env.');
  }
  const origin = project.origin;
  const storage = origin + '/storage/v1';
  const prefix = storage + '/object/authenticated/' + bucket + '/';

  async function json(endpoint, body) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetchFn(endpoint, {
        method: body ? 'POST' : 'GET',
        headers: { apikey: key, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: abort.signal
      });
      if (!response.ok) {
        const area = endpoint.startsWith(storage + '/') ? 'Storage' : 'Databas';
        const hint = response.status === 401 ? 'Kontrollera att adress och Publishable key hör till samma projekt.'
          : response.status === 403 ? 'Kontrollera SELECT och RLS för rollen anon.'
          : area === 'Storage' ? 'Kontrollera filens exakta sökväg och läspolicyn för exercise-videos.'
          : 'Kontrollera att public.exercises är tillgänglig via Data API och att kolumnnamnen stämmer.';
        throw new Error(area + ' (HTTP ' + response.status + '). ' + hint);
      }
      return await response.json();
    } catch (error) {
      if (abort.signal.aborted || error instanceof TypeError) throw new Error('Kunde inte nå Supabase. Kontrollera internet och projektets adress.');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function toExercise(row) {
    const id = String(row.id);
    if (!/^[1-9]\d*$/.test(id) || (typeof row.id === 'number' && !Number.isSafeInteger(row.id))) {
      throw new Error('Ogiltigt ID i övningslistan.');
    }
    if (!['short', 'long'].includes(row.session_type)) throw new Error('Övning ' + id + ' saknar session_type: short eller long.');
    return {
      id: 'sb-' + id,
      title_sv: row.title,
      description_sv: row.description || '',
      session_type: row.session_type,
      category_sv: categories.get(row.content_type) || row.content_type || 'Yoga',
      duration_seconds: row.duration_minutes > 0 ? row.duration_minutes * 60 : null,
      media_provider: 'supabase',
      // Spara en stabil referens. En signerad uppspelningslänk hör inte hemma i registret.
      video_url: prefix + objectPath(row.video_url),
      subtitle_url: row.subtitle_url ? prefix + objectPath(row.subtitle_url) : null,
      video_bytes: row.file_size_bytes == null ? null : Number(row.file_size_bytes),
      // Det befintliga lokala registret använder ett versionsfält. Ändrade filer
      // upptäcks även via deras sökvägar; databasen behöver ingen ny kolumn.
      content_version: 1
    };
  }

  function fileKey(ref) {
    if (!ref.startsWith(prefix)) throw new Error('Filens referens tillhör inte det inställda projektet och bucketen.');
    return bucket + '/' + ref.slice(prefix.length);
  }

  async function sign(ref) {
    const data = await json(storage + '/object/sign/' + fileKey(ref), { expiresIn: 3600 });
    const value = data?.signedURL ?? data?.signedUrl;
    if (typeof value !== 'string' || !value) throw new Error('Storage skickade ingen signerad länk.');
    const link = value.startsWith('/object/') ? new URL(storage + value) : new URL(value, storage + '/');
    if (link.origin !== origin || link.username || link.password || !link.pathname.startsWith('/storage/v1/object/sign/' + bucket + '/') || !link.searchParams.has('token')) {
      throw new Error('Storage skickade en ogiltig signerad länk.');
    }
    return link.href;
  }

  async function storedBytes(ref) {
    const info = await json(storage + '/object/info/' + fileKey(ref));
    const size = Number(info?.size ?? info?.metadata?.size ?? info?.metadata?.contentLength);
    if (!Number.isSafeInteger(size) || size <= 0) throw new Error('Filstorlek saknas i Storage. Fyll i filens exakta storlek i file_size_bytes.');
    return size;
  }

  return {
    async list() {
      const query = new URLSearchParams({ select: fields, published: 'eq.true', video_url: 'not.is.null', order: 'id.asc' });
      const rows = await json(origin + '/rest/v1/exercises?' + query);
      if (!Array.isArray(rows)) throw new Error('Supabase gav ingen övningslista.');
      return validateCatalog(rows.filter(row => row.published === true && row.video_url?.trim()).map(toExercise));
    },
    async media(exercise, forDownload = false) {
      const [videoUrl, subtitleUrl, videoBytes] = await Promise.all([
        sign(exercise.video_url),
        exercise.subtitle_url ? sign(exercise.subtitle_url) : null,
        forDownload && exercise.video_bytes == null ? storedBytes(exercise.video_url) : exercise.video_bytes
      ]);
      return { videoUrl, subtitleUrl, videoBytes };
    }
  };
}

// Läs inställningarna först när nätet behövs. Nedladdat ska fungera vid en kallstart offline.
export function appSupabase() {
  return createSupabase({
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  });
}
