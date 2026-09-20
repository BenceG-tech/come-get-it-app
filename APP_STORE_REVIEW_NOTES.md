# Come Get It — App Review Information

Paste the following into App Store Connect. Copy the login credentials from the local, Git-ignored file `.private/app-review-credentials.txt`; never commit the password.

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
2. On the Venues tab, browse the map/list and open “Come Get It Restaurant”.
3. Select the available drink “Midnight Tonic”.
4. Tap “Kérd ingyen italod”, continue through the arrival/show steps, then tap “BEVÁLTOM”.
5. Open the Rewards tab to view the live rewards availability state. This screen is backed by the production catalog and may show an empty state when participating venues have no currently active reward inventory.
6. Open Profile → Favorites to view saved venues.
7. Open Profile → Account to edit profile data, request a password reset, sign out, or initiate permanent account deletion.

Location access is optional for browsing. Normal accounts must grant When In Use location access and be within 100 meters of a participating venue to redeem. The app does not request background location.

Account deletion is available in-app at Profile → Account → Delete Account (“Fiók törlése”). The user receives a destructive confirmation prompt before the account and associated personal data are deleted.

The service is currently limited to Budapest, Hungary. Offer availability and opening hours are supplied by participating venues and can change.

## Reviewer-account operations

- Supabase user: `apple-review@comegetit.test`
- Allowlist table: `public.app_review_testers`
- To disable after review: set `enabled = false` for the review user, or delete the auth user.
- Rotate the password before every new review cycle.

Apple requires apps with account creation to let users initiate full account deletion in the app; this build implements that requirement. Reference: [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app).
