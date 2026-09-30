# Come Get It — kiadási készültségi mátrix

Állapotdátum: **2026. szeptember 30.**
Célkiadás: **iOS 1.0.0 (20), ingyenes béta**

Ez a mátrix a jelenlegi egyetlen rövid állapotforrás. A részletes bizonyíték a `RELEASE_AUDIT_2026-09-30_HU.md`, a tulajdonosi teendőlista az `OWNER_RELEASE_CHECKLIST.md`, a készülékteszt a `TESTFLIGHT_DEVICE_TEST.md` fájlban található.

| Kapu | Állapot | Bizonyíték / következő lépés |
|---|---|---|
| Produkciós mobilforrás | **KÉSZ** | Build 20 runtime source és current main: `2d81b1184d46193b0d04a0ddd69fe73de189214b` |
| TypeScript + iOS export | **PASS** | Build 20 forrásán hibamentes |
| Supabase és Venue Hub kapcsolat | **PASS** | közös production projekt, partner csak saját venue-t lát |
| Partneri QR-folyamat | **PASS, ÚJRAELLENŐRIZENDŐ BUILD 20-ON** | első valós iPhone → Mac beváltás sikeres; ismételt QR elutasítva |
| Négy jutalom és kategórialefedés | **KÉSZ** | drink, food és experience; képek és pontértékek beállítva |
| Egyszeri jutalombeváltás | **PASS** | adatbázis + Edge Function v49; duplikáció HTTP 409 |
| Login logó és indítás | **KÉSZ ÉS CSOMAGBAN AUDITÁLT** | ugyanaz az eredeti logó a loginban és a natív splashben; fölösleges külön runtime loader eltávolítva |
| EAS build 20 | **PASS** | `07fb063e-bfaf-4680-865a-512b1ab06def`, `1.0.0 (20)` |
| Apple-feltöltés | **PASS** | EAS submission `5703b7e4-6fcc-49ca-88b1-06e9c4a62a51`; feltöltés sikeres |
| Apple-feldolgozás | **PASS** | ASC build `616698d1-1207-46d8-a78e-f67d6040830f`; `processingState = VALID`, external `READY_FOR_BETA_SUBMISSION` |
| Aláírt Build 20 bináris/privacy/logó audit | **HELYI AUDIT PASS** | helyes bundle/build, App Store provisioning, hét privacy adattípus, no tracking és eredetilogó-csomag; `BUILD_20_BINARY_AUDIT.md` |
| Belső TestFlight-csoport | **PASS** | közvetlen ASC-visszaolvasás: `internalBuildState = IN_BETA_TESTING`, `containsBuild20 = true`; csoport buildszám `8 → 9` |
| Build 20 fizikai iPhone-regresszió | **TEENDŐ** | teljes `TESTFLIGHT_DEVICE_TEST.md` PASS szükséges |
| App Store-képek | **KÉSZ, FELTÖLTENDŐ** | 5 × `1320×2868`, alpha nélkül, QC PASS |
| App Review tesztfiók pontjai | **KÉSZ** | 500 pont a `user_points` és `profiles` nézetben; Blue Hour opcionális beváltási teszt |
| App Review útmutató | **JAVÍTVA, BUILD 20-ON TESZTELENDŐ** | a venue QR és a pontjutalom két külön folyamatként szerepel |
| Privacy Publish | **TULAJDONOSI TEENDŐ** | hét auditált adattípus, no tracking; végső jogi elfogadás |
| DSA trader/non-trader | **TULAJDONOSI TEENDŐ** | tényalapú státusz és szükséges elérhetőség-ellenőrzés |
| Partneranyagok jogai | **TULAJDONOSI TEENDŐ** | minden élő kép, logó és védjegy felhasználási joga igazolandó |
| API-kulcs és review-jelszavak | **BIZTONSÁGI TEENDŐ** | új ASC-kulcs ellenőrzése, régi visszavonása; jelszavak cseréje |
| App Review-beküldés | **NEM INDÍTHATÓ MÉG** | csak minden fenti TEENDŐ lezárása és fizikai PASS után |

## Következő helyes sorrend

1. Build 20 telepítése a belső TestFlight-csoportból és teljes fizikai iPhone-teszt.
2. Az öt kész kép feltöltése és vizuális ellenőrzése.
3. API-kulcs/review-jelszó rotáció.
4. App Privacy Publish, DSA és partneri tartalomjogok lezárása.
5. Build 20 kiválasztása, review notes/login ellenőrzése, majd **Submit for Review** kézi kiadással.

## Készültségi értelmezés

A technikai termék és a kiadási bináris elkészült. A hátralévő munka döntően terjesztési, fizikai ellenőrzési, biztonsági és tulajdonosi jogi kapu. Ez nem százalékos becslés: az App Review csak akkor indítható, ha minden kötelező kapu igazoltan PASS.
