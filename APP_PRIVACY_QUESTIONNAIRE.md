# Come Get It — App Store privacy questionnaire

Release candidate prepared on 2026-10-05, Expo SDK 54.0.37. These are the required answers for the new binary, not a claim that App Store Connect has already published them. Signed-binary evidence and final App Store Connect state belong in the release report.

- Data collected: **Yes**.
- Cross-company tracking: **No**. No IDFA or ATT prompt.
- Third-party advertising: **No**. Optional first-party offer notifications are developer marketing.
- Privacy Policy and Privacy Choices: https://come-get-it.app/adatvedelmi-szabalyzat

## Required data declarations

All nine categories below are linked to the account and **not** used for tracking.

| Apple data type | Purpose | Actual use |
|---|---|---|
| Name | App Functionality | Optional profile name |
| Email Address | App Functionality | Authentication, password reset, account contact |
| Phone Number | App Functionality | Optional profile field |
| User ID | App Functionality; Analytics; Developer Advertising or Marketing | Authentication, first-party activity, consented offer audience and delivery |
| Precise Location | App Functionality | Permission-based nearby search and on-site redemption validation |
| Coarse Location | App Functionality | Reduced-accuracy permission results |
| Product Interaction | App Functionality; Analytics; Developer Advertising or Marketing | Favorites, points, rewards, redemption history, app opens/page views; consented marketing audience selection by activity/points |
| Device ID | App Functionality; Developer Advertising or Marketing | Optional Expo/APNs push address linked to the user; no IDFA |
| Performance Data | Analytics | Time taken to create a QR redemption window |

The optional “Közeli ingyen ital” background geofence runs on the phone. Its locally stored coordinates are not sent to the server and are removed on opt-out/logout. Foreground coordinates sent for search/redemption remain declared conservatively. Activity event metadata excludes email, IP address, precise coordinates and QR secrets.

## Excluded features and SDKs

- Bank/card linking and community-impact previews are disabled in production by compile-time `__DEV__` gates. No payment information or card transaction data is collected by the consumer release.
- No IAP, subscription, third-party ads, contact upload, media upload, social feed or user-to-user messaging.
- No search-query history or crash-reporting SDK is intentionally enabled.
- Supabase stores authentication, application data and first-party activity.
- Expo Push Service and Apple APNs deliver optional consented remote notifications.
- Rork's transitive PostHog client remains disabled: production has neither `EXPO_PUBLIC_PROJECT_ID` nor `EXPO_PUBLIC_TEAM_ID`. Re-audit before enabling either.
- Apple/Google sign-in production flags remain false. Before enabling Apple, implement and verify server token revocation for account deletion; the current endpoint explicitly reports manual revocation if an Apple identity is ever encountered.

## Publication checks

1. Confirm the built app's root privacy manifest contains the nine categories/purposes above.
2. Publish matching usage disclosure on the linked privacy webpage.
3. Inspect App Store Connect App Privacy. The public API used in the audit cannot read the data-usage relationship; an unavailable API response is not evidence of an empty label.
4. Save and publish accurate answers through an authorized Apple account, including the final accuracy certification.
5. Test optional push/geofence opt-out and normal consumer account deletion on a physical iPhone.

References: [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/), [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy), [APNs device tokens](https://developer.apple.com/documentation/UserNotifications/registering-your-app-with-apns).
