# I CAN Yoga

Prototyp med övningslista, videospelare och nedladdade filmer. Appen öppnar direkt i övningslistan. Den använder fortfarande testinnehåll.

Installera Node.js 24 och öppna projektmappen i VS Code. Kör kommandona i terminalen från mappen där `package.json` ligger.

Testa gränssnittet i webbläsaren:

```bash
npm ci
npm run dev
```

Öppna adressen som visas i terminalen. Nedladdning till telefonen testas i Android-appen.

För Android behöver du Android Studio med Android SDK 36. Kör:

```bash
npm run build
npx cap sync android
npx cap open android
```

Vänta tills Android Studio har synkroniserat projektet. Välj en telefon i Device Manager, eller anslut en Android-telefon med USB-felsökning, och tryck på Run.

Välj Testfilm i övningslistan och tryck på Ladda ned. När filmen är sparad, stäng av internet och öppna den från Nedladdat. Där kan du också ta bort den.

Efter ändringar i koden, kör `npm run build` och `npx cap sync android` igen och starta om appen med Run.

HTML finns i `index.html` och `Player.html`. Gränssnittets JavaScript ligger i `src/integration/` och filhanteringen i `src/services/`.
