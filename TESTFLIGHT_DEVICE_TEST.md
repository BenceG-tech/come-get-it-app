# Come Get It — TestFlight készülékteszt

Tesztelendő kiadás: **1.0.0 (11)**
TestFlight-csoport: **Come Get It belső teszt**
Állapot: **telefonos ellenőrzésre kész**

Ezt a lapot sorrendben kell végigjárni egy valódi iPhone-on. Egy lépés csak akkor kész, ha a várt eredmény látható és a bizonyíték el van mentve. Hibánál ne menj tovább az App Review beküldéséig.

## Előkészítés

- [ ] Az iPhone-on a TestFlightba a fejlesztői fiókhoz tartozó Apple ID-val legyen belépve.
- [ ] A telepített alkalmazás verziója **1.0.0 (11)**.
- [ ] A Venue Hub meg van nyitva egy kamerás második eszközön (a Mac is megfelel): `https://come-get-it-venue-hub.lovable.app/pos/redeem`.
- [ ] A partnerellenőrző hozzáférés a helyi, Git által nem követett `.private/app-review-partner-credentials.txt` fájlból van használva. A jelszó nem kerül képernyőképre.
- [ ] A telefonon működő internetkapcsolat és a kameraengedély elérhető.

## A. Telepítés és első indítás

1. [ ] Telepítsd vagy frissítsd a Come Get It alkalmazást a TestFlightból.
2. [ ] Indítsd el teljesen bezárt állapotból.
3. [ ] Ellenőrizd, hogy nincs fehér/fekete üres képernyő, összeomlás vagy fejlesztői hibaüzenet.
4. [ ] Ellenőrizd az alkalmazás nevét, ikonját, splash képernyőjét és az olvasható magyar szövegeket.

Bizonyíték: `TF-01-elso-inditas.png`

## B. Új regisztráció

1. [ ] Nyisd meg a Regisztrációt.
2. [ ] Adj meg egy új, kizárólag ehhez a teszthez használt e-mail-címet és erős jelszót.
3. [ ] Fogadd el a kötelező jogi feltételeket.
4. [ ] Fejezd be az e-mail-megerősítést, ha az alkalmazás kéri.
5. [ ] Ellenőrizd, hogy az alkalmazás beenged és nem marad a regisztrációs képernyőn.

Várt eredmény: létrejön egy valódi felhasználó, és az alkalmazás kezdőnézete megjelenik.

## C. Bejelentkezés és munkamenet

1. [ ] Jelentkezz ki.
2. [ ] Jelentkezz be az imént létrehozott fiókkal.
3. [ ] Zárd be teljesen az alkalmazást, majd indítsd újra.
4. [ ] Ellenőrizd, hogy a bejelentkezett állapot biztonságosan helyreáll.

Várt eredmény: nincs végtelen betöltés, váratlan kijelentkezés vagy hibás profil.

## D. Helyszín, térkép és pontos jutalom

1. [ ] A helyengedélynél válaszd az „App használata közben” lehetőséget.
2. [ ] Ellenőrizd, hogy a listaoldal felső térképe valódi Apple Térképet mutat; az „API KEY REQUIRED” felirat sehol nem látható.
3. [ ] Ellenőrizd, hogy az öt helyjelölő látszik, a térkép mozgatható/nagyítható, és a saját helyzet gomb reagál.
4. [ ] Ellenőrizd, hogy a **Come Get It Bar** megjelenik, majd nyisd meg.
5. [ ] A hely adatlapján ellenőrizd a címet, nyitvatartást, térképet és az **Electric Blue Shot** italt.
6. [ ] Nyisd meg a Jutalmak lapot.
7. [ ] Ellenőrizd, hogy a **Pilot ajándék ital** saját képpel és 100 pontos árral jelenik meg.
8. [ ] Nyisd meg és váltsd be a Pilot jutalmat. Várt eredmény: „Sikeres beváltás”, beváltási kód, és pontosan 100 pont levonása.
9. [ ] Próbáld ki a kedvencek hozzáadását és eltávolítását.

Bizonyítékok:

- `TF-02-helyszinlista.png`
- `TF-03-helyszin-reszletek.png`
- `TF-04-rewards.png`
- `TF-05-jutalom-bevaltas.png`

## E. QR-beváltás végponttól végpontig

1. [ ] A **Come Get It Bar** adatlapján indítsd el az ingyen ital beváltását a „Kérd ingyen italod” gombbal.
2. [ ] Ellenőrizd, hogy a QR-kód megjelenik és visszaszámlálás látható.
3. [ ] A második eszközön jelentkezz be a Venue Hubba partnerként.
4. [ ] Ellenőrizd, hogy csak a **Come Get It Bar** látható.
5. [ ] Nyisd meg a **QR beváltás** menüpontot, majd indítsd el a szkennert.
6. [ ] Olvasd be a telefon QR-kódját.
7. [ ] Ellenőrizd a partneroldali sikeres visszajelzést és a telefon sikerállapotát.
8. [ ] Olvasd be ugyanazt a QR-kódot ismét.

Várt eredmény:

- az első beváltás sikeres;
- a telefon csak partneri jóváhagyás után mutat sikert;
- a második beváltás elutasított, mert a token már felhasznált;
- más helyszín adata nem jelenik meg a partner számára.

Bizonyítékok:

- `TF-06-qr-atadas.png` — úgy vágva, hogy a teljes token ne legyen olvasható;
- `TF-07-sikeres-bevaltas.png`;
- `TF-08-ismetelt-bevaltas-elutasitva.png`.

Megjegyzés: a tulajdonosi tesztfiók csak a hely- és idősáv-ellenőrzés alól kap tesztkivételt. A bejelentkezés, a kétperces lejárat, a partner jogosultsága és az egyszer használhatóság változatlanul kötelező.

## F. Profil, kijelentkezés és jelszó-visszaállítás

1. [ ] Módosíts egy nem érzékeny profilmezőt, majd indítsd újra az alkalmazást.
2. [ ] Ellenőrizd, hogy a módosítás megmaradt.
3. [ ] Jelentkezz ki, és ellenőrizd, hogy a védett nézetek már nem érhetők el.
4. [ ] Indíts jelszó-visszaállítást.
5. [ ] Nyisd meg az e-mailben érkező hivatkozást ugyanazon az iPhone-on.
6. [ ] Állíts be új jelszót, majd jelentkezz be vele.

Várt eredmény: a reset link a megfelelő képernyőt nyitja meg, az új jelszó működik, a régi már nem.

## G. Fióktörlés

Ezt csak az újonnan létrehozott tesztfiókkal végezd el; az App Review és partner fiókokat ne töröld.

1. [ ] Indítsd el a fióktörlést a Profil/Beállítások részből.
2. [ ] Erősítsd meg a törlést.
3. [ ] Ellenőrizd, hogy az alkalmazás kijelentkeztet.
4. [ ] Próbálj bejelentkezni a törölt tesztfiókkal.

Várt eredmény: a törölt fiók többé nem használható.

## H. App Store-képernyőképek

A sikeres teszt után készíts egységes, 6.9 hüvelykes iPhone-képernyőképeket a következőkről:

- [ ] helyszínlista vagy térkép;
- [ ] Come Get It Bar részletei;
- [ ] Rewards lista;
- [ ] Kedvencek vagy Profil személyes adatok nélkül;
- [ ] beváltás előtti átadóképernyő teljes QR-token nélkül.

Elfogadott portréméretek közül használj egyet következetesen: **1260 × 2736**, **1290 × 2796** vagy **1320 × 2868**. Ne legyen látható értesítés, böngészőkeret, fejlesztői felület, jelszó, e-mail-cím vagy teljes QR-titok.

## Tesztlezárás

- Dátum: ____________________
- iPhone modell: ____________________
- iOS verzió: ____________________
- Tesztelő: ____________________
- Eredmény: [ ] PASS  [ ] FAIL
- Hibajegy vagy megjegyzés: ________________________________________________

**Kiadási szabály:** csak PASS eredmény, friss képernyőképek és a fennmaradó Apple-nyilatkozatok kitöltése után küldhető App Review-ra.
