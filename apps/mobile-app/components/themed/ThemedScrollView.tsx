import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

type ThemedScrollViewProps = {
  style?: StyleProp<ViewStyle>;
  lightColor?: string;
  darkColor?: string;
  children?: React.ReactNode;
};

/**
 * Themed scroll view component.
 */
export function ThemedScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps): React.ReactNode {
  return (
    <ScrollView
      style={[styles.container, style]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 80,
  },
});
