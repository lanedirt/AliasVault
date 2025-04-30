import { ScrollView, StyleSheet } from 'react-native';

export function ThemedScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps) {
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
