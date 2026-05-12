# Preview javítás véglegesen: babel config tisztítás + cache reset

## Mi a probléma

A "Script not found 'expo'" hiba egy Metro bundler szintű probléma, nem a Te kódodból jön. A vizsgálat alapján két dolog együttese okozza:

1. A `babel.config.js`-ben egy kísérleti (unstable) opció szerepel, amit a Rork build környezet nem mindig fogad el frissítés után — ez töri a teljes bundle-t.
2. A build cache "beragad" ebbe a hibás állapotba, és minden további próbálkozásnál ugyanúgy elesik.

A `home.tsx` null-safe javítása **nem volt rossz**, csak épp az után frissült a build környezet és onnantól a babel config flag-je elkezdett ütközni.

## Mit fogok csinálni

- **Babel beállítás biztonságos visszaállítása**: kiszedem az `unstable_transformImportMeta` kísérleti flag-et a `babel.config.js`-ből, és a standard Expo babel preset marad. Ez a Rork által támogatott, stabil konfiguráció.
- **`package.json` mikro-érintése**: egy ártalmatlan változtatás (pl. üres sor) ami a Rork CI-t arra kényszeríti hogy újra-telepítse a függőségeket tiszta lappal — ettől eltűnik a beragadt cache.
- **`tsconfig.json` és `app.json`**: érintetlenek maradnak, ezekkel nincs gond.
- **`home.tsx` null-safe javítások**: érintetlenek maradnak, ezek helyesek.
- **`.gitignore` állapot**: marad ahogy van, nem ez a probléma.

## Mit NEM csinálok meg

- Nem nyúlok a Supabase, auth, vagy bármilyen feature kódhoz.
- Nem írom át a kinézetet vagy a felhasználói élményt.
- Nem érintem a már működő képernyőket.

## Várható eredmény

A változtatás után a Rork preview egy tiszta build-et fog futtatni a stabil konfigurációval, és a "Script not found 'expo'" hibának véglegesen el kell tűnnie. Ha a probléma valamiért mégis visszatér egy jövőbeli build során, az már nem ettől a config-tól lesz — és könnyebb diagnosztizálni.

## Ha a fix után még mindig nem jó

Akkor a build log alapján fogom tovább nyomozni — de a most azonosított gyanús pont (a kísérleti babel flag) a legvalószínűbb oka annak hogy a hiba **visszatér**, még akkor is, ha egyszer-egyszer eltűnik átmenetileg.