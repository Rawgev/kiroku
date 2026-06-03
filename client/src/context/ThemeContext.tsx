import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Theme Type Definitions ──────────────────────────────────────────────

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

// ── Theme Palettes ──────────────────────────────────────────────────────

const THEMES: Record<ThemeId, ThemeMeta> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    description: 'Deep navy with purple accents',
    palette: {
      bg:          '#0B1020',
      bg2:         '#141A2F',
      card:        '#1B223C',
      accent:      '#8B5CF6',
      accentLight: '#A78BFA',
      success:     '#10B981',
      warning:     '#F59E0B',
      danger:      '#EF4444',
      info:        '#3B82F6',
      text:        '#FFFFFF',
      muted:       '#A0AEC0',
      border:      'rgba(139, 92, 246, 0.18)',
      borderHover: 'rgba(139, 92, 246, 0.4)',
    },
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    description: 'Cherry blossom pink elegance',
    palette: {
      bg:          '#1A0F1E',
      bg2:         '#241828',
      card:        '#2E1F34',
      accent:      '#F472B6',
      accentLight: '#F9A8D4',
      success:     '#34D399',
      warning:     '#FBBF24',
      danger:      '#FB7185',
      info:        '#A78BFA',
      text:        '#FDF2F8',
      muted:       '#C4A8C8',
      border:      'rgba(244, 114, 182, 0.18)',
      borderHover: 'rgba(244, 114, 182, 0.4)',
    },
  },
  shrine: {
    id: 'shrine',
    name: 'Shrine',
    emoji: '⛩️',
    description: 'Torii gate red, strong contrast',
    palette: {
      bg:          '#0A0A0A',
      bg2:         '#141414',
      card:        '#1E1E1E',
      accent:      '#DC2626',
      accentLight: '#EF4444',
      success:     '#22C55E',
      warning:     '#F59E0B',
      danger:      '#FF6B6B',
      info:        '#60A5FA',
      text:        '#FAFAFA',
      muted:       '#A3A3A3',
      border:      'rgba(220, 38, 38, 0.18)',
      borderHover: 'rgba(220, 38, 38, 0.4)',
    },
  },
  archive: {
    id: 'archive',
    name: 'Archive',
    emoji: '📜',
    description: 'Parchment & gold, chronicles of old',
    palette: {
      bg:          '#1C1A15',
      bg2:         '#252218',
      card:        '#2E2A20',
      accent:      '#D4A853',
      accentLight: '#E8C87A',
      success:     '#6B8E23',
      warning:     '#DAA520',
      danger:      '#CD5C5C',
      info:        '#B8860B',
      text:        '#F5E6C8',
      muted:       '#A89B7A',
      border:      'rgba(212, 168, 83, 0.18)',
      borderHover: 'rgba(212, 168, 83, 0.4)',
    },
  },
};

// ── CSS Custom Property Helpers ─────────────────────────────────────────

const CSS_VAR_PREFIX = '--ov-';

function applyThemeToDOM(palette: ThemePalette) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`${CSS_VAR_PREFIX}${key}`, value);
  }
}

// ── Context ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeMeta[];
  currentTheme: ThemeMeta;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'ov_theme';

function getInitialTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in THEMES) return stored as ThemeId;
  } catch { /* ignore */ }
  return 'midnight';
}

// ── Provider ────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch { /* ignore */ }
  };

  // Apply CSS custom properties on mount and whenever theme changes
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

// ── Hook ────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

// Re-export for convenience
export { THEMES };
