import { SafeAreaView, StyleProp, ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

type ThemedSafeAreaViewProps = {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Themed safe area view component.
 */
export function ThemedSafeAreaView({
  lightColor,
  darkColor,
  style,
  children,
  ...otherProps
}: ThemedSafeAreaViewProps): React.ReactNode {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <SafeAreaView
      style={[{ backgroundColor }, style]}
      {...otherProps}
    >
      {children}
    </SafeAreaView>
  );
}