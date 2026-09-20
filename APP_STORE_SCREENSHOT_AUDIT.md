# Come Get It — App Store screenshot audit

Audit date: 2026-09-20

## Result

The marketing folder contains 37 PNG files at 1206 × 2622 pixels with no alpha channel. That size is accepted for Apple’s 6.3-inch screenshot slot, but the set must **not** be uploaded as the final 1.0 submission.

Reasons:

- several files show a prior prototype rather than the current build;
- `IMG_9349.PNG`, `IMG_9801.PNG`, `IMG_9803.PNG` and `IMG_9855.PNG` include browser/chat/photo-viewer chrome;
- `IMG_9931.PNG` advertises card linking and automatic points, which are not active in version 1.0;
- the screens include fabricated or outdated venue/reward content and older navigation states;
- the files are not the highest-resolution 6.9-inch set recommended for the current App Store product page.

Apple currently accepts one to ten screenshots per device size, without alpha/transparency. For a current iPhone 6.9-inch portrait set, accepted dimensions include 1260 × 2736, 1290 × 2796 or 1320 × 2868 pixels. Since `supportsTablet` is false, no iPad screenshot set is required. References: [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) and [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots).

## Required fresh capture set

Capture the signed release/TestFlight build at one consistent accepted 6.9-inch size, with the App Review account or a reset screenshot account:

1. Venue discovery — map/list with live Budapest partner data.
2. Venue details — real venue, opening hours, map and available drink.
3. Rewards — live reward catalog with no card-linking banner.
4. Favorites or Profile — saved venues and account value, without personal email/phone visible.
5. Redemption — arrival/show step before final confirmation; no reusable token or QR secret visible.

Optional sixth image: search/filter view with a useful result.

## Capture rules

- Use a clean status bar, consistent time and full battery; do not show browser controls, notifications or developer overlays.
- Use only live, licensed partner images and truthful offer names.
- Do not show the review password, personal contact details, full redemption token or internal IDs.
- Do not claim Plus, card linking, CSR donations, push notifications or partner/user counts.
- Reset review redemptions and favorites before the capture session if necessary.
- Capture only after the signed iOS build passes device and TestFlight smoke tests.
