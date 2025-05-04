import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Blur tab bar background component.
 */
export default function BlurTabBarBackground(): React.ReactNode {
  return (
    <BlurView
      /*
       * System chrome material automatically adapts to the system's theme
       * and matches the native tab bar appearance on iOS.
       */
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

/**
 * Use bottom tab overflow.
 */
export function useBottomTabOverflow(): number {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
