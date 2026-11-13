# Lägg upp integrationen på en separat branch

Rekommendation: använd en ny lokal klon av gruppens repository och skapa en branch
där. Din fungerande projektmapp finns då kvar som säkerhetskopia. En ZIP innehåller
inte automatiskt kopplingen till GitHub; den uppladdade ZIP-filen hade ingen .git-mapp.

## 1. Klona den senaste versionen

Öppna PowerShell i din lokala Projects-mapp:

```powershell
git clone https://github.com/asraaaljawabrah-debug/ican-yoga.git ican-yoga-git
cd ican-yoga-git
git switch -c isak/offline-integration
```

Välj ett annat mapp- eller branchnamn om det redan finns. Kloningen hämtar den senaste
versionen och historiken. Du behöver inte skapa branchen via GitHubs webbgränssnitt.

## 2. Kontrollera basen innan du ersätter filer

Den tidigare frontend-ZIP som integrationen bygger på motsvarade:

`8ed03d976d76f0d4a2c55d844a1ae21668e00e45`

Vid kontroll 13 november 2026 pekade GitHubs main fortfarande på den committen.
Detta kan ha ändrats när du gör stegen. Kontrollera:

```powershell
git log -1 --oneline
git diff --name-status 8ed03d976d76f0d4a2c55d844a1ae21668e00e45 HEAD
```

Om den andra raden ger filnamn har andra ändringar tillkommit. Jämför dem med din
integration i VS Code och för in bådas ändringar i berörda filer. Kopiera inte en
äldre version över deras nya arbete. En feature-branch förhindrar inte att en sådan
överskrivning följer med i en senare Pull Request.

## 3. Lägg in källkoden

Kopiera innehållet i det uppdaterade ICanYogaIntegration till den nya klonens rot,
så att package.json hamnar direkt i ican-yoga-git. Lägg inte hela projektet i en extra
undermapp. Slå ihop mappar och bevara den klonade .git-mappen.

Paketet är rensat från beroenden, byggresultat, cache och lokala SDK-sökvägar. Dessa
behöver inte läggas på GitHub. Källkod, package.json, package-lock.json,
capacitor.config.json, vite.config.js, Android-källkod och Gradle-wrapper ska däremot med.

Äldre script.js, Player.js och test-video.mp4 i repots rot används inte längre av
den här integrationen. När du har bekräftat att inga nyare ändringar där ska behållas
kan du ta bort de tre gamla filerna från din branch:

```powershell
git rm -- script.js Player.js test-video.mp4
```

Den använda testfilmen ligger nu i public/demo/test-video.mp4 och får inte tas bort.

## 4. Kör projektet och kontrollera ändringarna

```powershell
npm ci
npm test
npm run build
npx cap sync android
git status --short
git diff --stat
git diff
```

Kontrollera att ändringarna är avsiktliga. node_modules, dist, .gradle, build,
android/local.properties, genererade Android-assets och nyckelfiler ska inte stagedas.
.gitignore påverkar bara ospårade filer; om någon redan har committat sådana filer
behöver ni avregistrera just dem separat. Radera inte hela Git-indexet som en genväg.

## 5. Commit och push till din branch

```powershell
git add .
git update-index --chmod=+x android/gradlew
git diff --cached --stat
git diff --cached --name-only
```

Granska den stagedade fillistan. Den ska vara ett rimligt antal källfiler, inte
tusentals npm- eller byggfiler. Fortsätt när den ser rätt ut:

```powershell
git commit -m "Integrate Capacitor and simplify offline test"
git push -u origin isak/offline-integration
```

Pushen skapar branchen på GitHub. Den ändrar inte main. Du behöver skrivrättigheter
till gruppens repository för att kunna pusha dit.

## 6. Skapa en Pull Request

Öppna gruppens GitHub-repo och skapa en Pull Request med main som base och
isak/offline-integration som compare. Be A1/A2 granska gränssnittet och integrationen.
Ange att bygget, testerna och cap sync är kontrollerade, samt vilka telefonprov du
själv har gjort. Slå ihop först efter gruppens granskning.

Om main uppdateras efter att du klonat kan du föra in ändringarna på din feature-branch.
Spara först ditt eget arbete i en commit och kontrollera att git status är ren:

```powershell
git fetch origin
git merge origin/main
```

Lös eventuella konflikter genom att jämföra innehållet, bygg och testa igen och pusha
sedan branchen på nytt. Använd inte force push eller reset --hard för att lösa det.

## Om din nuvarande mapp redan är en Git-klon

Du kan kontrollera med git status och git remote -v. Då går det också att skapa en
branch där, committa arbetet, hämta med git fetch origin och sedan merge origin/main.
En färsk klon är rekommendationen här eftersom den uppladdade filen inte visar vilken
Git-historik din lokala mapp eventuellt har.

Källor: https://git-scm.com/docs/git-switch och https://git-scm.com/docs/gitignore
