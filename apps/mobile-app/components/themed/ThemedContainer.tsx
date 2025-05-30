import { Platform, StyleSheet, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed/ThemedView';

export type ThemedContainerProps = ViewProps;

/**
 * Themed container component which should be the outermost component of a screen.
 * It handles the safe area insets and the padding for the screen.
 */
export function ThemedContainer({ style, ...otherProps }: ThemedContainerProps): React.ReactNode {
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 14,
      paddingTop: Platform.OS === 'ios' ? insets.top : 0,
    },
  });
  return <ThemedView style={[styles.container, style]} {...otherProps} />;
}
