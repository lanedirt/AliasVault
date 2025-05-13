import { Text, type TextProps, StyleSheet } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

/**
 * Themed text component.
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps): React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
    default: {
      fontSize: 16,
      lineHeight: 24,
    },
    defaultSemiBold: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    link: {
      color: colors.primary,
      fontSize: 16,
      lineHeight: 30,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 32,
    },
  });

  return (
    <Text
      style={[
        { color: colors.text },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}