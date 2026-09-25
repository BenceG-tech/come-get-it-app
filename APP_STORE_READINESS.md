# Come Get It — App Store readiness

Last verified: 2026-09-25

## Ready in the repository

- Expo SDK 54 project passes `expo-doctor` (18/18), TypeScript validation, public config generation, and web production export.
- iOS metadata is set for `app.comegetit.mobile`, build `1`, foreground-only location access, Sign in with Apple, and non-exempt encryption disabled.
- The Expo project is linked to EAS as `@bencegatai/come-get-it-app`. Production Supabase URL/key variables are configured, while unfinished social-login and demo-mode feature flags are explicitly disabled.
- The 1024×1024 App Store icon is opaque (no alpha channel).
- Android uses the same application ID and explicitly blocks background location, foreground location service, and microphone access.
- Authentication recovers from invalid stored refresh tokens, preserves existing profile points, handles confirmed-email registration, password reset, Google OAuth, and Sign in with Apple.
- Users can edit their real profile, sign out, and delete their account in-app. Account deletion is implemented as an authenticated Supabase Edge Function.
- Redemption confirmation is authenticated, consumes a token atomically, writes the database-supported `success` status, and restores the token when the redemption insert fails.
- Production redemption no longer falls back to demo success. Demo behavior is restricted to development builds with an explicit environment flag.
- The consumer app no longer exposes the legacy admin editor or unfinished mock payment, card, referral, coupon, address, visit-history, mission, and token screens.
- The app shows only real backend rewards and profile data. CSR impact is shown only when a real donation was created.
- Customer reward reads expose only active, unexpired, in-stock rewards from active venues (or explicitly global rewards). The write path enforces the same rule, so a paused venue's hidden reward cannot be redeemed by guessing its UUID.
- Venue cards use separate accessible controls for card navigation and favorite toggling, avoiding nested interactive elements in the web preview while preserving native behavior.
- Public venue reads are limited to active venues. Sensitive helper functions reject cross-user lookups.
- Legal links point to the repository's public privacy policy and Apple's standard EULA.
- Legacy prototype routes (`landing`, template modal, and the fake Cock & Pye venue/card-linking screen) have been removed, so stale deep links cannot expose unfinished product claims.
- App Store metadata, privacy answers, review notes, support content, and a screenshot acceptance audit are prepared in the repository.
- The separate Lovable Venue Hub admin surface now uses live Supabase sessions only: forged browser storage and mock/demo providers no longer grant access, password reset is implemented, Google sign-in is hidden while unconfigured, and protected routes wait for authoritative session hydration.
- Venue Hub dashboards no longer show fabricated percentage changes or describe redeemed-drink value as transaction revenue. Reward management shows the exact mobile-app visibility state and prevents publishing against a paused venue.
- Venue Hub is published at `https://come-get-it-venue-hub.lovable.app`. Its production login, password-recovery screen, reset route, protected-route redirect, access-denied flow, and logout were exercised in the browser; an authenticated non-partner is correctly sent to `/no-access`.

## Verified live backend state

- Supabase project: `nrxfiblssxwzeziomlvc` (EU North).
- 5 active venues out of 11 total; all 11 have coordinates.
- 5 active venues out of 11 total, 18 venue drinks, 19 free-drink windows, 2 active reward rows, 1 customer-visible reward, 28 redemption records, and 1 explicitly scoped partner membership.
- `create-redemption-window` version 9, `confirm-redemption` version 9, `delete-account` version 2, and `redeem-reward` version 40 are deployed. The active redemption and account-deletion functions use gateway JWT verification; `redeem-reward` validates the user token inside the function.
- Anonymous callers cannot use the protected redemption or account-deletion functions.
- The production redemption flow was exercised end to end with an authenticated App Review account: token creation and confirmation both succeeded against live venue/drink data.
- Rork automatically synchronized the release-hardening commits from GitHub. Its current web preview was retested with the App Review account through sign-in, live venue loading, favorite add/remove, venue details, the review redemption handoff, rewards, profile, and the account-management screen.
- Normal accounts must pass the server-side 100 m venue and active-offer-window checks. The dedicated App Review account is service-role allowlisted to bypass only those two environmental checks; authentication, token expiry, and single-use consumption remain enforced.
- A database unique index and server check enforce at most one successful free-drink redemption per normal user per Budapest calendar day. A controlled duplicate-insert test was rejected and its test rows were removed.
- Review transactions are marked separately and never create CSR donation records.
- Points-reward redemption now uses an authenticated Edge Function and one atomic database transaction, preventing negative balances, partial point deductions, and reward-cap races.
- Privileged authorization lookups now live in a non-exposed `private` schema. Their public wrappers run as `SECURITY INVOKER`; anonymous execution and cross-user lookups are rejected.
- All 21 previously uncovered foreign keys now have supporting indexes, all 41 per-row `auth.uid()` RLS advisor warnings are resolved, and identity-dependent policies no longer target every Postgres role. Remaining multiple-policy notices are performance-only overlaps between intentionally distinct public, owner, and administrator paths.
- Supabase Auth uses the production Rork URL as the Site URL and allowlists the HTTPS preview URL, Expo URL, and `comegetit://` deep links.
- Email confirmation links/OTPs expire after 3,600 seconds. Leaked-password protection, secure password change, and an eight-character minimum are enabled.
- The production test-data endpoint and the obsolete `issue-redemption-token` endpoint are now permanently disabled with HTTP 410 responses and gateway JWT verification. The active mobile flow uses only `create-redemption-window` and the authenticated partner scanner uses `consume-redemption-token`.
- The mobile redemption window now renders the real 120-second QR token locally on-device. Venue Hub's authenticated camera scanner consumed that token successfully; a repeated scan returned `ALREADY_CONSUMED`, and the same partner account was rejected with `VENUE_UNAUTHORIZED` for another venue's token.
- Geocoding, AI recommendation, user-directory, and dashboard-stat endpoints now require JWTs; dashboard statistics additionally derive the effective role server-side and enforce administrator or venue membership/ownership access. `get-dashboard-stats` version 37 rejects client-forged administrator scope and has gateway JWT verification enabled.
- Live platform status and anomaly reports now require an authenticated administrator. `get-live-platform-status` version 32 uses the production redemption schema (`redeemed_at`, `drink`), performs its own administrator check, and has gateway JWT verification enabled. Venue revenue/free-drink analytics require administrator or venue-membership access.
- Direct `venues.owner_profile_id` ownership is included alongside `venue_memberships` in the shared venue-authorization helper, keeping mobile/backend RLS and Venue Hub session scope consistent.
- Scheduled notification processing requires the internal service key. Loyalty milestone detection and transaction matching accept only a valid internal key or a scoped authenticated caller.
- Salt Edge transaction callbacks now reject unsigned or invalidly signed payloads before parsing or awarding points. The verifier uses Salt Edge's documented Account Information v5 callback key and supports `SALTEDGE_CALLBACK_PUBLIC_KEY` and `SALTEDGE_CALLBACK_URL` overrides for key rotation or an explicitly configured callback URL.
- Public venue RPC returns only the 5 active venues and caps requested result size.

## External release blockers

These require owner credentials or commercial decisions and cannot be completed from source code alone:

1. **Apple paid membership and signing:** Expo/EAS is initialized as `@bencegatai/come-get-it-app`, the bundle identifier is `app.comegetit.mobile`, and the required production Supabase variables are configured in EAS. Activate the Apple Developer Program membership, then create the production signing credentials, build, and submit to App Store Connect.
2. **Optional social sign-in credentials:** Google and Apple providers are still disabled because the required provider credentials have not been supplied. Their buttons are hidden by default; email/password registration, confirmation, reset, and sign-in are the release-safe path. Only set `EXPO_PUBLIC_ENABLE_GOOGLE_AUTH=true` or `EXPO_PUBLIC_ENABLE_APPLE_AUTH=true` after the corresponding Supabase provider and native credentials are complete.
3. **Database maintenance:** schedule the Supabase Postgres security-patch upgrade. The current production version reports outstanding security patches.
4. **Monetization decision:** the source material describes Plus at 990 Ft/week or 2,990 Ft/month, but the app has no App Store subscription products or RevenueCat configuration. Either launch this build as a free beta or create StoreKit products, RevenueCat entitlements, a paywall, restore-purchases flow, and subscription terms before charging users.
5. **CSR content:** all five active venues currently have CSR disabled and no default charity. Configure real charity records and venue donation settings before promoting impact claims. A limited active test reward now exists at Come Get It Bar and is visible to the mobile app.
6. **App Store Connect and final media:** create the app record, enter the prepared metadata/privacy answers/review notes, and upload fresh screenshots from the signed release/TestFlight build. A stable auto-confirmed review account and server-side review path now exist; its password is stored only in the local Git-ignored `.private` directory.
7. **Public website and legal identity:** `come-get-it.app` currently has no A, AAAA, or MX record, while the published Lovable URL redirects to that broken domain. The app therefore uses the public GitHub privacy policy and the verified connected Gmail address as reliable interim privacy/support contacts. Restore the domain, add the legal entity's full name/address/registration details to the policy, publish the updated policy there, then switch the app URL and support mailbox back before final submission if possible.
8. **Salt Edge operations:** before enabling linked-card rewards, confirm that Salt Edge's configured callback URL exactly matches the deployed function URL. If Salt Edge rotates its callback signing key, set the current PEM as `SALTEDGE_CALLBACK_PUBLIC_KEY` before processing production callbacks.
9. **Venue onboarding:** one real test partner is assigned only to Come Get It Bar and the scoped Venue Hub view is verified. Repeat the same explicit membership-and-scope test for every production partner before onboarding them.
10. **Venue Hub password reset:** the final Lovable `/reset-password` URL is allowlisted in Supabase. Repeat the email-link flow on a physical device during the signed TestFlight pass.

## Release gate

Do not submit a paid or CSR-marketed version until items 4 and 5 above are complete. A free beta can proceed after the Apple membership/signing work in item 1, the maintenance in item 3, and the App Store Connect work in item 6 are completed and the signed TestFlight build passes device testing. Item 2 is optional because unconfigured social sign-in is not exposed.
