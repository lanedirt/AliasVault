/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    textMuted: '#4b5563',
    background: '#ffffff',
    accentBackground: '#fff',
    accentBorder: '#d1d5db',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    headerBackground: '#fff',
    tabBarBackground: '#fff',
    primaryButton: '#f97316',
    secondaryButton: '#6b7280',
  },
  dark: {
    text: '#ECEDEE',
    textMuted: '#9BA1A6',
    background: '#111827',
    accentBackground: '#1f2937',
    accentBorder: '#4b5563',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    headerBackground: '#1f2937',
    tabBarBackground: '#1f2937',
    primaryButton: '#f97316',
    secondaryButton: '#6b7280',
  },
} as const;

// Export the type for TypeScript support
export type ThemeColors = typeof Colors.light;
