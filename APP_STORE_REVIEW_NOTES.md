# Come Get It — App Review Information

Paste the following into App Store Connect. Copy the consumer-app login credentials from the local, Git-ignored file `.private/app-review-credentials.txt` and the Venue Hub credentials from `.private/app-review-partner-credentials.txt`; never commit either password.

## Contact information

- First name: Bence
- Last name: Gátai
- Email: enter the verified App Store Connect review contact; do not commit it here.
- Phone: enter the verified App Store Connect review contact; do not commit it here.

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
3. To test the venue free-drink QR flow, tap **Kérd ingyen italod** on the Come Get It Bar venue page, continue through the arrival/show steps and display the QR code.
4. On a second device or browser, open `https://come-get-it-venue-hub.lovable.app` and sign in with the restricted Venue Hub account supplied below. Open **QR beváltás** (direct path: `/pos/redeem`), start the scanner and scan the customer's QR code. The customer app changes to the successful state only after this partner action.
5. Scan the same QR code again. The repeated QR redemption is rejected because venue tokens are single use.
6. Separately, open the **Rewards** tab. The review account starts with 500 test points. Verify that Drinks, Food, Experiences and All contain live catalog items.
7. To test points redemption, open **Blue Hour koktél** (300 points) and tap **Jutalom beváltása**. This points reward is independent of the venue free-drink QR flow and does not use the partner scanner.
8. Attempt to redeem **Blue Hour koktél** again with the same account. The second attempt is rejected with the Hungarian message meaning “You have already redeemed this reward”; no additional points are deducted.
9. Open Profile → Favorites to view saved venues.
10. Open Profile → Account to edit profile data, request a password reset, sign out, or initiate permanent account deletion.

Restricted Venue Hub review access:

- URL: `https://come-get-it-venue-hub.lovable.app`
- Username: copy from `.private/app-review-partner-credentials.txt`
- Password: copy from `.private/app-review-partner-credentials.txt`
- Scope: non-admin `venue_staff`, assigned only to “Come Get It Bar”; navigation is limited to Dashboard, QR beváltás and Beváltások

Location access is optional for browsing. Normal accounts must grant When In Use location access and be within 100 meters of a participating venue to redeem. The app does not request background location.

Account deletion is available in-app at Profile → Account → Delete Account (“Fiók törlése”). The user receives a destructive confirmation prompt before the account and associated personal data are deleted.

The service is currently limited to Budapest, Hungary. Offer availability and opening hours are supplied by participating venues and can change.

## Reviewer-account operations

- Supabase consumer user: copy the account identifier from `.private/app-review-credentials.txt`.
- Supabase partner user: copy the account identifier from `.private/app-review-partner-credentials.txt`.
- Partner scope: exactly one `venue_memberships` row for “Come Get It Bar”, role `venue_staff`, `is_admin = false`
- Allowlist table: `public.app_review_testers`
- Points fixture: 500 synchronized points; use **Blue Hour koktél** for the optional points-redemption review path.
- Before every new review cycle, confirm that the review user has not already claimed the chosen reward. If it has, use a fresh review user or a different active reward; do not delete production redemption history merely to replay a test.
- To disable after review: set `enabled = false` for the consumer review user and remove or disable both review auth users.
- Rotate both passwords before every new review cycle.

Apple requires apps with account creation to let users initiate full account deletion in the app; this build implements that requirement. Reference: [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app).
