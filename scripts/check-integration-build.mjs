import { access, readFile } from 'node:fs/promises';

// Kör efter npm run build. Fångar det vanliga felet att Player.html saknas i dist.
for (const path of ['dist/index.html', 'dist/Player.html', 'dist/demo/test-video.mp4', 'dist/demo/preview.sv.vtt']) {
  await access(path);
  console.log(`Finns: ${path}`);
}
for (const page of ['index.html', 'Player.html']) {
  const html = await readFile(`dist/${page}`, 'utf8');
  if (!/<script\b[^>]*type="module"/.test(html)) throw new Error(`Modulskript saknas i ${page}`);
}
console.log('Byggfilerna för listan, spelaren och den medföljande förhandsvisningen finns. Detta provar inte native-uppspelning.');
