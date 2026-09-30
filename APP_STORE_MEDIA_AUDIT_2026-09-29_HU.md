# Come Get It — App Store média audit

> **Történeti audit, felülírva 2026. szeptember 30-án.** A végleges, jóváhagyott öt fájl neve és tartalma az `APP_STORE_SCREENSHOT_AUDIT.md` és az `APP_STORE_MEDIA_CAPTURE_HU.md` dokumentumban található. Az alábbi előzetes képsorrendet ne használd feltöltéshez.

Ellenőrzés dátuma: **2026. szeptember 29.**  
Célkiadás: **Come Get It 1.0.0 (13)**

## Vezetői eredmény

**Jelenleg nincs véglegesen feltölthető App Store-képcsomag.**

Ez nem buildhiba. Az aláírt production build elkészült, az EAS állapota `FINISHED`, az Apple feldolgozási állapota `VALID`, és a build belső TestFlight-tesztelésre elérhető. A média-gát azért marad zárva, mert a megtalált képek nem a javításokat tartalmazó, fizikailag letesztelt build 13 végleges állapotát mutatják.

Végleges feltöltéshez öt friss, ugyanazon 6,9 hüvelykes iPhone-on készült kép szükséges a `APP_STORE_MEDIA_CAPTURE_HU.md` kézikönyv szerint.

## Megvizsgált anyagok

### Marketingmappa

A `Come Get it video, screenshot, marketing marketing material` mappában **61 kép és 24 videó** található. A régebbi 1206 × 2622 képek közül több Apple által elfogadott 6,3 hüvelykes méretű, de tartalmilag nem használható végleges 1.0 anyagként:

- korábbi prototípust vagy régi navigációt mutatnak;
- böngésző-, Rork-, Lovable-, fotónézegető- vagy más kezelőfelület látható rajtuk;
- régi kártya-összekapcsolási és automatikus pontgyűjtési ígéret szerepel rajtuk;
- nem bizonyított vagy még nem kiadott funkciót mutatnak;
- nem a build 13 javított élő állapotából készültek.

### 2026. szeptember 29-i TestFlight-képek

A négy kép 1206 × 2622 méretű, de nem tölthető fel végleges App Store-képként:

- a helylistán még `API KEY REQUIRED` vízjel látható;
- a Pilot jutalom képe még hiányzik;
- a TestFlight visszajelzője látható a státuszsávban;
- a képek a kategória- és adatjavítások előtti állapotot dokumentálják.

Ezek hibabizonyítékként hasznosak, marketinganyagként nem.

### Helyi Rork-előnézeti képek

A négy előnézeti kép sem tekinthető véglegesnek:

- 402 × 874 képpontos webes előnézet felnagyított változatai, ezért láthatóan életlenek;
- két képen sárga fókusz-/billentyűzetkeret maradt az alsó navigáción;
- a jutalomképen még hiányzik a Pilot jutalom képe;
- nem bizonyítják, hogy a build 13 natív iOS-alkalmazásból készültek;
- a Rork-előnézet nem helyettesíti a fizikailag aláírt TestFlight-build felvételét.

## Jóváhagyott végleges képsorozat

Az öt kép sorrendje és fájlneve:

1. `01-fedezd-fel-budapestet.png` — helylista és működő natív térkép;
2. `02-hely-reszletek.png` — valós partner részletes oldala;
3. `03-jutalmak.png` — jutalomkatalógus képekkel és helyes kategóriákkal;
4. `04-pilot-jutalom.png` — aktív jutalom részletes, beváltás előtti állapota;
5. `05-ital-bevaltas.png` — helyszíni átadóképernyő, kitakart kóddal.

Mind az öt fájl legyen ugyanabban az Apple által elfogadott 6,9 hüvelykes álló méretben:

- 1260 × 2736 px; vagy
- 1290 × 2796 px; vagy
- 1320 × 2868 px.

## Kötelező átadási feltételek

A média-gát csak akkor nyitható ki, ha:

- a build 13 végigment a fizikai iPhone-teszten;
- a térkép minden nézetben vízjel és API-hiba nélkül működik;
- a jutalomképek betöltődnek, a kategória-visszanavigáció következetes;
- az ital- és pontjutalom beváltás sikeres, az ismételt kódot a rendszer elutasítja;
- nincs TestFlight-, Rork-, Lovable-, böngésző- vagy fejlesztői kezelőfelület a képen;
- nincs személyes adat, teljes QR-kód, token vagy belső azonosító;
- nincs régi kártya-összekapcsolási, automatikus pontgyűjtési vagy még nem élő funkcióra vonatkozó ígéret;
- az öt fájl az automatikus ellenőrzőn hibamentesen átmegy:

```bash
cd expo
pnpm run audit:app-store-media -- "/teljes/elérési/út/a/végleges/mappához"
```

## Jelenlegi korlátok

- Ezen a Macen nincs teljes Xcode/szimulátor telepítve, ezért innen nem készíthető hiteles natív iPhone-szimulátoros sorozat.
- A végleges képeket a fizikailag telepített TestFlight build 13-ból kell rögzíteni.
- Az App Store Connect aktuális űrlapállapotát ebben az ellenőrzési körben a Chrome-kapcsolat hibája miatt nem lehetett hitelesen újraolvasni. Ez nem változtatja meg a média-audit eredményét.

## Döntés

A megtalált régi képeket és az előnézeti csomagot **karanténban kell tartani, nem szabad feltölteni**. A végleges csomag csak a fizikai build 13 tesztje után, friss felvétellel készülhet el.

Hivatalos Apple-hivatkozások:

- [Képernyőkép-specifikációk](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [App Preview-specifikációk](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications)
- [App Preview-k és képernyőképek feltöltése](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots)
