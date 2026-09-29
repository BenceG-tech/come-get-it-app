# Come Get It — kiadási készültségi mátrix

Utolsó ellenőrzés: **2026. szeptember 29.**  
Cél: **1.0.0 (16), ingyenes iPhone-béta**

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
| Venue Hub kamerás szkenner javítása | **ELSŐ OPTIKAI SCAN PASS** | A kamera productionben megjelent. A Venue Hub parser és az `ACTIVE`, JWT-védett backend `consume-redemption-token` v53 kezeli a mobil teljes `cgi://redeem?...` deep linkjét. 2026-09-29 13:19-kor valódi iPhone QR-ról az éles Mac-kamera sikeresen beváltotta az Azure Garden Spritzet a Come Get It Bistro helyen. | Ugyanezt a QR-t ismételten beolvasva dokumentáld az `ALREADY_CONSUMED` felületi elutasítást. |

## 2. iPhone alkalmazás és TestFlight

| Követelmény | Állapot | Bizonyíték | Következő lépés |
|---|---|---|---|
| Aláírt production iOS build | **BUILD 16 BIZONYÍTOTT** | EAS build `38ce3da4-982d-4a51-92c2-1e148b2f4283`, verzió `1.0.0 (16)`, `FINISHED`, store distribution, GitHub commit `c734be02d6ea43f105600b574f10557df5d68aa5`. | Nincs buildelési teendő. |
| Feltöltés App Store Connectbe | **SORBAN** | A build 16 aktív submissionje `67be7039-993d-4756-b802-b10c7eba930c`; állapota `IN_QUEUE`. | Az EAS sor lefutása után ellenőrizni kell az Apple-feldolgozást és a TestFlight-megjelenést. |
| Belső TestFlight elérhetőség | **BUILD 13 ELÉRHETŐ · BUILD 16 SORBAN** | A korábbi build 13 belső bétában elérhető; a végleges regressziót igénylő build 16 még az aktív Apple-feltöltési sorban van. | A végső ellenőrzéshez várd meg és telepítsd az `1.0.0 (16)` buildet; a korábbi változatok nem tartalmazzák együtt az összes betöltési, kategória- és jogi-link javítást. |
| Regisztráció és e-mail-megerősítés | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | A kiadási forrásban implementálva; statikus és export tesztek PASS. | Friss tesztcímmel végigjárni iPhone-on. |
| Bejelentkezés, kijelentkezés, munkamenet-visszaállítás | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Implementálva; hibás refresh token helyreállítása is bent van. | Kijelentkezés, újranyitás és ismételt belépés iPhone-on. |
| Helylista natív térképe | **FIZIKAI PASS** | A friss build-13 iPhone-képen az Apple-térkép és mind az öt marker vízjel nélkül megjelenik. | Nincs teendő. |
| Venue-részlet térképe és italai | **FIZIKAI PASS** | A friss iPhone-képeken a venue-részlet, nyitvatartás, Azure Garden Spritz és az Apple-térkép megjelenik. | Nincs teendő. |
| Reward-lista, Pilot kép és kategória | **BUILD 16-BAN JAVÍTVA · ESZKÖZTESZT KELL** | A kliens a `consumer_rewards` nézetet használja, csak az aktív venue aktív rewardját mutatja, időkorlát és újrapróbálás védi a betöltést. A hitelesített böngészős regresszióban a Pilot jutalom képpel betöltött. | Build 16-ban vizuálisan ellenőrizni. |
| Pontos reward beváltás | **BIZONYÍTOTT BACKEND · BUILD 16 ESZKÖZTESZT KELL** | A Pilot reward beváltása 650 → 550 ponttal, 1/5 számlálóval, atomi tranzakcióban megtörtént. | Build 16-ban egyszer vizuálisan ismét ellenőrizni. |
| Reward kategóriák visszanavigációja | **BUILD 16-BAN JAVÍTVA · ESZKÖZTESZT KELL** | A kategóriaoldalon egyetlen saját vissza gomb maradt, amely közvetlenül a Jutalmak főoldalára visz. Az üres Étel és Élmények kártyák `Hamarosan` állapotban le vannak tiltva; az Italok és Összes az élő darabszámot mutatja. Hitelesített böngészős teszt, TypeScript, web- és iOS-export PASS. | Build 16-ban Italok → vissza, Étel/Élmények letiltás és Összes lista ellenőrzése. |
| Italbeváltási QR létrehozása és lejárata | **BIZONYÍTOTT** | Érvényes kétperces token létrejött, státusza lekérdezhető, fel nem használt token lejárt. | A teljes kamerás folyamatot lezárni. |
| QR első fizikai kamerás beolvasása | **FIZIKAI PASS** | A 2026-09-29 13:19-kor készült iPhone- és Venue Hub-képek a teljes Azure Garden Spritz beváltást és a partneroldali `SIKERES!` eredményt mutatják. | Nincs teendő. |
| Ugyanazon QR ismételt fizikai beolvasása | **UI-TESZT NYITOTT** | Ugyanazon teljes deep-link production ismétlése 409 `ALREADY_CONSUMED`; a felületi hibaüzenet fizikai kamerával még nincs dokumentálva. | Ugyanazt a QR-t másodszor is beolvasni, képernyőeredményt rögzíteni. |
| Jelszó-visszaállítás | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Mobil és Venue Hub reset útvonal implementálva, Supabase URL engedélyezett. | A levél-linket ugyanazon az iPhone-on megnyitni és új jelszót beállítani. |
| Fióktörlés | **FORRÁSBÓL IGAZOLT · ESZKÖZTESZT KELL** | Authentikált Edge Function és mobil kezelőfelület elkészült. | Külön tesztfiókkal véglegesen kipróbálni. |

## 3. App Store Connect és kiadás

| Követelmény | Állapot | Bizonyíték | Következő lépés |
|---|---|---|---|
| Build 16 kiválasztása az 1.0 verzióhoz | **APPLE-FELDOLGOZÁSRA VÁR** | A build 16 aláírt production csomagja elkészült; App Store Connect feltöltése ütemezve. | Feltöltés és feldolgozás után build 16 kiválasztása, teljes fizikai PASS esetén. |
| Öt friss App Store-kép | **6,9″ CSOMAG KÉSZ** | Öt egységes Come Get It marketingkép készült: térkép, helylista, helyadatlap, ingyenital és sikeres beváltás. Mind `1320×2868`, alpha nélküli PNG; vizuális QC PASS, a tiszta ZIP pontosan az öt fájlt tartalmazza. | Az öt képet a 6,9″ iPhone slotba feltölteni, majd App Store Connectben vizuálisan ellenőrizni. |
| Privacy label hét adattípussal | **JÓVÁHAGYVA · APPLE-MENTÉS HÁTRA** | A hét adattípus és a no-tracking csomag tulajdonosi jóváhagyása 2026-09-29-én rögzítve. | A végső **Publish** párbeszédet Apple-ben elfogadni, majd visszaellenőrizni. |
| Korhatár | **BIZONYÍTOTT** | A 18+ alkoholtartalom-válaszok elmentve és App Store Connectből visszaolvasva. | Csak a tartalom változásakor kell újraértékelni. |
| Copyright | **BIZONYÍTOTT** | A `2026 Gátai Bence` érték elmentve és App Store Connectből visszaolvasva. | Nincs további teendő az 1.0-hoz. |
| Tartalomjogok | **BIZONYÍTOTT** | Az Apple API `USES_THIRD_PARTY_CONTENT` értéket adott vissza; a partnerengedélyeket továbbra is meg kell őrizni. | Bizonytalan eredetű anyagot nem szabad publikálni. |
| DSA státusz | **TULAJDONOSI MŰVELET** | A szükséges döntési útmutató elkészült. | Valós üzleti helyzet szerint trader/non-trader választás; trader esetén elérhetőségek ellenőrzése. |
| Export compliance | **BIZONYÍTOTT** | Az Apple API szerint build 13 `VALID` és `usesNonExemptEncryption=false`. | Csak a titkosítási működés változásakor kell újranyilatkozni. |
| App Store Connect API-kulcs cseréje | **NYITOTT** | A jelenlegi EAS-kulcs működik, de korábban diagnosztikai kimenetben megjelent. | Új App Manager kulcs létrehozása, olvasási próba, majd csak utána a régi visszavonása. |
| Beküldés App Review-ra | **NYITOTT** | EAS aktuális státusz: nincs live, in-review vagy pending-release verzió. | Csak minden fenti fizikai, média-, kulcs- és tulajdonosi kapu lezárása után. |

## Következő pontos sorrend

1. Várd meg a build 16 Apple-feldolgozását, majd frissíts a TestFlight **1.0.0 (16)** buildre.
2. Futtasd végig a `TESTFLIGHT_DEVICE_TEST.md` teljes listáját.
3. A sikeres első fizikai QR-beváltás után ugyanazt a QR-t olvasd be még egyszer, és rögzítsd az elutasítást.
4. Töltsd fel az elkészült öt darab `1320×2868` PNG-t a 6,9″ iPhone slotba.
5. Cseréld az App Store Connect API-kulcsot biztonságos sorrendben.
6. Fogadd el az App Privacy végső **Publish** párbeszédét, és a valós üzleti helyzet alapján válaszd ki a DSA-státuszt. A korhatár, copyright, tartalomjog és export-válasz már igazoltan mentve van.
7. Válaszd ki a build 16-ot, ellenőrizd a review login adatokat, majd küldd App Review-ra manuális kiadással.

## Kiadási döntés

Az alkalmazás és az adminrendszer műszaki alapja működőképes. Az első valódi iPhone→Mac kamerás QR-beváltás és a natív térképek fizikai PASS-t kaptak. A venue/reward betöltési helyreállítás, a végleges kategória-viselkedés, a saját domaines jogi linkek és az öt kötelező 6,9″ App Store-kép elkészült. A kiadás jelenlegi kapuja a build 16 Apple-feldolgozása és fizikai regressziója, az ismételt QR felületi elutasítás, a fiókfolyamatok, a kulcscsere, az App Privacy Publish és a DSA tényalapú választása.
