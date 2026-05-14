# Restore phone preview compatibility

## What I found

- [x] Confirmed the phone error is not from the recent UI changes.
- [x] Confirmed the project dependencies are Expo SDK 54 (`expo` 54.x).
- [x] Confirmed the latest Metro failure is caused by the preview runner invoking the `expo` package script, which hard-coded `node ./node_modules/expo/bin/cli`.
- [x] Confirmed that hard-coded `node_modules` path is fragile in the preview environment and can fail even when the dependency is declared correctly.

## Fix completed

- [x] Kept explicit `sdkVersion: "54.0.0"` in `expo/app.json` so Expo Go receives the correct compatibility hint.
- [x] Kept `runtimeVersion: { policy: "sdkVersion" }` so runtime metadata stays tied to the SDK and does not drift.
- [x] Changed the `expo`, `ios`, `android`, and `web` scripts to use `bunx expo` instead of a hard-coded `node_modules` CLI path.
- [x] Kept the recent logo/map UI changes untouched.

## Validation

- [x] Verified `bun run expo --version` resolves Expo CLI successfully.
- [x] Verified `bun run expo config --json` loads the Expo config successfully.
- [x] Ran project checks after the startup-script fix.
- [ ] Rebuild/restart the preview so the phone gets a fresh server process.
- [ ] If Expo Go still shows an old/cached error after rebuild, open a fresh preview URL instead of reusing the old cached session.
