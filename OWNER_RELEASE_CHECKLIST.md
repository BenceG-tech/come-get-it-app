# Come Get It — owner release checklist

Last verified: 2026-09-20

The code, live Supabase protections, Rork preview, and Lovable Venue Hub have completed the automated production-readiness pass. The steps below require the owner's Apple, Expo, DNS, or business authority.

## 1. Supabase Auth redirect

In Supabase Dashboard → Authentication → URL Configuration, add this exact redirect URL and save:

```text
https://come-get-it-venue-hub.lovable.app/reset-password
```

Keep the existing Rork HTTPS, Expo, and `comegetit://` entries. After saving, request one password-reset email from the Venue Hub and confirm that the link returns to the URL above and allows a new password to be stored.

## 2. Partner access and launch content

- Create a Supabase Auth account for every venue owner/staff member.
- Add an explicit `venue_memberships` row for each staff user. Direct owners may instead use `venues.owner_profile_id`.
- Verify each partner can see only their assigned venue.
- Create at least one genuine, approved reward for an active venue. New rewards intentionally start inactive; review it in Venue Hub and publish it deliberately.
- Configure a real charity/default donation rate before using CSR claims. Otherwise keep CSR disabled for the free beta.

## 3. Expo and Apple signing

The last automated check returned `Not logged in` from EAS. From the `expo` directory:

```bash
pnpm dlx eas-cli login
pnpm dlx eas-cli init
pnpm dlx eas-cli build --platform ios --profile production
pnpm dlx eas-cli submit --platform ios --profile production
```

Use the intended Expo organization and Apple Developer team. Confirm bundle identifier `app.comegetit.mobile`. Do not change it after the App Store Connect record is created.

## 4. App Store Connect

- Create the iOS app record for `app.comegetit.mobile`.
- Choose the free-beta release path unless StoreKit products, RevenueCat entitlements, paywall, restore-purchases, and subscription terms are completed first.
- Copy metadata and reviewer instructions from `APP_STORE_METADATA_HU.md`, `APP_PRIVACY_QUESTIONNAIRE.md`, and `APP_STORE_REVIEW_NOTES.md`.
- Copy the review password only from the Git-ignored `.private/app-review-credentials.txt` file.
- Upload fresh screenshots from the signed TestFlight build and complete physical-device testing of login, location permission, venue browsing, redemption, rewards, profile edit, password reset, logout, and account deletion.

## 5. Infrastructure and legal

- Schedule the Supabase Postgres security-patch upgrade and re-run the security advisor afterward.
- Restore DNS for `come-get-it.app`; on 2026-09-20 it had no A, AAAA, CNAME, or MX response and did not resolve over HTTPS.
- Publish the legal entity's full name, address, and registration details in the privacy policy on the restored domain.
- Keep `gataibence@gmail.com` as the working support address until the domain's MX records and branded mailbox are verified.
- Before linked-card rewards go live, confirm the Salt Edge callback URL exactly matches the deployed callback function and confirm the current callback signing key.

## Release decision

A free beta may be submitted only after the Supabase redirect, Apple/EAS signing, Postgres patch, App Store Connect setup, signed TestFlight device test, and final screenshots are complete. Do not market paid Plus or CSR benefits until their corresponding commercial configuration and live content are complete.
