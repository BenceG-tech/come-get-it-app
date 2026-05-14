# Restore phone preview compatibility

## What I found

- [x] Confirmed the phone error is not from the last UI changes.
- [x] Confirmed Expo Go is rejecting the preview because the served manifest reports SDK 52 while the installed Expo Go supports SDK 54.
- [x] Confirmed the project dependencies are already SDK 54 (`expo` 54.x), so the issue is stale or missing manifest compatibility metadata.

## Fix completed

- [x] Added explicit `sdkVersion: "54.0.0"` to `expo/app.json` so Expo Go receives the correct compatibility hint.
- [x] Added `runtimeVersion: { policy: "sdkVersion" }` so runtime metadata stays tied to the SDK and does not drift.
- [x] Kept the recent logo/map UI changes untouched.

## Validation

- [x] Run the project checks after the manifest fix.
- [ ] Rebuild/restart the preview so the phone gets a fresh manifest instead of the cached SDK 52 one.
- [ ] If Expo Go still shows SDK 52 after rebuild, force a fresh preview URL because the old preview link is cached outside the app code.
