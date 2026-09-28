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
- A limited active pilot reward exists and is visible to the mobile app.
- Repeat the same account, membership and scope verification for every real production partner before onboarding.
- Configure a real charity/default donation rate before using CSR claims. Otherwise keep CSR disabled for the free beta.

## 3. Expo and Apple signing — owner authentication in progress

EAS is initialized as `@bencegatai/come-get-it-app`, the production environment is configured, Apple Developer membership is active through 2027-09-29, and App ID `app.comegetit.mobile` exists with Sign in with Apple. The first Distribution Certificate and provisioning profile still require one interactive Apple ID authentication in the already opened Terminal. After successful authentication, run or allow the existing command to finish:

```bash
pnpm dlx eas-cli build --platform ios --profile production
pnpm dlx eas-cli submit --platform ios --profile production
```

Use Apple Developer team `AMLH4RKNR8`. Confirm bundle identifier `app.comegetit.mobile`. Do not change it after the App Store Connect record is created. The App Store Connect app record must exist before upload; Apple currently requires iOS uploads to be built with Xcode 26 or later, which must be confirmed from the completed EAS build details.

## 4. App Store Connect — waiting for owner agreement

- In the already opened App Store Connect tab, the Account Holder must personally accept the displayed Terms of Service.
- After acceptance, create the iOS app record for `app.comegetit.mobile` with primary language Hungarian and SKU `COMEGETIT-IOS-1`.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- Copy metadata and reviewer instructions from `APP_STORE_METADATA_HU.md`, `APP_PRIVACY_QUESTIONNAIRE.md`, and `APP_STORE_REVIEW_NOTES.md`.
- Copy the review password only from the Git-ignored `.private/app-review-credentials.txt` file.
- Complete the current age-rating questionnaire and override to 18+ when necessary so it matches the app's stated audience.
- Upload fresh 6.9-inch screenshots from the signed TestFlight build and complete physical-device testing of registration, login, location permission, venue/reward display, successful QR redemption, rejected repeated redemption, profile edit, password reset, logout, and account deletion.

## 5. Infrastructure and legal

- Schedule the Supabase Postgres security-patch upgrade and re-run the security advisor afterward. The 2026-09-28 advisor still reports `supabase-postgres-17.4.1.074` with outstanding security patches; its only other security findings are informational no-policy notices on two intentionally server-only RLS tables.
- Restore DNS for `come-get-it.app`; on 2026-09-20 it had no A, AAAA, CNAME, or MX response and did not resolve over HTTPS.
- Publish the legal entity's full name, address, and registration details in the privacy policy on the restored domain.
- Keep `gataibence@gmail.com` as the working support address until the domain's MX records and branded mailbox are verified.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.

## Release decision

A free beta may be submitted only after the Supabase redirect, Apple/EAS signing, Postgres patch, App Store Connect setup, signed TestFlight device test, and final screenshots are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
