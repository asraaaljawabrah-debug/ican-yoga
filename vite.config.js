import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Båda sidorna måste finnas i dist innan Capacitor kopierar webbfilerna.
export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        player: fileURLToPath(new URL('./Player.html', import.meta.url))
      }
    }
  }
});
