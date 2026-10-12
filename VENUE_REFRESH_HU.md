# Helyszínlista frissítése – 2026. október 12.

## Ellenőrzött kiindulás

A felhasználó telefonján 1.0.0 (41) fut. Ennek forrása: `4f5adee81a46fbef4a3b63ebf416d03ba37966f9`.
A 41-es IPA-ban a helyes Supabase-projekt szerepel (`nrxfiblssxwzeziomlvc`), de a lista közvetlen PostgREST-olvasást használ, nem a `get-public-venues` végpontot.
A főoldalon már volt AppState-frissítés; a kereső és a térkép viszont csak egyszer töltött. Lehúzásos frissítés nem volt.
A helyszínlista nincs AsyncStorage-be, SQLite-ba, Zustandba vagy React Query-be perzisztálva. A részletekhez 60 másodperces memóriabeli gyorsítótár van. A felvetett ok tehát nem minden részletében egyezik a forrással; a telefon eredeti hálózati válaszát nem tudtuk megfigyelni.

A felhasználó engedélyével a BuBu és a Vinozza `is_paused=true` állapotot kapott. A nyilvános végpont és a mobil által korábban használt közvetlen, anonim lekérdezés is pontosan öt aktív Come Get It teszthelyet adott vissza. Szerveroldali terjedési várakozás nincs.

## Konkrét módosítások

- `expo/lib/publicVenues.ts`: a nyilvános végpontot kéri, minden alkalommal `v=Date.now()` paraméterrel és `cache: 'no-store'` beállítással. Nem vár auth-session zárolásra. Ellenőrzi a HTTP-választ és a válasz alakját; 100-as lapokban olvas, nem vágja le a későbbi helyeket.
- `expo/lib/venueService.ts`: a fogyasztói listát az új nyilvános olvasóra vezeti át. A friss alaplista a képek és italajánlatok beérkezése előtt megjelenik. A megszakított kérés nem frissítheti a listát.
- `expo/lib/venueRefreshLifecycle.ts`: képernyőfókusznál azonnali frissítés; háttérből/inaktívból `active` állapotba váltáskor újabb frissítés. Takarításkor leiratkozás és megszakítás.
- `expo/lib/useVenueList.ts`: közös frissítési működés. Új kérés megszakítja az előzőt; a friss eredmény teljesen felülírja a listát, az üres `[]` is. Hálózati hibánál megmaradhat a legutóbbi eredmény, látható hibajelzéssel és újrapróbálással. Sikeres válaszra nincs helyi tartalékra visszaállás.
- `expo/app/(tabs)/home.tsx`: közös frissítés és RefreshControl; kinyitott panelnél a lista lefelé húzása frissít, a fejléc húzása mozgatja a panelt. A becsukott/félig nyitott panel korábbi felfelé nyitása megmarad. Eltűnt helyszín térképes előnézete bezárul.
- `expo/app/search.tsx`, `expo/app/map.tsx`: fókusz/előtéres frissítés, lehúzásos frissítés üres listán is; térképes előnézet eltűnik, ha a hely már nem látható.
- `expo/context/FavoritesContext.tsx`, `expo/app/favorites.tsx`: visszatéréskor frissülnek a kedvencek; a friss helyszínlista alapján szűrnek, és lehúzással is kérhető frissítés. A felhasználó mentett kedvencazonosítói nem törlődnek az admin szüneteltetése miatt.
- `expo/lib/venueData.ts`: az új teljes lista kiveszi a már hiányzó helyeket a részletek memóriatárából.
- `expo/lib/supabaseProvider.ts`, `expo/app/venue/[id].tsx`: rejtett/törölt hely részletei nem maradhatnak a régi gyorsítótárból a képernyőn. A részletek is frissülnek visszatéréskor.
- `supabase/functions/get-public-venues/index.ts`: a már élő v59 forrásának kompatibilis bővítése `offset` lapozással, stabil azonosítós rendezéssel és `sort=newest` opcióval. A szüneteltetési szűrés és a no-store fejlécek megmaradtak. v60 élesítve; két elemes lapokkal 5 különböző teszthely és utána üres lap ellenőrizve; hibás offset 400.

## Fontos kódrészletek

```ts
url.searchParams.set('v', String(Date.now()));
const response = await fetch(url.toString(), { signal: options.signal, cache: 'no-store' });
```

```ts
useFocusEffect(useCallback(() => startVenueRefreshLifecycle(
  AppState, () => { void refresh(); }, () => request.current?.abort(),
), [refresh]));
```

```tsx
<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D1FF" />
```

## Ellenőrzés és készülékpróba

98 automatikus teszt sikeres (94 Node + 4 Bun), TypeScript és iOS Expo-export sikeres. A regressziós tesztek ellenőrzik az előtérbe kerülést, a leiratkozást, a későn beérkező régi választ, az üres listával történő törlést, az offline tartalékot, a 100 feletti lapozást és a rejtett hely részleteinek eltüntetését. Ez nem fizikai iPhone-próba.

Az új mobilkódhoz új TestFlight-build szükséges: a 41-es verzióban nincs bekötött expo-updates. A telepített 41-es app önmagától nem veszi át ezt a kódot. Az adminbeli állapot a következő sikeres hálózati frissítésnél jelenik meg; folyamatos valós idejű adatfolyam nincs bekötve.

Készülékpróba: lista betöltése → egy teszthely ideiglenes szüneteltetése adminban → háttérbe/előre váltás vagy lehúzás → hely eltűnik listából, keresésből és térképről → visszaaktiválás és új frissítés → hely visszatér. A próba végén álljon vissza az öt teszthely. Ezt automatizáltan nem végeztük el az élő helyszíneken.

## Felvétel

Egyetlen hosszabb álló felvétel is megfelelő. A kész, belépett appból induljon: nyugodt listagörgetés → hely kiválasztása → ital kiválasztása → térkép → vissza a helyhez. Az egyes lépések előtt és után 2–3 másodperc szünet maradjon, így később jól vágható. A belépési képernyő nem szükséges. Zene, hanghatás, felirat és sima átmenetek utólag hozzáadhatók.
