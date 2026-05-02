import { Platform } from 'react-native';

export const colors = {
  bg: '#000000',
  surface: '#0C0C0C',
  surfaceHigh: '#161616',
  border: '#272727',
  borderActive: '#FFFFFF',
  borderDim: '#1C1C1C',

  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#444444',
  textInverse: '#000000',

  // Difficulty — no color, just luminance
  diffEasy: '#555555',
  diffMedium: '#909090',
  diffHard: '#CCCCCC',
  diffLegendary: '#FFFFFF',

  error: '#FF3B30',
  success: '#AAFFAA',
};

export const fonts = {
  // Display headers — maximum weight, tight tracking
  display: (size = 32) => ({
    fontSize: size,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.text,
  }),
  // Tactical label — monospace, uppercase, tracked out
  label: (size = 11) => ({
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: size,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  }),
  // Body mono
  mono: (size = 13) => ({
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: size,
    lineHeight: size * 1.6,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  }),
  // Body regular
  body: (size = 15) => ({
    fontSize: size,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: size * 1.5,
  }),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 3,
  md: 6,
  lg: 10,
};

// Difficulty display config
export const DIFF_CONFIG = {
  easy:      { label: 'EASY',      color: colors.diffEasy,      xpColor: colors.diffEasy },
  medium:    { label: 'MEDIUM',    color: colors.diffMedium,    xpColor: colors.diffMedium },
  hard:      { label: 'HARD',      color: colors.diffHard,      xpColor: colors.diffHard },
  legendary: { label: 'LEGENDARY', color: colors.diffLegendary, xpColor: colors.diffLegendary },
};

export const TITLES = [
  { pts: 0,    label: 'ROOKIE' },
  { pts: 500,  label: 'EXPLORER' },
  { pts: 1500, label: 'DAREDEVIL' },
  { pts: 3000, label: 'LEGEND' },
  { pts: 5000, label: 'CHAOS AGENT' },
];

export function getTitle(pts) {
  let title = TITLES[0].label;
  for (const t of TITLES) {
    if (pts >= t.pts) title = t.label;
  }
  return title;
}
