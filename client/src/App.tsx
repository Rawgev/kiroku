import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetail from './pages/AnimeDetail';
import MangaDetail from './pages/MangaDetail';
import Library from './pages/Library';
import Stats from './pages/Stats';
import { Profile, Community, WatchPartyPage, Login, Register, OAuthCallback, Admin } from './pages/Pages';
import { C } from './constants/colors';

// ── Protected route wrapper ────────────────────────────────────────────────
function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{
        width: 40, height: 40, border: `3px solid ${C.accent}`, borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Admin route wrapper ────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
}

// ── BUG FIX #2: /profile redirect ─────────────────────────────────────────
// The old code rendered <Profile /> directly at /profile, but Profile reads
// useParams().username — which is undefined on /profile (no :username segment).
// This caused the page to always show "User not found."
// Fix: redirect to /user/:username using the logged-in user's actual username.
function ProfileRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/user/${user.username}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>
        <Routes>
          {/* Public auth routes — no sidebar layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* App routes — inside sidebar layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/anime" element={<Navigate to="/search?type=ANIME" replace />} />
            <Route path="/manga" element={<Navigate to="/search?type=MANGA" replace />} />
            <Route path="/search" element={<Search />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/manga/:id" element={<MangaDetail />} />
            <Route path="/user/:username" element={<Profile />} />
            <Route path="/community" element={<Community />} />

            {/* Protected routes */}
            <Route path="/library" element={<Protected><Library /></Protected>} />
            <Route path="/stats" element={<Protected><Stats /></Protected>} />
            <Route path="/watchparty" element={<Protected><WatchPartyPage /></Protected>} />
            {/* BUG FIX #2: /profile now uses ProfileRedirect which reads the logged-in
                user's username from auth context and redirects to /user/:username.
                Before this fix, Profile received useParams().username = undefined
                and always showed "User not found." */}
            <Route path="/profile" element={<Protected><ProfileRedirect /></Protected>} />

            {/* Admin */}
            <Route path="/admin" element={<Protected><AdminRoute><Admin /></AdminRoute></Protected>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
