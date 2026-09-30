# Come Get It — Build 19 signed binary audit

Audit date: **2026-09-30**  
Release candidate: **iOS 1.0.0 (19)**

## Result

**BINARY CONFIGURATION AND PRIVACY MANIFEST: PASS**

The audited IPA is the EAS production artifact for build `67ce044b-0327-44f6-a6d1-34f71576ec7e`, submitted through EAS submission `f2fc269a-6db6-4647-a313-82897ccf78fe` and accepted by Apple as `VALID`.

- IPA SHA-256: `e13ce9ff5944b46a83547fec680b3baf8ab13324f17490e4d82bf71139f57c20`
- IPA size: `16,225,215` bytes
- bundle identifier: `app.comegetit.mobile`
- version/build: `1.0.0 (19)`
- minimum iOS: `15.1`
- supported device family: iPhone only (`UIDeviceFamily = 1`)
- executable architecture: `arm64`

## Signing and provisioning

The extracted application contains an App Store provisioning profile for team `AMLH4RKNR8` / `Bence Gatai`:

- profile name: `*[expo] app.comegetit.mobile AppStore 2026-09-28T15:37:03.456Z`;
- profile UUID: `7a581246-8a22-472a-8515-2bed3a24fe8c`;
- profile expiry: `2027-09-28 15:26:57 UTC`;
- `get-task-allow = false`;
- `beta-reports-active = true`;
- Sign in with Apple entitlement: `Default`;
- application identifier: `AMLH4RKNR8.app.comegetit.mobile`.

The signed executable exposes CDHash `eb537d7775a04ed7f6044c395ce6b96b92242ec3` and matching app/team entitlements. The local Mac trust store reports `CSSMERR_TP_NOT_TRUSTED` when performing an offline full-chain `codesign --verify`; this environment result is not treated as an App Store rejection. Apple's completed processing and `VALID` state are the authoritative distribution validation.

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

The signed Build 19 binary matches the intended bundle, build number, iPhone-only scope, privacy declarations and distribution entitlements. This audit closes the binary/privacy-configuration evidence gap. It does **not** replace the full physical iPhone regression, App Privacy Publish, DSA declaration, content-rights confirmation or App Review submission gates.
