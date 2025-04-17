import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export type ColorSchemeName = 'light' | 'dark';

// Re-export the basic color scheme hook
export const useColorScheme = () => {
  return _useColorScheme() as ColorSchemeName;
};

// Simple hook that returns the current theme's colors
export const useColors = () => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
};
