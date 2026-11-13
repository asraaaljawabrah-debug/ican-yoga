# Senaste ändring: 13 november 2026

Offlinetestets texter och presentation har förenklats. Testlänken ligger nu under
Mina nedladdningar. Spelaren visar korta statusrader och döljer textningsdelen när
filmen saknar undertexter. Nedladdnings- och lagringstjänsterna är oförändrade.

Kontrollerat på den uppladdade projektstrukturen med ändringarna:

- npm run build: godkänt (Vite 8.3.8).
- npm test: 13 av 13 befintliga tester godkända.
- npx cap sync android: godkänt; fyra native-pluginer upptäckta.
- GitHubs main: 8ed03d976d76f0d4a2c55d844a1ae21668e00e45 vid kontrollen.

Webbläsaren kunde inte nå den lokala förhandsvisningen. Vyn är därför inte visuellt
verifierad i den här miljön. Native Gradle-bygge och faktisk uppspelning/nedladdning
på telefon har inte körts här. Testa efter build och cap sync på din Android-enhet.

Det levererade paketet innehåller källkod och native-projekt. Genererade filer,
node_modules och lokala datorinställningar har utelämnats. Följ README.md för att
återskapa dessa. Inget har pushats till GitHub.

---

## Tidigare verifieringsanteckningar

**Kontroller av B2-testappen den 12 november 2026**

| Kontroll | Resultat |
|---|---|
| Webbbygge med npm run build | Godkänt. Vite 8.3.8 byggde 23 moduler. |
| npm test | 8 av 8 logiktester godkända. Testerna använder simulerad fil- och registerlagring. |
| Testfilmens HTTPS-adress | HTTP 200, video/mp4, 1 128 375 byte. |
| Testfilmens format | ffprobe visar H.264, AAC, 960 × 540 och 5,055 sekunder. |
| Källkod för lagring | Samma modell och lagringstjänster som i det tidigare I CAN Yoga-startpaketet. |
| Gränssnitt i webbläsare | Inte visuellt eller interaktivt verifierat här. |
| Android/iOS-bygge | Inte utfört här. Nativeprojekt ska skapas på användarens dator. |
| Nedladdning på fysisk telefon | Återstår för användaren att verifiera. |
| Offline efter att appen avslutats | Återstår för användaren att verifiera. |
| Undertexter | Ingår i lagringslogikens simulerade tester, men denna första testfilm har inga undertexter. Verkligt undertextprov återstår. |
| Databas och katalog | Ingår inte i denna fristående B2-testapp. Integreras med B1:s arbete senare. |

Filmen är ett kort teknikprov, ingen yogaövning och inget realistiskt prov av stora videofiler. Att den fungerar garanterar inte att längre filmer eller alla måltelefoner fungerar.

Paketen är låsta med package-lock.json. Använd npm ci. Lokala node_modules, dist och Android/iOS-byggen ingår inte i zip-filen.

**Checklista att fylla i själv**

- Dator/operativsystem:
- Node-version:
- Android Studio eller Xcode-version:
- Telefonmodell och operativsystem:
- Installerad app startar:
- HTTPS-nedladdning klar:
- Lokal uppspelning med internet på:
- Lokal uppspelning efter fullständig appavslutning, flygplansläge och avstängt Wi-Fi:
- Radering verifierad efter ny omstart:
- Kvarvarande fel och nästa steg:
