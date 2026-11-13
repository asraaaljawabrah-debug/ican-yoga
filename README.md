# I CAN Yoga

Lite instruktioner för hur ni använder och testar appen i windows.


För att kunna köra:

1. Installera node.js (senaste)
2. Installera Android Stuido (senaste)
3. I android studio välkomstskärm, öppna More Actions -> SDK Manager. Under SDK Platforms, välj Android 16.0, API 36. Under SDK Tools, se till att Android SDK Platform-Tools, Android SDK Build-Tools och Android Emulator är installerade. Klicka Apply och installera.


För att starta appen:
Öppna den nedladdade projektmappen i VS Code och välj Terminal -> New Terminal. Kör dessa kommandon ett i taget:
1. npm ci
2. npm run build
3. npx cap sync android
4. npx cap open android

Det sista kommandot kommer att öppna projektet i Android Studio. Vänta tills synkroniseringen är färdig (blå bar längst ner) och klicka sedan på den stora gröna run symbolen.

För att testa nedladdning, skrolla längst ner i video listan.
