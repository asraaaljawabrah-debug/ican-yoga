// Gemensamt kontrakt. Ändra fälten tillsammans, inte var för sig.
export function exerciseKey(exercise) {
  return `${exercise.id}-v${exercise.content_version}`;
}

export function validateCatalog(rows, { demo = false } = {}) {
  if (!Array.isArray(rows)) throw new Error('Övningslistan har fel format.');
  const ids = new Set();
  for (const row of rows) {
    if (!row || !/^[a-z0-9_-]{1,64}$/.test(row.id) || ids.has(row.id)) {
      throw new Error('Övningarna behöver unika, giltiga ID:n.');
    }
    ids.add(row.id);
    if (!row.title_sv?.trim() || !row.category_sv?.trim() ||
        !Number.isInteger(row.duration_seconds) || row.duration_seconds <= 0 ||
        !Number.isInteger(row.content_version) || row.content_version < 1 ||
        !Number.isSafeInteger(row.video_bytes) || row.video_bytes <= 0) {
      throw new Error(`Ofullständig information för ${row.id}.`);
    }
    for (const url of [row.video_url, row.subtitle_url].filter(Boolean)) {
      if (demo && /^\/demo\/[a-z0-9_.-]+$/.test(url)) continue;
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        throw new Error('Media måste ha en HTTPS-adress utan inloggningsuppgifter.');
      }
    }
    if (typeof row.video_url !== 'string' || !row.video_url) throw new Error('Videolänk saknas.');
  }
  return rows;
}

export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes} min${rest ? ` ${rest} sek` : ''}` : `${rest} sek`;
}
