# Come Get It — tulajdonosi kiadási ellenőrzőlista

Utolsó műszaki ellenőrzés: **2026. szeptember 30.**
Célkiadás: **iOS 1.0.0 (19), ingyenes iPhone-béta**

Ez az aktuális tulajdonosi átadólap. A részletes állapot a `RELEASE_COMPLETION_MATRIX_2026-09-30_HU.md`, a fizikai teszt a `TESTFLIGHT_DEVICE_TEST.md`, a jogi válaszok az `APP_STORE_RELEASE_DECLARATIONS_HU.md` fájlban találhatók.

## Bizonyítottan elkészült

- [x] Supabase Auth reset redirect: `https://come-get-it-venue-hub.lovable.app/reset-password`.
- [x] Valódi, nem-admin partnerfiók kizárólag a saját helyszínéhez rendelve.
- [x] A Venue Hub és a mobilapp ugyanazt a produkciós Supabase projektet használja.
- [x] A valódi iPhone → éles Venue Hub Mac-kamera első QR-beváltása sikeres volt.
- [x] A QR-token első használata sikeres; ismétlés `ALREADY_CONSUMED`; idegen venue `VENUE_UNAUTHORIZED`.
- [x] Négy aktív, képpel rendelkező fogyasztói jutalom van az élő adatbázisban:
  - Pilot ajándék ital;
  - Blue Hour koktél — 300 pont;
  - Séf ajánlata – főétel — 900 pont;
  - VIP lounge élmény — 1400 pont.
- [x] Az Italok, Étel és Élmények fő kategória mindegyike rendelkezik legalább egy aktív jutalommal.
- [x] Ugyanaz a felhasználó ugyanazt a jutalmat csak egyszer válthatja be. Az adatbázis-korlát, trigger, RPC és `redeem-reward` Edge Function v49 együtt védi; a duplikációs tesztek PASS eredményűek.
- [x] A jutalomkategória-oldalakon egyetlen saját vissza gomb marad.
- [x] Az eredeti Come Get It logó visszaállítva és középre igazítva a login képernyőn.
- [x] A fölösleges külön márkázott runtime loading képernyő eltávolítva; csak a natív indítóképernyő és rövid semleges átmenet maradt.
- [x] TypeScript-ellenőrzés és Expo iOS-export PASS.
- [x] A Build 19 futtatott forráscommitja: `1563ac06341534653493901c3659005bf617f3a8`; a jelenlegi GitHub main a dokumentációs PR #29-cel: `210c1a76ae864d7a561106107b87f4bbb203ea66`.
- [x] Production EAS build `1.0.0 (19)` elkészült: `67ce044b-0327-44f6-a6d1-34f71576ec7e`.
- [x] App Store Connect-feltöltés sikeres: `f2fc269a-6db6-4647-a313-82897ccf78fe`.
- [x] A feltöltött Build 19 IPA bundle-, entitlement-, provisioning- és privacy-manifest auditja PASS; részletek: `BUILD_19_BINARY_AUDIT.md`.
- [x] Az App Review fogyasztói fiók 500 szinkronizált tesztponttal rendelkezik; a pontjutalom és a venue QR-folyamat külön, helyesen dokumentált.
- [x] Öt darab 6,9 hüvelykes, `1320×2868` méretű, alpha nélküli App Store-kép és tiszta feltöltési ZIP elkészült.
- [x] A `come-get-it.app` főoldala, support-, privacy- és terms-oldala HTTPS-en elérhető.

## 1. TestFlight-terjesztés

- [x] Az Apple utófeldolgozása befejeződött: `VALID`, `READY_FOR_BETA_TESTING`.
- [x] Az **1.0.0 (19)** a `Come Get It belső teszt` TestFlight-csoportban van: `IN_BETA_TESTING`.
- [ ] Az iPhone-ra telepített verzió valóban **1.0.0 (19)**.

Bizonyíték: manuális EAS workflow `01a0f016-0ce3-762a-9138-770cc31c242d`, job `SUCCESS`, ASC build `6fd8af6a-77e3-4de3-af88-1fa4228e3030`.

## 2. Fizikai iPhone-kapu

A `TESTFLIGHT_DEVICE_TEST.md` sorrendjében:

- [ ] első indítás stabil, nincs üres képernyő vagy összeomlás;
- [ ] az eredeti Come Get It logó középen jelenik meg a login képernyőn;
- [ ] nincs külön villanó márkázott runtime loading képernyő;
- [ ] regisztráció, bejelentkezés, kijelentkezés és munkamenet-visszaállítás PASS;
- [ ] a helylista Apple Térképe, a venue-részlet és az újrapróbálás PASS;
- [ ] mind a négy jutalom képpel és helyes pontértékkel betölt;
- [ ] Italok, Étel, Élmények és Összes megnyílik, és mindegyikből egyetlen vissza gomb vezet a Jutalmak főoldalára;
- [ ] ugyanazon jutalom második beváltása elutasított: `Ezt a jutalmat már beváltottad.`;
- [ ] friss QR első beolvasása sikeres, ugyanaz a QR másodszor elutasított;
- [ ] jelszó-visszaállítás ugyanazon az iPhone-on PASS;
- [ ] külön tesztfiók végleges törlése PASS.

Kiadási szabály: bármely FAIL esetén nincs App Review-beküldés.

## 3. App Store Connect biztonsági kapu

- [ ] Új App Manager API-kulcs létrehozva.
- [ ] Az új kulcs működése olvasási próbával igazolva.
- [ ] A korábban diagnosztikai kimenetben megjelent régi kulcs csak ezután visszavonva.
- [ ] Az App Review fogyasztói és partneri tesztfiók jelszava közvetlenül a beadás előtt újra cserélve.

## 4. App Store-adatlap és tulajdonosi nyilatkozatok

- [x] Copyright: `2026 Gátai Bence`.
- [x] Korhatár: 18+ és az alkoholreferenciák valósan kitöltve.
- [x] Tartalomjog-nyilatkozat: `USES_THIRD_PARTY_CONTENT`.
- [x] Export compliance: `usesNonExemptEncryption=false`.
- [ ] Minden élő partnerfotóhoz, logóhoz és védjegyhez igazolt felhasználási jog tartozik.
- [ ] Az öt kész kép feltöltve a 6,9 hüvelykes iPhone képkészlethez, és a feltöltés utáni vizuális ellenőrzés PASS.
- [ ] App Privacy: hét auditált adattípus, no tracking, majd a végső **Publish** jogi megerősítés elfogadva.
- [ ] DSA trader/non-trader státusz a tényleges üzleti helyzet alapján kiválasztva; trader esetén a publikus elérhetőségek ellenőrizve.
- [ ] Apple-szerződések, adó- és banki státusz nem jelez blokkot.

## 5. Beküldés

- [ ] A build **19** kiválasztva az App Store 1.0 verzióhoz.
- [ ] Mindkét Review login ellenőrizve; az angol review notes két külön folyamatát (venue QR és pontjutalom) a Build 19-en végigjártuk.
- [ ] Minden kötelező mező zöld és hibamentes.
- [ ] Manuális kiadási mód marad bekapcsolva.
- [ ] **Submit for Review** csak az 1–4. szakasz teljes lezárása után.

## Kiadási döntés

A technikai kiadási jelölt elkészült, az Apple feldolgozta és belső TestFlight-tesztelésre kiadta. Az app még nincs App Review-ra beküldve. A fennmaradó kapuk: build 19 fizikai PASS, screenshotfeltöltés, API-kulcscsere, App Privacy Publish és DSA. Fizetős előfizetés, linked-card és CSR-kommunikáció nem része az 1.0 kiadásnak.
