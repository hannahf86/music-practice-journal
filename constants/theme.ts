// constants/theme.ts — Design tokens for Music Practice Journal
// Palette derived from the Jorvik Media practice journal cover.

export const colors = {
  // Primary purple
  primary: '#534AB7',
  primaryLight: '#EEEDFE',
  primaryDark: '#3C3489',

  // Accent amber
  accent: '#EF9F27',
  accentLight: '#FAEEDA',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F1EFE8',
  backgroundTertiary: '#F8F7FD',

  // Text
  textPrimary: '#2C2C2A',
  textSecondary: '#5F5E5A',
  textTertiary: '#888780',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#0F6E56',
  successLight: '#E1F5EE',
  error: '#A32D2D',
  errorLight: '#FCEBEB',

  // Border
  border: '#D3D1C7',

  // Tab bar
  tabActive: '#534AB7',
  tabInactive: '#888780',
} as const;

// 8pt spacing grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

// System font sizes
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const theme = { colors, spacing, radius, fontSize, fontWeight } as const;

export type Theme = typeof theme;
