# Come Get It — App Review Information

Paste the following into App Store Connect. Copy the consumer-app login credentials from the local, Git-ignored file `.private/app-review-credentials.txt` and the Venue Hub credentials from `.private/app-review-partner-credentials.txt`; never commit either password.

## Contact information

- First name: Bence
- Last name: Gátai
- Email: gataibence@gmail.com
- Phone: +36 70 585 2053

## Sign-in required

- Sign-in required: Yes
- Username: copy from `.private/app-review-credentials.txt`
- Password: copy from `.private/app-review-credentials.txt`

## Review notes (English)

Come Get It is a Budapest venue-discovery and loyalty app for users aged 18 and over. The submitted 1.0 version is free and contains no in-app purchases, subscriptions, advertising, card linking, push notifications, or user-to-user communication.

The supplied App Review account is auto-confirmed and has a server-side review allowlist. This allowlist only bypasses the Budapest venue-distance and offer-time-window checks so App Review can exercise the complete redemption flow from any location and at any time. It does not bypass authentication, single-use redemption tokens, token expiry, or account authorization. Review transactions are marked as App Review data and do not create charity-impact records.

Suggested test flow:

1. Sign in with the supplied email and password.
2. On the Venues tab, browse the map/list and open “Come Get It Bar”.
3. Select the active, limited test reward “Pilot ajándék ital”.
4. Tap “Kérd ingyen italod”, continue through the arrival/show steps, then tap “BEVÁLTOM”.
5. On a second device or browser, open `https://come-get-it-venue-hub.lovable.app` and sign in with the restricted Venue Hub account supplied below. Open Beváltások and scan the customer's QR code. The customer app changes to the successful state only after this partner action.
6. Scan the same QR code again. The repeated redemption is rejected because tokens are single use.
7. Open the Rewards tab to view the live rewards availability state. This screen is backed by the production catalog and may show an empty state when participating venues have no currently active reward inventory.
8. Open Profile → Favorites to view saved venues.
9. Open Profile → Account to edit profile data, request a password reset, sign out, or initiate permanent account deletion.

Restricted Venue Hub review access:

- URL: `https://come-get-it-venue-hub.lovable.app`
- Username: copy from `.private/app-review-partner-credentials.txt`
- Password: copy from `.private/app-review-partner-credentials.txt`
- Scope: non-admin `venue_staff`, assigned only to “Come Get It Bar”

Location access is optional for browsing. Normal accounts must grant When In Use location access and be within 100 meters of a participating venue to redeem. The app does not request background location.

Account deletion is available in-app at Profile → Account → Delete Account (“Fiók törlése”). The user receives a destructive confirmation prompt before the account and associated personal data are deleted.

The service is currently limited to Budapest, Hungary. Offer availability and opening hours are supplied by participating venues and can change.

## Reviewer-account operations

- Supabase user: `apple-review@comegetit.test`
- Supabase partner user: `apple-review-partner@comegetit.test`
- Partner scope: exactly one `venue_memberships` row for “Come Get It Bar”, role `venue_staff`, `is_admin = false`
- Allowlist table: `public.app_review_testers`
- To disable after review: set `enabled = false` for the consumer review user and remove or disable both review auth users.
- Rotate both passwords before every new review cycle.

Apple requires apps with account creation to let users initiate full account deletion in the app; this build implements that requirement. Reference: [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app).
