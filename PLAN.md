# Fix recurring "expo: command not found" preview crash

**What's going wrong**

The preview keeps failing with `expo: command not found`. Looking at how the app starts:

- The project's start command is set to launch through Rork's bundler (`bunx rork start …`), which knows how to find Expo even on a fresh sandbox.
- But the error log shows the system actually running `expo start --max-workers "6"` directly. That path only works if Expo's command-line tool is already installed and on the system PATH — and in a fresh preview sandbox it isn't, which is exactly why the error keeps coming back.

So every time the preview sandbox is rebuilt from scratch, it tries the wrong launch command and crashes before the app ever gets a chance to load. Earlier attempts patched symptoms but didn't change the launch command itself, which is why it keeps returning.

**The permanent fix**

- Make the project's "expo" launch script route through the same Rork bundler the main start script already uses, so it works regardless of whether Expo's CLI is globally available.
- Also expose `ios`, `android`, and `web` shortcuts via the Rork bundler so any auto-detected launch path lands on a command that actually exists in the sandbox.
- Verify the preview boots cleanly after the change, with no other regressions.

**What you'll see**

- The preview starts up reliably on first try, no more "expo: command not found" or "Script not found 'expo'" errors.
- No visual or behavioral changes to the app itself — this is purely a startup-reliability fix.

**Not touching**

- App screens, home/impact widget logic, Supabase, redemption flow, and all other product code stay exactly as they are.