/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colors = {
  light: {
    text: '#11181C',
    textMuted: '#4b5563',
    background: '#ffffff',
    accentBackground: '#fff',
    accentBorder: '#d1d5db',
    errorBackground: '#f8d7da',
    errorBorder: '#f8d7da',
    errorText: '#842029',
    tint: '#f49541',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#f49541',
    headerBackground: '#fff',
    tabBarBackground: '#fff',
    primary: '#f97316',
    secondary: '#6b7280',
    loginHeader: '#f6dfc4',
  },
  dark: {
    text: '#ECEDEE',
    textMuted: '#9BA1A6',
    background: '#111827',
    accentBackground: '#1f2937',
    accentBorder: '#4b5563',
    errorBackground: '#3d1a1e',
    errorBorder: '#9c2530',
    errorText: '#fae1e3',
    tint: '#f49541',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#f49541',
    headerBackground: '#1f2937',
    tabBarBackground: '#1f2937',
    primary: '#f97316',
    secondary: '#6b7280',
    loginHeader: '#5c4331',
  },
} as const;

// Export the type for TypeScript support
export type ThemeColors = typeof Colors.light;
