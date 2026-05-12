# Permanently fix the "Script not found 'expo'" preview crash

**What's still wrong**

The preview keeps crashing on startup with the same "Script not found 'expo'" message. Previous attempts only reinstalled packages, which fixed it for a moment but never touched the project itself — so on every cold rebuild the same error comes back.

**Why it keeps coming back**

When the preview boots, the underlying tool tries to call `expo` as a named shortcut inside the project's settings, but no such shortcut is defined. So it gives up before Metro even starts. Reinstalling packages doesn't help because the project file is still missing that one line.

**The permanent fix**

- Add the missing `expo` shortcut (and standard companions: `android`, `ios`, `web`) into the project's settings so the startup tool can always find it.
- Keep the existing Rork start shortcut exactly as it is — nothing about how the preview launches changes.
- Re-run a clean package install so everything is in sync after the change.
- Run the build check to confirm the preview boots cleanly.

**What you'll see**

- The yellow "needs to be fixed" screen goes away and stays away across rebuilds.
- The preview opens normally on iOS, Android, and web.
- Zero changes to your screens, data, flows, or design — this is purely a one-line configuration fix.

