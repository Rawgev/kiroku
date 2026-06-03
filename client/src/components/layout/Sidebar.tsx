import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { GlassEffect, GlassFilter } from '../ui/liquid-glass';

const NAV = [
  { icon: '⊞', label: 'Home', path: '/' },
  { icon: '▶', label: 'Anime', path: '/anime' },
  { icon: '📖', label: 'Manga', path: '/manga' },
  { icon: '🔭', label: 'Discover', path: '/search' },
  { icon: '💬', label: 'Community', path: '/community' },
  { icon: '📅', label: 'Watch Party', path: '/watchparty' },
  { icon: '📊', label: 'Stats', path: '/stats' },
];

const LIBRARY = [
  { dot: C.accent, label: 'Watching', path: '/library?status=watching' },
  { dot: C.success, label: 'Completed', path: '/library?status=completed' },
  { dot: C.warning, label: 'On Hold', path: '/library?status=on_hold' },
  { dot: C.danger, label: 'Dropped', path: '/library?status=dropped' },
  { dot: '#6B7280', label: 'Plan to Watch', path: '/library?status=plan_to_watch' },
  { dot: '#3B82F6', label: 'Reading', path: '/library?status=reading' },
  { dot: '#6B7280', label: 'Plan to Read', path: '/library?status=plan_to_read' },
];

interface SidebarProps {
  setSidebarOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export default function Sidebar({ setSidebarOpen, isMobile = false }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const current = pathname + search;
  const [mangaExpanded, setMangaExpanded] = useState(true);

  return (
    <aside style={{
      width: 220, background: C.bg2, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      ...(isMobile ? {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        boxShadow: '0 0 40px rgba(0,0,0,0.8)',
      } : {})
    }}>

      {/* Close Menu Button (Matching Image 4) */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <GlassEffect
          onClick={() => setSidebarOpen(false)}
          className="nav-btn"
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '999px',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            color: '#FFF',
            fontSize: '17px',
            fontWeight: 700,

            whiteSpace: 'nowrap', // prevents text wrapping
            overflow: 'hidden',

            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 8 }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>

          Close Menu
        </GlassEffect>
      </div>
      {/* Main nav */}
      <nav style={{ padding: '10px 8px 0' }}>
        {NAV.map((item) => {
          const isAnime = item.path === '/anime';
          const isManga = item.path === '/manga';
          const isHome = item.path === '/';
          const isDiscover = item.path === '/search';

          const active = isHome
            ? pathname === '/'
            : isAnime
              ? pathname.startsWith('/anime') || (pathname === '/search' && current.includes('type=ANIME'))
              : isManga
                ? pathname.startsWith('/manga') || (pathname === '/search' && (current.includes('type=MANGA') || current.includes('type=MANHWA') || current.includes('type=MANHUA')))
                : isDiscover
                  ? pathname === '/search' && !current.includes('type=')
                  : pathname.startsWith(item.path);

          if (isManga) {
            return (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <NavRow
                  item={item}
                  active={active}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  suffix={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMangaExpanded(!mangaExpanded);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: C.muted,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        transition: 'transform 0.2s',
                        transform: mangaExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      }}
                    >
                      ▼
                    </button>
                  }
                />
                {/* Indented sub-items under Manga */}
                {mangaExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 16, marginTop: 2, marginBottom: 4 }}>
                    {[
                      { icon: '📖', label: 'All Manga', path: '/search?type=MANGA' },
                      { icon: '🇰🇷', label: 'Manhwa', path: '/search?type=MANHWA' },
                      { icon: '🇨🇳', label: 'Manhua', path: '/search?type=MANHUA' },
                    ].map((sub) => {
                      const subActive = current.includes(sub.path);
                      return (
                        <NavRowSub
                          key={sub.label}
                          item={sub}
                          active={subActive}
                          onClick={() => {
                            navigate(sub.path);
                            if (isMobile) setSidebarOpen(false);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavRow
              key={item.label}
              item={item}
              active={active}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setSidebarOpen(false);
              }}
            />
          );
        })}
      </nav>

      {/* Library */}
      <div style={{ padding: '14px 8px 0' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
          letterSpacing: '0.1em', paddingLeft: 10, marginBottom: 4
        }}>My Library</p>
        {LIBRARY.map((item) => {
          const active = current === item.path;
          return (
            <div key={item.label} onClick={() => {
              navigate(item.path);
              if (isMobile) setSidebarOpen(false);
            }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: active ? `${C.accent}15` : 'transparent', transition: 'background 0.15s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot }} />
                <span style={{ fontSize: 12, color: active ? C.text : C.muted }}>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Profile card */}
      {user ? (
        <div style={{
          margin: 10, padding: 12, background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: user.avatar ? undefined : `linear-gradient(135deg,${C.accent},#06b6d4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              fontSize: 18
            }}>
              {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🦊'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 700, color: C.text, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{user.username}</p>
              <p style={{ fontSize: 11, color: C.accent, margin: 0 }}>✨ Level {user.level}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => {
              navigate(`/user/${user.username}`);
              if (isMobile) setSidebarOpen(false);
            }}
              style={{
                flex: 1, padding: '6px 0', background: `${C.accent}20`, border: `1px solid ${C.accent}50`,
                borderRadius: 8, color: C.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Profile
            </button>
            <button onClick={logout}
              style={{
                padding: '6px 10px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`,
                borderRadius: 8, color: C.danger, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              ↩
            </button>
          </div>
        </div>
      ) : (
        <div style={{ margin: 10 }}>
          <button onClick={() => {
            navigate('/login');
            if (isMobile) setSidebarOpen(false);
          }}
            style={{
              width: '100%', padding: '9px 0', background: C.accent, border: 'none',
              borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
            }}>
            Sign In
          </button>
        </div>
      )}
      {/* Glass SVG Filter definition required for the distortion effect */}
      <GlassFilter />
    </aside>
  );
}


function NavRow({
  item,
  active,
  onClick,
  suffix
}: {
  item: { icon: string; label: string };
  active: boolean;
  onClick: () => void;
  suffix?: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 10, cursor: 'pointer', marginBottom: 2,
        background: active ? `${C.accent}22` : hov ? `${C.accent}0F` : 'transparent',
        borderLeft: `3px solid ${active ? C.accent : 'transparent'}`, transition: 'all 0.15s',
        position: 'relative'
      }}>
      <span style={{ fontSize: 15 }}>{item.icon}</span>
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text : C.muted }}>
        {item.label}
      </span>
      {suffix && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

function NavRowSub({ item, active, onClick }: { item: { icon: string; label: string }; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
        borderRadius: 8, cursor: 'pointer', marginBottom: 2,
        background: active ? `${C.accent}15` : hov ? `${C.accent}0A` : 'transparent',
        transition: 'all 0.15s'
      }}>
      <span style={{ fontSize: 12 }}>{item.icon}</span>
      <span style={{ fontSize: 11.5, fontWeight: active ? 600 : 500, color: active ? C.text : C.muted }}>
        {item.label}
      </span>
    </div>
  );
}
