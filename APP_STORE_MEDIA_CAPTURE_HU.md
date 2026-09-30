# Come Get It — App Store-képek és videó felvételi kézikönyv

Frissítve: 2026-09-30
Célbuild: **1.0.0 (19)**, TestFlight

Ez a dokumentum a végleges App Store-média ellenőrzési és utánpótlási kézikönyve. Új felvételt csak akkor készíts, amikor a build 19 fizikai iPhone-on végigment a `TESTFLIGHT_DEVICE_TEST.md` ellenőrzésein.

> **Aktuális állapot:** öt új, egységes, 6,9 hüvelykes, `1320 × 2868` pixeles promóciós kép elkészült és technikai/vizuális QC-n átment. Az App Store Connect feltöltés még tulajdonosi feladat. A régi marketing-, TestFlight- és Rork-előnézeti képek továbbra sem használhatók; ennek részletei az [`APP_STORE_MEDIA_AUDIT_2026-09-29_HU.md`](APP_STORE_MEDIA_AUDIT_2026-09-29_HU.md) auditban vannak.

## 1. Felvétel előtti állapot

- A TestFlightban a **Come Get It 1.0.0 (19)** legyen telepítve.
- A felvételi fiókban ne látszódjon személyes e-mail-cím, telefonszám vagy valódi fizetési adat.
- Legyen legalább egy aktív budapesti hely, jó minőségű, jogtisztán használható képpel.
- Legyen aktív ital és aktív jutalom képpel, valósághű névvel és leírással.
- A térkép minden nézetben natív legyen, API-kulcs-hiba vagy vízjel nélkül.
- A státuszsáv legyen tiszta: ne legyen értesítés, képernyőrögzítés-jelzés vagy alacsony akkumulátor.
- A beváltási QR-kód vagy token teljes tartalma egyik publikált anyagban se legyen olvasható.

## 2. Kötelező 6,9 hüvelykes képsorozat

Minden kép álló tájolású, azonos méretű és átlátszóság nélküli PNG vagy JPEG legyen. Elfogadott natív méretek:

- 1260 × 2736 px;
- 1290 × 2796 px;
- 1320 × 2868 px.

Az ajánlott öt kép, ebben a sorrendben:

| # | Fájlnév | Felvétel | Marketing-felirat |
|---|---|---|---|
| 1 | `01-fedezd-fel-budapestet.png` | Működő natív térkép és valós partnerkártyák | **Fedezd fel Budapestet — Közeli helyek, élő térképen.** |
| 2 | `02-valassz-helyet.png` | Görgethető budapesti helylista, ingyenital-jelzésekkel | **Válassz helyet — Bárok és bisztrók egy helyen.** |
| 3 | `03-minden-reszlet-egy-helyen.png` | Partner részletes oldala, nyitvatartás, távolság és ajánlat | **Minden részlet egy helyen — Nyitvatartás, italok, útvonal.** |
| 4 | `04-kerd-az-ingyen-italod.png` | Elérhető ital, nyitvatartás, térkép és beváltási belépési pont | **Kérd az ingyen italod — Pár lépés, és a tiéd.** |
| 5 | `05-sikeres-bevaltas.png` | Sikeres, partner által jóváhagyott beváltási végállapot | **Sikeres beváltás — Gyors, biztonságos, egyszerű.** |

Opcionális hatodik kép: keresés/szűrés valós találatokkal. Az App Store-ba eszközméretenként 1–10 kép tölthető fel.

### Amit tilos publikálni

- böngésző-, Rork-, Lovable-, Expo- vagy TestFlight-kezelőfelület;
- személyes e-mail, telefonszám, jelszó, belső azonosító vagy teljes QR/token;
- korábbi prototípus vagy a régi kártya-összekapcsolási/automatikus pontgyűjtési ígéret;
- nem működő Plus, CSR, push vagy előfizetési funkció;
- olyan partnerszám, felhasználószám vagy kedvezmény, amely nincs bizonyítva.

## 3. Képek ellenőrzése feltöltés előtt

Tedd a végleges fájlokat egy külön mappába, majd az `expo` mappában futtasd:

```bash
pnpm run audit:app-store-media -- "/teljes/elérési/út/a/mappához"
```

Az ellenőrző 1–10 képet, azonos elfogadott 6,9 hüvelykes méretet és átlátszóság nélküli fájlokat vár. A tartalmi ellenőrzést ezután embernek is el kell végeznie a fenti tiltólista szerint.

## 4. Felhasználói folyamat videó — nyers marketinganyag

Rögzíts egy **45–60 másodperces, vágatlan nyers felvételt** az alábbi sorrendben. Ez belső/marketing alapanyag; nem tölthető fel változtatás nélkül App Preview-ként.

1. Indítás a már bejelentkezett, semleges tesztfiókkal — 3 mp.
2. Vendéglátóhely-lista és működő térkép, egy partner kiválasztása — 8 mp.
3. Partner részletes oldala, nyitvatartás és ital — 7 mp.
4. Jutalmak; Italok, Étel, Élmények és Összes kategória megnyitása, majd mindenhol visszalépés — 12 mp.
5. Jutalom részletei és beváltás előtti állapot — 6 mp.
6. Italbeváltás indítása és QR-átadás — 7 mp; a kódot utólag maszkolni kell.
7. Partneri leolvasás sikeres eredménye, majd ugyanazon kód ismételt elutasítása — 8 mp.
8. Profil és kijelentkezés — 5 mp.

Ne rögzíts bejelentkezési adatokat. A partneri QR-leolvasást második telefonnal vagy a Venue Hubot megnyitó Mac kamerájával kell demonstrálni.

## 5. App Store App Preview-videó

Az App Preview külön, a nyers anyagból vágott export:

- 15–30 másodperc;
- legfeljebb 500 MB;
- álló iPhone-videónál 886 × 1920 px;
- H.264 vagy ProRes 422 HQ, legfeljebb 30 fps;
- `.mov`, `.m4v` vagy `.mp4` H.264 esetén;
- csak az app tényleges használata, valósághű állapotokkal.

Javasolt 25 másodperces vágás: helylista/térkép (5 mp) → hely részletei (5 mp) → jutalmak és kategóriák (7 mp) → beváltás előtti átadás és sikeres partneri visszajelzés (8 mp). A teljes QR-kódot ebben is maszkolni kell.

## 6. Végső átadás

A kész csomag akkor tölthető fel, ha:

- a képméret-ellenőrző hibamentesen lefutott;
- minden képen és képkockán a Build 19-cel egyező, valós jelenlegi funkció látható, nem régi prototípus;
- nincs személyes vagy biztonsági adat;
- a hely- és jutalomképek felhasználási joga igazolt;
- a feliratok pontosan azt ígérik, amit az app ténylegesen tud;
- a fizikai QR-teszt sikeres, az ismételt kódot a rendszer elutasítja.

Hivatalos Apple-hivatkozások:

- [Képernyőkép-specifikációk](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [App Preview-specifikációk](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications)
- [App Preview-k és képernyőképek feltöltése](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots)
