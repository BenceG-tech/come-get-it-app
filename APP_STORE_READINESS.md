# Come Get It — App Store readiness

Current candidate: **iOS 1.0.0 (19)**
Status date: **2026-09-30**

## Executive status

Build 19 is signed, uploaded, accepted by Apple as `VALID`, and distributed to the `Come Get It belső teszt` internal TestFlight group with state `IN_BETA_TESTING`. Do not submit for App Review until it passes the complete physical-device checklist.

Canonical current documents:

- `RELEASE_COMPLETION_MATRIX_2026-09-30_HU.md` — concise gate status;
- `RELEASE_AUDIT_2026-09-30_HU.md` — evidence-backed audit;
- `OWNER_RELEASE_CHECKLIST.md` — exact owner actions;
- `TESTFLIGHT_DEVICE_TEST.md` — physical iPhone regression;
- `APP_STORE_RELEASE_DECLARATIONS_HU.md` — privacy, age, rights and DSA answers.
- `BUILD_19_BINARY_AUDIT.md` — signed IPA, entitlements and privacy-manifest evidence.

## Verified release evidence

| Item | Result |
|---|---|
| Build 19 runtime source | `1563ac06341534653493901c3659005bf617f3a8` |
| Current GitHub main | `210c1a76ae864d7a561106107b87f4bbb203ea66` (PR #29, release documentation only) |
| EAS production build | `67ce044b-0327-44f6-a6d1-34f71576ec7e`, version `1.0.0 (19)`, `FINISHED` |
| App Store submission | `f2fc269a-6db6-4647-a313-82897ccf78fe`, `FINISHED` |
| Apple processing | `VALID`, external `READY_FOR_BETA_SUBMISSION`, not expired |
| Internal TestFlight | `IN_BETA_TESTING`; workflow `01a0f016-0ce3-762a-9138-770cc31c242d` succeeded |
| TypeScript and iOS export | PASS |
| Signed Build 19 binary/privacy audit | PASS; see `BUILD_19_BINARY_AUDIT.md` |
| Supabase / Venue Hub | production-connected and healthy |
| App Store media | five `1320×2868` alpha-free promotional PNG files, QC PASS; upload pending |
| App Review fixture | consumer review account has 500 synchronized test points; venue QR and points-reward instructions are separated |

## Product state included in build 19

- Original Come Get It logo restored and horizontally centered on login.
- Redundant branded runtime loading screen removed; native launch and only a brief neutral transition remain.
- Venue list and venue detail use native Apple Maps.
- Venue and reward requests include bounded loading, retry and safe session recovery.
- Reward category navigation has one deterministic back action and no exposed native duplicate header.
- Four active, imaged rewards cover Drinks, Food and Experiences, plus the All view.
- A user can redeem a specific reward only once. Database constraints, triggers, the atomic RPC and `redeem-reward` Edge Function v49 enforce the rule; repeats return HTTP 409 and the app explains the rejection in Hungarian.
- Partner QR tokens remain short-lived, venue-scoped and single-use.
- Account deletion, password reset and production legal links are implemented.

## Live reward catalog

1. Pilot ajándék ital;
2. Blue Hour koktél — 300 points;
3. Séf ajánlata – főétel — 900 points;
4. VIP lounge élmény — 1400 points.

Consumer reads expose only active, non-expired, in-stock rewards belonging to active venues or explicitly global rewards. Venue Hub edits use the same production backend as the mobile app.

## Privacy and legal state

The release privacy manifest declares Name, Email Address, Phone Number, User ID, Precise Location, Coarse Location and Product Interaction. All are linked to the user, used for App Functionality and not used for tracking. Rork's transitive PostHog package is not initialized because the required production project/team identifiers are absent.

Public production URLs:

- `https://come-get-it.app`
- `https://come-get-it.app/support`
- `https://come-get-it.app/adatvedelmi-szabalyzat`
- `https://come-get-it.app/felhasznalasi-feltetelek`

Saved Apple facts include `2026 Gátai Bence` copyright, 18+ alcohol-related age answers, third-party-content declaration and `usesNonExemptEncryption=false`. The owner must still confirm content rights, publish the privacy answers and choose the truthful DSA trader/non-trader status.

## Remaining release gates

1. Install build 19 from TestFlight and complete every item in `TESTFLIGHT_DEVICE_TEST.md`, including all four categories, duplicate reward rejection, QR success/repeat rejection, password reset and account deletion.
2. Upload and visually verify the five prepared screenshots.
3. Rotate the exposed App Store Connect API key safely and change both App Review account passwords.
4. Complete App Privacy Publish, DSA status and partner-content-rights confirmation.
5. Select build 19, verify reviewer credentials/notes and submit only after every gate passes, with manual release retained.

## Release rule

No version is known to be live, in review or pending public release. Build 19 is the only current release candidate. Paid subscription, linked-card rewards and CSR marketing are outside this 1.0 free-beta scope and must not be advertised as active features.
