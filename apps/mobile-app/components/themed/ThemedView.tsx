import { View, type ViewProps } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

export type ThemedViewProps = ViewProps;

/**
 * Themed view component.
 */
export function ThemedView({ style, ...otherProps }: ThemedViewProps): React.ReactNode {
  const colors = useColors();

  return <View style={[{ backgroundColor: colors.background }, style]} {...otherProps} />;
}
