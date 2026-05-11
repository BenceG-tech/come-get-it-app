# Fix the "Script not found expo" preview error for good

## What's happening
The preview keeps failing with "Metro not ready — Script not found 'expo'". This happens when the app's installed packages get out of sync with the lockfile, so the start-up script can't find Expo even though it's listed in the project.

## Root cause
The packages folder ends up in a broken state between sessions. Nothing in your project files is actually wrong — it's an install/cache issue that comes back whenever the environment is rebuilt.

## What I'll do
- **Force a clean reinstall** of all app packages so the Expo start script is properly registered.
- **Clear Metro's cache** so it doesn't keep loading the broken state.
- **Verify** by running the project's type/build check and confirming Metro boots without the "Script not found" error.
- **Add a small safety net** so that if the same situation happens again, the start script self-heals instead of throwing the cryptic error.

## What you'll see after
- The yellow "The app needs to be fixed" screen goes away.
- The preview boots normally and you can scan the QR code or use the in-browser preview again.
- No code/UI changes — your screens, data, and flows stay exactly the same.

Shall I go ahead and apply this fix?