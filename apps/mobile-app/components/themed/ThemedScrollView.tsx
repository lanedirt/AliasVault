import { Platform, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ThemedScrollViewProps = {
  style?: StyleProp<ViewStyle>;
  lightColor?: string;
  darkColor?: string;
  children?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollIndicatorInsets?: { top?: number; bottom?: number };
};

/**
 * Themed scroll view component.
 */
export function ThemedScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps): React.ReactNode {
  const insets = useSafeAreaInsets();

  const paddingTop = Platform.OS === 'ios' ? insets.top + 36 : 64;
  const paddingBottom = Platform.OS === 'ios' ? insets.bottom + 60 : 0;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: paddingTop }, style]}
      contentContainerStyle={{ paddingBottom: paddingBottom }}
      scrollIndicatorInsets={{ bottom: paddingBottom }}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});