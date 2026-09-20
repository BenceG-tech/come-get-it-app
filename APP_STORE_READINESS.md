# Come Get It — App Store readiness

Last verified: 2026-09-20

## Ready in the repository

- Expo SDK 54 project passes `expo-doctor` (18/18), TypeScript validation, public config generation, and web production export.
- iOS metadata is set for `app.comegetit.mobile`, build `1`, foreground-only location access, Sign in with Apple, and non-exempt encryption disabled.
- The 1024×1024 App Store icon is opaque (no alpha channel).
- Android uses the same application ID and explicitly blocks background location, foreground location service, and microphone access.
- Authentication recovers from invalid stored refresh tokens, preserves existing profile points, handles confirmed-email registration, password reset, Google OAuth, and Sign in with Apple.
- Users can edit their real profile, sign out, and delete their account in-app. Account deletion is implemented as an authenticated Supabase Edge Function.
- Redemption confirmation is authenticated, consumes a token atomically, writes the database-supported `success` status, and restores the token when the redemption insert fails.
- Production redemption no longer falls back to demo success. Demo behavior is restricted to development builds with an explicit environment flag.
- The consumer app no longer exposes the legacy admin editor or unfinished mock payment, card, referral, coupon, address, visit-history, mission, and token screens.
- The app shows only real backend rewards and profile data. CSR impact is shown only when a real donation was created.
- Public venue reads are limited to active venues. Sensitive helper functions reject cross-user lookups.
- Legal links point to the repository's public privacy policy and Apple's standard EULA.

## Verified live backend state

- Supabase project: `nrxfiblssxwzeziomlvc` (EU North).
- 5 active venues out of 11 total; all 11 have coordinates.
- 18 venue drinks, 19 free-drink windows, 1 active reward, and 25 redemption records.
- `create-redemption-window` version 4, `confirm-redemption` version 5, and `delete-account` version 2 are deployed with JWT verification enabled.
- Anonymous callers cannot use the protected redemption or account-deletion functions.
- The production test-data endpoint is disabled. Legacy token issuance now requires a valid user JWT and ignores a caller-supplied user ID outside authenticated admin test mode.
- Geocoding, AI recommendation, user-directory, and dashboard-stat endpoints now require JWTs; dashboard statistics additionally enforce administrator or venue membership/ownership access.
- Public venue RPC returns only the 5 active venues and caps requested result size.

## External release blockers

These require owner credentials or commercial decisions and cannot be completed from source code alone:

1. **Expo/EAS and Apple signing:** log in to the intended Expo account, register/confirm the bundle identifier `app.comegetit.mobile`, create iOS signing credentials, initialize the EAS project, then run the production build and submit it to App Store Connect. The local environment is not logged in to EAS.
2. **Supabase Auth console:** add production redirect URLs for `comegetit://`, `comegetit://reset-password`, and the exact Rork/Expo preview URL; finish Google and Apple provider credentials; reduce email OTP expiry to 60 minutes or less; enable leaked-password protection.
3. **Database maintenance:** schedule the Supabase Postgres security-patch upgrade. The current production version reports outstanding security patches.
4. **Monetization decision:** the source material describes Plus at 990 Ft/week or 2,990 Ft/month, but the app has no App Store subscription products or RevenueCat configuration. Either launch this build as a free beta or create StoreKit products, RevenueCat entitlements, a paywall, restore-purchases flow, and subscription terms before charging users.
5. **CSR activation:** all five active venues currently have CSR disabled and no default charity. Configure real charity records and venue donation settings before promoting impact claims.
6. **App Store Connect:** provide final screenshots, subtitle/description/keywords, privacy questionnaire, support and privacy URLs, age rating, review notes, and a stable review account with sample data. Email sign-up testing is temporarily rate-limited in Supabase, so a new review account was not created during this audit.
7. **Public website and legal identity:** `come-get-it.app` currently has no working DNS record, while the published Lovable URL redirects to that broken domain. The app therefore uses the public GitHub privacy policy as a reliable interim URL. Restore the domain, add the legal entity's full name/address/registration details to the policy, publish the updated policy there, then switch the app URL back before final submission if possible.

## Release gate

Do not submit a paid or CSR-marketed version until items 2, 4, and 5 above are complete. A free beta can proceed after items 1, 2, 3, and 6 are completed and the signed TestFlight build passes device testing.
