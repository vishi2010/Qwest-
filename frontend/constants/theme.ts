import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F1117',
    background: '#F4F5FA',
    tint: '#1D4ED8',
    icon: '#475569',
    tabIconDefault: '#64748B',
    tabIconSelected: '#1D4ED8',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    surface: '#EEF0F6',
    gold: '#D97706',
  },
  dark: {
    text: '#F0F1F3',
    background: '#0D0F14',
    tint: '#FFB800',
    icon: '#6B7180',
    tabIconDefault: '#4B5563',
    tabIconSelected: '#FFB800',
    card: '#161921',
    cardBorder: '#1E2130',
    surface: '#1C1F2C',
    gold: '#FFB800',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
