// Merkezi tema sistemi - Tüm renk ve stil değişkenleri
// Bu dosya, tüm uygulamada tutarlı bir görünüm sağlar

export const colors = {
  // Ana Renkler
  bg: '#1a1814',
  bgLight: '#242019',
  card: '#2d2820',
  cardHover: '#3a332a',

  // Primary (Amber/Gold)
  primary: '#d97706',
  primaryHover: '#b45309',
  primaryLight: '#fbbf24',
  primaryLighter: '#fcd34d',

  // Accent
  accent: '#92400e',
  accentLight: '#b45309',

  // Nötr Renkler
  white: '#ffffff',
  cream: '#fef3c7',
  gray: '#a8a29e',
  grayLight: '#d6d3d1',
  darkGray: '#78716c',

  // Durum Renkleri
  success: '#22c55e',
  successLight: '#dcfce7',
  successDark: '#15803d',

  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#dc2626',

  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',

  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',

  // Border & Shadow
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.2)',
  borderDark: 'rgba(0,0,0,0.3)',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.2)',
  md: '0 4px 6px rgba(0,0,0,0.3)',
  lg: '0 10px 15px rgba(0,0,0,0.4)',
  xl: '0 20px 25px rgba(0,0,0,0.5)',
  inner: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  glow: '0 0 20px rgba(217, 119, 6, 0.3)',
  glowStrong: '0 0 40px rgba(217, 119, 6, 0.5)',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Playfair Display', Georgia, serif",
    mono: "'JetBrains Mono', Menlo, Monaco, monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Utility fonksiyonlar
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Tema objesi
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  transitions,
  breakpoints,
  zIndex,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;

export default theme;
