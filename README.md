# ⛩️ KirokuVault

A premium, full-stack anime & manga tracking platform built with the MERN stack and TypeScript. KirokuVault features beautiful anime-themed presets, social interactions, interactive analytics, and automated tracking.

---

## 🎨 Premium Features & Milestones

- **4-Theme Preset System**: Swap the interface styling on the fly with CSS custom properties. Integrated directly into the user profile avatar dropdown via the `Settings` panel:
  - 🌙 **Midnight**: Dark navy base with purple and cyan accents.
  - 🌸 **Sakura**: Plum and magenta base with cherry blossom pink accents and glows.
  - ⛩️ **Shrine**: Pitch black base with traditional Torii gate red accents.
  - 📜 **Archive**: Journal parchment grey with gold and leather brown details.
- **Kanban-Style Library Tracking**: Organize your watchlists and readlists into interactive Kanban boards. Updates are optimized for quick editing, with a built-in review writer inside the edit modal.
- **Auto-Maxing Library Progress**: When marking a title's watch status or reading status as `Completed`, KirokuVault automatically fills the progress field to the maximum episode or chapter count.
- **Reddit-Style Review Voting**: Reviews feature horizontal voting capsules `[ ▲ Score ▼ ]` matching modern Reddit-style interfaces, color-coded with orange (upvote) and blue (downvote) active states.
- **Interactive Emoji Reactions**: Users can leave `❤️`, `🔥`, and `🤪` reactions on reviews. Triggering reactions spawns premium coordinate-based floating emoji animations that float up the screen.
- **Manga, Manhwa, & Manhua Querying**: Filter Manga lists by origin dynamically (`KR` for Manhwa, `CN` for Manhua) through the Top Navbar dropdown or Collapsible Sidebar sub-links.
- **Analytics Dashboard**: Monitor your stats with a custom Recharts dashboard. Completed slice segments use the application's green success color palette rather than generic charts colors, styled with clean layouts to prevent label clipping on smaller devices.
- **Mobile Viewport Optimization**: Audited interface designed for fluid mobile breakpoints. Includes auto-expanding topnav search, mobile-safe spacing on grid list cards, and a `16px` minimum font size override to bypass iOS Safari's default input zoom-on-focus.
- **High-Res Favicon**: Art-cropped, padding-optimized browser tab favicon. Centered and scaled to 256x256 while compressed to 67 KB for high performance.

---

## 🛠️ Stack

- **Frontend**: React 18 + Vite + TypeScript + Recharts + React Router v7 (future features)
- **Backend**: Node.js + Express + TypeScript + Passport.js (JWT & OAuth)
- **Database**: MongoDB Atlas + Mongoose ODM
- **APIs**: AniList (GraphQL for media detail/discovery), MangaDex (REST for reading links) — free, no API key required

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <your-repo>
cd kiroku

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free tier cluster.
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, add IP `0.0.0.0/0` (allow all connections) for local development.
4. Click **Connect** → **Drivers** → Copy your connection string.

### 3. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com) and create a New Project.
2. Navigate to **APIs & Services** → **OAuth consent screen** → Select **External**.
3. Go to **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Set **Authorized redirect URIs** to: `http://localhost:5000/api/auth/google/callback`
5. Copy your Client ID and Client Secret.

### 4. Server Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Fill in the required environment variables:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_string
SESSION_SECRET=your_session_secret_string
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. Run the Application

```bash
# Terminal 1 — Start the backend server (runs on http://localhost:5000)
cd server && npm run dev

# Terminal 2 — Start the frontend client (runs on http://localhost:5173)
cd client && npm run dev
```

---

## 🔌 API Routes

### Authentication

| Method | Route | Auth | Description |
|:---|:---|:---:|:---|
| POST | `/api/auth/register` | — | Register a new user with email/password |
| POST | `/api/auth/login` | — | Login with email/password |
| GET | `/api/auth/google` | — | Authenticate via Google OAuth |
| GET | `/api/auth/me` | ✅ | Get active authenticated user details |
| POST | `/api/auth/logout` | — | Logout current user |

### Library & Tracking

| Method | Route | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/library` | ✅ | Fetch own Kanban tracking library |
| GET | `/api/library/stats` | ✅ | Fetch tracking stats for dashboard |
| POST | `/api/library` | ✅ | Add a media title to your tracker |
| PUT | `/api/library/:id` | ✅ | Update tracking progress or status |
| DELETE | `/api/library/:id` | ✅ | Remove title from library |

### Reviews & Reactions

| Method | Route | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/reviews` | — | Get all reviews (filterable by media/user) |
| GET | `/api/reviews/admin/all`| 👮 Admin | Get all database reviews for moderation |
| GET | `/api/reviews/:id` | — | Get detailed view of single review |
| POST | `/api/reviews` | ✅ | Post a new review with ratings (1-10) |
| PUT | `/api/reviews/:id` | ✅ | Update own review details |
| DELETE | `/api/reviews/:id` | ✅ / 👮 | Delete own review (or admin moderated delete) |
| POST | `/api/reviews/:id/vote` | ✅ | Cast Reddit-style upvote or downvote |
| POST | `/api/reviews/:id/react`| ✅ | Toggle reaction emojis (`heart`, `fire`, `zany`) |
| POST | `/api/reviews/:id/like` | ✅ | Toggle upvote (legacy backwards compatibility) |

### Profiles & Settings

| Method | Route | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/users/profile` | ✅ | Get private profile settings |
| PUT | `/api/users/profile` | ✅ | Update profile info (username, bio, avatar) |
| GET | `/api/users/:username`| — | Get public profile data & stats |
| GET | `/api/users` | 👮 Admin | List all database users |
| DELETE | `/api/users/:id` | 👮 Admin | Permanently delete user and their data |
| PUT | `/api/users/:id/role` | 👮 Admin | Update user permissions (user/admin) |

### Watch Parties

| Method | Route | Auth | Description |
|:---|:---|:---:|:---|
| GET | `/api/watchparty` | ✅ | Fetch all current watch parties |
| POST | `/api/watchparty` | ✅ | Create a new seasonal watch party group |

---

## 📄 Pages & Routing

| Route | Auth | Description |
|:---|:---:|:---|
| `/` | — | **Homepage**: Trending, top-rated, and popular anime and manga recommendations |
| `/search` | — | **Search**: Discovery filters for title search, category, and country codes |
| `/anime/:id` | — | **Anime Detail**: Ratings, tabs, character casts, reviews feed, and write review panel |
| `/manga/:id` | — | **Manga Detail**: Overview, reading resources from MangaDex, reviews, and library quick adds |
| `/user/:username`| — | **Public Profile**: Public stats (counts), achievements, and library items |
| `/community` | — | **Community**: Feed showing recently published reviews with reaction and voting capabilities |
| `/library` | ✅ | **Library**: Kanji-themed Kanban lists for custom progression tracking |
| `/stats` | ✅ | **Analytics**: Dynamic charts visualizing user tracking stats |
| `/watchparty` | ✅ | **Watch Party**: Seasonal watchlist tracking |
| `/profile` | ✅ | **Redirect Wrapper**: Automatically reads auth state and routes to `/user/:username` |
| `/settings` | ✅ | **Settings Panel**: Manage account settings, notification preferences, connected profiles, and theme presets |
| `/admin` | 👮 Admin | **Admin Console**: Moderate comments/reviews and update user permission ranks |

---

## 📦 Deployment

### Frontend (Vercel)
1. Build client files locally or during pipeline execution:
   ```bash
   cd client && npm run build
   ```
2. Import client repository to your **Vercel** dashboard.
3. Configure environment variable: `VITE_API_URL=https://your-backend-api.com`

### Backend (Render)
1. Add a new Web Service on **Render** linked to your repository.
2. Set configuration properties:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
3. Add all `.env` environment variables inside the Web Service dashboard configuration.

