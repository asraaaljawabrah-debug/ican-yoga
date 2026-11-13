import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { library, nativePlatform } from '../services/native-storage.js';
import { formatDuration } from '../models/exercise.js';
import { loadCatalog } from './catalog.js';
import { playerHref } from './selection.js';

const $ = id => document.getElementById(id);
let busy = false;
const icons = ['🌬️', '🌿', '🌱', '💨', '🫁', '🧘', '🤱', '🤸', '🌼', '☁️', '🌙'];

function card(exercise, downloaded = false, status = '') {
  const isTest = exercise.id === 'b2-flower';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'exercise-card exercise-card-button';
  const icon = document.createElement('span');
  icon.className = 'exercise-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = exercise.is_preview ? icons[Number(exercise.id.split('-')[1]) - 1] || '🌿' : '▶';
  const info = document.createElement('span');
  info.className = 'exercise-info';
  const title = document.createElement('span');
  title.className = 'exercise-name';
  title.textContent = isTest ? 'Testfilm' : exercise.title_sv;
  const duration = document.createElement('span');
  duration.className = 'exercise-duration';
  duration.textContent = exercise.is_preview
    ? `Planerad längd: ${exercise.duration_label}`
    : isTest ? formatDuration(exercise.duration_seconds) : `${formatDuration(exercise.duration_seconds)} · ${exercise.category_sv}`;
  const description = document.createElement('span');
  description.className = 'exercise-description';
  description.textContent = isTest ? '' : exercise.description_sv || '';
  const badge = document.createElement('span');
  badge.className = 'exercise-description';
  badge.textContent = downloaded
    ? status === 'ready' ? 'Sparad på telefonen' : 'Ofullständig – ladda ned igen'
    : '';
  info.append(title, duration);
  if (description.textContent) info.append(description);
  if (badge.textContent) info.append(badge);
  const arrow = document.createElement('span');
  arrow.className = 'exercise-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '›';
  button.append(icon, info, arrow);
  button.addEventListener('click', () => { if (!busy) location.href = playerHref(exercise, downloaded); });
  return button;
}

async function renderDownloads() {
  const container = $('download-list');
  container.replaceChildren();
  if (!nativePlatform) {
    $('downloads-status').textContent = 'Nedladdning är tillgänglig i mobilappen.';
    return;
  }
  const downloads = await library.listDownloads();
  if (!downloads.length) {
    $('downloads-status').textContent = 'Inga nedladdade filmer ännu.';
    return;
  }
  let ready = 0;
  for (const exercise of downloads) {
    const status = await library.getStatus(exercise);
    if (status === 'ready') ready++;
    const wrapper = document.createElement('div');
    wrapper.className = 'download-item';
    wrapper.append(card(exercise, true, status));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary-button';
    remove.textContent = 'Ta bort';
    remove.setAttribute('aria-label', `Ta bort ${exercise.title_sv}, version ${exercise.content_version}, från telefonen`);
    remove.addEventListener('click', async () => {
      if (busy || !window.confirm(`Ta bort den lokala kopian av ”${exercise.title_sv}”?`)) return;
      busy = true;
      document.querySelectorAll('#download-list button').forEach(button => button.disabled = true);
      try { await library.removeExercise(exercise); await renderDownloads(); }
      catch (error) { $('downloads-status').textContent = `Kunde inte radera: ${error.message}`; }
      finally {
        busy = false;
        document.querySelectorAll('#download-list button').forEach(button => button.disabled = false);
      }
    });
    wrapper.append(remove);
    container.append(wrapper);
  }
  const incomplete = downloads.length - ready;
  $('downloads-status').textContent = incomplete
    ? `${incomplete} ${incomplete === 1 ? 'film behöver' : 'filmer behöver'} laddas ned igen.`
    : '';
}

try {
  const catalog = await loadCatalog();
  for (const exercise of catalog) {
    if (exercise.is_technical) {
      const link = document.createElement('a');
      link.href = playerHref(exercise);
      link.textContent = `Öppna testfilm (${formatDuration(exercise.duration_seconds)})`;
      $('technical-exercises').append(link);
      continue;
    }
    const target = exercise.session_type === 'short' ? 'short-exercises' : 'long-exercises';
    $(target).append(card(exercise));
  }
  $('catalog-status').textContent = '';
} catch (error) { $('catalog-status').textContent = `Kunde inte läsa listan: ${error.message}`; }

try { await library.init(); await renderDownloads(); }
catch (error) { $('downloads-status').textContent = `Kunde inte läsa telefonens bibliotek: ${error.message}`; }

if (nativePlatform && Capacitor.getPlatform() === 'android') {
  await App.addListener('backButton', () => {
    if (busy) return;
    if (location.hash && location.hash !== '#home') {
      location.hash = '#home';
    } else { App.minimizeApp(); }
  });
}
