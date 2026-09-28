# Come Get It — owner release checklist

Last verified: 2026-09-29

The code, live Supabase protections, Rork preview, and Lovable Venue Hub have completed the automated production-readiness pass. Completed owner actions are recorded below so this file can be used as the single release handoff.

## 1. Supabase Auth redirect — completed

The following redirect URL is present in Supabase Authentication → URL Configuration:

```text
https://come-get-it-venue-hub.lovable.app/reset-password
```

The production Venue Hub reset route, protected-route redirect, access-denied flow and logout were verified. The complete email-link round trip remains part of the signed TestFlight physical-device test.

## 2. Partner access and launch content — pilot completed

- A genuine test-partner account and explicit `venue_memberships` scope exist for Come Get It Bar.
- The partner-only Venue Hub view was verified: the test partner sees only the assigned venue.
- A separate, auto-confirmed App Review partner account is configured as non-admin `venue_staff` for exactly one venue. Browser testing confirmed it can access only Dashboard, QR beváltás and Beváltások; the scanner and redemption data expose only Come Get It Bar.
- A limited active pilot reward exists and is visible to the mobile app.
- The Pilot reward now has a live image. Its signed-device test succeeded: the reward count moved to 1/5 and the balance decreased atomically from 650 to 550.
- Repeat the same account, membership and scope verification for every real production partner before onboarding.
- Configure a real charity/default donation rate before using CSR claims. Otherwise keep CSR disabled for the free beta.

## 3. Expo and Apple signing — build 12 in TestFlight

EAS is initialized as `@bencegatai/come-get-it-app`, the production environment is configured, Apple Developer membership is active through 2027-09-29, and App ID `app.comegetit.mobile` exists with Sign in with Apple. The Distribution Certificate, provisioning profile and App Store Connect app record are complete. The current signed production candidate is `1.0.0 (12)`, build ID `9769b4f0-e0f5-4a75-a3e6-0d9d7ffee8e5`, from GitHub main commit `0a3128778fea25bdb4d4fd4ac88fe2d29439e67b`.

EAS submission `60948b56-2fba-4b03-bd1d-8a9d66157f98` uploaded build 12 successfully. It contains the native Apple MapKit list/detail maps and authenticated reward-detail fixes from builds 10–11, plus deterministic back navigation from every reward category and every reward-detail loading/error state. Apple reports `VALID` for App Store Connect build `857ee4f8-1f05-4b08-92c3-0c9669e99762`, and the build is assigned to the internal “Come Get It belső teszt” group. Build 9 remains selected on App Store version `1.0` only as the last release baseline; switch to build 12 after a full physical PASS.

## 4. App Store Connect — metadata and build saved

- The Terms of Service are accepted.
- The iOS app record exists for `app.comegetit.mobile`, primary language Hungarian, SKU `COMEGETIT-IOS-1`, Apple ID `6817022464`.
- The Hungarian subtitle, 131-character promotional text, 897-character description, keywords, live `come-get-it.app` support URL, primary/secondary categories, reviewer contact and login, English review notes, and manual-release mode are saved.
- The live privacy-policy URL and all seven audited App Privacy data types are configured. The owner must make the final **Publish** click because Apple's confirmation includes an accuracy and legal-compliance declaration.
- The free-beta price is set to 0 Ft with Hungary as the base region and all 175 App Store regions enabled. Apple Silicon Mac and Apple Vision Pro distribution are disabled because those platforms are not part of the tested launch scope.
- The App Store version still selects processed build `1.0.0 (9)` while build 12 is being qualified. Do not submit for review until build 12 passes the physical-device checklist, is selected, and screenshots plus owner declarations are complete.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- Enter the correct copyright holder, complete the current age-rating questionnaire, and override to 18+ when necessary so it matches the app's stated audience.
- Upload fresh 6.9-inch screenshots from signed TestFlight build 12 and complete physical-device testing of registration, login, location permission, both map views, venue/reward display, category/detail back navigation, successful QR redemption, rejected repeated redemption, profile edit, password reset, logout, and account deletion.
- Follow the step-by-step evidence checklist in [`TESTFLIGHT_DEVICE_TEST.md`](TESTFLIGHT_DEVICE_TEST.md); record a PASS/FAIL result and keep the named screenshots before App Review submission.

## 5. Infrastructure and legal

- Supabase was upgraded from `supabase-postgres-17.4.1.074` to stable `17.6.1.166`. The project returned to `ACTIVE_HEALTHY`, the vulnerable-version warning disappeared, and post-upgrade authentication, reward catalog, QR consume, status transition and repeated-use rejection checks passed.
- `come-get-it.app` was successfully redeemed and restored on 2026-09-28. GoDaddy nameservers resolve, the apex has an A record, HTTPS returns 200, and `/adatvedelmi-szabalyzat` is public.
- The public website now reflects the free-beta release and exposes working support, privacy and terms pages. App Store Connect uses the live support and privacy URLs.
- Confirm the exact legal-holder/copyright wording and every controller/business detail before the final legal declarations. Keep `gataibence@gmail.com` as the working support address until a branded mailbox has verified inbound delivery.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.

## Release decision

A free beta may be submitted after build 12 passes the signed-device checklist and the final App Store screenshots and legal declarations are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
