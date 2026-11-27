'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { searchMedia } from '@/api/anilist';
import type { AniListMedia } from '@/types';
import Sidebar from './Sidebar';

interface TopNavProps {
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  isMobile: boolean;
  isScrolled: boolean;
}

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Discover', path: '/search' },
  { label: 'Anime', path: '/search?type=ANIME' },
  { label: 'Manga', path: '/search?type=MANGA' },
];

function TopNav({ sidebarOpen, setSidebarOpen, isMobile, isScrolled }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<AniListMedia[]>([]);

  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { user } = useAuth();
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const current = pathname + search;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQ('');
      setSuggestions([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      searchMedia({ query: trimmed, perPage: 6 })
        .then((res) => setSuggestions(res.search.media || []))
        .catch(() => setSuggestions([]));
    }, 280);
    return () => clearTimeout(timer);
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
    }
  };

  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/search') return pathname === '/search' && !current.includes('type=');
    if (path.includes('type=ANIME')) {
      return pathname.startsWith('/anime') || current.includes('type=ANIME');
    }
    if (path.includes('type=MANGA')) {
      return (
        pathname.startsWith('/manga') ||
        current.includes('type=MANGA') ||
        current.includes('type=MANHWA') ||
        current.includes('type=MANHUA')
      );
    }
    return pathname === path;
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-[padding] duration-300 ${
          isScrolled ? 'pt-4 px-4' : isMobile ? 'pt-6 px-6' : 'pt-[37px] px-[80px]'
        }`}
      >
        <motion.header
          layout
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className={`pointer-events-auto flex items-center ${
            isScrolled
              ? 'w-auto rounded-full bg-[#0B0D12]/75 backdrop-blur-md border border-[#F5F5F2]/15 px-7 py-3 shadow-2xl gap-6'
              : 'w-full max-w-[1440px] justify-between bg-transparent'
          }`}
        >
          {/* Left Group (Brand + Nav Links) */}
          <motion.div
            layout
            className={`flex items-center ${isScrolled ? 'gap-6' : isMobile ? 'gap-5' : 'gap-[64px]'}`}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!isScrolled && (
                <motion.button
                  key="brand-logo"
                  layout
                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  onClick={() => navigate('/')}
                  className="bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2] text-[24px] font-bold leading-none uppercase whitespace-nowrap shrink-0"
                >
                  KIROKU
                </motion.button>
              )}
            </AnimatePresence>

            {!isMobile && (
              <motion.nav
                layout
                onMouseLeave={() => setHoveredNav(null)}
                className={`flex items-center ${isScrolled ? 'gap-2' : 'gap-3'}`}
              >
                {NAV_LINKS.map((item) => {
                  const active = isLinkActive(item.path);
                  const isHovered = hoveredNav === item.label;
                  return (
                    <motion.button
                      key={item.label}
                      layout="position"
                      onClick={() => navigate(item.path)}
                      onMouseEnter={() => setHoveredNav(item.label)}
                      animate={{ scale: isHovered ? 1.08 : 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.6 }}
                      className={`relative bg-transparent border-none px-3.5 py-1.5 cursor-pointer font-bold leading-none text-[#F5F5F2] whitespace-nowrap transition-opacity duration-150 ${
                        isScrolled ? 'text-[16px]' : 'text-[22px]'
                      } ${active || isHovered ? 'opacity-100' : 'opacity-85'}`}
                    >
                      {isHovered && (
                        <motion.span
                          layoutId="nav-hover-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
                          className="absolute inset-0 rounded-full bg-[#F5F5F2]/12 backdrop-blur-md border border-[#F5F5F2]/20 shadow-[0_4px_16px_rgba(0,0,0,0.25)] pointer-events-none"
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </motion.button>
                  );
                })}
              </motion.nav>
            )}
          </motion.div>

          {/* Right Group (Search, Menu, Profile Icons) */}
          <motion.div layout className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2] flex items-center justify-center"
            >
              <Search size={isScrolled ? 19 : 22} strokeWidth={2} />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open menu"
              className="bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2] flex items-center justify-center"
            >
              <svg
                width={isScrolled ? 19 : 22}
                height={isScrolled ? 19 : 22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="11" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <button
              onClick={() => navigate(user ? `/user/${user.username}` : '/login')}
              aria-label="Profile"
              className="bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2] flex items-center justify-center"
            >
              <User size={isScrolled ? 19 : 22} strokeWidth={2} />
            </button>
          </motion.div>
        </motion.header>
      </div>

      {/* Minimal Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[1000] flex justify-center items-start pt-[90px] px-4 bg-[#0B0D12]/80 backdrop-blur-md"
        >
          <div
            ref={searchBoxRef}
            className="w-full max-w-[560px] bg-[#13161F] border border-[#F5F5F2]/15 rounded-2xl p-3.5 shadow-2xl"
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2.5">
              <Search size={18} className="text-[#F5F5F2]/70 shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search anime, manga, characters..."
                className="flex-1 bg-transparent border-none outline-none text-[#F5F5F2] text-[15px] py-2 px-1"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="bg-[#F5F5F2]/10 border-none rounded-lg text-[#F5F5F2] text-[11px] py-1.5 px-2 cursor-pointer"
              >
                ESC
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="mt-2.5 border-t border-[#F5F5F2]/10 pt-2 flex flex-col gap-1 max-h-[340px] overflow-y-auto">
                {suggestions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      navigate(`/${m.type === 'MANGA' ? 'manga' : 'anime'}/${m.id}`);
                      setSearchOpen(false);
                    }}
                    className="flex items-center gap-3 py-2 px-2.5 bg-transparent hover:bg-[#F5F5F2]/10 border-none rounded-[10px] cursor-pointer text-left w-full"
                  >
                    {m.coverImage?.large && (
                      <img
                        src={m.coverImage.large}
                        alt=""
                        className="w-[34px] h-[48px] rounded-md object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-[#F5F5F2] m-0 truncate">
                        {m.title.english || m.title.romaji}
                      </p>
                      <p className="text-[12px] text-[#F5F5F2]/65 mt-0.5 mb-0">
                        {m.type} {m.format ? `• ${m.format}` : ''} {m.averageScore ? `• ★ ${(m.averageScore / 10).toFixed(1)}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY >= 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      key={theme}
      className="flex flex-col min-h-screen bg-[#0B0D12] text-[#F5F5F2] overflow-x-hidden"
    >
      <TopNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isScrolled={isScrolled}
      />

      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-[998] backdrop-blur-sm"
          />
          <Sidebar setSidebarOpen={setSidebarOpen} isMobile={true} />
        </>
      )}

      <main
        className={
          isHome
            ? 'flex-1 w-full'
            : isMobile
              ? 'flex-1 w-full max-w-[1440px] mx-auto pt-[88px] px-6 pb-16'
              : 'flex-1 w-full max-w-[1440px] mx-auto pt-[110px] px-[80px] pb-12'
        }
      >
        {children}
      </main>
    </div>
  );
}
