# Fix venue details and real account-based favourites

**Features**
- [x] Opening any venue from the main list, map, profile, or favourites will show the correct detailed venue page.
- [x] Users can tap a heart on venue cards to add or remove that real venue from their favourites.
- [x] Users can also favourite or unfavourite a venue from its detailed page.
- [x] The profile favourites section will show real saved venues from the current user’s account, not mockup places.
- [x] The full favourites page will show the same real saved venues and an empty state when nothing is saved.

**Design**
- [x] Heart buttons will sit cleanly on venue images with a dark glass-style circular background.
- [x] Saved venues will use a filled bright cyan heart; unsaved venues will use an outlined heart.
- [x] The profile favourites carousel will keep the current dark Come Get It visual style.
- [x] Empty favourites will show a friendly message and a button back to the venue list.

**Reliability**
- [x] Venue detail loading will be made more tolerant of different ID formats so tapping a venue does not fail silently.
- [x] Favourite changes will update immediately on screen and stay synced with the user account.
- [x] If account syncing fails, the app will show a non-blocking friendly error instead of breaking the page.

**Screens**
- [x] Home list: add favourite hearts and preserve tap-to-open details.
- [x] Venue details: add a favourite action near the top.
- [x] Profile: replace mockup favourite cards with real saved venues.
- [x] Favourites: replace mockup list with real saved venues.