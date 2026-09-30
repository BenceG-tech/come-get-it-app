# Come Get It — Build 20 signed binary audit

Audit date: **2026-09-30**
Release candidate: **iOS 1.0.0 (20)**

## Result

**LOCAL BINARY, PRIVACY-MANIFEST AND LOGO PACKAGE AUDIT: PASS**

The audited IPA is the EAS production artifact for build `07fb063e-bfaf-4680-865a-512b1ab06def`, created from GitHub source `2d81b1184d46193b0d04a0ddd69fe73de189214b` and uploaded through EAS submission `5703b7e4-6fcc-49ca-88b1-06e9c4a62a51`.

The upload to Apple succeeded and App Store Connect processing completed. A direct App Store Connect API readback identifies Build 20 as `616698d1-1207-46d8-a78e-f67d6040830f`, with `processingState = VALID`, `internalBuildState = IN_BETA_TESTING` and `externalBuildState = READY_FOR_BETA_SUBMISSION`. The `Come Get It belső teszt` group directly reports `containsBuild20 = true`; its build count increased from 8 to 9. This is not evidence of an App Review submission or public release.

- IPA SHA-256: `6a434c29aacf4f8a4eef3b90a6b62eef240ab28867b2d12486d381d25ed34f6a`
- IPA size: `16,477,849` bytes
- bundle identifier: `app.comegetit.mobile`
- version/build: `1.0.0 (20)`
- minimum iOS: `15.1`
- supported device family: iPhone only (`UIDeviceFamily = 1`)
- executable architecture: `arm64`

## Original-logo evidence

The login screen and the native splash are configured from the same original source asset: `expo/assets/images/login-logo-attached.png`.

- source and packaged runtime asset size: `3371 × 2350` pixels;
- packaged runtime asset SHA-256: `71f3bc3bb7cc3f985d49e01ab0fb9c25d24b1adb83520bce67c9d13e9d9c4aee`;
- the packaged runtime hash matches the GitHub source asset exactly;
- the compiled native asset catalog contains `SplashScreenLegacy` renditions at `3371 × 2350`, matching the original logo dimensions;
- `expo/app.json` points the native splash to that same original source asset.

This proves that Build 20 packages the requested original logo for both login and native startup. The exact visual centering and startup timing still require the physical iPhone test in `TESTFLIGHT_DEVICE_TEST.md`.

## Signing and provisioning

The extracted application contains an App Store distribution provisioning profile for team `AMLH4RKNR8` / `Bence Gatai`:

- profile name: `*[expo] app.comegetit.mobile AppStore 2026-09-28T15:37:03.456Z`;
- profile UUID: `7a581246-8a22-472a-8515-2bed3a24fe8c`;
- profile expiry: `2027-09-28 15:26:57 UTC`;
- `get-task-allow = false`;
- `beta-reports-active = true`;
- Sign in with Apple entitlement: `Default`;
- application identifier: `AMLH4RKNR8.app.comegetit.mobile`.

The signed executable exposes CDHash `d7c72ca2d950b8487ef3c8057425219afb8858d9`. The local Mac trust store reports `CSSMERR_TP_NOT_TRUSTED` during offline full-chain verification, as it did for the previously Apple-validated Build 19. Apple's direct `VALID` processing state and `IN_BETA_TESTING` internal state are the authoritative distribution checks.

## Privacy manifest

The root `PrivacyInfo.xcprivacy` is present in the signed app, together with twelve library manifests. It declares:

- Name;
- Email Address;
- Phone Number;
- User ID;
- Precise Location;
- Coarse Location;
- Product Interaction.

Every collected-data entry is linked to the user, used for App Functionality and marked as not used for tracking. The root manifest sets `NSPrivacyTracking = false` and declares no tracking domains.

Required-reason API entries are present for file timestamps, user defaults, disk space and system boot time.

## Other release-relevant configuration

- `ITSAppUsesNonExemptEncryption = false`;
- arbitrary network loads are disabled (`NSAllowsArbitraryLoads = false`);
- the location permission text states that location is used for nearby partner venues while using the app;
- the app uses portrait orientations and a native launch storyboard;
- URL schemes include `comegetit` and `app.comegetit.mobile`.

## Decision

The signed Build 20 package matches the intended bundle, version/build, iPhone-only scope, privacy declarations and original-logo source. App Store Connect directly confirms `VALID`, `IN_BETA_TESTING` and membership in the `Come Get It belső teszt` group. The physical iPhone regression, App Privacy Publish, DSA, content-rights confirmation and App Review submission remain open gates.
