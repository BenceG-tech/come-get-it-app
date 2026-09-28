# Come Get It — owner release checklist

Last verified: 2026-09-28

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
- Repeat the same account, membership and scope verification for every real production partner before onboarding.
- Configure a real charity/default donation rate before using CSR claims. Otherwise keep CSR disabled for the free beta.

## 3. Expo and Apple signing — build uploaded and ready in TestFlight

EAS is initialized as `@bencegatai/come-get-it-app`, the production environment is configured, Apple Developer membership is active through 2027-09-29, and App ID `app.comegetit.mobile` exists with Sign in with Apple. The Distribution Certificate, provisioning profile, App Store Connect app record, and signed production build `1.0.0` (`9`) are complete. Build ID: `3a386512-fcfb-431d-832a-f7d4c5a6783a`.

The App Store Connect API key has been created and EAS submission `050bd28b-63da-467d-a156-854c16949669` uploaded build 9 successfully. Apple Developer team `AMLH4RKNR8` and App Store Connect app ID `6817022464` are linked, and the EAS project-level App Store Connect integration is configured. The downloaded IPA has a valid Apple Distribution signature and matching bundle ID, version, build number, entitlement set, production provisioning profile and privacy manifests. Apple completed processing build `1.0.0 (9)`, and EAS workflow `01a0e9d7-cfc7-7493-9f06-b2bcdb88858b` added it to the internal “Come Get It belső teszt” group. The Account Holder's Apple ID is linked to that group as the internal tester, and App Store Connect reports `VALID` and `IN_BETA_TESTING`. The App Store version `1.0` now selects build 9 and remains in `PREPARE_FOR_SUBMISSION` with manual release. Use build 9 for all remaining device evidence. Build 8 is superseded because it predates the final stored-session recovery fix.

## 4. App Store Connect — metadata and build saved

- The Terms of Service are accepted.
- The iOS app record exists for `app.comegetit.mobile`, primary language Hungarian, SKU `COMEGETIT-IOS-1`, Apple ID `6817022464`.
- The Hungarian subtitle, promotional text, description, keywords, support URL, primary/secondary categories, reviewer contact and login, English review notes, and manual-release mode are saved.
- The privacy-policy URLs and all seven audited App Privacy data types are configured. The owner must make the final **Publish** click because Apple's confirmation includes an accuracy and legal-compliance declaration.
- The free-beta price is set to 0 Ft with Hungary as the base region and all 175 App Store regions enabled. Apple Silicon Mac and Apple Vision Pro distribution are disabled because those platforms are not part of the tested launch scope.
- The App Store version now selects processed build `1.0.0 (9)`. Do not submit for review until the physical-device checklist, screenshots and owner declarations are complete.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- The current age-rating questionnaire is complete and verified: alcohol/tobacco/drug references are marked frequent or intense, unsupported content categories are none/false, and the release is overridden to 18+ (17+ on the legacy scale).
- Enter and confirm the correct copyright holder.
- Upload fresh 6.9-inch screenshots from the signed TestFlight build and complete physical-device testing of registration, login, location permission, venue/reward display, successful QR redemption, rejected repeated redemption, profile edit, password reset, logout, and account deletion.
- Follow the step-by-step evidence checklist in [`TESTFLIGHT_DEVICE_TEST.md`](TESTFLIGHT_DEVICE_TEST.md); record a PASS/FAIL result and keep the named screenshots before App Review submission.

## 5. Infrastructure and legal

- Supabase was upgraded from `supabase-postgres-17.4.1.074` to stable `17.6.1.166`. The project returned to `ACTIVE_HEALTHY`, the vulnerable-version warning disappeared, and post-upgrade authentication, reward catalog, QR consume, status transition and repeated-use rejection checks passed.
- `come-get-it.app` was successfully redeemed and restored on 2026-09-28. GoDaddy nameservers resolve, the apex has an A record, HTTPS returns 200, and `/adatvedelmi-szabalyzat` is public.
- The restored privacy page still identifies the controller only as “Come Get It”. Publish the legal entity's full name, address, registration details, processing details for the mobile app, and a current effective date before using it as the App Store privacy URL.
- No MX record was returned on 2026-09-28. Keep `gataibence@gmail.com` as the working support address until a branded mailbox is configured and its inbound delivery is verified; do not rely on `hello@come-get-it.app` yet.
- The public website still advertises 990 Ft/week, 2,990 Ft/month and a CSR water-impact promise. Remove or clearly label those claims as future concepts while the App Store release remains a free beta and CSR is disabled.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.
- Rotate the current App Store Connect API key because its private material appeared in local diagnostic output: create and connect a replacement, verify EAS submission-status access, then revoke the old key. Never revoke the working key before the replacement passes verification.

## Release decision

A free beta may be submitted after the completed Supabase redirect, Apple/EAS signing and Postgres patch, once App Store Connect setup, the signed TestFlight device test and final screenshots are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
