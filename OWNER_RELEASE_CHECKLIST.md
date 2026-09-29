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

## 3. Expo and Apple signing — build 13 in TestFlight

EAS is initialized as `@bencegatai/come-get-it-app`, the production environment is configured, Apple Developer membership is active through 2027-09-29, and App ID `app.comegetit.mobile` exists with Sign in with Apple. The Distribution Certificate, provisioning profile and App Store Connect app record are complete. The current signed production candidate is `1.0.0 (13)`, build ID `7629d072-a18a-4e5e-ba2e-c72fc8667b4d`, from GitHub main commit `90d6202b7bee71ccdbfa9cde1349aaa9099bf1c7`.

EAS submission `e0705b3a-2b9f-4a11-a451-5818e09515bd` uploaded build 13 successfully. It contains all build-12 map, reward and deterministic-navigation fixes, plus complete first-party declarations in the iOS privacy manifest. Apple reports `VALID` for App Store Connect build `5eefbd16-dab8-47e0-bab9-b3ba4edd89be`, and the build is assigned to the internal “Come Get It belső teszt” group. Build 9 remains selected on App Store version `1.0` only as the last release baseline; switch to build 13 after a full physical PASS. See [`BUILD_13_BINARY_AUDIT.md`](BUILD_13_BINARY_AUDIT.md).

## 4. App Store Connect — metadata and build saved

- The Terms of Service are accepted.
- The iOS app record exists for `app.comegetit.mobile`, primary language Hungarian, SKU `COMEGETIT-IOS-1`, Apple ID `6817022464`.
- The Hungarian subtitle, 131-character promotional text, 897-character description, keywords, live `come-get-it.app` support URL, primary/secondary categories, reviewer contact and login, English review notes, and manual-release mode are saved.
- The live privacy-policy URL and all seven audited App Privacy data types are configured. The owner must make the final **Publish** click because Apple's confirmation includes an accuracy and legal-compliance declaration.
- The free-beta price is set to 0 Ft with Hungary as the base region and all 175 App Store regions enabled. Apple Silicon Mac and Apple Vision Pro distribution are disabled because those platforms are not part of the tested launch scope.
- The App Store version still selects processed build `1.0.0 (9)` while build 13 is being qualified. Do not submit for review until build 13 passes the physical-device checklist, is selected, and screenshots plus owner declarations are complete.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- Enter the correct copyright holder, complete the current age-rating questionnaire, and override to 18+ when necessary so it matches the app's stated audience.
- Upload fresh 6.9-inch screenshots from signed TestFlight build 13 by following [`APP_STORE_MEDIA_CAPTURE_HU.md`](APP_STORE_MEDIA_CAPTURE_HU.md), and complete physical-device testing of registration, login, location permission, both map views, venue/reward display, category/detail back navigation, successful QR redemption, rejected repeated redemption, profile edit, password reset, logout, and account deletion.
- Follow the step-by-step evidence checklist in [`TESTFLIGHT_DEVICE_TEST.md`](TESTFLIGHT_DEVICE_TEST.md); record a PASS/FAIL result and keep the named screenshots before App Review submission.

## 5. Infrastructure and legal

- Supabase was upgraded from `supabase-postgres-17.4.1.074` to stable `17.6.1.166`. The project returned to `ACTIVE_HEALTHY`, the vulnerable-version warning disappeared, and post-upgrade authentication, reward catalog, QR consume, status transition and repeated-use rejection checks passed.
- `come-get-it.app` was successfully redeemed and restored on 2026-09-28. GoDaddy nameservers resolve, the apex has an A record, HTTPS returns 200, and `/adatvedelmi-szabalyzat` is public.
- The public website now reflects the free-beta release and exposes working support, privacy and terms pages. App Store Connect uses the live support and privacy URLs.
- Confirm the exact legal-holder/copyright wording and every controller/business detail before the final legal declarations. Keep `gataibence@gmail.com` as the working support address until a branded mailbox has verified inbound delivery.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.

## Release decision

A free beta may be submitted after build 13 passes the signed-device checklist and the final App Store screenshots and legal declarations are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
