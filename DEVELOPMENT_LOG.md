# Development Log — KirokuVault

This log tracks all architectural changes, feature implementations, and bug fixes implemented during the local development of KirokuVault, an anime and manga tracking platform.

---

## 📅 Project History & Major Milestones

### 1. Project Initialization & Core Architecture
*   **Tech Stack**: Built a modular full-stack application using a React + TypeScript frontend (Vite bundler) and an Express + Node.js backend with a MongoDB database (Mongoose ODM).
*   **Routing & Layout**: Initialized client-side routing using `react-router-dom` v7 with a persistent layouts structure featuring a dynamic Sidebar navigation, a Top Navbar, and sub-page rendering.
*   **Auth & Sessions**: Set up secure local auth registration and login endpoints alongside passport-driven Google OAuth integration.

---

### 2. Auto-Maxing Library Progress on Completion
*   **Feature**: Automated library updates to eliminate manual input when completing titles.
*   **Behavior**: When a user changes the watch status of an anime to `Completed` or the read status of a manga to `Completed`, the entry's progress field is automatically set to its maximum value (total episodes or chapters).
*   **File Changes**:
    *   [MangaDetail.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/MangaDetail.tsx)
    *   [AnimeDetail.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/AnimeDetail.tsx)
    *   [Library.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/Library.tsx)

---

### 3. Media Detail Reviews Tab (Bug Fix)
*   **Bug**: The "Reviews" tab existed on the media detail page's UI navigation, but clicking it rendered a blank section because reviews state, API fetching, and render blocks were missing.
*   **Fix**:
    *   Implemented a dedicated local state `reviews` and loaded reviews dynamically from the backend only when the "Reviews" tab is selected.
    *   Created a "Write a Review" modal allowing authenticated users to select star ratings (1-10), write titles and bodies, and post them directly to the database, updating the reviews feed instantly.
*   **File Changes**:
    *   [AnimeDetail.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/AnimeDetail.tsx)
    *   [MangaDetail.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/MangaDetail.tsx)

---

### 4. Public Profile Data Fetch Optimization (Bug Fix)
*   **Bug**: Opening a user's profile triggered a `Promise.all` that fired two wasted/broken calls:
    1.  `getUserLibrary('')` which hit the database with an empty string, causing Mongoose to throw a `400 Bad Request` validation error.
    2.  `getReviews({ userId: undefined })` which returned the entire database reviews list since no user ID was provided.
*   **Fix**: Refactored the loading sequence to fetch the profile data first. Once the profile's real Mongoose ObjectId `_id` is resolved, it triggers optimized parallel library and review fetches for that specific user.
*   **File Changes**:
    *   [Pages.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/Pages.tsx)

---

### 5. Profile Route Redirect Wrapper (Bug Fix)
*   **Bug**: Clicking "Profile" in the navigation loaded the `<Profile />` component directly on `/profile`. However, the profile page requires a `:username` parameter to look up profiles. Lacking this, it constantly rendered a blank "User not found." screen.
*   **Fix**: Created a `ProfileRedirect` wrapper in the router. When a user requests `/profile`, the app fetches the username from the authenticated user context and performs a safe redirect to `/user/:username`.
*   **File Changes**:
    *   [App.tsx](file:///c:/padhai/projects/otakuvault/client/src/App.tsx)

---

### 6. Spotlight Hero Navigation Correction
*   **Bug**: The next/previous navigation controls on the SpotlightHero slider rendered stacked vertically, causing layout overlaps and visual collisions on narrow views.
*   **Fix**: Redesigned the navigation block to render horizontally `[ < ] [ > ]` on the bottom right of the hero banner, matching standard UX conventions and keeping it clear of overlay descriptions.
*   **File Changes**:
    *   [SpotlightHero.tsx](file:///c:/padhai/projects/otakuvault/client/src/components/ui/SpotlightHero.tsx)

---

### 7. Core Style Reactive Refactoring
*   **Improvement**: Redesigned style constants to support direct CSS variables for full theme reactivity.
*   **Details**:
    *   Cleaned up JS Proxy-based theme color lookups to ensure values compile directly to theme CSS variables.
    *   Refactored inline style helpers (e.g. `inputStyle`, `btnPrimaryStyle`, `cardStyle`) to be simple static objects without getter traps, eliminating React DOM update skipped frames when references didn't change.
    *   Added standard focus styles (accent borders, glows) and tactile button click effects globally to ensure a high-fidelity interactiveness.
*   **File Changes**:
    *   [colors.ts](file:///c:/padhai/projects/otakuvault/client/src/constants/colors.ts)
    *   [index.html](file:///c:/padhai/projects/otakuvault/client/index.html)

---

### 8. Premium 4-Theme System Implementation
*   **Feature**: Replaced the original EN/JP language toggle with an anime-themed styling selector.
*   **Menu Placement**: Integrated inside the user profile avatar dropdown: `Profile` → `Settings` → `Theme ➔` (showing 🌙 Midnight, 🌸 Sakura, ⛩️ Shrine, and 📜 Archive options).
*   **Theme Details**:
    *   🌙 **Midnight**: Dark navy base with purple and cyan accents.
    *   🌸 **Sakura**: Plum and magenta bases with blossom pink accents and glows.
    *   ⛩️ **Shrine**: Pitch black base with traditional Torii gate red accents.
    *   📜 **Archive**: Journal parchment grey with gold and leather brown details.
*   **File Changes**:
    *   [ThemeContext.tsx](file:///c:/padhai/projects/otakuvault/client/src/context/ThemeContext.tsx)
    *   [Layout.tsx](file:///c:/padhai/projects/otakuvault/client/src/components/layout/Layout.tsx)

---

### 9. Mobile Viewport Polish & iOS Focus Zoom Fixes
*   **Improvement**: Audited the entire app interface on mobile breakpoints to ensure premium layout scaling.
*   **Fixes**:
    *   Hid redundant Brand Text labels and Mailbox icons on small screens to prevent top navbar crowding.
    *   Made the topnav search field expand to 100% viewport width when active on mobile, rendering a custom "Cancel" button to exit search view.
    *   Fixed iOS Safari's default page zoom-on-focus behavior by setting search and form input text sizes to `16px` on mobile viewports.
*   **File Changes**:
    *   [Layout.tsx](file:///c:/padhai/projects/otakuvault/client/src/components/layout/Layout.tsx)
    *   [Pages.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/Pages.tsx)

---

### 10. Sidebar Routing Audit
*   **Investigation**: Reviewed why sidebar clicks appeared not to route to Anime, Manga, and other destinations.
*   **Finding**:
    *   The sidebar's Anime and Manga items intentionally navigate to the shared search route with query filters: `/search?type=ANIME` and `/search?type=MANGA`.
    *   The router only defines detail routes for `/anime/:id` and `/manga/:id`; there are no standalone `/anime` or `/manga` index/list routes.
    *   The Search page already reads the `type` query parameter through `useSearchParams`, so Anime/Manga sidebar clicks should render filtered Search results rather than separate pages.
    *   Stats, Watch Party, Library, and Profile are protected routes and redirect unauthenticated users to `/login` by design.
*   **Next Decision**: If separate Anime and Manga landing pages are desired, add dedicated `/anime` and `/manga` routes or keep the current query-filtered Search behavior.
*   **File References**:
    *   [Sidebar.tsx](file:///c:/padhai/projects/otakuvault/client/src/components/layout/Sidebar.tsx)
    *   [App.tsx](file:///c:/padhai/projects/otakuvault/client/src/App.tsx)
    *   [Search.tsx](file:///c:/padhai/projects/otakuvault/client/src/pages/Search.tsx)

---

### 11. Manga, Manhwa, and Manhua Dropdowns & Sidebar Collapse
*   **API Filter Mapping**: Integrated the `countryOfOrigin` string parameter into the client's search params and updated the AniList GraphQL query variables to support filtering by country code (`KR` for Manhwa, `CN` for Manhua).
*   **Dropdown Header & Search Filters**: Implemented hoverable, glassmorphic dropdown menus in the Top Navigation bar and the Search type toggle. The Manga button dynamically updates its label to match the active type (e.g. `MANGA ▾`, `MANHWA ▾`, `MANHUA ▾`).
*   **Debounced Hover State**: Added a 250ms delay timeout buffer on mouse leave events to ensure smooth mouse transitions across spacing gaps without causing the dropdowns to flicker or close prematurely.
*   **Collapsible Sidebar Sub-links**: Nested "All Manga", "Manhwa", and "Manhua" sub-links directly inside the sidebar. Added a chevron toggle button (`▼`/`▶`) next to the parent "Manga" option to let users collapse or expand the list of sub-links.
*   **File Changes**:
    *   [anilist.ts](file:///c:/padhai/projects/kiroku/client/src/api/anilist.ts)
    *   [Layout.tsx](file:///c:/padhai/projects/kiroku/client/src/components/layout/Layout.tsx)
    *   [Sidebar.tsx](file:///c:/padhai/projects/kiroku/client/src/components/layout/Sidebar.tsx)
    *   [Search.tsx](file:///c:/padhai/projects/kiroku/client/src/pages/Search.tsx)

---

### 12. Spotlight, Star Rating, Reviews, and Card Fixes
*   **Spotlight Click/Tap Navigation**: Made the entire SpotlightHero banner slides clickable to navigate to the media details page, while keeping watch now, add to list, next/prev arrow buttons, and slide dots interactive without triggering navigation.
*   **Star Rating Reset**: Allowed unchecking star ratings back to 0 (unscored) when clicking the active rating value in the StarRating component.
*   **Card Layouts & Double-Edit Hover Fixes**:
    *   **LibraryCard**: Moved action buttons (Edit, Delete) below the progress info on grid cards, making them always visible. This completely bypasses the hover state locking bug when edit modal overlay is closed, allowing double edits without a page refresh.
    *   **KanbanCard**: Made action buttons visible on hover or automatically visible on phone viewports.
*   **Write/Edit Reviews from Library**: Added a "Your Review" section directly inside the Library Edit Modal, dynamically loading/updating/deleting the user's review for that media.
*   **Delete Reviews Option**: Added a delete button on review cards across detail, profile, and community feed pages, allowing users to remove their reviews with confirmation.
*   **Interactive Reaction Emojis**: Rendered interactive reaction buttons (👍, ❤️, 🔥, 😮) for each review, which trigger backend likes and spawn premium floating emoji animations rising from the clicked screen coordinates.
*   **File Changes**:
    *   [SpotlightHero.tsx](file:///c:/padhai/projects/kiroku/client/src/components/ui/SpotlightHero.tsx)
    *   [index.tsx](file:///c:/padhai/projects/kiroku/client/src/components/ui/index.tsx)
    *   [Library.tsx](file:///c:/padhai/projects/kiroku/client/src/pages/Library.tsx)
    *   [AnimeDetail.tsx](file:///c:/padhai/projects/kiroku/client/src/pages/AnimeDetail.tsx)
    *   [MangaDetail.tsx](file:///c:/padhai/projects/kiroku/client/src/pages/MangaDetail.tsx)
    *   [Pages.tsx](file:///c:/padhai/projects/kiroku/client/src/pages/Pages.tsx)
