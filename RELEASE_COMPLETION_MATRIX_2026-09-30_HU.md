# Come Get It — kiadási készültségi mátrix

Állapotdátum: **2026. szeptember 30.**
Célkiadás: **iOS 1.0.0 (19), ingyenes béta**

Ez a mátrix a jelenlegi egyetlen rövid állapotforrás. A részletes bizonyíték a `RELEASE_AUDIT_2026-09-30_HU.md`, a tulajdonosi teendőlista az `OWNER_RELEASE_CHECKLIST.md`, a készülékteszt a `TESTFLIGHT_DEVICE_TEST.md` fájlban található.

| Kapu | Állapot | Bizonyíték / következő lépés |
|---|---|---|
| Produkciós mobilforrás | **KÉSZ** | Build 19 runtime source `1563ac06341534653493901c3659005bf617f3a8`; current main `210c1a76ae864d7a561106107b87f4bbb203ea66` (PR #29, csak dokumentáció) |
| TypeScript + iOS export | **PASS** | build 19 forrásán hibamentes |
| Supabase és Venue Hub kapcsolat | **PASS** | közös production projekt, partner csak saját venue-t lát |
| Partneri QR-folyamat | **PASS, újraellenőrzendő build 19-en** | első valós iPhone → Mac beváltás sikeres; ismételt QR elutasítva |
| Négy jutalom és kategórialefedés | **KÉSZ** | drink, food és experience; képek és pontértékek beállítva |
| Egyszeri jutalombeváltás | **PASS** | adatbázis + Edge Function v49; duplikáció HTTP 409 |
| Login logó és indítás | **KÉSZ A FORRÁSBAN** | eredeti logó középen, fölösleges külön runtime loader eltávolítva |
| EAS build 19 | **PASS** | `67ce044b-0327-44f6-a6d1-34f71576ec7e` |
| App Store Connect-feltöltés | **PASS** | `f2fc269a-6db6-4647-a313-82897ccf78fe` |
| Apple-feldolgozás | **PASS** | `VALID`, nem lejárt |
| Aláírt Build 19 bináris/privacy audit | **PASS** | helyes bundle/build, App Store provisioning, hét privacy adattípus, no tracking; `BUILD_19_BINARY_AUDIT.md` |
| Belső TestFlight-csoport | **PASS** | Build 19 `IN_BETA_TESTING`; workflow `01a0f016-0ce3-762a-9138-770cc31c242d` |
| Build 19 fizikai iPhone-regresszió | **TEENDŐ** | teljes `TESTFLIGHT_DEVICE_TEST.md` PASS szükséges |
| App Store-képek | **KÉSZ, FELTÖLTENDŐ** | 5 × `1320×2868`, alpha nélkül, QC PASS |
| App Review tesztfiók pontjai | **KÉSZ** | 500 pont a `user_points` és `profiles` nézetben; Blue Hour opcionális beváltási teszt |
| App Review útmutató | **JAVÍTVA, BUILD 19-EN TESZTELENDŐ** | a venue QR és a pontjutalom két külön folyamatként szerepel |
| Privacy Publish | **TULAJDONOSI TEENDŐ** | hét auditált adattípus, no tracking; végső jogi elfogadás |
| DSA trader/non-trader | **TULAJDONOSI TEENDŐ** | tényalapú státusz és szükséges elérhetőség-ellenőrzés |
| Partneranyagok jogai | **TULAJDONOSI TEENDŐ** | minden élő kép, logó és védjegy felhasználási joga igazolandó |
| API-kulcs és review-jelszavak | **BIZTONSÁGI TEENDŐ** | új ASC-kulcs ellenőrzése, régi visszavonása; jelszavak cseréje |
| App Review-beküldés | **NEM INDÍTHATÓ MÉG** | csak minden fenti TEENDŐ lezárása és fizikai PASS után |

## Következő helyes sorrend

1. Build 19 telepítése és teljes fizikai iPhone-teszt.
2. Az öt kész kép feltöltése és vizuális ellenőrzése.
3. API-kulcs/review-jelszó rotáció.
4. App Privacy Publish, DSA és partneri tartalomjogok lezárása.
5. Build 19 kiválasztása, review notes/login ellenőrzése, majd **Submit for Review** kézi kiadással.

## Készültségi értelmezés

A technikai termék és a kiadási bináris elkészült. A hátralévő munka döntően terjesztési, fizikai ellenőrzési, biztonsági és tulajdonosi jogi kapu. Ez nem százalékos becslés: az App Review csak akkor indítható, ha minden kötelező kapu igazoltan PASS.
