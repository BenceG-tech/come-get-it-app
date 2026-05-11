# Make home screen impact widget null-safe for new users

**What's happening**

The home screen tries to read impact stats (meals donated, streak days) before they exist for brand-new users, which can crash the screen.

**Fix**

- Safely read every impact stat on the home screen so missing values default to 0 instead of crashing.
- Only show the "Your Impact This Week" widget when there's actually a value greater than 0 to display.
- Leave the rest of the home screen untouched.

**Note on user defaults**

The home screen reads its stats from the impact service (not directly from the user record), and that service already returns a stats object. The "initialize a default stats object on user creation" piece would belong in the server-side user-creation flow, which isn't part of this app's code. I'll flag this so you can address it on the backend if needed — happy to help if you point me to where new users are created.