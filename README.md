# I CAN Yoga

Prototyp med HTML, CSS, JavaScript och Capacitor. Övningsfilmerna är fortfarande
testmaterial. Databasen är inte ansluten.

## Starta

Använd Node 24 och kör från mappen med package.json:

```powershell
npm ci
npm run dev
```

## Android

```powershell
npm run build
npx cap sync android
npx cap open android
```

Välj telefon eller emulator och tryck Run i Android Studio. Android-projektet finns
redan, så cap init och cap add behövs inte. Behåll appId för att fortsätta använda
samma app och dess sparade filer.

## Offlineprovet

Gå till Mina nedladdningar → Testa offline → Öppna testfilm.
Ladda ned filmen, stäng appen och stäng av internet. Öppna appen och spela filmen
från Mina nedladdningar. Ta bort den med Ta bort när provet är klart.

Nedladdning används i den installerade mobilappen. Den medföljande filmen på
övningskorten är en annan testfilm och bevisar inte att nedladdningen fungerar.

## Kontroller

```powershell
npm test
npm run build
node scripts/check-integration-build.mjs
```

Den förenklade vyn ändrar texter och presentation. Filhantering, versionskontroll,
felhantering och valet mellan lokal film och nätfilm använder samma tjänster som tidigare.

## Filer i paketet

Källkod, package-lock.json, Android-projekt och Gradle-wrapper ingår. node_modules,
dist, Android-byggcache, kopierade webbfiler och local.properties ingår inte. De skapas
lokalt av installation, bygge, cap sync och Android Studio.

Om du kopierar ändringarna till din befintliga mapp kan dina lokala inställningar ligga
kvar. Om du öppnar en helt ny mapp kan Android Studio behöva ange Android SDK-sökvägen.

De ändrade gränssnittsfilerna är index.html, Player.html och filerna catalog.js,
catalog-page.js, player-page.js och integration.css under src/integration.
.gitignore har också kompletterats.

Läs GITHUB.md innan du lägger in arbetet i gruppens repo. BORJA_HAR.md innehåller
äldre instruktioner för det ursprungliga B2-provet.
