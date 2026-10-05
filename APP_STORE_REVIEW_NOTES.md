# Come Get It — App Review Information

Prepared for the 2026-10-05 release candidate. Copy existing review credentials from App Store Connect or the original checkout's Git-ignored `.private/app-review-credentials.txt` and `.private/app-review-partner-credentials.txt`. Never commit passwords. Verify the review user's current points and available rewards before submission; historical test balances must not be presented as current.

## Review notes (English)

Come Get It is a Budapest venue-discovery and loyalty app for adults aged 18 and over. This release is free, with no in-app purchases, subscriptions, third-party advertising, card linking or user-to-user communication. Email/password sign-in is available. Apple and Google sign-in are not enabled in this release.

The supplied review account has a server-side allowlist that bypasses venue distance and offer-time-window checks for remote review. Authentication, account ownership, token expiry and single-use protections remain enforced. Review redemptions are identified as test data and do not create charity-impact records.

Suggested test flow:

1. Sign in using the supplied consumer review account. Browse the Venues map/list and open “Come Get It Bar”, the review fixture.
2. Tap **Kérd ingyen italod** and follow the arrival/show instructions. A QR code is created only after the final user action. It is valid for two minutes. Closing and reopening the same offer restores that token with its original expiry.
3. On a second device/browser, open https://come-get-it-venue-hub.lovable.app and sign in with the restricted partner review account. Open **QR beváltás** (`/pos/redeem`) and scan the consumer QR. The app reports success only after server confirmation. The same token cannot be redeemed twice.
4. If the countdown reaches zero, the QR is hidden while the app confirms whether the partner scanned it just before expiry. An internet connection is required for that final confirmation.
5. Separately, open Rewards and choose an available points reward that the account can afford. Points rewards use an independent claim/receipt flow and do not use the free-drink partner QR scanner. Reopening a claimed reward shows its existing receipt; it must not deduct points again.
6. Open Profile → Favorites and Profile → Account. The latter supports profile editing, password reset, sign-out and account deletion.
7. Optional notifications are configured in Profile. “Közeli ingyen ital” is a local background geofence alert; remote offer notifications have separate opt-in controls. Both are off until the user chooses them.

Location access is optional for browsing. Ordinary consumers must provide a location fix and be within 100 meters for on-site redemption. The optional proximity alert asks for Always location only when enabled, processes its geofences locally and does not send background coordinates to our server. Opt-out/logout clears local monitoring data.

Account deletion is initiated at Profile → Account → **Fiók törlése**, followed by explicit confirmation. An ordinary consumer's identity and associated personal application data are removed in one database transaction; the app clears its local session only after server confirmation. Business owners/storage owners receive a saved pending request because linked business resources require handling first. Failed or pending requests are never displayed as completed deletion.

First-party activity measurement records signed-in app opens, relevant page views and redemption events to improve the service. Analytics does not contain precise coordinates or QR secrets. The app does not track users across other companies' apps or websites.

The public pilot is being prepared. The named review venue is a test fixture; review activity must not be described as real customer traction or live partner availability.

## Submission operations

- Preserve the verified Apple review contact and both existing review credentials.
- Verify consumer review allowlist, partner membership limited to the review venue, current catalog and point balance before submission.
- Never delete production redemption history to replay review tests. Choose an unused reward or provision an explicitly identified review fixture if needed.
- Confirm the selected Apple build is the new validated candidate, not the previously rejected Build 22.
- Inspect and address the actual Resolution Center rejection before resubmitting.
- Match App Privacy answers to `APP_PRIVACY_QUESTIONNAIRE.md` and the live policy.
- Keep the App Store release mode manual; TestFlight availability is not App Review approval or public release.

Reference: [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app).
