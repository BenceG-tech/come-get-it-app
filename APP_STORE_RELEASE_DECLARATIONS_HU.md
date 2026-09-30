# Come Get It — App Store Connect nyilatkozatok

Állapotdátum: **2026. szeptember 30.**
Célkiadás: **Come Get It 1.0.0 (19), ingyenes iPhone-béta**

Ez a lap a build 19 kiadási forrása, a `BUILD_19_BINARY_AUDIT.md` szerint ellenőrzött aláírt binárisa és privacy manifestje, az élő Supabase-funkciók és a `come-get-it.app` publikus jogi oldalai alapján készült. A technikai válaszokat előkészíti, de a tulajdonjogi és jogi állításokat az Account Holdernek a saját nevében kell végleg elfogadnia.

## 1. Korhatár

| Kérdéskör | Válasz |
|---|---|
| Kids Category | **Nem** |
| Alkohol, dohány vagy drog használata / említése | **Gyakori**, mert az app bárokat és alkoholos italajánlatokat rendszeresen megjelenít |
| Szerencsejáték, loot box, nyereményjáték | **Nem** |
| Erőszak, szexuális tartalom, horror, fegyver | **Nem** |
| Felhasználói chat vagy felhasználók által közzétett tartalom | **Nem** |
| Korlátlan webhozzáférés | **Nem** |
| Kids kategória / gyermekeknek készült | **Nem** |

Az app saját feltételei 18 éven felüli használatot írnak elő. Ha az Apple kérdőíve ennél alacsonyabb értéket számol, válaszd az **Override to Higher Age Rating → 18+** lehetőséget. Apple előírása szerint a saját EULA-ban szereplő magasabb minimuméletkort felülbírálással kell tükrözni.

## 2. Tartalomjogok

- A „Does your app contain, show, or access third-party content?” kérdésre: **Igen**.
- Az app partnerneveket, partnerfotókat, logókat, helyadatokat és italneveket jeleníthet meg.
- A felhasználási jog meglétét csak akkor szabad jóváhagyni, ha minden élő partneranyaghoz írásos engedély, saját tulajdon vagy megfelelő licenc tartozik.
- Bizonytalan eredetű kép, logó vagy védjegy nem maradhat a beadandó appban vagy screenshotban.

Ez tulajdonosi jognyilatkozat; a technikai audit nem helyettesíti a partnerengedélyeket.

## 3. Copyright

Javasolt mezőérték az egyéni Apple Developer-fiókhoz:

```text
2026 Gátai Bence
```

Ne használj fantázianevet jogi tulajdonosként. Ha a jogok később bejegyzett társasághoz kerülnek, a következő verzió előtt a hivatalos cégnévvel és a szerződéses jogutódlással kell egyeztetni.

## 4. App Privacy

Felső szintű válaszok:

- Does this app or its third-party partners collect data? **Igen**
- Tracking across other companies' apps or websites? **Nem**
- Third-party advertising? **Nem**
- Privacy Policy URL: `https://come-get-it.app/adatvedelmi-szabalyzat`
- Privacy Choices URL: `https://come-get-it.app/adatvedelmi-szabalyzat`

A build 19 kiadási forrásában rögzített privacy manifesttel egyező hét adattípus:

| Apple adattípus | Felhasználóhoz kötött | Tracking | Cél |
|---|---:|---:|---|
| Name | Igen | Nem | App Functionality |
| Email Address | Igen | Nem | App Functionality |
| Phone Number | Igen, opcionális mező | Nem | App Functionality |
| User ID | Igen | Nem | App Functionality |
| Precise Location | Igen, engedély után | Nem | App Functionality |
| Coarse Location | Igen, csökkentett pontosság esetén | Nem | App Functionality |
| Product Interaction | Igen | Nem | App Functionality |

Ne jelöld be az 1.0 kiadásban: pénzügyi adat, vásárlási előzmény, hirdetési adat, kontaktlista, fotó/videó, audio, egészség/fitnesz, böngészési előzmény, keresési előzmény, crash/performance analytics vagy tracking. A Rork csomagban tranzitívan jelen lévő PostHog nem inicializálódik, mert a szükséges production projekt- és csapatazonosítók nincsenek beállítva.

Az App Privacy **Publish** gombja olyan nyilatkozatot erősít meg, hogy a válaszok pontosak, megfelelnek az App Review irányelveinek és az alkalmazandó jognak, valamint változás esetén frissítésre kerülnek. Ezt az Account Holdernek vagy más megfelelő tulajdonosi jogosultságú személynek kell elfogadnia.

## 5. Titkosítás és export compliance

- A build `usesNonExemptEncryption: false` beállítást tartalmaz.
- Az app szabványos HTTPS/TLS és platform-/SDK-szintű titkosítást használ.
- Nincs saját fejlesztésű titkosítási algoritmus vagy nem mentesített kriptográfiai termék.
- Az App Store Connect aktuális kérdésénél a szabványos, mentesített titkosítási útvonalat kell választani. Ha Apple dokumentumfeltöltést kér, állítsd meg a beadást és ellenőrizd újra a konkrét kérdést.

## 6. EU Digital Services Act

Apple nem döntheti el helyetted a trader/non-trader státuszt. Az app partnerhelyeket és ajánlatokat népszerűsít, ezért a kereskedelmi célú működés erős trader-jelzés; bizonytalanság esetén jogi tanács szükséges.

Ha **trader**:

- magánszemély fejlesztőként nyilvánosan megjelenő cím vagy postafiók, telefonszám és e-mail szükséges;
- Apple e-mail- és telefonellenőrzést, valamint címet/jogi státuszt igazoló dokumentumot kérhet;
- az Account Holdernek igazolnia kell az EU-jognak megfelelő termék/szolgáltatás kínálását.

Ha **non-trader**, az EU-s termékoldalon Apple jelzi, hogy a fogyasztóvédelmi jogok nem ugyanúgy alkalmazandók. A státuszt csak Bence választhatja ki a tényleges üzleti körülmények alapján.

## 7. Egyéb kiadási válaszok

- Árazás: **ingyenes**, nincs IAP vagy előfizetés az 1.0-ban.
- Hirdetések: **nincsenek**.
- Account creation: **van**; az alkalmazáson belüli végleges fióktörlés elérhető.
- Sign-in required for review: **igen**; a review-fiók adatai Git által nem követett helyi fájlban vannak.
- Release mode: **kézi kiadás** App Review-jóváhagyás után.
- Standard Apple EULA: **használható**; nincs külön egyedi licencfeltétel beállítva.
- Apple Silicon Mac és Apple Vision Pro terjesztés: **kikapcsolva**, mert nincs ezen platformokon tesztelt kiadás.

## 8. Az Account Holder végső ellenőrzőlistája

- [ ] Minden élő partnerképhez, logóhoz és védjegyhez igazolt felhasználási jog tartozik.
- [ ] Copyright: `2026 Gátai Bence`.
- [ ] Korhatárválaszok pontosak, és a végső globális érték 18+.
- [ ] A hét privacy adattípus és a no-tracking válasz megfelel a build 19-nek.
- [ ] Privacy Publish nyilatkozat elfogadva.
- [ ] DSA trader/non-trader státusz a valós működés alapján kiválasztva és szükség esetén ellenőrizve.
- [ ] Az Apple szerződéses, adó- és banki státuszán nincs blokkoló figyelmeztetés.
- [ ] Az öt friss 6,9 hüvelykes screenshot feltöltve.
- [ ] Build 19 fizikai TestFlight-tesztje PASS.
- [ ] Csak ezután: **Submit for Review**.

Hivatalos Apple-források:

- [App Privacy kezelése](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Korhatár beállítása](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)
- [EU DSA trader követelmények](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements)
- [App information mezők](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information)
