# Recover the broken preview and add a rollback safety path

## What I found

- [x] Confirmed the app screen code is not the direct cause of this failure.
- [x] Confirmed the preview was failing before Metro/app code could run because the startup command could not find Expo.
- [x] Confirmed earlier fixes refreshed dependencies or added an `expo` script, but still relied on a global `expo` command that is not available in the preview shell.

## Fix completed

- [x] Registered a persistent local Expo startup path in `expo/package.json`.
- [x] Changed the script from `"expo": "expo"` to `"expo": "node ./node_modules/expo/bin/cli"` so the preview no longer depends on a global Expo binary.
- [x] Updated Android/iOS/web scripts to use the same local Expo CLI.
- [x] Refreshed dependencies with `bun install --frozen-lockfile`.
- [x] Verified the exact failing command path now resolves: `bun run expo start --max-workers "6" --help`.
- [x] Ran Rork checks successfully: no TypeScript, lint, or project-structure errors.

## Rollback guidance

- [x] Checked recent project history with Git; the latest saved versions include startup-related commits, so a full rollback may undo useful fixes.
- [x] Recommended rollback path: use Rork's “Revert to Previous Version” only if rebuild still fails after this fix.
- [x] Safer rollback path: restore only `expo/package.json` startup scripts from the last working snapshot rather than reverting the whole app.

## Next step

- [ ] Restart/rebuild the preview once so Rork picks up the corrected startup script.
