'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Play,
  BookOpen,
  Compass,
  MessageSquare,
  Calendar,
  BarChart3,
  Shield,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { Icon: Home, label: 'Home', path: '/' },
  { Icon: Compass, label: 'Discover', path: '/search' },
  { Icon: Play, label: 'Anime', path: '/anime' },
  { Icon: BookOpen, label: 'Manga', path: '/manga' },
  { Icon: MessageSquare, label: 'Community', path: '/community' },
  { Icon: Calendar, label: 'Watch Party', path: '/watchparty' },
  { Icon: BarChart3, label: 'Stats', path: '/stats' },
];

const LIBRARY = [
  { dot: '#38BDF8', label: 'Watching', path: '/library?status=watching' },
  { dot: '#10B981', label: 'Completed', path: '/library?status=completed' },
  { dot: '#F59E0B', label: 'On Hold', path: '/library?status=on_hold' },
  { dot: '#EF4444', label: 'Dropped', path: '/library?status=dropped' },
  { dot: '#6B7280', label: 'Plan to Watch', path: '/library?status=plan_to_watch' },
  { dot: '#7DD3FC', label: 'Reading', path: '/library?status=reading' },
  { dot: '#6B7280', label: 'Plan to Read', path: '/library?status=plan_to_read' },
];

interface SidebarProps {
  setSidebarOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export default function Sidebar({ setSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const navigate = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? '?' + searchParams.toString() : '';
  const { user, logout } = useAuth();
  const current = pathname + search;
  const [mangaExpanded, setMangaExpanded] = useState(false);

  const items = user?.role === 'admin'
    ? [...NAV, { Icon: Shield, label: 'Admin Panel', path: '/admin' }]
    : NAV;

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className="fixed top-0 bottom-0 left-0 w-[264px] z-[999] bg-[#0B0D12]/90 backdrop-blur-xl border-r border-[#F5F5F2]/12 flex flex-col overflow-y-auto shadow-2xl"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-[#F5F5F2]/10">
        <button
          onClick={() => navigate('/')}
          className="bg-transparent border-none p-0 cursor-pointer text-[#F5F5F2] text-[20px] font-bold tracking-wide uppercase"
        >
          KIROKU
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          className="w-8 h-8 rounded-full bg-[#F5F5F2]/8 hover:bg-[#F5F5F2]/15 border border-[#F5F5F2]/12 text-[#F5F5F2] flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 pt-4 flex flex-col gap-0.5">
        {items.map((item) => {
          const isAnime = item.path === '/anime';
          const isManga = item.path === '/manga';
          const isHome = item.path === '/';
          const isDiscover = item.path === '/search';

          const active = isHome
            ? pathname === '/'
            : isAnime
              ? pathname.startsWith('/anime') || (pathname === '/search' && current.includes('type=ANIME'))
              : isManga
                ? pathname.startsWith('/manga') ||
                  (pathname === '/search' &&
                    (current.includes('type=MANGA') ||
                      current.includes('type=MANHWA') ||
                      current.includes('type=MANHUA')))
                : isDiscover
                  ? pathname === '/search' && !current.includes('type=')
                  : pathname.startsWith(item.path);

          const Icon = item.Icon;

          return (
            <div key={item.label} className="flex flex-col">
              <div
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#F5F5F2]/12 text-[#F5F5F2]'
                    : 'text-[#F5F5F2]/70 hover:bg-[#F5F5F2]/6 hover:text-[#F5F5F2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={2} />
                  <span className={`text-[14px] ${active ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>
                {isManga && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMangaExpanded(!mangaExpanded);
                    }}
                    className="bg-transparent border-none p-1 text-[#F5F5F2]/60 hover:text-[#F5F5F2] cursor-pointer"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${mangaExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                )}
              </div>

              {isManga && mangaExpanded && (
                <div className="pl-9 pr-2 py-1 flex flex-col gap-0.5">
                  {[
                    { label: 'All Manga', path: '/search?type=MANGA' },
                    { label: 'Manhwa', path: '/search?type=MANHWA' },
                    { label: 'Manhua', path: '/search?type=MANHUA' },
                  ].map((sub) => {
                    const subActive = current.includes(sub.path);
                    return (
                      <button
                        key={sub.label}
                        onClick={() => navigate(sub.path)}
                        className={`text-left px-3 py-1.5 rounded-lg text-[12.5px] bg-transparent border-none cursor-pointer transition-colors ${
                          subActive
                            ? 'text-[#38BDF8] font-bold bg-[#38BDF8]/10'
                            : 'text-[#F5F5F2]/60 hover:text-[#F5F5F2] font-medium'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Library */}
      <div className="px-3 pt-5">
        <p className="text-[11px] font-bold text-[#F5F5F2]/45 uppercase tracking-wider px-3 mb-2">
          My Library
        </p>
        <div className="flex flex-col gap-0.5">
          {LIBRARY.map((item) => {
            const active = current === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-none cursor-pointer text-left transition-colors ${
                  active
                    ? 'bg-[#F5F5F2]/12 text-[#F5F5F2] font-semibold'
                    : 'bg-transparent text-[#F5F5F2]/65 hover:bg-[#F5F5F2]/6 hover:text-[#F5F5F2]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.dot }}
                />
                <span className="text-[13px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom Profile Card */}
      <div className="p-3.5 border-t border-[#F5F5F2]/10 mt-4">
        {user ? (
          <div className="p-3 rounded-2xl bg-[#13161F] border border-[#F5F5F2]/12">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full shrink-0 bg-[#181C26] border border-[#F5F5F2]/15 flex items-center justify-center overflow-hidden text-sm font-bold text-[#F5F5F2]">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.username[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#F5F5F2] m-0 truncate">{user.username}</p>
                <p className="text-[11px] text-[#38BDF8] m-0 font-medium">Level {user.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => navigate(`/user/${user.username}`)}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#F5F5F2]/10 hover:bg-[#F5F5F2]/16 border border-[#F5F5F2]/12 text-[#F5F5F2] text-[12px] font-semibold cursor-pointer transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className="p-1.5 rounded-lg bg-[#F5F5F2]/8 hover:bg-[#F5F5F2]/15 border border-[#F5F5F2]/12 text-[#F5F5F2]/80 cursor-pointer"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                aria-label="Log out"
                className="p-1.5 rounded-lg bg-[#EF4444]/12 hover:bg-[#EF4444]/22 border border-[#EF4444]/25 text-[#EF4444] cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-full bg-[#F5F5F2] text-[#0B0D12] text-[13.5px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        )}
      </div>
    </motion.aside>
  );
}
