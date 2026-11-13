import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { library, nativePlatform } from './services/native-storage.js';
import { validateCatalog } from './models/exercise.js';
import { testExercise } from './test-exercise.js';

validateCatalog([testExercise]);
const $ = selector => document.querySelector(selector);
const video = $('#video');
const progress = $('#progress');
const nativeButtons = ['#download', '#play-local', '#check', '#remove'].map($);
let initialized = false;
let busy = false;
let sourceMode = '';
const labels = {'ready':'Filmen finns komplett på telefonen.', 'incomplete':'Filmen saknas eller är ofullständig. Ladda ned igen.', 'not-downloaded':'Ingen komplett testfilm är nedladdad.'};

function log(text) {
  const line = `${new Date().toLocaleTimeString('sv-SE')} ${text}`;
  $('#log').textContent = (line+'\n'+$('#log').textContent).slice(0, 7000);
}
function setStatus(text) { $('#status').textContent = text; log(text); }
function refreshButtons() {
  nativeButtons.forEach(button => { button.disabled = !nativePlatform || !initialized || busy; });
  $('#play-online').disabled = busy;
}
function clearVideo() {
  video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true;
  $('#source').hidden = true; sourceMode = '';
}
function selectVideo(url, local) {
  clearVideo();
  sourceMode = local ? 'local' : 'online';
  video.src = url; video.hidden = false; video.load();
  $('#source').textContent = local ? 'Källa: sparad fil på telefonen.' : 'Källa: internet. Detta bevisar inte offlinefunktionen.';
  $('#source').hidden = false;
  setStatus('Filmen är vald. Tryck på spelarens playknapp för att prova uppspelningen.');
}
async function action(job) {
  if (busy) return;
  busy = true; refreshButtons();
  try { await job(); }
  catch (error) {
    setStatus(`Fel: ${error.message || String(error)}${error.code ? ` (${error.code})` : ''}`);
    console.error(error);
  } finally { busy = false; progress.hidden = true; refreshButtons(); }
}

$('#download').addEventListener('click', () => action(async () => {
  clearVideo();
  setStatus('Laddar ned. Behåll appen öppen tills nedladdningen är klar.');
  progress.hidden = false; progress.removeAttribute('value');
  await library.downloadExercise(testExercise, event => {
    if (event.phase === 'video' && event.total) progress.value = Math.min(100, 100 * event.received / event.total);
  });
  if (await library.getStatus(testExercise) !== 'ready') throw new Error('Filen kunde inte verifieras.');
  setStatus('Nedladdningen är klar och registret är sparat. Du kan nu göra offlineprovet.');
}));
$('#play-local').addEventListener('click', () => action(async () => {
  if (await library.getStatus(testExercise) !== 'ready') throw new Error('Ingen komplett sparad film finns. Ladda ned testfilmen först.');
  const source = await library.getPlayback(testExercise);
  if (!source.offline) throw new Error('En lokal fil förväntades. Ingen nätuppspelning startas.');
  selectVideo(source.videoUrl, true);
}));
$('#check').addEventListener('click', () => action(async () => setStatus(labels[await library.getStatus(testExercise)])));
$('#remove').addEventListener('click', () => action(async () => {
  clearVideo();
  await library.removeExercise(testExercise);
  setStatus('Den lokala testfilmen och dess registerpost är raderade.');
}));
$('#play-online').addEventListener('click', () => action(async () => selectVideo(testExercise.video_url, false)));
video.addEventListener('playing', () => setStatus(sourceMode === 'local' ? 'Spelaren spelar från den lokala filen.' : 'Spelaren spelar via internet.'));
video.addEventListener('error', () => {
  if (sourceMode) setStatus(`Videospelaren rapporterar fel ${video.error?.code ?? 'okänt'}. Kontrollera fil, anslutning och enhet. Källa: ${sourceMode}.`);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
if (nativePlatform) {
  await App.addListener('appStateChange', ({ isActive }) => { if (!isActive) video.pause(); });
  if (Capacitor.getPlatform() === 'android') await App.addListener('backButton', () => App.minimizeApp());
}
$('#platform').textContent = nativePlatform
  ? `Installerad ${Capacitor.getPlatform()}-app. Native filhantering är tillgänglig.`
  : 'Webbläsarläge. Du kan prova nätvideon här. Nedladdning och lokala filer provas i den installerade appen.';
try {
  await library.init(); initialized = true;
  setStatus(nativePlatform ? labels[await library.getStatus(testExercise)] : 'Öppna projektet på en telefon för nästa steg.');
} catch (error) { setStatus(`Kunde inte starta filhanteringen: ${error.message}`); }
refreshButtons();
