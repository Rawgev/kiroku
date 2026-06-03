import type { CSSProperties } from 'react';

// ── Fallback palette (Midnight defaults, used before ThemeProvider mounts) ──

const FALLBACK: Record<string, string> = {
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
};

// ── Reactive color proxy (reads CSS custom properties set by ThemeProvider) ──

function readCSSVar(key: string): string {
  if (typeof document === 'undefined') return FALLBACK[key] || '';
  const val = document.documentElement.style.getPropertyValue(`--ov-${key}`).trim();
  return val || FALLBACK[key] || '';
}

type ColorKeys = 'bg' | 'bg2' | 'card' | 'accent' | 'accentLight' | 'success'
  | 'warning' | 'danger' | 'info' | 'text' | 'muted' | 'border' | 'borderHover';

type Colors = Record<ColorKeys, string>;

export const C: Colors = new Proxy({} as Colors, {
  get(_target, prop: string) {
    return readCSSVar(prop);
  },
});

export type ColorKey = ColorKeys;

// ── Reusable style getters (pick up current theme at access time) ────────

export function getCardStyle(): CSSProperties {
  return {
    background:   C.card,
    borderRadius: 16,
    border:       `1px solid ${C.border}`,
    padding:      16,
  };
}

export function getInputStyle(): CSSProperties {
  return {
    width:        '100%',
    padding:      '9px 14px',
    background:   C.card,
    border:       `1px solid ${C.border}`,
    borderRadius: 10,
    color:        C.text,
    fontSize:     13,
    outline:      'none',
    fontFamily:   'inherit',
    transition:   'border-color 0.2s',
  };
}

export function getBtnPrimaryStyle(): CSSProperties {
  return {
    display:      'inline-flex',
    alignItems:   'center',
    justifyContent: 'center',
    gap:          6,
    padding:      '9px 20px',
    background:   C.accent,
    border:       'none',
    borderRadius: 10,
    color:        '#fff',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
    fontFamily:   'inherit',
    transition:   'opacity 0.15s, transform 0.15s',
  };
}

export function getBtnGhostStyle(): CSSProperties {
  return {
    display:      'inline-flex',
    alignItems:   'center',
    justifyContent: 'center',
    gap:          6,
    padding:      '8px 16px',
    background:   'transparent',
    border:       `1px solid ${C.border}`,
    borderRadius: 10,
    color:        C.muted,
    fontSize:     12,
    fontWeight:   600,
    cursor:       'pointer',
    fontFamily:   'inherit',
    transition:   'border-color 0.15s, color 0.15s',
  };
}

// ── Enumerable style objects with getters (fully compatible with ES6 spread operator) ──

export const cardStyle: CSSProperties = {
  get background()   { return C.card; },
  get borderRadius() { return 16; },
  get border()       { return `1px solid ${C.border}`; },
  get padding()      { return 16; }
};

export const inputStyle: CSSProperties = {
  get width()        { return '100%'; },
  get padding()      { return '9px 14px'; },
  get background()   { return C.card; },
  get border()       { return `1px solid ${C.border}`; },
  get borderRadius() { return 10; },
  get color()        { return C.text; },
  get fontSize()     { return 13; },
  get outline()      { return 'none'; },
  get fontFamily()   { return 'inherit'; },
  get transition()   { return 'border-color 0.2s'; }
};

export const btnPrimaryStyle: CSSProperties = {
  get display()      { return 'inline-flex'; },
  get alignItems()   { return 'center'; },
  get justifyContent() { return 'center'; },
  get gap()          { return 6; },
  get padding()      { return '9px 20px'; },
  get background()   { return C.accent; },
  get border()       { return 'none'; },
  get borderRadius() { return 10; },
  get color()        { return '#fff'; },
  get fontSize()     { return 13; },
  get fontWeight()   { return 700; },
  get cursor()       { return 'pointer'; },
  get fontFamily()   { return 'inherit'; },
  get transition()   { return 'opacity 0.15s, transform 0.15s'; }
};

export const btnGhostStyle: CSSProperties = {
  get display()      { return 'inline-flex'; },
  get alignItems()   { return 'center'; },
  get justifyContent() { return 'center'; },
  get gap()          { return 6; },
  get padding()      { return '8px 16px'; },
  get background()   { return 'transparent'; },
  get border()       { return `1px solid ${C.border}`; },
  get borderRadius() { return 10; },
  get color()        { return C.muted; },
  get fontSize()     { return 12; },
  get fontWeight()   { return 600; },
  get cursor()       { return 'pointer'; },
  get fontFamily()   { return 'inherit'; },
  get transition()   { return 'border-color 0.15s, color 0.15s'; }
};

// ── Status colors (semantic, theme-reactive via C) ──────────────────────

export const STATUS_COLORS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_t, prop: string) {
    const map: Record<string, () => string> = {
      watching:      () => C.accent,
      reading:       () => C.info,
      completed:     () => C.success,
      on_hold:       () => C.warning,
      dropped:       () => C.danger,
      plan_to_watch: () => '#6B7280',
      plan_to_read:  () => '#6B7280',
    };
    return map[prop] ? map[prop]() : undefined;
  },
});

export const STATUS_LABELS: Record<string, string> = {
  watching:      'Watching',
  reading:       'Reading',
  completed:     'Completed',
  on_hold:       'On Hold',
  dropped:       'Dropped',
  plan_to_watch: 'Plan to Watch',
  plan_to_read:  'Plan to Read',
};
