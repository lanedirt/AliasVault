import { Platform, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

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
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer]}
      scrollIndicatorInsets={styles.scrollIndicatorInsets}
      {...otherProps}
    />
  );
}

const HEADER_HEIGHT = Platform.OS === 'ios' ? 96 : 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 80,
    paddingTop: HEADER_HEIGHT,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  scrollIndicatorInsets: {
    bottom: 40,
  },
});