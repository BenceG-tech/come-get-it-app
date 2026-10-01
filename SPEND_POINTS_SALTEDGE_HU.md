# Költésből pont (Salt Edge) és helyszíni attribúció – üzemeltetés

Részletes terv: https://claude.ai/code/artifact/add7d5b6-3ee8-4863-b3d4-f60efbc7e374

## Kapcsoló

A Supabase Edge Function titkok között a `SALTEDGE_MODE` dönt:

| Érték | Mit jelent |
| --- | --- |
| `off` (alap) | A mobilapp elrejti a „Költésből pont” menüt, a webhook mindent figyelmen kívül hagy |
| `mock` | Nincs Salt Edge hívás. A „Bank csatolása” tesztkapcsolatot hoz létre, admin a `saltedge-mock-transaction` functionnel szimulál költést |
| `sandbox` | Valódi Salt Edge Partners API teszt kulcsokkal, Fakebank tesztbankkal |
| `live` | Éles |

A helykód és a „ki hozta a felhasználót” címkézés a kapcsolótól független, a migráció után azonnal működik.

## Titkok (sandbox/live)

- `SALTEDGE_APP_ID`, `SALTEDGE_SECRET` – Salt Edge dashboard
- `SALTEDGE_CALLBACK_URL` – `https://nrxfiblssxwzeziomlvc.supabase.co/functions/v1/saltedge-webhook`
- `SALTEDGE_RETURN_TO` (opcionális, alap: `comegetit://spend-points`)
- `SALTEDGE_CONSENT_DAYS` (opcionális, alap: 180)
- `SALTEDGE_CALLBACK_PUBLIC_KEY` (opcionális, alap: a Partners API dokumentált kulcsa)

A Salt Edge dashboardon négy callback cím: `<SALTEDGE_CALLBACK_URL>/success`, `/fail`, `/notify`, `/destroy`.

## Edge Functionök és `verify_jwt`

| Function | verify_jwt | Hitelesítés |
| --- | --- | --- |
| `saltedge-connect` | true | Gateway JWT + `auth.getUser()`; csak a saját adatát látja |
| `saltedge-mock-transaction` | true | Gateway JWT + `profiles.is_admin`; csak `mock` módban fut |
| `saltedge-webhook` | false | Salt Edge RSA aláírás (`Signature` fejléc), minden hívásnál ellenőrizve |

Mindhárom a `_shared/saltedge.ts` modult használja, deploykor azt is fel kell tölteni.

## Adatbázis

Migráció: `supabase/migrations/20261001200000_spend_points_and_acquisition.sql` (visszaállítási lépések a fájl elején).

- Pont: `award_spend_points` (csak service role). Alap: 100 Ft = 1 pont, minimum 500 Ft, napi 300 pont helyenként, csak a csatolás napjától, függő tétel nem kap pontot, visszatérítés levonódik. Helyenként a `venues.points_rules` (`per_huf`, `min_amount_huf`, `daily_cap_points`) felülírja.
- Párosítás: `venues.merchant_match_rules` `names` (biztos) és `contains` (erős) listája. Csak párosított tranzakciót tárolunk.
- Attribúció: `user_acquisition`, első sikeres beváltáskor töltődik (`venue_code` / `venue_walk_in` ≤ 180 perc / `cgi`).
- Riportok: `get_venue_free_drink_impact(from, to, venue_id?, include_test?)`, `get_venue_acquisition_stats(from, to, venue_id?)`. Admin minden helyet, tulajdonos/staff a sajátját látja; belső fiókok kizárva.

## Helykód asztali táblára

Admin a Venue Hubban adja meg (`venues.referral_code`, 4–12 nagybetű/szám). A táblán a QR a letöltési oldalra mutat, mellette nagy betűkkel a kód, amit a vendég regisztráció után 24 óráig a Profil → Helykód képernyőn beír. Már telepített appnál a `comegetit://venue-code?code=<KÓD>` link automatikusan kitölti. (Egy `come-get-it.app/r/<KÓD>` átirányító oldal a weboldal repóban külön feladat.)
