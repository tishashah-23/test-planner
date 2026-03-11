# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

Open `index.html` directly in a browser — no build step or server required. The app uses CDN-hosted Tailwind CSS and SortableJS and reads activity data from a local JS variable, so `file://` protocol works fine.

If a local server is preferred: `python3 -m http.server 8080` then visit `http://localhost:8080`.

## Architecture

Four files make up the entire app:

| File | Role |
|------|------|
| `index.html` | App shell, two screens (onboarding + dashboard), all HTML structure |
| `css/styles.css` | All custom styles; Tailwind is used only for reset/utilities |
| `js/data.js` | `ACTIVITIES` constant — 58 curated activities, the only data source |
| `js/app.js` | All app logic — state, rendering, filters, drag-and-drop, persistence |
| `activities.json` | Mirror of `data.js` in JSON format for human reference/editing |

## State and screens

`App.users`, `App.activeUser`, and `App.filters` are the only runtime state. There are two views:
- **Onboarding** (`#screen-onboarding`) — shown when `localStorage` has no `tp_users` key. Collects two user names + trip length.
- **Dashboard** (`#screen-dashboard`) — two-panel layout: activity library sidebar (fixed 380px left) + horizontally-scrollable itinerary day columns (right).

`App.activeUser` = `'user1' | 'user2' | 'combined'`. All write operations target the active user's keys. `switchUser(viewKey)` rebuilds the itinerary panel and re-renders the library.

`localStorage` keys:
- `tp_users` — `{ user1, user2, bangkokDays, chiangMaiDays }`
- `tp_itinerary_1` / `tp_itinerary_2` — `{ "Bangkok|Day 1": ["bkk-001", ...] }`
- `tp_prefs_1` / `tp_prefs_2` — `{ "bkk-001": "mustdo" | "interested" | "skip" }`
- `tp_time_overrides` — `{ "bkk-001": "Evening", ... }` (shared)
- `tp_custom_activities` — custom activities array (shared)

Old v1 keys (`tp_user`, `tp_itinerary`, `tp_bookmarks`) are auto-migrated to v2 on first boot via `migrateOldData()`.

## Collaborative / Combined view

The header has a `#user-tabs` segmented control: [User 1] [User 2] [Combined].

- **User views**: full drag-and-drop, saves to that user's itinerary key.
- **Combined view**: `renderCombinedView()` merges both itineraries per day (union, deduplicated). Builds read-only `.day-sortable-combined` columns — no Sortable instances, library drag disabled. Attribution badges (`.collab-both`, `.collab-user1`, `.collab-user2`) show who selected each activity. Activities where both users have `mustdo` pref get `.card-both-mustdo` highlight and a `.both-mustdo-banner`.

## Preferences (replaces bookmarks)

Each library/day card has a `.pref-btn-group` with 3 buttons: ★ mustdo / ♥ interested / — skip. These are hidden in combined view. `togglePreference(id, pref)` saves to the active user's prefs key and updates all matching card DOM nodes. The "Must Do" library filter shows only activities with `pref === 'mustdo'` for the active user (or either user in combined mode).

## Drag-and-drop

SortableJS is configured with a shared group named `"trip"`:
- Library list: `pull: 'clone', put: false` — cards are cloned, never moved.
- Day columns: `pull: true, put: true` — accept drops and allow inter-day moves.

The `onAdd` callback injects a remove button and calls `setupCardListeners()` on the cloned card — this is necessary because SortableJS clones DOM nodes but not event listeners. `saveItinerary()` serializes all `.day-sortable` containers to `localStorage` after every drag event.

## Adding or editing activities

Edit `js/data.js` (the `ACTIVITIES` array). Each activity requires: `id`, `city` (`"Bangkok"` or `"Chiang Mai"`), `area` (district/neighborhood string), `name`, `description`, `type`, `cost` (`"Free"` / `"$"` / `"$$"` / `"$$$"`), `duration`, `bestTime`, `link`. After editing, sync `activities.json` by running: `node -e "const fs=require('fs'); eval(fs.readFileSync('./js/data.js','utf8').replace('const ACTIVITIES','var ACTIVITIES')); fs.writeFileSync('./activities.json',JSON.stringify(ACTIVITIES,null,2))"`.

Valid `type` values and their badge styles are mapped in `typeBadgeClass()` in `app.js`: Cultural, Food, Nature, Shopping, Adventure, Wellness, Nightlife, Day Trip.

Valid `duration` values (used for filtering): `"Under 1 hour"`, `"1-2 hours"`, `"2-3 hours"`, `"3-4 hours"`, `"Half day"`, `"Full day"`.

## Styling conventions

- Custom styles live in `css/styles.css`; Tailwind utility classes are avoided in favour of semantic CSS class names.
- Type badge colours are defined as `.badge-*` classes; cost colours as `.cost-*` classes.
- Cards in day columns are styled via `.day-sortable .activity-card` — the description and link are hidden there via CSS, not JS.
- Accent colour: `#6366f1` (indigo-500).
