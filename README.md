# I CAN Yoga

Övningarna hämtas från `public.exercises` i Supabase. Filmerna ligger i den privata bucketen `exercise-videos`. Nedladdade filmer sparas på telefonen.

Använd Node.js 24. Öppna PowerShell i mappen där `package.json` ligger. Första gången:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Fyll i `VITE_SUPABASE_PUBLISHABLE_KEY` med projektets Publishable key från **Settings → API Keys** i Supabase. Adressen står redan i filen. Spara `.env` lokalt; den ignoreras av Git. Använd aldrig en secret- eller service_role-nyckel i appen.

```powershell
npm run check:supabase
npm run dev
```

Kontrollen läser övningslistan och provar att läsa en bit av en befintlig film. Den ändrar inget i Supabase. Öppna sedan adressen Vite visar och välj en övning. Endast publicerade rader med en videosökväg visas. `video_url` och eventuell `subtitle_url` är sökvägar i bucketen, inte signerade länkar.

För att testa nedladdning, använd Android Studio med Android SDK 36:

```powershell
npm run build
npx cap sync android
npx cap open android
```

Vänta på Gradle-synkroniseringen. Välj en emulator eller ansluten telefon och tryck på Run. Spela en film, välj **Ladda ned** och vänta på beskedet att den har sparats. Stäng av Wi-Fi och mobildata, stäng appen helt och öppna filmen igen under **Nedladdat**.

Kör bygg- och synkkommandona igen efter ändringar i kod eller `.env`. Lokala tester körs med `npm test` och behöver ingen nyckel.
