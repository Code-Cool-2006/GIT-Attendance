/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0F172A';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F7F9FB',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#FFFFFF',
    border: '#E2E8F0',
    primary: '#0F172A',
    secondary: '#334155',
    tertiary: '#0284C7',
    error: '#BA1A1A',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    surface: '#1E293B',
    border: '#334155',
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    tertiary: '#38BDF8',
    error: '#FFB4AB',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'PublicSans-Regular',
    bold: 'PublicSans-Bold',
    semiBold: 'PublicSans-SemiBold',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'PublicSans-Regular',
    bold: 'PublicSans-Bold',
    semiBold: 'PublicSans-SemiBold',
    mono: 'monospace',
  },
  web: {
    sans: "'Public Sans', system-ui, -apple-system, sans-serif",
    bold: "'Public Sans Bold', 'Public Sans', system-ui, sans-serif",
    semiBold: "'Public Sans SemiBold', 'Public Sans', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

