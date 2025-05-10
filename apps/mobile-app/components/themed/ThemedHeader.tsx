import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { useColors } from '@/hooks/useColorScheme';

/**
 * ThemedHeader component that provides consistent header styling across the app.
 * This component is used as a headerBackground in Stack.Screen options.
 * @returns {React.ReactNode} The themed header component
 */
export function ThemedHeader(): React.ReactNode {
  const colorScheme = useColorScheme();
  const colors = useColors();

  const styles = StyleSheet.create({
    header: {
      flex: 1,
    },
    headerBorder: {
      backgroundColor: colors.headerBorder,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      left: 0,
      position: 'absolute',
      right: 0,
    },
  });

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.header}>
        <BlurView
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          intensity={colorScheme === 'dark' ? 90 : 100}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.headerBackground }]}
        />
        <View style={[styles.headerBorder, { backgroundColor: colors.headerBorder }]} />
      </View>
    );
  }

  return null;
}

/**
 * Default header options for Stack.Screen components.
 * This provides consistent header styling across the app.
 * @returns {Object} The default header options
 */
export const defaultHeaderOptions = {
  headerTransparent: true,
  /**
   * Header background component that provides consistent styling.
   * @returns {React.ReactNode} The themed header background component
   */
  headerBackground: (): React.ReactNode => <ThemedHeader />,
};