// Gemensam navigering. En länk från Nedladdade identifierar också exakt version.
export function playerHref(exercise, downloaded = false, returnHash = '') {
  const query = new URLSearchParams({ id: exercise.id });
  if (downloaded) {
    query.set('source', 'download');
    query.set('version', String(exercise.content_version));
  }
  if (returnHash) query.set('from', returnHash);
  return `Player.html?${query}`;
}

export function listRoute(hash = '') {
  const [page, query = ''] = hash.replace(/^#/, '').split('?');
  const view = page === 'downloads' ? 'downloads' : 'exercises';
  const requested = new URLSearchParams(query).get('length');
  const length = ['short', 'long'].includes(requested) ? requested : 'all';
  return { view, length };
}

export function listHash(view, length = 'all') {
  if (view === 'downloads') return '#downloads';
  return ['short', 'long'].includes(length) ? `#exercises?length=${length}` : '#exercises';
}

export function returnToList(params) {
  if (params.get('source') === 'download') return 'index.html#downloads';
  const route = listRoute(params.get('from') || '#exercises');
  return `index.html${listHash(route.view, route.length)}`;
}

export function resolveSelection(params, catalog, downloads) {
  const id = params.get('id');
  if (!id || !/^[a-z0-9_-]{1,64}$/.test(id)) throw new Error('Övningen hittades inte. Gå tillbaka till listan.');
  const localOnly = params.get('source') === 'download';
  if (localOnly) {
    const raw = params.get('version');
    const version = Number(raw);
    if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(version) || version < 1) {
      throw new Error('Den sparade versionen kunde inte identifieras. Öppna den från Nedladdade igen.');
    }
    const exercise = downloads.find(row => row.id === id && row.content_version === version);
    if (!exercise) throw new Error('Den sparade övningen finns inte längre. Gå tillbaka till Nedladdade.');
    return { exercise, localOnly: true };
  }
  const exercise = catalog.find(row => row.id === id);
  if (!exercise) throw new Error('Övningen hittades inte. Gå tillbaka till listan.');
  return { exercise, localOnly: false };
}

// En trasig lokal fil får aldrig tyst ersättas av en nätfilm i offlineprovet.
export async function resolvePlayback(library, exercise, localOnly) {
  if (localOnly && await library.getStatus(exercise) !== 'ready') {
    throw new Error('Den sparade filmen är ofullständig. Gå till Övningar och ladda ned igen.');
  }
  const playback = await library.getPlayback(exercise, localOnly);
  if (localOnly && !playback.offline) throw new Error('Ingen komplett lokal film finns. Ingen nätvideo öppnades.');
  return playback;
}
