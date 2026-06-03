# ⛩️ Kiroku

A full-stack anime & manga tracking platform — MERN + TypeScript.

## Stack
- **Frontend**: React 18 + Vite + TypeScript + Recharts
- **Backend**: Express + TypeScript + Passport.js
- **Database**: MongoDB Atlas
- **Auth**: JWT + Google OAuth + GitHub OAuth + Email/Password
- **APIs**: AniList (GraphQL), MangaDex (REST) — both free, no key needed

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd Kiroku

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → Create free cluster
2. Database Access → Add user with read/write permissions
3. Network Access → Add IP `0.0.0.0/0` (allow all) for dev
4. Connect → Drivers → Copy connection string

### 3. Google OAuth Setup

1. https://console.cloud.google.com → New Project
2. APIs & Services → OAuth consent screen → External
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret

### 4. GitHub OAuth Setup

1. https://github.com/settings/developers → New OAuth App
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID → Generate Client Secret

### 5. Server Environment

```bash
cd server
cp .env.example .env
# Fill in all values in .env
```

Required `.env` values:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=any_long_random_string
SESSION_SECRET=another_long_random_string
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 6. Run

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm run dev
```

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register with email |
| POST | `/api/auth/login` | — | Login with email |
| GET | `/api/auth/google` | — | Google OAuth |
| GET | `/api/auth/github` | — | GitHub OAuth |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/library` | ✅ | Get own library |
| GET | `/api/library/stats` | ✅ | Get own stats |
| POST | `/api/library` | ✅ | Add entry |
| PUT | `/api/library/:id` | ✅ | Update entry |
| DELETE | `/api/library/:id` | ✅ | Remove entry |
| GET | `/api/reviews` | — | List reviews |
| POST | `/api/reviews` | ✅ | Create review |
| POST | `/api/reviews/:id/like` | ✅ | Toggle like |
| GET | `/api/users/:username` | — | Public profile |
| PUT | `/api/users/profile` | ✅ | Update profile |
| GET | `/api/watchparty` | ✅ | Get watch parties |
| POST | `/api/watchparty` | ✅ | Create watch party |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — trending, top rated, popular manga |
| `/search` | Search anime/manga with filters |
| `/anime/:id` | Anime detail + characters + recommendations |
| `/manga/:id` | Manga detail + MangaDex read links |
| `/library` | Personal kanban-style library |
| `/stats` | Analytics dashboard with charts |
| `/user/:username` | Public user profile |
| `/community` | Social activity feed |
| `/watchparty` | Seasonal watchlist tracker |
| `/admin` | Admin dashboard (admin role only) |

---

## Deploy

**Frontend → Vercel**
```bash
cd client && npm run build
# Push to GitHub → Import on vercel.com
# Set env: VITE_API_URL=https://your-backend.com
```

**Backend → Render**
```bash
# render.com → New Web Service → Connect GitHub repo
# Build: cd server && npm install && npm run build
# Start: node server/dist/index.js
# Add all .env variables in Render dashboard
```
