import { createSupabase } from '../src/services/supabase.js';

try {
  const api = createSupabase({ url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_PUBLISHABLE_KEY });
  const rows = await api.list();
  console.log('Spelbara övningar från public.exercises:', rows.length);
  if (!rows.length) throw new Error('Tabellen svarar. Kontrollera published, video_url och SELECT-policyn för anon.');
  const sample = rows.find(row => row.video_url.endsWith('/sample-mp4-360p-h264-10s.mp4')) || rows[0];
  console.log('Provar:', sample.title_sv);
  const media = await api.media(sample, true);
  // Be om en enda byte. Om servern skickar hela filen stoppas läsningen ändå.
  const response = await fetch(media.videoUrl, {
    headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(15000)
  });
  const reader = response.body?.getReader();
  try {
    if (![200, 206].includes(response.status) || !reader) throw new Error('Videolänken svarade med HTTP ' + response.status + '.');
    const total = response.status === 206 ? response.headers.get('content-range')?.split('/')[1]
      : response.headers.get('content-length');
    if (total != null && Number(total) !== media.videoBytes) throw new Error('Filens storlek stämmer inte med metadata i Supabase.');
    if (!(await reader.read()).value?.length) throw new Error('Videolänken gav en tom fil.');
  } finally { if (reader) await reader.cancel(); }
  console.log('Storage OK:', media.videoBytes, 'byte. Testfilen gick att läsa.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
