import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ColorSchemeName = 'light' | 'dark';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() : ColorSchemeName {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme as ColorSchemeName;
  }

  return 'light';
}
