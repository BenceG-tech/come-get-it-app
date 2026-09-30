# Come Get It — végső kiadási audit

Állapotdátum: **2026. szeptember 30.**
Célkiadás: **iOS 1.0.0 (19), ingyenes béta**

## Vezetői eredmény

A build 19 a jelenlegi kiadási jelölt. Az aláírt iOS build elkészült, az App Store Connect feltöltése sikeres, az Apple `VALID` állapotig feldolgozta, és a build a belső TestFlight-csoportban `IN_BETA_TESTING`. A fizikai Build 19-regresszió és a tulajdonosi kapuk lezárásáig az alkalmazás még nem küldhető App Review-ra.

A build 19 tartalmazza:

- az eredeti, középre igazított Come Get It login logót;
- a fölösleges külön runtime loading képernyő eltávolítását;
- az egységes jutalomkategória-visszanavigációt;
- négy élő jutalmat, amelyek lefedik az Italok, Étel és Élmények kategóriát;
- a felhasználónként és jutalmanként egyszeri beváltás szerveroldali védelmét;
- a korábbi venue-, reward- és jogi link javításokat.

## Bizonyított műszaki állapot

| Terület | Állapot | Bizonyíték |
|---|---|---|
| GitHub forrás | **PASS** | main `1563ac06341534653493901c3659005bf617f3a8`; PR #27 és #28 merged |
| TypeScript | **PASS** | teljes forrásellenőrzés hiba nélkül |
| Expo iOS-export | **PASS** | production forrásból sikeres export |
| EAS production build | **PASS** | `67ce044b-0327-44f6-a6d1-34f71576ec7e`, `FINISHED` |
| App Store Connect feltöltés | **PASS** | submission `f2fc269a-6db6-4647-a313-82897ccf78fe`, `FINISHED` |
| Apple-feldolgozás | **PASS** | `VALID`, `READY_FOR_BETA_TESTING`, nem lejárt |
| Belső TestFlight-terjesztés | **PASS** | workflow `01a0f016-0ce3-762a-9138-770cc31c242d`; Build 19 `IN_BETA_TESTING` a `Come Get It belső teszt` csoportban |
| Supabase | **ACTIVE_HEALTHY** | az app és a Venue Hub ugyanazt a production projektet használja |
| Jutalomkatalógus | **PASS** | 4 aktív jutalom; drink, food és experience lefedve |
| Egyszeri jutalombeváltás | **PASS** | egyedi `(user_id, reward_id)` igény, trigger/RPC védelem, Edge Function v49, duplikációs teszt PASS |
| Partneres QR | **ELSŐ FIZIKAI ÚT PASS** | iPhone → éles Mac-kamera → sikeres partneri beváltás |
| App Store médiacsomag | **KÉSZ · FELTÖLTÉS KELL** | 5 × `1320×2868` alpha nélküli PNG és tiszta ZIP |
| App Review tesztadat | **ELŐKÉSZÍTVE** | fogyasztói review-fiók 500 szinkronizált ponttal; review notes külön kezeli a venue QR-t és a pontjutalmat |

## Élő jutalmak

1. Pilot ajándék ital;
2. Blue Hour koktél — 300 pont;
3. Séf ajánlata – főétel — 900 pont;
4. VIP lounge élmény — 1400 pont.

A `consumer_rewards` nézet csak aktív, érvényes, készleten lévő, aktív helyhez tartozó jutalmat ad vissza. Az adminban végzett módosítások appfrissítés vagy újranyitás után jelennek meg.

## Ismételt beváltás elleni védelem

- A `reward_redemption_claims` elsődleges kulcsa `(user_id, reward_id)`.
- A beváltás elején lefoglalt igény kizárja a párhuzamos és későbbi duplikációt.
- Az adatbázis-trigger a közvetlen duplikált beszúrást is blokkolja.
- A `redeem-reward` Edge Function v49 ismétléskor HTTP 409 választ ad.
- Az app felhasználói üzenete: **„Ezt a jutalmat már beváltottad.”**
- A korábbi három történeti beváltási sor változatlan maradt.

## App Store-képek

Az öt elkészült kép technikai és vizuális QC-je PASS:

- darabszám: 5;
- méret: egységesen `1320×2868`;
- formátum: PNG;
- alpha/átlátszóság: nincs;
- nincs olvasható QR/token, személyes adat vagy fejlesztői keret;
- nincs nem élő card-linking, fizetős Plus vagy CSR-ígéret.

## Adatvédelem és publikus URL-ek

A jelenlegi kiadási forrás privacy manifestje hét adattípust jelöl: Name, Email Address, Phone Number, User ID, Precise Location, Coarse Location és Product Interaction. Mindegyik App Functionality célú, felhasználóhoz kötött és nem tracking célú.

Publikus URL-ek:

- `https://come-get-it.app`
- `https://come-get-it.app/support`
- `https://come-get-it.app/adatvedelmi-szabalyzat`
- `https://come-get-it.app/felhasznalasi-feltetelek`

## Pontos hátralévő sorrend

1. Telepítsd a TestFlightból az **1.0.0 (19)** buildet, és futtasd végig a `TESTFLIGHT_DEVICE_TEST.md` listát.
2. Külön igazold az eredeti középre igazított login logót, a rövid semleges betöltést, mind a négy jutalmat és minden kategória visszanavigációját.
3. Próbáld ugyanazt a jutalmat másodszor beváltani, majd ugyanazt a QR-t másodszor beolvasni; mindkettő legyen elutasított.
4. Ellenőrizd a kijelentkezést, jelszó-visszaállítást és külön tesztfiókkal a fióktörlést.
5. Töltsd fel az öt kész 6,9 hüvelykes képet.
6. Hozz létre és igazolj egy új App Manager API-kulcsot, majd vond vissza a régit; cseréld a review-fiókok jelszavát is.
7. Fogadd el az App Privacy **Publish** nyilatkozatát, és válaszd ki a tényalapú DSA-státuszt.
8. Válaszd ki a build 19-et, ellenőrizd a review notes és login adatokat, majd minden PASS után küldd App Review-ra kézi kiadással.

## Kiadási szabály

Az EAS-build és a sikeres App Store Connect-feltöltés nem helyettesíti a valós iPhone-tesztet vagy az Apple jogi nyilatkozatait. App Review-beküldés csak a teljes fizikai PASS és minden tulajdonosi kapu lezárása után történhet.
