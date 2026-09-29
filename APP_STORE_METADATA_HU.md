# Come Get It — App Store metaadatok (HU)

Állapot: előkészítve az 1.0.0 verzióhoz. A szöveg kizárólag a jelenlegi, működő mobilfunkciókat állítja.

## App-információ

| Mező | Javasolt érték | Korlát / megjegyzés |
|---|---|---|
| Név | Come Get It | 11/30 karakter |
| Alcím | Budapesti helyek és italok | 26/30 karakter |
| Elsődleges nyelv | Magyar | `hu-HU` |
| Elsődleges kategória | Food & Drink | |
| Másodlagos kategória | Lifestyle | opcionális |
| Bundle ID | `app.comegetit.mobile` | egyeznie kell a builddel |
| SKU | `COMEGETIT-IOS-1` | belső azonosító, létrehozás után nem módosítható |
| Verzió | `1.0.0` | a buildszámot az EAS távolról kezeli és minden production buildnél növeli |
| Ár | Ingyenes | nincs előfizetés vagy IAP az 1.0-ban |
| Korhatár | 18+ célkorhatár | töltsd ki a jelenlegi Apple-kérdőívet, jelöld az alkoholra vonatkozó gyakoriságot a tényleges tartalom szerint, majd használd az „Override to Higher Age Rating” lehetőséget, hogy az appban közölt 18+ korláttal egyezzen |
| Kids kategória | Nem | |
| Kiadás | Kézi kiadás jóváhagyás után | ajánlott az első verziónál |
| Első elérhetőség | Magyarország | partnerkínálat jelenleg budapesti |
| Copyright | 2026 Gátai Bence | egyéni Apple Developer-fiók esetén a természetes személy jogi neve; Bence végleges jóváhagyása szükséges |

Az Apple jelenlegi mezőkorlátai: név és alcím legfeljebb 30 karakter, promóciós szöveg 170 karakter, leírás 4000 karakter, kulcsszavak 100 bájt. Lásd: [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) és [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information).

Az App Store Connect 2026-os korhatárfolyamata kérdőívből számít globális és régiónként eltérő értéket. Mivel a Come Get It saját felülete 18 éven felülieknek szól, a kiszámított értéket szükség esetén 18+-ra kell felülbírálni. Lásd: [Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating).

## Promóciós szöveg

131 karakter / 138 bájt:

> Fedezz fel budapesti partnerhelyeket, mentsd el kedvenceidet, nézd meg az aktuális italajánlatokat, és váltsd be őket a helyszínen.

## Leírás

Fedezd fel Budapest partnerhelyeit a Come Get Ittel.

Böngészd a közelben elérhető bárokat és vendéglátóhelyeket, nézd meg az aktuális ingyen italokat és partnerajánlatokat, majd mentsd el a kedvenceidet. A térképes nézet és a szűrők segítenek gyorsan megtalálni a neked való helyet.

Fő funkciók:

• budapesti partnerhelyek és részletes helyadatlapok
• aktuális italok, elérhetőségi idősávok és nyitvatartás
• térképes böngészés és közelség szerinti felfedezés
• keresés, szűrés és kedvencek
• pontok és elérhető partnerjutalmak
• helyszíni, időkorlátos beváltási folyamat
• saját profil és fiókkezelés

A helyadat használata opcionális a böngészéshez; a közeli helyek megjelenítéséhez és a helyszíni beváltás ellenőrzéséhez kérjük. Az app csak használat közben fér hozzá a helyzetedhez.

Az italajánlatok helyszínenként és időszakonként változhatnak. 18 éven felülieknek. Fogyassz felelősséggel.

## Kulcsszavak

73 bájt / 100 bájt:

`Budapest,bár,kocsma,koktél,sör,ital,helyek,térkép,kedvencek,jutalmak`

## URL-ek

- Support URL: `https://come-get-it.app/support`
- Privacy Policy URL: `https://come-get-it.app/adatvedelmi-szabalyzat`
- Privacy Choices URL: `https://come-get-it.app/adatvedelmi-szabalyzat` — a jogok és a fióktörlés módja is szerepel rajta; a fióktörlés az appon belül is elérhető.
- Marketing URL: `https://come-get-it.app`

Mindhárom publikus URL HTTPS-en elérhető. App Store Connectben ne a GitHub-dokumentumokra mutató korábbi címeket használd.

## Nem szerepelhet az 1.0 metaadataiban

- fizetős Plus előfizetés vagy 990 Ft/hét / 2 990 Ft/hó ár;
- bankkártya-összekapcsolás vagy automatikus pontgyűjtés vásárlás után;
- garantált CSR-adomány vagy „minden ital = egy napi ivóvíz” állítás;
- push értesítések, referral program vagy még nem élő partner-/felhasználószámok;
- „korlátlan”, „mindig elérhető” vagy más, partnerkapacitástól független ígéret.

## Kötelező tulajdonosi ellenőrzés beküldés előtt

- az App Store Connect seller/copyright mezőben szereplő jogi név;
- EU DSA trader státusz, cím és kapcsolattartási adatok;
- valamennyi partnerfotó, logó, italnév és védjegy felhasználási joga;
- az Apple Developer-szerződések, adó- és banki adatok állapota.
