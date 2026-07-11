/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Uniwind](https://uniwind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Centralized Uniwind class tokens for shared layout/styling patterns.
 */
export const ClassNames = {
  screen: 'flex-1',
  safeArea: 'flex-1',
  centeredScreen: 'flex-1 flex-row justify-center',
  centeredSafeArea: 'flex-1 items-center gap-4 px-6',
  heroSection: 'flex-1 items-center justify-center gap-6 px-6',
  card: 'rounded-2xl bg-backgroundElement',
  elevatedCard: 'w-full self-stretch rounded-3xl px-4 py-6',
  chip: 'rounded-full border border-gray-400/40 px-2 py-1',
  chipActive: 'rounded-full border border-primary bg-primary px-2 py-1',
  sectionStack: 'gap-8 px-6 pt-4',
  centerText: 'text-center',
  bodyLineHeight: 'leading-[22px]',
  textMuted: 'text-gray-600',
} as const;
