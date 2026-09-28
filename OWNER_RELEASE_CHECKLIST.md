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

EAS is initialized as `@bencegatai/come-get-it-app`, the production environment is configured, Apple Developer membership is active through 2027-09-29, and App ID `app.comegetit.mobile` exists with Sign in with Apple. The Distribution Certificate, provisioning profile, App Store Connect app record, and signed production build `1.0.0` (`8`) are complete. Build ID: `3a27b206-e9a2-4d37-9684-60355302c4fe`.

The App Store Connect API key has been created and EAS submission `6834af76-a861-41de-910f-edf33fb3acf3` completed successfully. Apple Developer team `AMLH4RKNR8` and App Store Connect app ID `6817022464` are linked. The downloaded IPA has a valid Apple Distribution signature and matching bundle ID, version, build number, entitlement set and provisioning profile. Build `1.0.0 (8)` is Ready to Test, attached to the internal “Come Get It belső teszt” group, and the Account Holder is invited.

## 4. App Store Connect — metadata and build saved

- The Terms of Service are accepted.
- The iOS app record exists for `app.comegetit.mobile`, primary language Hungarian, SKU `COMEGETIT-IOS-1`, Apple ID `6817022464`.
- The Hungarian subtitle, promotional text, description, keywords, support URL, primary/secondary categories, reviewer contact and login, English review notes, and manual-release mode are saved.
- The privacy-policy URLs and all seven audited App Privacy data types are configured. The owner must make the final **Publish** click because Apple's confirmation includes an accuracy and legal-compliance declaration.
- The free-beta price is set to 0 Ft with Hungary as the base region and all 175 App Store regions enabled. Apple Silicon Mac and Apple Vision Pro distribution are disabled because those platforms are not part of the tested launch scope.
- Build `1.0.0 (8)` is selected for the App Store version. Do not submit it for review until the physical-device checklist, screenshots and owner declarations are complete.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- Enter the correct copyright holder, complete the current age-rating questionnaire, and override to 18+ when necessary so it matches the app's stated audience.
- Upload fresh 6.9-inch screenshots from the signed TestFlight build and complete physical-device testing of registration, login, location permission, venue/reward display, successful QR redemption, rejected repeated redemption, profile edit, password reset, logout, and account deletion.
- Follow the step-by-step evidence checklist in [`TESTFLIGHT_DEVICE_TEST.md`](TESTFLIGHT_DEVICE_TEST.md); record a PASS/FAIL result and keep the named screenshots before App Review submission.

## 5. Infrastructure and legal

- Supabase was upgraded from `supabase-postgres-17.4.1.074` to stable `17.6.1.166`. The project returned to `ACTIVE_HEALTHY`, the vulnerable-version warning disappeared, and post-upgrade authentication, reward catalog, QR consume, status transition and repeated-use rejection checks passed.
- Restore DNS for `come-get-it.app`; on 2026-09-20 it had no A, AAAA, CNAME, or MX response and did not resolve over HTTPS.
- Publish the legal entity's full name, address, and registration details in the privacy policy on the restored domain.
- Keep `gataibence@gmail.com` as the working support address until the domain's MX records and branded mailbox are verified.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.

## Release decision

A free beta may be submitted after the completed Supabase redirect, Apple/EAS signing and Postgres patch, once App Store Connect setup, the signed TestFlight device test and final screenshots are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
