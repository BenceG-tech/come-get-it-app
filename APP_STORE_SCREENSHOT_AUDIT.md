# Come Get It — App Store screenshot audit

Audit date: **2026-09-30**
Target release: **iOS 1.0.0 (20)**

## Result

**TECHNICAL AND VISUAL QC: PASS · APP STORE CONNECT UPLOAD PENDING**

The final package contains five consistent portrait PNG files at `1320 × 2868` pixels, with no alpha/transparency. This is an accepted 6.9-inch iPhone screenshot size. The clean upload ZIP contains only the five intended files.

The completed set covers:

1. Budapest venue discovery and native map;
2. venue selection;
3. venue details and available offer;
4. free-drink handoff;
5. successful redemption.

Visual review found no browser, Rork, Lovable, Expo or TestFlight interface; no readable QR/token; no password, email address or phone number; and no inactive card-linking, paid Plus or CSR promise.

The older 1206 × 2622 source and prototype images remain rejected for final submission. Their historical findings are recorded in `APP_STORE_MEDIA_AUDIT_2026-09-29_HU.md`.

## Final upload checks

- [ ] Build 20 completes the physical iPhone regression.
- [ ] All five images still truthfully match the released behavior and licensed content.
- [ ] Upload the set to the 6.9-inch iPhone slot in App Store Connect.
- [ ] Open every uploaded image at full preview and check order, crop, text and colour.
- [ ] Confirm no duplicate, missing or unintended file is present.

No iPad screenshot set is required because `supportsTablet` is false. Apple permits one to ten screenshots per supported device size. References: [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) and [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots).

For any replacement capture or App Preview video, follow `APP_STORE_MEDIA_CAPTURE_HU.md`.
