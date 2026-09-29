# Come Get It — kiadási készültségi mátrix

Utolsó ellenőrzés: **2026. szeptember 29.**  
Cél: **1.0.0 (13), ingyenes iPhone-béta**

## Jelmagyarázat

- **BIZONYÍTOTT** — élő rendszerrel, builddel vagy automatizált teszttel igazolva.
- **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** — a javítás a kiadási forrásban/buildben van, de a teljes felhasználói folyamatot még valódi eszközön kell lezárni.
- **TULAJDONOSI MŰVELET** — Apple-jogi vagy üzleti nyilatkozat, amelyet az Account Holdernek kell elfogadnia.
- **NYITOTT** — a kiadás előtt még végrehajtandó feladat.

## 1. Backend és Venue Hub

| Követelmény | Állapot | Bizonyíték | Következő lépés |
|---|---|---|---|
| Supabase reset URL | **BIZONYÍTOTT** | A `https://come-get-it-venue-hub.lovable.app/reset-password` átirányítás engedélyezett. | Nincs műszaki teendő; a telefonos levél-linket még próbáld ki. |
| Valódi tesztpartner-belépés | **BIZONYÍTOTT** | Nem-admin `venue_staff` fiók létrehozva. | Az éles partnereknél ugyanezt a szerepkört használd. |
| Partner egy aktív helyhez rendelve | **BIZONYÍTOTT** | A tesztpartner kizárólag a Come Get It Barhoz tartozik. | Új partner felvételekor mindig külön scope-teszt kell. |
| Partner csak a saját helyét látja | **BIZONYÍTOTT** | Böngészős ellenőrzésben csak Dashboard, QR beváltás, Beváltások és a saját venue jelent meg. | Nincs teendő. |
| Aktív, korlátozott Pilot jutalom | **BIZONYÍTOTT** | Élő, készlet- és felhasználókorlátos Pilot reward; `drink` kategória; kép beállítva. | Nincs teendő. |
| Mobilapp és admin ugyanazt az adatot használja | **BIZONYÍTOTT** | Mindkét felület ugyanahhoz a production Supabase projekthez kapcsolódik; venue- és reward-módosítások onnan töltődnek. | Tartalmat a Venue Hubban szerkessz; alkalmazásfrissítés csak funkció- vagy dizájnváltozáshoz kell. |
| QR-backend egyszer használható | **BIZONYÍTOTT** | Első consume 200; ismétlés 409 `ALREADY_CONSUMED`; idegen venue `VENUE_UNAUTHORIZED`; párhuzamos próbából csak egy siker. | Nincs backend-teendő. |
| Venue Hub kamerás szkenner javítása | **JAVÍTVA · OPTIKAI KAMERATESZT KELL** | A kamera productionben megjelent. A Venue Hub parser és az `ACTIVE`, JWT-védett backend `consume-redemption-token` v53 kezeli a mobil teljes `cgi://redeem?...` deep linkjét. A hitelesített production E2E pontosan ezt a teljes payloadot használta: első consume 200, ismétlés 409 `ALREADY_CONSUMED`, vendégstátusz `consumed`. | Új kétperces QR-t olvass be kamerával egyszer, majd ugyanazt azonnal másodszor; már csak a kép-felismerés/UI bizonyítandó. |

## 2. iPhone alkalmazás és TestFlight

| Követelmény | Állapot | Bizonyíték | Következő lépés |
|---|---|---|---|
| Aláírt production iOS build | **BIZONYÍTOTT** | EAS build `7629d072-a18a-4e5e-ba2e-c72fc8667b4d`, verzió `1.0.0 (13)`, `FINISHED`, store distribution. | Nincs buildelési teendő. |
| Feltöltés App Store Connectbe | **BIZONYÍTOTT** | EAS submission `e0705b3a-2b9f-4a11-a451-5818e09515bd` `FINISHED`. | Nincs feltöltési teendő. |
| Belső TestFlight elérhetőség | **BIZONYÍTOTT** | Apple/EAS aktuális státusz: build 13 belső béta tesztelésben; külső bétára előkészíthető. | TestFlightban mindig a 13-as buildet nyisd meg. |
| Regisztráció és e-mail-megerősítés | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | A kiadási forrásban implementálva; statikus és export tesztek PASS. | Friss tesztcímmel végigjárni iPhone-on. |
| Bejelentkezés, kijelentkezés, munkamenet-visszaállítás | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Implementálva; hibás refresh token helyreállítása is bent van. | Kijelentkezés, újranyitás és ismételt belépés iPhone-on. |
| Helylista natív térképe | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Build 13 tartalmazza az Apple MapKit megoldást; nincs `API KEY REQUIRED` marker vagy CARTO végpont. | Ellenőrizni, hogy nincs vízjel és minden marker látszik. |
| Venue-részlet térképe és italai | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Build 10-től javítva és build 13-ban benne van; élő venue-adatok rendelkezésre állnak. | Come Get It Bar részletes oldalát iPhone-on végigellenőrizni. |
| Reward-lista, Pilot kép és kategória | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Két aktív rewardnak van képe; Pilot kategória `drink`; a mobil kliens authentikált élő adatot használ. | Build 13-ban vizuális ellenőrzés. |
| Pontos reward beváltás | **BIZONYÍTOTT** | A Pilot reward beváltása 650 → 550 ponttal, 1/5 számlálóval, atomi tranzakcióban megtörtént. | Build 13-ban egyszer vizuálisan ismét ellenőrizni. |
| Reward kategóriák visszanavigációja | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | A build 13 forrásában determinisztikus visszalépés van: kategóriából a Jutalmak főoldalára, részletből az előző képernyőre vagy biztonságos fallbackre. | Italok, Étel, Élmények és Összes kategóriából egyenként visszalépni. |
| Italbeváltási QR létrehozása és lejárata | **BIZONYÍTOTT** | Érvényes kétperces token létrejött, státusza lekérdezhető, fel nem használt token lejárt. | A teljes kamerás folyamatot lezárni. |
| QR első fizikai kamerás beolvasása | **OPTIKAI TESZT NYITOTT** | A teljes hitelesített vendég→deep-link→scoped partner→consume lánc HTTP 200-zal PASS; a Mac-kamera már képet adott. | Friss QR megnyitása iPhone-on, optikai beolvasás a közvetlen éles Venue Hubban. |
| Ugyanazon QR ismételt fizikai beolvasása | **UI-TESZT NYITOTT** | Ugyanazon teljes deep-link production ismétlése 409 `ALREADY_CONSUMED`; a felületi hibaüzenet fizikai kamerával még nincs dokumentálva. | Ugyanazt a QR-t másodszor is beolvasni, képernyőeredményt rögzíteni. |
| Jelszó-visszaállítás | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Mobil és Venue Hub reset útvonal implementálva, Supabase URL engedélyezett. | A levél-linket ugyanazon az iPhone-on megnyitni és új jelszót beállítani. |
| Fióktörlés | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Authentikált Edge Function és mobil kezelőfelület elkészült. | Külön tesztfiókkal véglegesen kipróbálni. |

## 3. App Store Connect és kiadás

| Követelmény | Állapot | Bizonyíték | Következő lépés |
|---|---|---|---|
| Build 13 kiválasztása az 1.0 verzióhoz | **NYITOTT** | Build 13 feltöltve és érvényes; a verzióhoz korábban szándékosan a build 9 maradt kiválasztva a fizikai tesztig. | Teljes fizikai PASS után build 13 kiválasztása. |
| Öt friss App Store-kép | **NYITOTT** | A régi készlet auditálva és elutasítva; pontos öt képes capture-runbook elkészült. | Fizikai PASS után öt natív, 6,9 hüvelykes képet készíteni és auditálni. |
| Privacy label hét adattípussal | **JÓVÁHAGYVA · APPLE-MENTÉS HÁTRA** | A hét adattípus és a no-tracking csomag tulajdonosi jóváhagyása 2026-09-29-én rögzítve. | A végső **Publish** párbeszédet Apple-ben elfogadni, majd visszaellenőrizni. |
| Korhatár | **BIZONYÍTOTT** | A 18+ alkoholtartalom-válaszok elmentve és App Store Connectből visszaolvasva. | Csak a tartalom változásakor kell újraértékelni. |
| Copyright | **BIZONYÍTOTT** | A `2026 Gátai Bence` érték elmentve és App Store Connectből visszaolvasva. | Nincs további teendő az 1.0-hoz. |
| Tartalomjogok | **BIZONYÍTOTT** | Az Apple API `USES_THIRD_PARTY_CONTENT` értéket adott vissza; a partnerengedélyeket továbbra is meg kell őrizni. | Bizonytalan eredetű anyagot nem szabad publikálni. |
| DSA státusz | **TULAJDONOSI MŰVELET** | A szükséges döntési útmutató elkészült. | Valós üzleti helyzet szerint trader/non-trader választás; trader esetén elérhetőségek ellenőrzése. |
| Export compliance | **BIZONYÍTOTT** | Az Apple API szerint build 13 `VALID` és `usesNonExemptEncryption=false`. | Csak a titkosítási működés változásakor kell újranyilatkozni. |
| App Store Connect API-kulcs cseréje | **NYITOTT** | A jelenlegi EAS-kulcs működik, de korábban diagnosztikai kimenetben megjelent. | Új App Manager kulcs létrehozása, olvasási próba, majd csak utána a régi visszavonása. |
| Beküldés App Review-ra | **NYITOTT** | EAS aktuális státusz: nincs live, in-review vagy pending-release verzió. | Csak minden fenti fizikai, média-, kulcs- és tulajdonosi kapu lezárása után. |

## Következő pontos sorrend

1. Frissíts a TestFlight **1.0.0 (13)** buildre.
2. Futtasd végig a `TESTFLIGHT_DEVICE_TEST.md` teljes listáját.
3. A QR-t ne a Lovable beágyazott előnézetében, hanem a közvetlen `https://come-get-it-venue-hub.lovable.app/pos/redeem` oldalon olvasd be.
4. Ha az első és ismételt scan is megfelelő, készítsd el az öt App Store-képet.
5. Cseréld az App Store Connect API-kulcsot biztonságos sorrendben.
6. Fogadd el az App Privacy végső **Publish** párbeszédét, és a valós üzleti helyzet alapján válaszd ki a DSA-státuszt. A korhatár, copyright, tartalomjog és export-válasz már igazoltan mentve van.
7. Válaszd ki a build 13-at, ellenőrizd a review login adatokat, majd küldd App Review-ra manuális kiadással.

## Kiadási döntés

Az alkalmazás és az adminrendszer műszaki alapja működőképes. A szkenner- és navigációs javítások telepítve vannak; a kiadás jelenlegi kapuja a fizikai kamerás QR-teszt, a teljes build-13 iPhone regresszió, az öt friss kép, a kulcscsere, az App Privacy Publish és a DSA tényalapú választása.
