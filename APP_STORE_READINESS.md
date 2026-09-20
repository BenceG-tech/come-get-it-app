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
- Venue cards use separate accessible controls for card navigation and favorite toggling, avoiding nested interactive elements in the web preview while preserving native behavior.
- Public venue reads are limited to active venues. Sensitive helper functions reject cross-user lookups.
- Legal links point to the repository's public privacy policy and Apple's standard EULA.
- Legacy prototype routes (`landing`, template modal, and the fake Cock & Pye venue/card-linking screen) have been removed, so stale deep links cannot expose unfinished product claims.
- App Store metadata, privacy answers, review notes, support content, and a screenshot acceptance audit are prepared in the repository.

## Verified live backend state

- Supabase project: `nrxfiblssxwzeziomlvc` (EU North).
- 5 active venues out of 11 total; all 11 have coordinates.
- 18 venue drinks, 19 free-drink windows, 1 active reward, and 25 redemption records.
- `create-redemption-window` version 6, `confirm-redemption` version 6, `delete-account` version 2, and `redeem-reward` version 36 are deployed with JWT verification enabled.
- Anonymous callers cannot use the protected redemption or account-deletion functions.
- The production redemption flow was exercised end to end with an authenticated App Review account: token creation and confirmation both succeeded against live venue/drink data.
- Rork automatically synchronized the release-hardening commits from GitHub. Its current web preview was retested with the App Review account through sign-in, live venue loading, favorite add/remove, venue details, the review redemption handoff, rewards, profile, and the account-management screen.
- Normal accounts must pass the server-side 100 m venue and active-offer-window checks. The dedicated App Review account is service-role allowlisted to bypass only those two environmental checks; authentication, token expiry, and single-use consumption remain enforced.
- A database unique index and server check enforce at most one successful free-drink redemption per normal user per Budapest calendar day. A controlled duplicate-insert test was rejected and its test rows were removed.
- Review transactions are marked separately and never create CSR donation records.
- Points-reward redemption now uses an authenticated Edge Function and one atomic database transaction, preventing negative balances, partial point deductions, and reward-cap races.
- Supabase Auth uses the production Rork URL as the Site URL and allowlists the HTTPS preview URL, Expo URL, and `comegetit://` deep links.
- Email confirmation links/OTPs expire after 3,600 seconds. Leaked-password protection, secure password change, and an eight-character minimum are enabled.
- The production test-data endpoint is disabled. Legacy token issuance now requires a valid user JWT and ignores a caller-supplied user ID outside authenticated admin test mode.
- Geocoding, AI recommendation, user-directory, and dashboard-stat endpoints now require JWTs; dashboard statistics additionally enforce administrator or venue membership/ownership access.
- Live platform status and anomaly reports now require an authenticated administrator. Venue revenue/free-drink analytics require administrator or venue-membership access.
- Scheduled notification processing requires the internal service key. Loyalty milestone detection and transaction matching accept only a valid internal key or a scoped authenticated caller.
- Salt Edge transaction callbacks now reject unsigned or invalidly signed payloads before parsing or awarding points. The verifier uses Salt Edge's documented Account Information v5 callback key and supports `SALTEDGE_CALLBACK_PUBLIC_KEY` and `SALTEDGE_CALLBACK_URL` overrides for key rotation or an explicitly configured callback URL.
- Public venue RPC returns only the 5 active venues and caps requested result size.

## External release blockers

These require owner credentials or commercial decisions and cannot be completed from source code alone:

1. **Expo/EAS and Apple signing:** log in to the intended Expo account, register/confirm the bundle identifier `app.comegetit.mobile`, create iOS signing credentials, initialize the EAS project, then run the production build and submit it to App Store Connect. The local environment is not logged in to EAS.
2. **Optional social sign-in credentials:** Google and Apple providers are still disabled because the required provider credentials have not been supplied. Their buttons are hidden by default; email/password registration, confirmation, reset, and sign-in are the release-safe path. Only set `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH=true` or `EXPO_PUBLIC_ENABLE_APPLE_AUTH=true` after the corresponding Supabase provider and native credentials are complete.
3. **Database maintenance:** schedule the Supabase Postgres security-patch upgrade. The current production version reports outstanding security patches.
4. **Monetization decision:** the source material describes Plus at 990 Ft/week or 2,990 Ft/month, but the app has no App Store subscription products or RevenueCat configuration. Either launch this build as a free beta or create StoreKit products, RevenueCat entitlements, a paywall, restore-purchases flow, and subscription terms before charging users.
5. **CSR activation:** all five active venues currently have CSR disabled and no default charity. Configure real charity records and venue donation settings before promoting impact claims.
6. **App Store Connect and final media:** create the app record, enter the prepared metadata/privacy answers/review notes, and upload fresh screenshots from the signed release/TestFlight build. A stable auto-confirmed review account and server-side review path now exist; its password is stored only in the local Git-ignored `.private` directory.
7. **Public website and legal identity:** `come-get-it.app` currently has no A, AAAA, or MX record, while the published Lovable URL redirects to that broken domain. The app therefore uses the public GitHub privacy policy and the verified connected Gmail address as reliable interim privacy/support contacts. Restore the domain, add the legal entity's full name/address/registration details to the policy, publish the updated policy there, then switch the app URL and support mailbox back before final submission if possible.
8. **Salt Edge operations:** before enabling linked-card rewards, confirm that Salt Edge's configured callback URL exactly matches the deployed function URL. If Salt Edge rotates its callback signing key, set the current PEM as `SALTEDGE_CALLBACK_PUBLIC_KEY` before processing production callbacks.

## Release gate

Do not submit a paid or CSR-marketed version until items 4 and 5 above are complete. A free beta can proceed after item 1, the maintenance in item 3, and the App Store Connect work in item 6 are completed and the signed TestFlight build passes device testing. Item 2 is optional because unconfigured social sign-in is not exposed.
