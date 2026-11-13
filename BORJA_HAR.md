**B2 börja med Capacitor och offlinevideo**

Detta är ett fristående teknikprov för Isaks B2-arbete. Du kan bygga det innan A1, A2 och B1 är färdiga. Appen använder en offentlig testfilm från MDN och behöver ingen databas, Supabase-nyckel eller egen server. Filmens bytes hämtas först när du väljer att ladda ned. Den levereras inte inbyggd i appen.

**Ditt första mål**

Installera appen på en telefon, ladda ned testfilmen, stäng appen helt, öppna den utan nät och spela den sparade filen. Radera därefter filmen och kontrollera att den inte längre kan öppnas lokalt.

Testappen är till för att lära sig och prova tekniken. Den ersätter inte gruppens slutliga gränssnitt, databas eller tester med verkliga filmer. Android/iOS-körning har inte verifierats i framtagningen. Läs VERIFIERING.md.

**1. Förstå verktygen**

- HTML/CSS/JavaScript är webbgränssnittet.
- Node.js och npm installerar och kör utvecklingsverktygen på datorn.
- Vite visar webbversionen och bygger webbfilerna till dist.
- Capacitor lägger webbfilerna i ett Android- eller iOS-projekt och ger JavaScript åtkomst till telefonfunktioner via pluginer.
- Android Studio/Xcode bygger och installerar mobilappen.

Du börjar med JavaScript. Kotlin, Java eller Swift behövs inte för att använda pluginerna i detta prov.

**2. Installera verktyg**

Installera Node.js 24 LTS (paketets val), Git, VS Code och en stabil Android Studio som uppfyller Capacitor 8:s krav. Dokumenterad miniminivå för Android Studio är 2025.2.1. Använd dess medföljande JDK. I SDK Manager: installera SDK Platform 36, Platform-Tools och Build-Tools som projektet begär. För en emulator behövs också Android Emulator och en system image; du kan börja med en fysisk telefon i stället.

Officiella länkar: https://nodejs.org/en/download, https://git-scm.com/downloads, https://code.visualstudio.com/download och https://developer.android.com/studio.

Öppna en ny terminal och kontrollera:

```bash
node --version
npm --version
git --version
```

Node ska visa v24.x för den valda installationen. Installera inte en separat global Capacitor-CLI. Projektet har redan CLI och pluginer i package.json.

**3. Öppna rätt mapp**

Packa upp zip-filen i en egen mapp, till exempel C:/projekt/i-can-yoga-b2-lab på Windows eller en projektmapp på Mac. I VS Code: File → Open Folder och välj mappen där package.json, index.html och capacitor.config.json ligger. Öppna Terminal → New Terminal.

Kör kommandona ett i taget:

```bash
npm ci
npm run dev
```

Öppna adressen terminalen visar. Du ska se I CAN Yoga B2 teknikprov och en markering om webbläsarläge. Nedladdningsknapparna är avstängda i webbläsaren. Du kan prova knappen för internetfilmen och trycka play i spelaren.

Stoppa utvecklingsservern med Ctrl+C när du ska fortsätta. Detta stänger inte projektet. Kör inte npm create vite eller npx cap init ovanpå paketet; uppsättningen finns redan.

**4. Bygg Android-projektet**

I VS Codes terminal, i samma projektmapp:

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

build skapar dist. add skapar android och körs bara första gången. sync kopierar byggda webbfiler och synkroniserar pluginer. open öppnar Android-projektet i Android Studio. Finns android redan ska du hoppa över add.

Skapa inget nytt Empty Activity-projekt i Android Studio. Öppna projektet Capacitor skapade och låt Gradle-sync bli färdig. Första gången kan verktyg och beroenden behöva hämtas.

**5. Installera på telefon**

På Android: öppna Inställningar → Om telefonen och aktivera Utvecklaralternativ genom att trycka upprepade gånger på versions-/byggnumret, ofta sju gånger. Placeringen varierar mellan tillverkare. Slå sedan på USB-felsökning i Utvecklaralternativ.

Anslut en datakabel, lås upp telefonen och godkänn datorns felsökningsanslutning. Välj telefonen i Android Studios enhetslista, välj app-konfigurationen och tryck den gröna Run-knappen. På Windows kan tillverkarens USB-drivrutin behövas. Android Studios Connection Assistant hjälper om telefonen inte visas.

Utan Androidtelefon: öppna Device Manager, skapa en virtuell telefon och starta den. Det räcker för en första installation, men det slutliga prototypprovet ska även göras på verkliga telefoner.

Appen heter I CAN Yoga B2 och använder identifieraren se.studentgrupp8.icanyoga.b2lab, så den skiljs från gruppens huvudapp.

**6. Prova först med internet**

1. Kontrollera att appen visar Installerad android-app och att knapparna är aktiva.
2. Tryck Ladda ned testfilmen. Håll appen öppen tills den visar klar.
3. Tryck Kontrollera nedladdning. Resultatet ska säga att filmen finns komplett på telefonen.
4. Tryck Öppna sparad film och sedan play i spelaren.
5. Kontrollera att källan visas som sparad fil på telefonen. Det är knappen för lokal film du ska använda vid offlineprov.

Testklippet är cirka fem sekunder. Det är inte en av projektets riktiga 2–5-minutersövningar och innehåller ingen yogainstruktion. Undertexter finns inte för detta första teknikprov.

**7. Bevisa offline efter omstart**

1. Stäng appen helt via listan med senaste appar.
2. Koppla bort USB-kabeln.
3. Aktivera flygplansläge och kontrollera att Wi-Fi också är avstängt.
4. Starta I CAN Yoga B2 från telefonens ikon, inte genom en webbadress.
5. Tryck Kontrollera nedladdning och sedan Öppna sparad film.
6. Spela och spola. Filmen ska fungera från telefonens lagring.
7. Tryck Radera testfilmen, starta om appen utan nät igen och kontrollera att lokal uppspelning nekas med ett tydligt meddelande.

Avinstallera inte appen och radera inte appdata mellan nedladdning och offlineprov. Det tar bort den lokala lagringen. Att bara prova appens webbläsarversion offline verifierar inte Capacitors filhantering.

**8. Gör en liten ändring för att lära dig byggflödet**

Ändra en synlig text i index.html, exempelvis rubriken till Isaks B2-test. Spara och kör:

```bash
npm run build
npx cap sync android
npx cap open android
```

Tryck Run igen. Den nya texten ska visas. Det vanliga arbetsflödet är redigera → build → sync → Run. Redigera inte dist eller kopiorna av webbfiler inne i android. Lägg inte en server.url till en Vite-server i konfigurationen för detta offlineprov.

**9. Läs koden i denna ordning**

1. index.html: knappar och spelare.
2. src/test-exercise.js: ett tillfälligt övningsobjekt med HTTPS-länk, storlek och version.
3. src/main.js: kopplar knapptryckningar till lagringstjänsten och visar status. Lokal uppspelning har ett separat kontrollsteg som hindrar tyst nätfallback.
4. src/services/offline-library.js: komplett/ofullständig nedladdning, register, radering och lokal källa.
5. src/services/native-storage.js: Filesystem, File Transfer, Preferences och omvandling till en spelbar lokal adress.

Tjänstefilerna kommer från det tidigare startpaketet. De är avsedda att kunna kopplas till A2:s spelare och B1:s katalog. Du behöver inte förstå alla rader före första installationen. Följ först en enda knapptryckning, från main.js till native-storage.js.

File Transfer hämtar en MP4 till ett tillfälligt filnamn. OfflineLibrary kontrollerar storleken, byter filnamn och sparar en registerpost med Preferences. Filesystem.getUri och Capacitor.convertFileSrc används för lokal uppspelning. Stora filmer läses inte in som Base64 i JavaScript.

**10. Koppla sedan till gruppens projekt**

När B1 har testmedia och API: byt den hårdkodade testdatan mot övningsobjekt från katalogen. A2 ska använda getPlayback för att välja en lokal fil eller serverfil. Du ansvarar för downloadExercise, getStatus, removeExercise och lokal filhantering. Avtala namn och fält innan ni integrerar.

Behåll gruppens gemensamma appidentifierare och konfiguration när ni integrerar. Kopiera relevanta tjänstefiler i en separat Git-branch; ersätt inte hela gruppens projekt med testappen. Flytta inte med node_modules eller dist. Versionshantera nativeprojektets källfiler men inte lokala SDK-sökvägar, byggen eller signeringsnycklar.

Nästa tester efter detta grundprov: VTT-undertexter offline, lokal katalog och metadata, båda passgrupperna, verkliga filstorlekar, avbruten hämtning, versionerad film, fel vid lagring och fysisk iPhone. Den grundläggande metadata som sparas med testfilmen ersätter inte B1:s arbete med en lokal katalog.

**iOS på Mac**

Capacitor 8 kräver Xcode 26 eller senare. Installera Xcode och dess komponenter, öppna det en gång, lägg till Apple-konto och kontrollera Command Line Tools. Kör vid behov xcode-select --install.

```bash
npm ci
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

I Xcode: låt paket hämtas, välj app-target → Signing & Capabilities → ditt team och automatisk signering. Anslut och välj iPhone, godkänn utvecklarläge när det krävs och tryck Run. Kör samma offlineprov. Fysisk testinstallation och distribution via App Store/TestFlight är olika steg.

En privacy-manifest-mall för Filesystem och Preferences finns i ios-template. Lägg till/mergea relevanta poster och kontrollera rätt target; skriv inte över ett befintligt manifest blint. Gruppen behöver en fungerande iOS-byggväg tidigt även om du börjar på Android.

**Vanliga fel**

| Problem | Första kontroll |
|---|---|
| node/npm hittas inte | Starta om terminal/VS Code efter Node-installationen. |
| PowerShell blockerar npm.ps1 | Välj Command Prompt i VS Codes terminalmeny och kör där, eller använd npm.cmd och npx.cmd. |
| package.json hittas inte | Öppna terminalen i mappen där package.json finns. |
| Web assets directory saknas | Kör npm run build och kontrollera webDir: dist. |
| android already exists | Hoppa över cap add; använd sync/open. |
| SDK saknas eller Gradle begär paket | Installera det efterfrågade paketet i SDK Manager; använd Android Studios JDK. |
| Telefonen visas inte | Kontrollera datakabel, USB-felsökning, telefonens godkännande och eventuell drivrutin. |
| Appen visar gammal text | Kör build, sync och Run igen. |
| Knapparna är avstängda | Kontrollera att du öppnat den installerade appen. Läs startfelet i testloggen om native lagring inte kunde initieras. |
| Nedladdning misslyckas | Kontrollera internet och om testlänken fortfarande öppnas. Läs felmeddelande/kod i testloggen. |
| Filstorleken stämmer inte | Källfilen kan ha ändrats. Kontrollera storleken och uppdatera testdata/version; ta inte bort kontrollen. |
| Offline fungerar bara innan omstart | Kontrollera filens och registrets beständighet; använd lokal-knappen. Appen får inte bero på en utvecklingsserver. |

**Det du lämnar till gruppen**

En kort beskrivning av dator/telefon, fungerande byggkommandon, vilka tester som faktiskt gått igenom, eventuella blockerare och hur A2 ska anropa lagringsfunktionerna. Ta gärna en kort skärminspelning av offlineprovet. Markera iPhone och undertexter som återstående tills de verkligen har testats.

**Källor**

- Capacitor miljökrav: https://capacitorjs.com/docs/getting-started/environment-setup
- Arbetsflöde: https://capacitorjs.com/docs/basics/workflow
- Filesystem: https://capacitorjs.com/docs/apis/filesystem
- File Transfer: https://capacitorjs.com/docs/apis/file-transfer
- Preferences: https://capacitorjs.com/docs/apis/preferences
- Android på fysisk enhet: https://developer.android.com/studio/run/device
- Testfilmens exempel: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- Testfilm: https://developer.mozilla.org/shared-assets/videos/flower.mp4

Testfilmen ligger hos MDN och kan ändras eller bli otillgänglig. Använd den för teknikprovet och byt sedan till gruppens egen överenskomna medialagring. Filmen har inte kopierats in i paketet.
