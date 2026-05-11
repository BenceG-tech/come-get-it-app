# Fix Metro build error by reinstalling app dependencies

**What's wrong**
The app failed to start because Metro couldn't find the core Expo script. This usually means the installed packages got out of sync with the project's lockfile.

**Fix**
- Reinstall the app's packages so Expo and Metro are properly available again.
- Restart the preview so the simulator picks up the freshly installed dependencies.

After this, the app should boot in the preview as before.