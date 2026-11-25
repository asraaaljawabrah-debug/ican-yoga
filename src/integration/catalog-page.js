import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { library, nativePlatform } from '../services/native-storage.js';
import { exerciseDuration } from '../models/exercise.js';
import { loadCatalog } from './catalog.js';
import { playerHref, listRoute, listHash } from './selection.js';
import { icon, mountIcons, exerciseIcon } from './icons.js';

const $ = id => document.getElementById(id);
let busy = false;
let length = listRoute(location.hash).length;
let hasTest = false;
let totals = null;
let catalogTask = null;
let downloadsLoaded = false;
let lastView = '';

function applyFilter() {
  $('short-group').hidden = length === 'long' || totals?.short === 0;
  $('long-group').hidden = length === 'short' || totals?.long === 0;
  $('test-group').hidden = !hasTest || length !== 'all';
  document.querySelectorAll('[data-length]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.length === length));
  });
  document.querySelector('[data-view="exercises"]').href = listHash('exercises', length);
  if (totals) $('catalog-status').textContent = totals[length] ? ''
    : length === 'all' ? 'Det finns inga publicerade övningar med film ännu.'
    : 'Det finns inga publicerade filmer i den här kategorin ännu.';
}

function showView(focus = false) {
  const route = listRoute(location.hash);
  if (route.view === 'exercises') length = route.length;
  $('exercises').hidden = route.view !== 'exercises';
  $('downloads').hidden = route.view !== 'downloads';
  $('view-title').textContent = route.view === 'downloads' ? 'Nedladdat' : 'Övningar';
  document.title = `I CAN Yoga – ${$('view-title').textContent}`;
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    if (link.dataset.view === route.view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  applyFilter();
  if (lastView !== route.view) {
    window.scrollTo(0, 0);
    if (focus) $('view-title').focus({ preventScroll: true });
  }
  lastView = route.view;
  if (route.view === 'exercises') ensureCatalog();
  if (route.view === 'downloads' && downloadsLoaded) {
    renderDownloads().catch(error => { $('downloads-status').textContent = `Kunde inte läsa sparade filmer: ${error.message}`; });
  }
}

function card(exercise, downloaded = false, status = '') {
  const isTest = exercise.id === 'b2-flower';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'exercise-card';
  const picture = document.createElement('span');
  picture.className = 'exercise-icon';
  picture.append(icon(exerciseIcon(exercise)));
  const info = document.createElement('span');
  info.className = 'exercise-info';
  const title = document.createElement('span');
  title.className = 'exercise-name';
  title.textContent = isTest ? 'Testfilm' : exercise.title_sv;
  const duration = document.createElement('span');
  duration.className = 'exercise-duration';
  duration.textContent = [exerciseDuration(exercise), exercise.category_sv].filter(Boolean).join(' · ');
  info.append(title, duration);
  if (downloaded) {
    const state = document.createElement('span');
    state.className = 'exercise-state';
    state.textContent = status === 'ready' ? 'Sparad på telefonen' : 'Ofullständig – ladda ned igen';
    info.append(state);
  }
  const play = document.createElement('span');
  play.className = 'exercise-arrow';
  play.append(icon('play'));
  button.append(picture, info, play);
  button.addEventListener('click', () => {
    if (busy) return;
    const from = downloaded ? '#downloads' : listHash('exercises', length);
    location.href = playerHref(exercise, downloaded, from);
  });
  return button;
}

let downloadsRender = 0;
async function renderDownloads() {
  const rendering = ++downloadsRender;
  $('downloads-empty').hidden = true;
  if (!nativePlatform) {
    $('download-list').replaceChildren();
    $('downloads-status').textContent = 'Nedladdning och sparade filmer testas i mobilappen.';
    return;
  }
  const downloads = await library.listDownloads();
  const statuses = await Promise.all(downloads.map(exercise => library.getStatus(exercise)));
  if (rendering !== downloadsRender) return;
  const container = $('download-list');
  container.replaceChildren();
  $('downloads-empty').hidden = downloads.length > 0;
  if (!downloads.length) {
    $('downloads-status').textContent = '';
    return;
  }
  for (const [index, exercise] of downloads.entries()) {
    const wrapper = document.createElement('div');
    wrapper.className = 'download-item';
    wrapper.append(card(exercise, true, statuses[index]));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-download';
    remove.append(icon('trash'), document.createTextNode('Ta bort'));
    const title = exercise.id === 'b2-flower' ? 'Testfilm' : exercise.title_sv;
    remove.setAttribute('aria-label', `Ta bort ${title} från telefonen`);
    remove.addEventListener('click', async () => {
      if (busy || !window.confirm(`Ta bort den sparade filmen ”${title}”?`)) return;
      busy = true;
      document.querySelectorAll('#download-list button').forEach(button => { button.disabled = true; });
      try {
        await library.removeExercise(exercise);
        await renderDownloads();
      } catch (error) {
        $('downloads-status').textContent = `Kunde inte ta bort filmen: ${error.message}`;
      } finally {
        busy = false;
        document.querySelectorAll('#download-list button').forEach(button => { button.disabled = false; });
      }
    });
    wrapper.append(remove);
    container.append(wrapper);
  }
  const incomplete = statuses.filter(status => status !== 'ready').length;
  $('downloads-status').textContent = incomplete
    ? `${incomplete} ${incomplete === 1 ? 'film behöver' : 'filmer behöver'} laddas ned igen.` : '';
}

async function loadExercises() {
  try {
    const catalog = await loadCatalog();
    for (const exercise of catalog) {
      const target = exercise.is_technical ? 'technical-exercises'
        : exercise.session_type === 'short' ? 'short-exercises' : 'long-exercises';
      $(target).append(card(exercise));
    }
    hasTest = catalog.some(exercise => exercise.is_technical);
    totals = { all: catalog.length, short: catalog.filter(x => x.session_type === 'short').length,
      long: catalog.filter(x => x.session_type === 'long').length };
    applyFilter();
  } catch (error) {
    $('catalog-status').textContent = `Kunde inte läsa listan: ${error.message}`;
  }
}

function ensureCatalog() {
  if (totals || catalogTask) return;
  if (navigator.onLine === false) {
    $('catalog-status').textContent = 'Du är offline. Sparade filmer finns under Nedladdat.';
    return;
  }
  $('catalog-status').textContent = 'Läser övningslistan…';
  catalogTask = loadExercises().finally(() => { catalogTask = null; });
}

async function loadDownloads() {
  try {
    await library.init();
    downloadsLoaded = true;
    await renderDownloads();
  } catch (error) {
    $('downloads-status').textContent = `Kunde inte läsa telefonens bibliotek: ${error.message}`;
  }
}

mountIcons();
showView();
window.addEventListener('hashchange', () => showView(true));
document.querySelectorAll('[data-length]').forEach(button => {
  button.addEventListener('click', () => {
    length = button.dataset.length;
    history.replaceState(null, '', listHash('exercises', length));
    applyFilter();
    window.scrollTo(0, 0);
  });
});
window.addEventListener('online', () => { if (listRoute(location.hash).view === 'exercises') ensureCatalog(); });
loadDownloads();

if (nativePlatform && Capacitor.getPlatform() === 'android') {
  App.addListener('backButton', () => {
    if (busy) return;
    if (listRoute(location.hash).view === 'downloads') location.hash = listHash('exercises', length);
    else App.minimizeApp();
  });
}
