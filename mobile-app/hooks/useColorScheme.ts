import { Appearance } from 'react-native';
import React from 'react';
import _ from 'lodash';
import { Colors } from '@/constants/Colors';

export type ColorSchemeName = 'light' | 'dark';

/**
 * Get the color scheme of the device.
 *
 * @param delay - The delay in milliseconds between color scheme changes. This is to prevent a bug where
 * when app goes to background/foreground, the color scheme can return "light" for a split second amongst
 * many "dark" calls (if theme is set to dark). Throttling the calls to once per 150ms prevents this.
 *
 * @returns The color scheme of the device.
 */
export const useColorScheme = (delay = 150) => {
  const [colorScheme, setColorScheme] = React.useState<ColorSchemeName>(
    Appearance.getColorScheme() as ColorSchemeName
  );
  const onColorSchemeChange = React.useCallback(
    _.throttle(
      (preferences: { colorScheme: string | null | undefined }) => {
        if (preferences.colorScheme) {
          setColorScheme(preferences.colorScheme as ColorSchemeName);
        }
      },
      delay,
      {
        leading: false,
      }
    ),
    []
  );
  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(onColorSchemeChange);
    return () => {
      onColorSchemeChange.cancel();
      subscription.remove();
    };
  }, []);
  return colorScheme;
};

// Simple hook that returns the current theme's colors
export const useColors = () => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
};
