import { Appearance } from 'react-native';
import { useEffect, useState } from 'react';
import _ from 'lodash';

import { Colors, ThemeColors } from '@/constants/Colors';

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
export const useColorScheme = (delay = 150): ColorSchemeName => {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() as ColorSchemeName
  );

  useEffect(() => {
    const throttledHandler = _.throttle(
      (preferences: { colorScheme: string | null | undefined }) => {
        if (preferences.colorScheme) {
          setColorScheme(preferences.colorScheme as ColorSchemeName);
        }
      },
      delay,
      { leading: false }
    );

    const subscription = Appearance.addChangeListener(throttledHandler);

    return () : void => {
      throttledHandler.cancel();
      subscription.remove();
    };
  }, [delay]);

  return colorScheme;
};

/**
 * Get the colors for the current theme.
 *
 * @returns The colors for the current theme.
 */
export const useColors = () : ThemeColors => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'] as ThemeColors;
};
