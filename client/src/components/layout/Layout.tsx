import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { C } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { searchMedia } from '../../api/anilist';
import type { AniListMedia } from '../../types';
import Sidebar from './Sidebar';
interface TopNavProps {
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  isMobile: boolean;
}

function TopNav({ sidebarOpen, setSidebarOpen, isMobile }: TopNavProps) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [submenuActive, setSubmenuActive] = useState(false);
  const [mangaNavDropdownOpen, setMangaNavDropdownOpen] = useState(false);
  const mangaNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMangaNavMouseEnter = () => {
    if (mangaNavTimeoutRef.current) {
      clearTimeout(mangaNavTimeoutRef.current);
      mangaNavTimeoutRef.current = null;
    }
    setMangaNavDropdownOpen(true);
  };

  const handleMangaNavMouseLeave = () => {
    mangaNavTimeoutRef.current = setTimeout(() => {
      setMangaNavDropdownOpen(false);
    }, 250);
  };

  // Auto-complete suggestions state
  const [suggestions, setSuggestions] = useState<AniListMedia[]>([]);

  // Typewriter placeholder state
  const [placeholderText, setPlaceholderText] = useState('Search ');

  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Typewriter placeholder effect
  useEffect(() => {
    if (focused || q) return; // Pause typewriter when input is active or filled

    const placeholders = [
      'Hunter x Hunter...',
      'Vinland Saga...',
      'Spy x Family...',
      'Frieren...',
      'Jujutsu Kaisen...',
      'Attack on Titan...',
      'Death Note...',
      'Demon Slayer...',
      'Chainsaw Man...',
      'Naruto...'
    ];

    let wordIndex = 0;
    let letterIndex = 0;
    let isDeleting = false;
    let currentText = '';
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const fullWord = placeholders[wordIndex];
      if (isDeleting) {
        currentText = fullWord.substring(0, letterIndex - 1);
        letterIndex--;
      } else {
        currentText = fullWord.substring(0, letterIndex + 1);
        letterIndex++;
      }

      setPlaceholderText(`Search ${currentText}`);

      let delta = 120 - Math.random() * 40; // Typing speed
      if (isDeleting) { delta /= 2; } // Deleting speed

      if (!isDeleting && currentText === fullWord) {
        delta = 1800; // Pause at end
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % placeholders.length;
        delta = 400; // Pause before next word
      }

      timeout = setTimeout(tick, delta);
    };

    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [focused, q]);

  // Suggestions search effect
  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchMedia({ query: q, perPage: 5 })
        .then((res) => {
          setSuggestions(res?.search?.media || []);
        })
        .catch(console.error);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [q]);

  // Close suggestions / notifications / avatar menu on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
        setSubmenuActive(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAvatarMenuOpen(false);
        setSubmenuActive(false);
        setNotifOpen(false);
        setSuggestions([]);
        setMangaNavDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setQ('');
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (media: AniListMedia) => {
    navigate(`/${media.type === 'MANGA' ? 'manga' : 'anime'}/${media.id}`);
    setQ('');
    setSuggestions([]);
  };

  // Removed toggleLang

  // Picks a random Anime or Manga ID and navigates
  const handleRandom = () => {
    const isManga = Math.random() > 0.5;
    const animeIds = [21, 20, 16498, 1535, 101922, 113415, 154587, 5114, 9253, 11061, 140960, 30230, 21511];
    const mangaIds = [30002, 30013, 30021, 30026, 30001, 63326, 85486, 101517, 105778, 108556, 119158, 30642];

    if (isManga) {
      const randomMangaId = mangaIds[Math.floor(Math.random() * mangaIds.length)];
      navigate(`/manga/${randomMangaId}`);
    } else {
      const randomAnimeId = animeIds[Math.floor(Math.random() * animeIds.length)];
      navigate(`/anime/${randomAnimeId}`);
    }
  };

  // Nav buttons visible when sidebar is closed
  const navItems = [
    {
      label: 'Home',
      path: '/',
      active: pathname === '/',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      label: 'Anime',
      path: '/anime',
      active: pathname.startsWith('/anime') || (pathname === '/search' && search.includes('type=ANIME')),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
      ),
    },
    {
      label: 'Manga',
      path: '/manga',
      active: pathname.startsWith('/manga') || (pathname === '/search' && (search.includes('type=MANGA') || search.includes('type=MANHWA') || search.includes('type=MANHUA'))),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ),
    },
    {
      label: 'Discover',
      path: '/search',
      active: pathname === '/search' && !search.includes('type='),
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      ),
    },
  ];

  return (
    <header
      style={{
        height: isMobile ? 65 : 85,
        background: `${C.bg}D9`,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 24px',
        gap: isMobile ? 8 : 16,
        flexShrink: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Far Left: Collapsible Sidebar Trigger (Hone menu button ONLY when closed) & Brand Logo */}
      {(!isMobile || !focused) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="nav-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${C.border}`,
                cursor: 'pointer',
                color: C.text,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                outline: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          {/* Brand Logo in Navbar (Automatically shifts to far left when sidebar is open and menu is hidden) */}
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                boxShadow: `0 4px 10px ${C.accent}40`,
              }}
            >
              ⛩️
            </div>
            {!isMobile && (
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>
                <span style={{ color: C.text }}>Kiroku</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Flashy Search Input & Auto-complete suggestions Container */}
      <div
        ref={searchRef}
        style={{
          flex: 1,
          maxWidth: isMobile && focused ? '100%' : 450,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={focused || q ? (isMobile ? "Search..." : "Search anime, manga, characters...") : placeholderText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flashy-search"
            style={{
              width: '100%',
              padding: '11px 40px 11px 16px', // Spacious padding
              background: 'rgba(0, 0, 0, 0.45)',
              border: `1px solid ${C.border}`,
              borderRadius: 20, // Fully capsule rounded
              color: C.text,
              fontSize: isMobile ? 16 : 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: focused ? C.accentLight : C.muted,
              fontSize: 13,
              pointerEvents: 'none',
              transition: 'color 0.25s',
            }}
          >
            🔍
          </span>
        </div>

        {isMobile && focused && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setQ('');
              setSuggestions([]);
              setFocused(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.accentLight,
              fontSize: 13,
              fontWeight: 600,
              padding: '0 4px',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Cancel
          </button>
        )}

        {/* Dynamic Auto-complete Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(20, 26, 47, 0.96)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.65), 0 0 1px rgba(139,92,246,0.3)',
              overflow: 'hidden',
              zIndex: 220,
              marginTop: 8,
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {suggestions.map((m) => {
              const suggestionTitle = m.title.english || m.title.romaji;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectSuggestion(m)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={m.coverImage.large}
                    alt=""
                    style={{ width: 28, height: 38, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.text,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {suggestionTitle}
                    </p>
                    <p style={{ fontSize: 10, color: C.muted, margin: '2px 0 0' }}>
                      {m.format || m.type || ''} {m.averageScore ? `· ★ ${(m.averageScore / 10).toFixed(1)}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Navigation Pill Items (Rendered ONLY when Sidebar is Closed and not on mobile) */}
      {!sidebarOpen && !isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            padding: 4,
            borderRadius: 16,
            marginLeft: 8,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {navItems.map((item) => {
            if (item.label === 'Manga') {
              return (
                <div
                  key={item.label}
                  onMouseEnter={handleMangaNavMouseEnter}
                  onMouseLeave={handleMangaNavMouseLeave}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={() => navigate(item.path)}
                    className="nav-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 12,
                      border: item.active ? `1px solid ${C.accent}40` : '1px solid transparent',
                      background: item.active ? `${C.accent}20` : 'transparent',
                      color: item.active ? '#FFF' : C.muted,
                      fontSize: 12,
                      fontWeight: item.active ? 700 : 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    {item.icon}
                    {item.label} ▾
                  </button>
                  {mangaNavDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: 140,
                        background: 'rgba(20, 26, 47, 0.96)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${C.border}`,
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(139,92,246,0.3)',
                        padding: '6px 0',
                        zIndex: 220,
                        marginTop: 6,
                        animation: 'fadeIn 0.15s ease-out',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {[
                        { label: '📖 All Manga', path: '/search?type=MANGA' },
                        { label: '🇰🇷 Manhwa', path: '/search?type=MANHWA' },
                        { label: '🇨🇳 Manhua', path: '/search?type=MANHUA' },
                      ].map((subItem) => (
                        <button
                          key={subItem.label}
                          onClick={() => {
                            navigate(subItem.path);
                            if (mangaNavTimeoutRef.current) {
                              clearTimeout(mangaNavTimeoutRef.current);
                              mangaNavTimeoutRef.current = null;
                            }
                            setMangaNavDropdownOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            color: C.text,
                            fontSize: 11,
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${C.accent}20`;
                            e.currentTarget.style.color = '#FFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = C.text;
                          }}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="nav-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 12,
                  border: item.active ? `1px solid ${C.accent}40` : '1px solid transparent',
                  background: item.active ? `${C.accent}20` : 'transparent',
                  color: item.active ? '#FFF' : C.muted,
                  fontSize: 12,
                  fontWeight: item.active ? 700 : 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          {/* Random Anime/Manga Selector Button */}
          <button
            onClick={handleRandom}
            className="nav-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 12,
              border: '1px solid transparent',
              background: 'transparent',
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            Random
          </button>
        </div>
      )}

      {/* Right Side: Language Switcher, Mailbox, Notifications, Profile/Login */}
      {(!isMobile || !focused) && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>

          {/* Language toggle removed */}

          {/* Mailbox (✉️) Button - Linked to redirect to /community */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => navigate('/community')}
                className="nav-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  color: C.text,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                }}
              >
                ✉️
              </button>
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Mailbox
              </span>
            </div>
          )}

          {/* Notification Bell (🔔) Button & Dropdown Container */}
          <div ref={notifRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="nav-btn"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: notifOpen ? `${C.accent}20` : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${notifOpen ? C.accent : C.border}`,
                cursor: 'pointer',
                color: notifOpen ? C.accentLight : C.text,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
              }}
            >
              🔔
            </button>
            {!isMobile && (
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Notif
              </span>
            )}

            {/* Premium Glassmorphic Notifications Dropdown */}
            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 0,
                  width: 290,
                  background: 'rgba(20, 26, 47, 0.96)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 1px rgba(139, 92, 246, 0.4)',
                  padding: '12px 0',
                  zIndex: 200,
                  animation: 'fadeIn 0.15s ease-out',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    padding: '0 16px 8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>Notifications</h3>
                  <span
                    style={{ fontSize: 9.5, color: C.accentLight, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => setNotifOpen(false)}
                  >
                    Mark all read
                  </span>
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {[
                    { title: '📺 Airing Update', text: 'Ep 11 of Witch Hat Atelier is now streaming live!', time: '2h ago' },
                    { title: '💖 Review Liked', text: 'Raghav liked your review of ONE PIECE.', time: '5h ago' },
                    { title: '📅 Watch Party Alert', text: 'Your upcoming watch party starts in 1 hour!', time: '1d ago' },
                  ].map((n, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 16px',
                        borderBottom: idx === 2 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{n.title}</p>
                      <p style={{ fontSize: 10, color: C.muted, margin: '0 0 4px', lineHeight: 1.4 }}>{n.text}</p>
                      <span style={{ fontSize: 8.5, color: C.accentLight, fontWeight: 700 }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Login / Active User Profile Card */}
          <div ref={avatarMenuRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }}>
            {user ? (
              <>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(!avatarMenuOpen);
                    setSubmenuActive(false);
                  }}
                  className="nav-btn"
                  aria-haspopup="true"
                  aria-expanded={avatarMenuOpen}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: user.avatar ? undefined : `linear-gradient(135deg,${C.accent},#06b6d4)`,
                    border: `2px solid ${avatarMenuOpen ? C.accent : `${C.accent}60`}`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    outline: 'none',
                    padding: 0,
                    boxShadow: avatarMenuOpen ? `0 0 12px ${C.accent}80` : 'none',
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '🦊'
                  )}
                </button>
                {!isMobile && (
                  <span
                    style={{
                      fontSize: 9,
                      color: C.text,
                      fontWeight: 700,
                      maxWidth: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.username}
                  </span>
                )}

                {/* Premium Glassmorphic Avatar Dropdown Menu */}
                {avatarMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 50,
                      right: 0,
                      width: 220,
                      background: `${C.bg2}FB`,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 1px rgba(139, 92, 246, 0.4)',
                      padding: '8px 0',
                      zIndex: 200,
                      animation: 'fadeIn 0.15s ease-out',
                      textAlign: 'left',
                      overflow: 'hidden',
                    }}
                  >
                    {/* MAIN MENU */}
                    {!submenuActive ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={() => {
                            navigate(`/user/${user.username}`);
                            setAvatarMenuOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            color: C.text,
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 16 }}>👤</span>
                          <span>Profile</span>
                        </div>

                        {user.role === 'admin' && (
                          <div
                            onClick={() => {
                              navigate('/admin');
                              setAvatarMenuOpen(false);
                            }}
                            style={{
                              padding: '10px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              cursor: 'pointer',
                              color: C.accentLight,
                              fontSize: 13,
                              fontWeight: 600,
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontSize: 16 }}>🛡️</span>
                            <span>Admin Panel</span>
                          </div>
                        )}

                        <div
                          onClick={() => {
                            navigate('/settings');
                            setAvatarMenuOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            color: C.text,
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 16 }}>⚙️</span>
                          <span>Settings</span>
                        </div>

                        <div
                          onClick={() => setSubmenuActive(true)}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            color: C.text,
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 16 }}>🎨</span>
                            <span>Theme</span>
                          </div>
                          <span style={{ fontSize: 12, color: C.muted }}>➔</span>
                        </div>

                        <div
                          style={{
                            height: 1,
                            background: 'rgba(255, 255, 255, 0.06)',
                            margin: '6px 0',
                          }}
                        />

                        <div
                          onClick={() => {
                            logout();
                            setAvatarMenuOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            color: C.danger,
                            fontSize: 13,
                            fontWeight: 600,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 16 }}>↩️</span>
                          <span>Logout</span>
                        </div>
                      </div>
                    ) : (
                      /* THEME SUBMENU */
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={() => setSubmenuActive(false)}
                          style={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            color: C.accentLight,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            marginBottom: 4,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span>⬅ Back</span>
                        </div>

                        {themes.map((t) => {
                          const isCurrent = t.id === theme;
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setTheme(t.id);
                                setAvatarMenuOpen(false);
                                setSubmenuActive(false);
                              }}
                              style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                color: isCurrent ? C.accentLight : C.text,
                                fontSize: 13,
                                fontWeight: isCurrent ? 700 : 500,
                                background: isCurrent ? `${C.accent}12` : 'transparent',
                                transition: 'background 0.2s, color 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = isCurrent ? `${C.accent}20` : 'rgba(255, 255, 255, 0.05)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = isCurrent ? `${C.accent}12` : 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                                <span>{t.name}</span>
                              </div>
                              {isCurrent && <span style={{ fontSize: 13, fontWeight: 800, color: C.accentLight }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="nav-btn"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    color: C.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                {!isMobile && (
                  <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Login
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Layout() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      key={theme}
      style={{
        display: 'flex',
        height: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Outfit', sans-serif",
        overflow: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        
        /* Smooth transitions for theme switching */
        body, #root, div, header, aside, main, button, input, span, p, h1, h2, h3, h4, h5, h6 {
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease, box-shadow 0.3s ease;
        }

        input::placeholder { color: var(--ov-muted); }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        
        .nav-btn {
          transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .nav-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 12px var(--ov-borderHover);
        }
        
        .flashy-search {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease, transform 0.2s ease;
        }
        .flashy-search:hover {
          transform: translateY(-1px) scale(1.008);
          border-color: var(--ov-borderHover);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(0,0,0,0.4);
        }
        .flashy-search:focus {
          transform: translateY(-1px) scale(1.008);
          border-color: var(--ov-accent) !important;
          box-shadow: 0 0 16px var(--ov-borderHover), inset 0 2px 4px rgba(0,0,0,0.6) !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>

      {sidebarOpen && <Sidebar setSidebarOpen={setSidebarOpen} isMobile={isMobile} />}

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s',
          }}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '12px 10px 80px' : '22px 24px 32px',
            animation: 'fadeIn 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 1200 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
