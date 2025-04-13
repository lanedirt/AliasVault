import { SafeAreaView, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

type ThemedSafeAreaViewProps = {
  lightColor?: string;
  darkColor?: string;
  style?: any;
  children?: React.ReactNode;
};

export function ThemedSafeAreaView({
  lightColor,
  darkColor,
  style,
  children,
  ...otherProps
}: ThemedSafeAreaViewProps) {
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