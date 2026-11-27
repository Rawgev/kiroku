'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeId = 'midnight' | 'sakura' | 'shrine' | 'archive';

export interface ThemePalette {
  bg: string;
  bg2: string;
  card: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  text: string;
  muted: string;
  border: string;
  borderHover: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  palette: ThemePalette;
}

const THEMES: Record<ThemeId, ThemeMeta> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    description: 'Cinematic obsidian & frosted glass',
    palette: {
      bg: '#0B0D12',
      bg2: '#13161F',
      card: '#181C26',
      accent: '#38BDF8',
      accentLight: '#7DD3FC',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#38BDF8',
      text: '#F5F5F2',
      muted: 'rgba(245, 245, 242, 0.68)',
      border: 'rgba(245, 245, 242, 0.12)',
      borderHover: 'rgba(245, 245, 242, 0.28)',
    },
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    description: 'Cherry blossom pink elegance',
    palette: {
      bg: '#1A0F1E',
      bg2: '#241828',
      card: '#2E1F34',
      accent: '#F472B6',
      accentLight: '#F9A8D4',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#FB7185',
      info: '#A78BFA',
      text: '#FDF2F8',
      muted: '#C4A8C8',
      border: 'rgba(244, 114, 182, 0.18)',
      borderHover: 'rgba(244, 114, 182, 0.4)',
    },
  },
  shrine: {
    id: 'shrine',
    name: 'Shrine',
    emoji: '⛩️',
    description: 'Torii gate red, strong contrast',
    palette: {
      bg: '#0A0A0A',
      bg2: '#141414',
      card: '#1E1E1E',
      accent: '#DC2626',
      accentLight: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#FF6B6B',
      info: '#60A5FA',
      text: '#FAFAFA',
      muted: '#A3A3A3',
      border: 'rgba(220, 38, 38, 0.18)',
      borderHover: 'rgba(220, 38, 38, 0.4)',
    },
  },
  archive: {
    id: 'archive',
    name: 'Archive',
    emoji: '📜',
    description: 'Parchment & gold, chronicles of old',
    palette: {
      bg: '#1C1A15',
      bg2: '#252218',
      card: '#2E2A20',
      accent: '#D4A853',
      accentLight: '#E8C87A',
      success: '#6B8E23',
      warning: '#DAA520',
      danger: '#CD5C5C',
      info: '#B8860B',
      text: '#F5E6C8',
      muted: '#A89B7A',
      border: 'rgba(212, 168, 83, 0.18)',
      borderHover: 'rgba(212, 168, 83, 0.4)',
    },
  },
};

const CSS_VAR_PREFIX = '--ov-';

function applyThemeToDOM(palette: ThemePalette) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`${CSS_VAR_PREFIX}${key}`, value);
  }
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeMeta[];
  currentTheme: ThemeMeta;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'ov_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('midnight');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in THEMES) {
        setThemeState(stored as ThemeId);
      }
    } catch { /* ignore */ }
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    applyThemeToDOM(THEMES[theme].palette);
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    themes: Object.values(THEMES),
    currentTheme: THEMES[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export { THEMES };
