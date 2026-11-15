import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { library, nativePlatform } from '../services/native-storage.js';
import { formatDuration } from '../models/exercise.js';
import { loadCatalog } from './catalog.js';
import { resolveSelection, resolvePlayback, returnToList } from './selection.js';
import { icon, mountIcons } from './icons.js';

const $ = id => document.getElementById(id);
const video = $('exercise-video');
const params = new URLSearchParams(location.search);
let selected = null;
let initialized = false;
let busy = false;
let status = 'not-downloaded';
let hasPlayback = false;
let trackElement = null;
let captionsVisible = false;
let localOnly = params.get('source') === 'download';

mountIcons();
const listLink = document.querySelector('[data-view="exercises"]');
if (!localOnly) listLink.href = returnToList(params);
document.querySelectorAll('.bottom-nav a').forEach(link => {
  const active = link.dataset.view === (localOnly ? 'downloads' : 'exercises');
  if (active) link.setAttribute('aria-current', 'page');
  else link.removeAttribute('aria-current');
  link.addEventListener('click', event => {
    if (busy) {
      event.preventDefault();
      message('Vänta tills filhanteringen är klar.');
    } else video.pause();
  });
});

function message(text) { $('player-status').textContent = text; }
function updateButtons() {
  $('back-button').disabled = busy;
  $('download-button').disabled = !selected || selected.is_preview || !nativePlatform || !initialized || busy || status === 'ready';
  $('download-label').textContent = busy ? 'Vänta…' : status === 'ready' ? 'Nedladdad' : 'Ladda ned';
  $('remove-button').hidden = !selected || status === 'not-downloaded';
  $('remove-button').disabled = busy;
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    if (busy) {
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
    } else {
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
    }
  });
  $('download-hint').textContent = !selected ? '' : selected.is_preview
    ? 'Prova nedladdning med Testfilm i övningslistan.'
    : !nativePlatform ? 'Nedladdning testas i mobilappen.'
    : status === 'ready' ? 'Filmen finns även under Nedladdat.'
    : 'Spara filmen för att använda den utan internet.';
}
function clearPlayer() {
  hasPlayback = false;
  video.pause();
  video.removeAttribute('src');
  video.querySelectorAll('track').forEach(track => track.remove());
  trackElement = null;
  video.load();
  video.hidden = true;
  $('video-placeholder').hidden = false;
  $('video-placeholder').textContent = 'Filmen visas här.';
  captionsVisible = false;
  $('captions-button').hidden = true;
  $('captions-button').setAttribute('aria-pressed', 'false');
  $('captions-button').textContent = 'Visa undertexter';
  $('subtitle-status').textContent = '';
  document.querySelector('.subtitle-info').hidden = true;
  $('source-status').textContent = '';
}
function showVideo(source, label) {
  clearPlayer();
  if (source.subtitleUrl) {
    document.querySelector('.subtitle-info').hidden = false;
    trackElement = document.createElement('track');
    trackElement.kind = 'captions';
    trackElement.srclang = 'sv';
    trackElement.label = 'Svenska';
    trackElement.src = source.subtitleUrl;
    const currentTrack = trackElement;
    currentTrack.addEventListener('load', () => {
      if (trackElement !== currentTrack) return;
      currentTrack.track.mode = captionsVisible ? 'showing' : 'hidden';
      $('subtitle-status').textContent = '';
    });
    currentTrack.addEventListener('error', () => {
      if (trackElement !== currentTrack) return;
      $('subtitle-status').textContent = 'Undertexten kunde inte öppnas.';
    });
    video.append(trackElement);
    trackElement.track.mode = 'hidden';
    $('captions-button').hidden = false;
  }
  hasPlayback = true;
  video.src = source.videoUrl;
  video.hidden = false;
  $('video-placeholder').hidden = true;
  video.load();
  $('source-status').replaceChildren(icon(source.offline ? 'check' : selected.is_preview ? 'play' : 'wifi'), document.createTextNode(label));
}
async function openSelected() {
  if (selected.is_preview) {
    showVideo({ videoUrl: new URL('demo/test-video.mp4', document.baseURI).href,
      subtitleUrl: new URL('demo/preview.sv.vtt', document.baseURI).href },
    'Medföljande testfilm · 22 sek');
    message('Övningens riktiga film kommer senare.');
    return;
  }
  const source = await resolvePlayback(library, selected, localOnly);
  showVideo(source, source.offline ? 'Sparad på telefonen' : 'Spelas via internet');
  message('');
}
async function perform(job) {
  if (busy) return;
  busy = true;
  updateButtons();
  try { await job(); }
  catch (error) { message(`Kunde inte slutföra: ${error.message || String(error)}`); console.error(error); }
  finally {
    busy = false;
    $('download-progress').hidden = true;
    if (selected && initialized && !selected.is_preview) {
      try { status = await library.getStatus(selected); }
      catch (error) { initialized = false; message(`Kunde inte kontrollera lokala filer: ${error.message}`); }
    }
    updateButtons();
  }
}
function goBack() {
  if (busy) { message('Vänta tills nedladdningen är klar.'); return; }
  clearPlayer();
  location.href = returnToList(params);
}
$('back-button').addEventListener('click', goBack);
$('captions-button').addEventListener('click', () => {
  if (!trackElement) return;
  captionsVisible = !captionsVisible;
  trackElement.track.mode = captionsVisible ? 'showing' : 'hidden';
  $('captions-button').textContent = captionsVisible ? 'Dölj undertexter' : 'Visa undertexter';
  $('captions-button').setAttribute('aria-pressed', String(captionsVisible));
});
$('download-button').addEventListener('click', () => perform(async () => {
  clearPlayer();
  message('Laddar ned… Behåll appen öppen.');
  const progress = $('download-progress');
  progress.hidden = false;
  progress.removeAttribute('value');
  await library.downloadExercise(selected, event => {
    if (event.phase === 'video' && event.total) progress.value = Math.min(100, event.received / event.total * 100);
    if (event.phase === 'subtitles') { progress.removeAttribute('value'); message('Hämtar undertext…'); }
  });
  status = await library.getStatus(selected);
  if (status !== 'ready') throw new Error('Den sparade övningen kunde inte verifieras.');
  const source = await resolvePlayback(library, selected, true);
  showVideo(source, 'Sparad på telefonen');
  message('Klart. Filmen kan spelas utan internet.');
}));
$('remove-button').addEventListener('click', () => {
  if (busy || !window.confirm('Ta bort den sparade filmen och eventuell undertext?')) return;
  perform(async () => {
    clearPlayer();
    await library.removeExercise(selected);
    status = 'not-downloaded';
    message('Filmen är borttagen från telefonen.');
  });
});
video.addEventListener('error', () => {
  if (hasPlayback) message(`Filmen kunde inte spelas (fel ${video.error?.code ?? 'okänt'}). Kontrollera anslutningen eller hämta den lokala kopian igen.`);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
window.addEventListener('pagehide', () => video.pause());
window.addEventListener('beforeunload', event => { if (busy) { event.preventDefault(); event.returnValue = ''; } });
if (nativePlatform) {
  await App.addListener('appStateChange', ({ isActive }) => { if (!isActive) video.pause(); });
  if (Capacitor.getPlatform() === 'android') await App.addListener('backButton', goBack);
}
try {
  await library.init();
  initialized = true;
  // Nedladdningsvyn behöver inte en nätkatalog för att öppna sin sparade metadata.
  const downloads = await library.listDownloads();
  const catalog = localOnly ? [] : await loadCatalog();
  ({ exercise: selected, localOnly } = resolveSelection(params, catalog, downloads));
  const isTest = selected.id === 'b2-flower';
  $('exercise-title').textContent = isTest ? 'Testfilm' : selected.title_sv;
  document.title = `I CAN Yoga – ${$('exercise-title').textContent}`;
  $('exercise-category').textContent = isTest ? '' : selected.category_sv || (selected.session_type === 'short' ? 'Korta övningar' : 'Längre pass');
  $('category-row').hidden = !$('exercise-category').textContent;
  $('exercise-duration').textContent = selected.is_preview ? `Planerad längd: ${selected.duration_label}` : formatDuration(selected.duration_seconds);
  $('exercise-description').textContent = isTest
    ? 'Ladda ned filmen. Stäng sedan av internet och spela den igen.'
    : selected.description_sv || '';
  if (!selected.is_preview) status = await library.getStatus(selected);
  await openSelected();
} catch (error) {
  message(error.message || 'Övningen kunde inte öppnas.');
  if (!hasPlayback) $('video-placeholder').textContent = 'Filmen kunde inte öppnas.';
  if (!selected) $('exercise-title').textContent = 'Övningen kunde inte öppnas';
}
updateButtons();
