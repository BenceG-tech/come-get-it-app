# Come Get It — tulajdonosi kiadási ellenőrzőlista

Utolsó műszaki ellenőrzés: **2026. szeptember 29.**
Célkiadás: **1.0.0 (13), ingyenes iPhone-béta**

Ez az egyetlen aktuális tulajdonosi átadólap. A követelményenkénti készültség a `RELEASE_COMPLETION_MATRIX_2026-09-29_HU.md`, a részletes műszaki bizonyíték az `APP_STORE_READINESS.md`, a fizikai teszt a `TESTFLIGHT_DEVICE_TEST.md`, a jogi válaszok az `APP_STORE_RELEASE_DECLARATIONS_HU.md`, a végleges képek szabályai az `APP_STORE_MEDIA_CAPTURE_HU.md` fájlban vannak.

## Már elkészült

- [x] Supabase Auth engedélyezett átirányítás: `https://come-get-it-venue-hub.lovable.app/reset-password`.
- [x] Valódi, nem-admin tesztpartner kizárólag a Come Get It Bar helyhez rendelve.
- [x] Korlátozott Pilot jutalom és Electric Blue Shot ital aktív élő adatokkal.
- [x] A Venue Hub és a mobilapp ugyanazt a production Supabase projektet használja.
- [x] Partneres QR-backend: első beváltás sikeres, ismétlés `ALREADY_CONSUMED`, idegen venue `VENUE_UNAUTHORIZED`, párhuzamos dupla próbából csak egy sikeres.
- [x] Venue Hub kamerajavítás éles: látható videókonténer, tényleges kameraválasztás, iframe-figyelmeztetés és közvetlen éles link.\n- [x] A mobilapp teljes `cgi://redeem?...` QR-hivatkozását a Venue Hub és a backend is biztonságosan normalizálja; a production Edge Function `consume-redemption-token` v52 és a Lovable éles kiadás frissítve.
- [x] Supabase Postgres `17.6.1.166`, projektállapot `ACTIVE_HEALTHY`.
- [x] Öt aktív venue mindegyike képpel és koordinátával; két aktív reward mindegyike képpel.
- [x] Pilot reward kategória a mobilapp által használt `drink` kulcsra javítva.
- [x] `user_qr_tokens` közvetlen anon/authenticated jogosultságai visszavonva.
- [x] Production EAS build: `1.0.0 (13)`, build ID `7629d072-a18a-4e5e-ba2e-c72fc8667b4d`, állapot `FINISHED`.
- [x] Apple-feldolgozás: build 13 `VALID`, belső TestFlight-csoporthoz rendelve.
- [x] Build 13 IPA: aláírás, bundle ID, entitlement, privacy manifest és beágyazott titkok ellenőrzése PASS.
- [x] Friss forrásellenőrzés: TypeScript PASS és teljes iOS Hermes export PASS, 3476 modul.
- [x] Come Get It Venue Hub production build, TypeScript és célzott QR-szkenner lint PASS.
- [x] A `come-get-it.app`, `/support`, `/adatvedelmi-szabalyzat` és `/felhasznalasi-feltetelek` HTTPS-en elérhető.
- [x] A régi marketing-, TestFlight- és Rork-előnézeti médiakészlet auditálva és feltöltésből kizárva.

## 1. Fizikai TestFlight-kapu — Bence

Telepítsd/frissítsd a TestFlightban a **Come Get It 1.0 (13)** verziót, majd a `TESTFLIGHT_DEVICE_TEST.md` sorrendjében ellenőrizd:

- [ ] regisztráció és e-mail-megerősítés;
- [ ] kijelentkezés, bejelentkezés és munkamenet-visszaállítás;
- [ ] helylista Apple Térképpel, vízjel nélkül;
- [ ] Come Get It Bar részlet, nyitvatartás, térkép és Electric Blue Shot;
- [ ] Pilot jutalom képe, `drink` kategóriája és 100 pontos beváltása;
- [ ] Italok, Étel, Élmények és Összes kategória következetes vissza gombja;
- [ ] friss iPhone QR → éles Venue Hub Mac-kamera → sikeres első beolvasás;
- [ ] ugyanaz a QR másodszor elutasítva;
- [ ] jelszó-visszaállítás ugyanazon az iPhone-on;
- [ ] tesztfiók végleges törlése.

Kiadási szabály: bármely FAIL esetén nincs App Review-beküldés.

## 2. Végleges App Store-képek — csak a fizikai PASS után

Pontosan öt friss, ugyanazon 6,9 hüvelykes iPhone-on készült kép:

1. helylista és működő natív térkép;
2. Come Get It Bar részletes oldala;
3. jutalomkatalógus;
4. Pilot jutalom részletes, beváltás előtti állapota;
5. italbeváltási átadóképernyő kitakart kóddal.

- [ ] Egységes méret: 1260×2736, 1290×2796 vagy 1320×2868.
- [ ] Nincs TestFlight-, Rork-, Lovable-, böngésző- vagy fejlesztői keret.
- [ ] Nincs személyes adat vagy olvasható QR/token.
- [ ] Nincs régi card-linking, automatikus pontgyűjtés, fizetős Plus vagy CSR-ígéret.
- [ ] Az `audit:app-store-media` ellenőrző PASS.

## 3. App Store Connect biztonsági kulcs

- [ ] Hozz létre egy új App Manager API-kulcsot.
- [ ] Ellenőrizd az új kulcs működését egy csak olvasó kiadási lekéréssel.
- [ ] Csak ezután vond vissza a korábban diagnosztikai kimenetben megjelent kulcsot.

Ne vond vissza a régit az új kulcs igazolása előtt, mert ez megszakíthatja az automatizált feltöltést.

## 4. Tulajdonosi Apple-nyilatkozatok

Az `APP_STORE_RELEASE_DECLARATIONS_HU.md` alapján:

- [ ] Tartalomjogok: minden élő partnerfotóhoz, logóhoz és védjegyhez van felhasználási jog.
- [x] Copyright: `2026 Gátai Bence` — App Store Connectből visszaolvasva.
- [x] Age Rating: valós alkoholtartalom-válaszok és 18+ végeredmény — App Store Connectből visszaolvasva.
- [ ] App Privacy: hét build-13 adattípus, no tracking, élő saját domaines URL-ek.
- [ ] App Privacy **Publish** jogi megerősítés elfogadva.
- [ ] DSA trader/non-trader státusz a tényleges üzleti helyzet alapján kiválasztva; trader esetén publikus cím/postafiók, telefon és e-mail ellenőrizve.
- [ ] Apple-szerződések, adó- és banki státusz nem jelez blokkot.
- [x] Tartalomjogok: `USES_THIRD_PARTY_CONTENT` mentve és az Apple API válaszából igazolva.
- [x] Export compliance: build 13 `usesNonExemptEncryption=false`, `VALID` állapotban, Apple API-ból visszaolvasva.

## 5. Beküldés

- [ ] A build 13 legyen kiválasztva az App Store 1.0 verzióhoz a korábbi build 9 helyett.
- [ ] Review login és angol review notes utolsó ellenőrzése.
- [ ] Az öt friss screenshot feltöltve.
- [ ] Minden kötelező mező zöld / hibamentes.
- [ ] Manuális kiadási mód maradjon bekapcsolva.
- [ ] **Submit for Review** csak az 1–4. szakasz teljes lezárása után.

## Kiadási döntés

Az ingyenes béta technikai alapja elkészült. A copyright, 18+ korhatár, tartalomjogok és export-compliance Apple-ben mentve és visszaellenőrizve. A kiadást jelenleg a fizikai build-13 teszt, a friss médiacsomag, az API-kulcscsere, az App Privacy végső Publish megerősítése és a DSA tényalapú választása tartja vissza. Fizetős előfizetés, linked-card és CSR-kommunikáció nem része az 1.0 kiadásnak.
