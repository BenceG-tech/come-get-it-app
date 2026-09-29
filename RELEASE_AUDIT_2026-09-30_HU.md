# Come Get It — végső kiadási audit

Állapotdátum: **2026. szeptember 30.**

Célkiadás: **iOS 1.0.0 (17), ingyenes béta**

## Vezetői eredmény

A build 17 a jelenlegi egyetlen kiadási jelölt. Az aláírt iOS build elkészült, és az App Store Connect feltöltése sikeresen befejeződött. A kategóriaoldalak forrásoldali hibajavítása, a középre igazított login logó, a márkázott induló/betöltő képernyő, a venue- és reward-betöltés helyreállítása, valamint a saját domaines jogi linkek ebben a buildben vannak.

Az alkalmazás még nem küldhető App Review-ra. A fennmaradó kapuk: a build 17 TestFlight-megjelenésének igazolása, a rövid fizikai iPhone-regresszió, az ismételt QR-beolvasás felületi elutasítása, a jelszó-visszaállítás és fióktörlés készüléktesztje, az öt kép feltöltése, az App Privacy Publish, a DSA-választás és a korábban megjelent App Store Connect API-kulcs biztonságos cseréje.

## Bizonyított technikai állapot

- GitHub main commit: `5371af254ff36e3d0f713ae2bb1b40bf9903150f`.
- EAS build: `f73e1c33-ed39-4f8b-b238-c8cf835839d2`, `FINISHED`.
- App Store submission: `1b79e305-f24c-4b69-b9a0-3dd62fe76a68`, `FINISHED` 2026-09-29 21:57 CEST.
- Verzió: `1.0.0 (17)`; bundle ID: `app.comegetit.mobile`.
- TypeScript: PASS.
- Expo web export: PASS.
- Expo iOS/Hermes export: PASS.
- Jutalomkategória navigációs statikus ellenőrzés: 7/7 PASS.
- A kategóriaoldal natív fejléce közvetlenül tiltott; egyetlen saját vissza gomb marad, amely a Jutalmak főoldalára visz.
- Az Étel és Élmények üres kategóriák `Hamarosan` állapotban le vannak tiltva.
- A login logó középre igazított; a statikus splash és az alkalmazáson belüli betöltő márkázott.
- A production Supabase és a Venue Hub ugyanazt az élő adatforrást használja.
- Az első valódi iPhone → éles Venue Hub kamera QR-beváltás sikeres volt; az egyszer használható backend ismétléskor `ALREADY_CONSUMED` eredményt ad.

## App Store-képek

Az öt végleges kép automatikus technikai auditja PASS:

- darabszám: 5;
- méret: egységesen `1320×2868`;
- formátum: PNG;
- átlátszósági csatorna: nincs;
- mappa: `/Users/bencegatai/Documents/Codex/Come Get It App Store Screenshots 6.9-inch`;
- tiszta ZIP: `/Users/bencegatai/Documents/Codex/Come-Get-It-App-Store-Screenshots-6.9-inch-CLEAN-2026-09-29.zip`.

## Adatvédelem és nyilvános URL-ek

A build 17 privacy manifestje hét adattípust jelöl: Name, Email Address, Phone Number, User ID, Precise Location, Coarse Location és Product Interaction. Mindegyik App Functionality célú, felhasználóhoz kötött és nem tracking célú.

2026-09-30-i élő ellenőrzés:

- `https://come-get-it.app` — HTTP 200;
- `https://come-get-it.app/support` — HTTP 200;
- `https://come-get-it.app/adatvedelmi-szabalyzat` — HTTP 200;
- `https://come-get-it.app/felhasznalasi-feltetelek` — HTTP 200.

A forrásellenőrzés nem talált beégetett service-role kulcsot, privát kulcsot vagy kliens titkot. A mobilapp csak az EAS környezeti változóiból kapott publikus Supabase URL-t és anon kulcsot használja; a jogosultságot Supabase Auth, RLS és Edge Function ellenőrzések adják.

## Függőségi megállapítás

A csomagvizsgálat több tranzitív figyelmeztetést jelez az Expo/Metro buildeszközökben (`postcss`, `image-size`, `uuid`) és a Rork/Router függőségi fában (`@ai-sdk/provider-utils`, `decode-uri-component`). A buildeszköz-találatok nem kerülnek önállóan futó szolgáltatásként az iPhone-ra. A Rork analitikai kliens production azonosítók hiányában nem inicializálódik. A jelenlegi Expo SDK 54 csomagválasztása konzisztens, az `expo install --check` PASS eredményt adott.

Ezeket nem javítjuk kockázatos, kiadás előtti főverzió-kényszerítéssel. A biztonságos út egy külön Expo SDK/frissítési ág teljes regresszióval a 1.0 után. Ha bármely érintett csomaghoz távolról kihasználható, mobil-futásidejű probléma igazolódik, új build szükséges a beadás előtt.

## Pontos hátralévő sorrend

1. Igazold, hogy a TestFlightban megjelent a **Come Get It 1.0.0 (17)**, és telepítsd.
2. Futtasd végig a `TESTFLIGHT_DEVICE_TEST.md` listát; különösen: venue-részlet, jutalomlista, Italok és Összes kategória egyetlen vissza gombja, letiltott Étel/Élmények, középre igazított login logó és márkázott betöltő.
3. Olvasd be ugyanazt a QR-t másodszor is, és rögzítsd a felületi elutasítást.
4. Ellenőrizd iPhone-on a kijelentkezést, jelszó-visszaállítást és külön tesztfiókkal a végleges fióktörlést.
5. Töltsd fel az öt `1320×2868` képet a 6,9″ iPhone képkészlethez.
6. Hozz létre új App Manager API-kulcsot, olvasási próbával igazold, majd vond vissza a korábban megjelent kulcsot.
7. Fogadd el az App Privacy **Publish** nyilatkozatát, és a tényleges üzleti működés szerint válaszd ki a DSA trader/non-trader státuszt.
8. Válaszd ki a build 17-et az App Store 1.0 verzióhoz, ellenőrizd a review-fiókot és az angol review notes szöveget.
9. Csak minden kapu PASS eredménye után: **Submit for Review**, kézi kiadással.

## Reális készültség

Műszaki kiadási készültség: **kb. 90%**. A fennmaradó rész döntően Apple-felületi és fizikai készülékes igazolás, nem új funkciófejlesztés. App Store-megjelenés a beküldés után az Apple felülvizsgálati idejétől függ; dátumot csak a sikeres Submit for Review után lehet érdemben becsülni.
