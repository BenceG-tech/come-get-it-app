# Come Get It — App Store privacy questionnaire

Scope: iOS 1.0.0, based on the currently shipped app and Supabase backend. Re-check this file whenever a new SDK or feature is enabled.

## App Store Connect top-level answers

- Does this app or its third-party partners collect data? **Yes**
- Is any collected data used for tracking across other companies’ apps or websites? **No**
- Does the app show third-party advertising? **No**
- Privacy Policy URL: `https://come-get-it.app/adatvedelmi-szabalyzat`
- Privacy Choices URL: `https://come-get-it.app/adatvedelmi-szabalyzat`; the page explains user rights and account deletion, and users can also delete the account inside the app.

Apple requires the declaration to include third-party code as well as first-party handling. Reference: [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy) and [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/).

## Data types to declare

| Apple data type | Collected | Linked to user | Tracking | Purpose | Current implementation |
|---|---:|---:|---:|---|---|
| Name | Yes | Yes | No | App Functionality | optional profile name / OAuth profile |
| Email Address | Yes | Yes | No | App Functionality | authentication, password reset, account communication |
| Phone Number | Yes, optional | Yes | No | App Functionality | optional profile field |
| User ID | Yes | Yes | No | App Functionality | Supabase account ID, authorization, fraud prevention |
| Precise Location | Yes, only when permitted | Yes | No | App Functionality | sent during nearby search/redemption validation; no background access and redemption coordinates are not stored in the redemption record |
| Coarse Location | Yes, when the user grants approximate rather than precise location | Yes | No | App Functionality | iOS may provide reduced-accuracy coordinates under the same foreground permission; no background access |
| Product Interaction | Yes | Yes | No | App Functionality | favorites, points, rewards and redemption history |

These seven entries match the root privacy manifest configured for signed build 17: Name, Email Address, Phone Number, User ID, Precise Location, Coarse Location and Product Interaction. Every entry is linked to the user, used for App Functionality and not used for tracking.

## Do not select for version 1.0

- Payment Info, Credit Info, Other Financial Info: card linking is not exposed or active.
- Purchase History: a free-drink redemption is not a purchase, and there is no IAP.
- Device ID: the app does not use IDFA or a stable device-level identifier. The redemption token nonce is request-specific.
- Contacts, Photos or Videos, Audio Data, Health, Fitness, Sensitive Info.
- Emails or Text Messages, User-Generated Content, Customer Support data: support opens the user’s external email/phone app and is not submitted inside Come Get It.
- Search History: venue search text is not stored server-side.
- Advertising Data, Browsing History, Crash Data, Performance Data and Other Diagnostic Data: not intentionally collected as product analytics by the current binary. Infrastructure security/request logs are used only to operate and protect the service; if their use or retention grows beyond Apple's optional-disclosure conditions, add the appropriate diagnostic category before publishing an updated label.

## SDK and feature audit

- Supabase: authentication, database, storage and edge functions; included in the declarations above.
- Rork toolkit: the dependency contains PostHog code and the production bundle therefore contains the SDK, but its client is disabled unless both `EXPO_PUBLIC_PROJECT_ID` and `EXPO_PUBLIC_TEAM_ID` are present. Neither variable exists in the EAS production environment, so build 17 does not initialize the client or send Rork lifecycle/screen analytics. If either identifier is deliberately configured later, perform a new binary/privacy audit before rebuilding and update App Store Connect when collection begins.
- Apple / Google sign-in: only declare the profile data actually returned and stored. Google and Apple provider secrets must be configured before their buttons are enabled in production.
- Expo/EAS: build/distribution tooling; no advertising SDK is present.
- Salt Edge, Fidel and Goorderz server integrations are not exposed as active consumer features in iOS 1.0. Do not declare financial data unless card linking is enabled in a later release.
- No ATT prompt is needed because this version performs no cross-company tracking.

## Consistency checks

- The in-app privacy policy must match these answers.
- Apple requires the answers to include third-party code and to be updated whenever practices change. The final **Publish** dialog is a legal accuracy/compliance certification and must be accepted by the Account Holder or another authorized owner role.
- If precise location remains transient and legal counsel confirms it meets Apple’s optional-disclosure exception, the location label can be reconsidered. The conservative submission choice above declares it.
- Adding analytics, crash reporting, push notifications, IAP/subscriptions, card linking or marketing automation requires a new privacy review before release.
- Treat adding the two Rork project/team analytics identifiers as enabling analytics for privacy-review purposes, even though the PostHog package is already present transitively.
