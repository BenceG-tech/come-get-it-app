# Permanently fix the recurring "Script not found 'expo'" Metro startup error

**What's going wrong**

Every time the preview boots, the underlying tool tries to invoke `expo` but the project's settings file doesn't list `expo` as a known shortcut, so it bails out with "Script not found 'expo'" and Metro never finishes starting. Previous fixes kept re-running installs, which only patched it for a moment — the project itself was never adjusted, so the error returns on the next cold start.

**The permanent fix**

- Add the missing `expo` shortcut (and a couple of standard companions like `android`, `ios`, `web`) directly into the project's scripts, so the startup tool can always find it instead of failing.
- Keep the existing Rork `start` shortcut exactly as it is so nothing else changes about how the preview launches.
- Confirm the entry point (`expo-router/entry`) is still wired correctly and that nothing else in the config is interfering.

**Result**

- The preview will boot cleanly every time without the "Script not found" error.
- No visual or feature changes to the app itself — this is purely a configuration fix so the build stops crashing at the very first step.

