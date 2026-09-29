# Come Get It — build 13 binary audit

Audit date: 2026-09-29

## Artifact identity

- EAS build ID: `7629d072-a18a-4e5e-ba2e-c72fc8667b4d`
- Source commit: `90d6202b7bee71ccdbfa9cde1349aaa9099bf1c7`
- App version/build: `1.0.0 (13)`
- Bundle ID: `app.comegetit.mobile`
- SDK: Expo 54 / iOS minimum 15.1
- IPA SHA-256: `526356a688ddf376eef3392e87df2bc14280b8b4e770cb68726b30e97b8a2c1b`
- IPA size: 16,221,439 bytes
- EAS submission: `e0705b3a-2b9f-4a11-a451-5818e09515bd` — `FINISHED`
- App Store Connect build ID: `5eefbd16-dab8-47e0-bab9-b3ba4edd89be` — `VALID`
- Internal TestFlight group: `Come Get It belső teszt` — assigned

## Signing and distribution

- `codesign --verify --deep --strict` passed.
- Distribution authority: `iPhone Distribution: Bence Gatai (AMLH4RKNR8)`.
- The App Store provisioning profile is active until 2027-09-28.
- `get-task-allow=false`; this is not a development-signed build.
- Sign in with Apple entitlement is present.
- Non-exempt encryption is declared false.
- The app is iPhone-only and ARM64.

## Permissions and transport

- Only when-in-use location access is configured, with a Hungarian purpose string.
- No always/background-location permission or background mode is present.
- No tracking permission string is present because the app does not track.
- Arbitrary insecure network loads are disabled.
- The App Store icon source is 1024×1024 and has no alpha channel.

## Privacy manifest

The root `PrivacyInfo.xcprivacy` is valid and now declares the first-party data categories that match the live app and public privacy policy:

- name;
- email address;
- optional phone number;
- user ID;
- precise location;
- coarse location;
- product interaction data.

Every category is linked to the account, used only for app functionality and marked as not used for tracking. `NSPrivacyTracking=false`, with no tracking domains. Required-reason API declarations for file timestamps, user defaults, disk space and system boot time are present. Thirteen privacy manifests are bundled across the app and included libraries.

## Secret and regression scan

The production JavaScript bundle contains the expected public Supabase project URL and anonymous client JWT. It contains no detected:

- private key material;
- Supabase service-role/secret key;
- Stripe live secret;
- GitHub token;
- Slack token;
- Google Maps API key;
- PostHog project key;
- App Store Connect key identifier from the release tooling.

The bundle contains the build-12 deterministic reward-navigation markers (`rewards-category-back`, `Vissza a Jutalmakhoz`). It contains neither the old `API KEY REQUIRED` marker nor the retired CARTO basemap endpoint.

## Post-submission regression — 2026-09-29

The current `main` branch at `6aab394178d0177d96ed7d03d49cdaed6c2d3d7c` was rechecked after the media-runbook merge. The application source and native configuration are unchanged from build-13 source commit `90d6202b7bee71ccdbfa9cde1349aaa9099bf1c7`; the only package change adds the standalone App Store media-audit command.

- TypeScript `tsc --noEmit`: passed.
- Clean iOS Metro/Hermes export: passed, 3,476 modules bundled and an 8.8 MB `.hbc` bundle produced.
- Expo dependency compatibility check: dependencies are up to date.
- Expo Doctor: 15 of 18 checks passed; the other three could not execute because this audit runtime does not include `npm`, rather than because of a detected project incompatibility.
- Production Venue Hub build and TypeScript project build: passed.
- The changed `src/pages/pos/POSRedeem.tsx` scanner file passes ESLint.
- The live Venue Hub deployment returns HTTP 200, does not emit a camera-blocking `Permissions-Policy` header, and its deployed JavaScript contains the new active-camera, direct-production-tab and missing-camera handling.
- The public home, support, privacy and terms endpoints all return HTTP 200.
- App Store Connect still reports build `1.0.0 (13)` as internal beta testing / ready for external beta submission, with no live, in-review or pending-release version.

The full legacy Venue Hub lint baseline is not clean (203 errors and 19 warnings, primarily historical `no-explicit-any` findings). This does not contradict the successful production/type checks above, but it remains technical debt and must not be represented as a repository-wide green lint result.

## Remaining release gates

This audit proves packaging, signing and static binary configuration. It does not replace the physical TestFlight acceptance test. Before selecting build 13 for App Store version 1.0:

1. run the complete iPhone flow;
2. perform first and repeated QR scans through the production Venue Hub camera;
3. capture fresh build-13 App Store screenshots;
4. rotate the previously exposed App Store Connect API key;
5. have the account holder confirm privacy publication, copyright and final legal declarations.
